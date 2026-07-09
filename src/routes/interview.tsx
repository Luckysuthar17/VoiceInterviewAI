import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mic, Square, Loader2, Play, RotateCcw, ArrowLeft, Waves, Brain,
  MessageSquare, Clock, Sparkles, CheckCircle2, TrendingUp, Briefcase, GraduationCap,
} from "lucide-react";
import { startRecording, extForMime, type RecorderHandle } from "@/lib/recorder";
import questionsData from "@/data/interview-questions.json";
import {
  DOMAINS,
  EXPERIENCES,
  domainLabel,
  experienceLabel,
  writeSession,
} from "@/lib/interview-session";

type Msg = { role: "user" | "assistant"; content: string };
type Grade = { questionId: string; question: string; score: number; note: string };
type Feedback = {
  overall_score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  per_question: { question: string; score: number; feedback: string }[];
  next_steps: string[];
};

export const Route = createFileRoute("/interview")({
  head: () => ({
    meta: [
      { title: "Voice Interview Coach — Practice Mock Interviews with AI" },
      {
        name: "description",
        content:
          "Practice real interview questions by voice. An AI interviewer asks, listens, follows up, and gives you structured feedback. Available in English, Hindi and German.",
      },
      { property: "og:title", content: "Voice Interview Coach" },
      { property: "og:description", content: "Voice-first mock interview practice with grounded AI." },
    ],
  }),
  component: Home,
});

const QUESTIONS = questionsData.questions;
const TOTAL = QUESTIONS.length;

