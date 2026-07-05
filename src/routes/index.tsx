import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Loader2, Play, RotateCcw } from "lucide-react";
import { startRecording, extForMime, type RecorderHandle } from "@/lib/recorder";
import questionsData from "@/data/interview-questions.json";

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

export const Route = createFileRoute("/")({
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
  }, [language, speak]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:mb-8 sm:items-center">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-3xl">Voice Interview Coach</h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Voice-first mock interview, grounded in a reference Q&A set.
            </p>
          </div>
          <div className="shrink-0">
            <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "hi" | "de")} disabled={status !== "idle" && status !== "done"}>
              <SelectTrigger className="w-[110px] sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <Badge variant="secondary">
              Question {Math.min(progress + (status === "idle" ? 0 : 1), TOTAL)} of {TOTAL}
            </Badge>
            <StatusPill status={status} />
          </div>

          <div className="mb-6 max-h-[420px] min-h-[240px] space-y-3 overflow-y-auto rounded-md border bg-background p-4">
            {transcript.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Press <strong>Start interview</strong>. The interviewer will greet you and ask the first question by voice.
              </p>
            )}
            {transcript.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <div className="mb-0.5 text-xs opacity-70">{m.role === "user" ? "You" : "Interviewer"}</div>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>

          {error && (
            <p className="mb-3 text-sm text-destructive">{error}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {status === "idle" && (
              <Button onClick={startInterview} size="lg">
                <Play className="mr-2 h-4 w-4" /> Start interview
              </Button>
            )}

            {status === "listening" && (
              <Button onClick={beginRecording} size="lg">
                <Mic className="mr-2 h-4 w-4" /> Hold to answer — tap to start
              </Button>
            )}

            {status === "recording" && (
              <Button onClick={finishRecording} size="lg" variant="destructive">
                <Square className="mr-2 h-4 w-4" /> Stop & send
              </Button>
            )}

            {(status === "thinking" || status === "speaking" || status === "greeting") && (
              <Button disabled size="lg">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {status === "speaking" ? "Speaking…" : status === "greeting" ? "Greeting…" : "Thinking…"}
              </Button>
            )}

            {(status === "done" || transcript.length > 0) && status !== "recording" && (
              <Button onClick={reset} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Restart
              </Button>
            )}
          </div>
        </Card>

        {feedback && <FeedbackCard feedback={feedback} />}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const label: Record<string, string> = {
    idle: "Ready",
    greeting: "Interviewer greeting…",
    listening: "Your turn — press mic",
    recording: "Recording…",
    thinking: "Thinking…",
    speaking: "Interviewer speaking…",
    done: "Interview complete",
  };
  const color: Record<string, string> = {
    recording: "bg-destructive text-destructive-foreground",
    listening: "bg-primary text-primary-foreground",
    done: "bg-emerald-500 text-white",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${color[status] ?? "bg-muted text-muted-foreground"}`}>
      {label[status] ?? status}
    </span>
  );
}

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  return (
    <Card className="mt-6 p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold">Feedback</h2>
        <span className="text-3xl font-bold text-primary">{feedback.overall_score}/100</span>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{feedback.summary}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Strengths</h3>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {feedback.strengths?.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Improvements</h3>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {feedback.improvements?.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold">Per-question</h3>
      <div className="space-y-3">
        {feedback.per_question?.map((q, i) => (
          <div key={i} className="rounded-md border p-3">
            <div className="mb-1 flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{q.question}</p>
              <Badge variant="outline">{q.score}/5</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{q.feedback}</p>
          </div>
        ))}
      </div>

      {feedback.next_steps?.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 text-sm font-semibold">Next steps</h3>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {feedback.next_steps.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </>
      )}
    </Card>
  );
}