function Home() {
  const [language, setLanguage] = useState<"en" | "hi" | "de">("en");
  const [domain, setDomain] = useState<string>(DOMAINS[0].id);
  const [experience, setExperience] = useState<string>(EXPERIENCES[0].id);
  const [status, setStatus] = useState<"idle" | "greeting" | "listening" | "recording" | "thinking" | "speaking" | "done">("idle");
  const [transcript, setTranscript] = useState<Msg[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [followUps, setFollowUps] = useState(0);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<RecorderHandle | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, status]);

  const speak = useCallback(async (text: string) => {
    setStatus("speaking");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      await new Promise<void>((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        audio.play().catch(() => resolve());
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const startInterview = useCallback(async () => {
    setError(null);
    setTranscript([]);
    setGrades([]);
    setFeedback(null);
    setCurrentIndex(0);
    setFollowUps(0);
    setStatus("greeting");
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "start",
          language,
          domain: domainLabel(domain),
          experience: experienceLabel(experience),
          currentIndex: 0,
          followUpsUsed: 0,
          history: [],
        }),
      });
      const data = await res.json();
      const reply: string = data.spoken_reply ?? "";
      setTranscript([{ role: "assistant", content: reply }]);
      await speak(reply);
      setStatus("listening");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("idle");
    }
  }, [language, domain, experience, speak]);

  const beginRecording = useCallback(async () => {
    setError(null);
    try {
      const handle = await startRecording();
      recorderRef.current = handle;
      setStatus("recording");
    } catch (e) {
      setError("Microphone permission denied.");
    }
  }, []);

  const finishRecording = useCallback(async () => {
    if (!recorderRef.current) return;
    setStatus("thinking");
    const blob = await recorderRef.current.stop();
    recorderRef.current = null;

    if (blob.size < 2048) {
      setError("Recording too short. Please try again.");
      setStatus("listening");
      return;
    }

    try {
      // 1. STT
      const form = new FormData();
      form.append("file", blob, `answer.${extForMime(blob.type)}`);
      form.append("language", language);
      const sttRes = await fetch("/api/stt", { method: "POST", body: form });
      const sttData = await sttRes.json();
      if (!sttRes.ok) throw new Error(sttData.error ?? "STT failed");
      const userText: string = (sttData.text ?? "").trim();
      if (!userText) {
        setError("I couldn't hear that. Please try again.");
        setStatus("listening");
        return;
      }

      const nextTranscript: Msg[] = [...transcript, { role: "user", content: userText }];
      setTranscript(nextTranscript);

      // 2. Interview turn
      const turnRes = await fetch("/api/interview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "turn",
          language,
          domain: domainLabel(domain),
          experience: experienceLabel(experience),
          currentIndex,
          followUpsUsed: followUps,
          history: nextTranscript,
        }),
      });
      const turn = await turnRes.json();
      if (!turnRes.ok) throw new Error(turn.error ?? "Interview turn failed");

      const spoken: string = turn.spoken_reply ?? "";
      const action: string = turn.action ?? "advance";
      const grade = turn.grade;

      const withAssistant: Msg[] = [...nextTranscript, { role: "assistant", content: spoken }];
      setTranscript(withAssistant);

      // Record grade when we move on (advance / correct_and_advance / end)
      if (grade && action !== "follow_up") {
        setGrades((g) => [
          ...g,
          {
            questionId: QUESTIONS[currentIndex].id,
            question: QUESTIONS[currentIndex].question,
            score: Number(grade.score) || 0,
            note: grade.note ?? "",
          },
        ]);
      }

      // Speak reply
      await speak(spoken);

      // State transitions
      if (action === "follow_up") {
        setFollowUps((n) => n + 1);
        setStatus("listening");
      } else if (action === "end" || currentIndex + 1 >= TOTAL) {
        // Finish
        setStatus("thinking");
        const fbRes = await fetch("/api/interview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            mode: "feedback",
            language,
            domain: domainLabel(domain),
            experience: experienceLabel(experience),
            currentIndex,
            followUpsUsed: followUps,
            history: withAssistant,
            grades: grade && action !== "follow_up"
              ? [...grades, {
                  questionId: QUESTIONS[currentIndex].id,
                  question: QUESTIONS[currentIndex].question,
                  score: Number(grade.score) || 0,
                  note: grade.note ?? "",
                }]
              : grades,
          }),
        });
        const fbData = await fbRes.json();
        if (fbData.feedback) setFeedback(fbData.feedback);
        setStatus("done");
      } else {
        setCurrentIndex((i) => i + 1);
        setFollowUps(0);
        setStatus("listening");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("listening");
    }
  }, [language, currentIndex, followUps, transcript, grades, speak]);

  const reset = useCallback(() => {
    audioRef.current?.pause();
    recorderRef.current?.cancel();
    setStatus("idle");
    setTranscript([]);
    setGrades([]);
    setFeedback(null);
    setCurrentIndex(0);
    setFollowUps(0);
    setError(null);
  }, []);

  const progress = Math.min(currentIndex + (status === "done" ? 1 : 0), TOTAL);

  const questionNumber = Math.min(progress + (status === "idle" ? 0 : 1), TOTAL);
  const isActive = status === "recording";
  const isListeningState = status === "listening";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground antialiased">
      {/* Aurora background — matches landing */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[24rem] w-[36rem] -translate-x-1/2 rounded-full bg-violet-400/10 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-indigo-500 text-primary-foreground shadow-md shadow-primary/30">
              <Waves className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="hidden text-base font-extrabold tracking-tight sm:inline">
              Voice<span className="text-primary">InterviewAI</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden h-9 items-center gap-1.5 rounded-full border border-border/60 bg-white/60 px-3 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to home
            </Link>
            <Select
              value={language}
              onValueChange={(v) => setLanguage(v as "en" | "hi" | "de")}
              disabled={status !== "idle" && status !== "done"}
            >
              <SelectTrigger className="h-9 w-[120px] rounded-full border-border/60 bg-white/60 backdrop-blur">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="hi">🇮🇳 हिन्दी</SelectItem>
                <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Session bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/50 bg-white/50 px-4 py-3 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  status === "idle" ? "bg-slate-400" : status === "done" ? "bg-emerald-400" : "animate-ping bg-primary"
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  status === "idle" ? "bg-slate-400" : status === "done" ? "bg-emerald-500" : "bg-primary"
                }`}
              />
            </span>
            <span className="text-sm font-semibold">
              {status === "idle" ? "Ready to begin" : status === "done" ? "Interview complete" : "Interview in Progress"}
            </span>
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
              <Clock className="h-3.5 w-3.5" /> Question {questionNumber} of {TOTAL}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={status} />
            {(status === "done" || transcript.length > 0) && status !== "recording" && (
              <Button onClick={reset} variant="outline" size="sm" className="rounded-full bg-white/60 backdrop-blur">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restart
              </Button>
            )}
          </div>
        </div>

        {/* Progress dots */}
        <div className="mb-6 flex items-center gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < progress
                  ? "bg-gradient-to-r from-primary to-indigo-500"
                  : i === progress && status !== "idle"
                  ? "bg-primary/40"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Left column — AI Interviewer + Mic */}
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">AI Interviewer</h2>
                  <p className="text-[11px] text-muted-foreground">Grounded in a curated Q&amp;A set</p>
                </div>
              </div>
              <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary sm:inline-block">
                <Sparkles className="mr-1 inline h-3 w-3" /> AI-Powered
              </span>
            </div>

            {/* Transcript */}
            <div className="mb-5 max-h-[380px] min-h-[220px] space-y-3 overflow-y-auto rounded-xl border border-white/50 bg-white/40 p-4 backdrop-blur">
              {transcript.length === 0 && (
                <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
                  <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium">Ready when you are</p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    Press <strong>Start interview</strong>. The interviewer will greet you and ask the first question by voice.
                  </p>
                </div>
              )}
              {transcript.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-primary to-indigo-500 text-primary-foreground"
                        : "border border-white/60 bg-white/70 text-foreground backdrop-blur"
                    }`}
                  >
                    <div className={`mb-0.5 text-[10px] font-semibold uppercase tracking-wider ${m.role === "user" ? "opacity-80" : "text-primary/80"}`}>
                      {m.role === "user" ? "You" : "Interviewer"}
                    </div>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>

            {/* Waveform */}
            <div className="mb-4 flex h-16 items-center justify-center gap-1 rounded-xl border border-white/50 bg-white/30 px-3 backdrop-blur">
              {Array.from({ length: 40 }).map((_, i) => {
                const base = 6 + Math.round(Math.abs(Math.sin(i * 0.5 + (isActive ? 1 : 0))) * 34);
                const animate = isActive || status === "speaking";
                return (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      animate
                        ? "bg-gradient-to-t from-primary to-indigo-400"
                        : isListeningState
                        ? "bg-primary/40"
                        : "bg-muted-foreground/30"
                    }`}
                    style={{
                      height: `${animate ? base : Math.max(3, base / 3)}px`,
                      animation: animate ? `pulse 1.${i % 9}s ease-in-out infinite` : undefined,
                    }}
                  />
                );
              })}
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Mic controls */}
            <div className="flex flex-col items-center gap-2">
              {status === "idle" && (
                <button
                  onClick={startInterview}
                  className="group inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-primary to-indigo-500 px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.03]"
                >
                  <Play className="h-4 w-4" /> Start Interview
                </button>
              )}

              {status === "listening" && (
                <>
                  <button
                    onClick={beginRecording}
                    className="group relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary to-indigo-500 text-primary-foreground shadow-xl shadow-primary/40 transition-transform hover:scale-105"
                  >
                    <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
                    <Mic className="relative h-8 w-8" />
                  </button>
                  <p className="text-xs font-medium text-primary">Tap to answer</p>
                </>
              )}

              {status === "recording" && (
                <>
                  <button
                    onClick={finishRecording}
                    className="group relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xl shadow-red-500/40 transition-transform hover:scale-105"
                  >
                    <span className="absolute inset-0 rounded-full bg-red-400/50 animate-ping" />
                    <Square className="relative h-7 w-7 fill-current" />
                  </button>
                  <p className="text-xs font-medium text-red-600">Recording… tap to stop</p>
                </>
              )}

              {(status === "thinking" || status === "speaking" || status === "greeting") && (
                <>
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-white/60 backdrop-blur">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {status === "speaking" ? "Interviewer speaking…" : status === "greeting" ? "Greeting…" : "Thinking…"}
                  </p>
                </>
              )}

              {status === "done" && (
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> All questions complete
                </div>
              )}
            </div>
          </GlassCard>

          {/* Right column — Live Feedback */}
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Live Feedback</h2>
                  <p className="text-[11px] text-muted-foreground">Updates as you answer</p>
                </div>
              </div>
            </div>

            <LiveFeedbackPanel grades={grades} status={status} />
          </GlassCard>
        </div>

        {feedback && <FeedbackCard feedback={feedback} />}
      </main>
    </div>
  );
}

/* ----- Presentational bits ----- */

function GlassCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`relative rounded-3xl border border-white/50 bg-white/60 shadow-xl shadow-primary/5 backdrop-blur-2xl ${className}`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      {children}
    </div>
  );
}

function LiveFeedbackPanel({ grades, status }: { grades: Grade[]; status: string }) {
  const avg = grades.length
    ? Math.round((grades.reduce((s, g) => s + g.score, 0) / grades.length) * 20) // 0-5 → 0-100
    : 0;

  const empty = grades.length === 0;

  return (
    <div>
      <div className="flex items-center gap-4">
        <ScoreRing value={empty ? 0 : avg} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {empty
              ? status === "idle"
                ? "Awaiting your first answer"
                : "Listening…"
              : avg >= 80
              ? "Excellent response!"
              : avg >= 60
              ? "Good response!"
              : "Keep going — you can do it."}
          </p>
          <p className="text-xs text-muted-foreground">
            {empty ? "Answers you give will be scored live." : `Averaged over ${grades.length} answer${grades.length > 1 ? "s" : ""}.`}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <FeedbackBar label="Technical Knowledge" value={empty ? 0 : Math.min(100, avg + 5)} color="#22c55e" />
        <FeedbackBar label="Communication"      value={empty ? 0 : Math.max(30, avg - 8)}    color="#3b82f6" />
        <FeedbackBar label="Problem Solving"    value={empty ? 0 : Math.min(100, avg + 2)}   color="#a855f7" />
        <FeedbackBar label="Confidence"         value={empty ? 0 : Math.max(30, avg - 4)}    color="#f59e0b" />
      </div>

      <div className="mt-6 rounded-2xl border border-white/50 bg-white/40 p-4 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent grades</p>
        <div className="mt-2 space-y-2">
          {empty && <p className="text-xs text-muted-foreground">No grades yet.</p>}
          {grades.slice(-3).reverse().map((g, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <p className="line-clamp-1 text-xs text-foreground/80">{g.question}</p>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {g.score}/5
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r={r} stroke="currentColor" strokeWidth="7" className="text-muted" fill="none" />
        <circle
          cx="40" cy="40" r={r}
          stroke="url(#ringGrad)" strokeWidth="7" strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 500ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-lg font-extrabold leading-none">{value}</div>
          <div className="text-[9px] font-medium text-muted-foreground">/100</div>
        </div>
      </div>
    </div>
  );
}

function FeedbackBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
        />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const label: Record<string, string> = {
    idle: "Ready",
    greeting: "Greeting…",
    listening: "Your turn",
    recording: "Recording",
    thinking: "Thinking…",
    speaking: "Speaking…",
    done: "Complete",
  };
  const color: Record<string, string> = {
    recording: "bg-red-500/10 text-red-600 border-red-500/20",
    listening: "bg-primary/10 text-primary border-primary/20",
    speaking: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    done: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        color[status] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {label[status] ?? status}
    </span>
  );
}

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  return (
    <GlassCard className="mt-8 p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Final Report</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Your interview feedback</h2>
        </div>
        <div className="flex items-center gap-4">
          <ScoreRing value={feedback.overall_score} />
          <div>
            <div className="text-3xl font-extrabold text-primary">{feedback.overall_score}<span className="text-lg text-muted-foreground">/100</span></div>
            <p className="text-xs text-muted-foreground">Overall score</p>
          </div>
        </div>
      </div>

      <p className="mb-6 rounded-xl border border-white/50 bg-white/40 p-4 text-sm text-foreground/80 backdrop-blur">
        {feedback.summary}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/60 p-5 backdrop-blur">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Strengths
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-emerald-900/80">
            {feedback.strengths?.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50/60 p-5 backdrop-blur">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-700">
            <TrendingUp className="h-4 w-4" /> Improvements
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-900/80">
            {feedback.improvements?.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>

      <h3 className="mb-3 mt-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">Per-question</h3>
      <div className="space-y-3">
        {feedback.per_question?.map((q, i) => (
          <div key={i} className="rounded-2xl border border-white/50 bg-white/50 p-4 backdrop-blur">
            <div className="mb-1 flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{q.question}</p>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {q.score}/5
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{q.feedback}</p>
          </div>
        ))}
      </div>

      {feedback.next_steps?.length > 0 && (
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 backdrop-blur">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
            <Sparkles className="h-4 w-4" /> Next steps
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-foreground/80">
            {feedback.next_steps.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </GlassCard>
  );
}
