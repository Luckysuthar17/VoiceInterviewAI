import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MessageSquare,
  BarChart3,
  Globe,
  ArrowRight,
  Play,
  Star,
  Users,
  CheckCircle2,
  Clock,
  ChevronDown,
  Waves,
  Brain,
  Sparkles,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { useLiveSession } from "@/lib/interview-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoiceInterviewAI — Practice Smarter. Interview Better." },
      {
        name: "description",
        content:
          "Realistic voice conversations with AI, intelligent follow-ups, and actionable feedback to help you ace your next interview. Practice in English, Hindi, or German.",
      },
      { property: "og:title", content: "VoiceInterviewAI — Practice Smarter. Interview Better." },
      {
        property: "og:description",
        content:
          "Voice-first mock interviews with a grounded AI interviewer. Live follow-ups, structured feedback, three languages.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <Languages />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

/* ---------------- Navbar ---------------- */
function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how" },
    { label: "Languages", href: "#languages" },
    { label: "FAQ", href: "#faq" },
  ];
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="text-lg font-extrabold tracking-tight">
            Voice<span className="text-primary">InterviewAI</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/interview"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02]"
          >
            Start Interview <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border md:hidden"
          aria-label="Toggle menu"
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1">
            <span className="h-0.5 w-5 bg-foreground" />
            <span className="h-0.5 w-5 bg-foreground" />
            <span className="h-0.5 w-5 bg-foreground" />
          </div>
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/interview"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Start Interview <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function LogoMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-500 text-primary-foreground shadow-md shadow-primary/30">
      <Waves className="h-5 w-5" strokeWidth={2.5} />
    </div>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* aurora background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-28">
        {/* Left column */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered Interview Practice
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Practice Smarter.
            <br />
            <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              Interview Better.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Realistic voice conversations with AI, intelligent follow-ups, and actionable
            feedback to help you ace your next interview.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/interview"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02]"
            >
              Start Free Interview <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Play className="h-4 w-4" /> Watch Demo
            </a>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-9 w-9 rounded-full border-2 border-background bg-gradient-to-br from-slate-300 to-slate-500"
                  style={{
                    background: [
                      "linear-gradient(135deg,#fca5a5,#ef4444)",
                      "linear-gradient(135deg,#93c5fd,#3b82f6)",
                      "linear-gradient(135deg,#c4b5fd,#8b5cf6)",
                      "linear-gradient(135deg,#fcd34d,#f59e0b)",
                    ][i],
                  }}
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 text-amber-400">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Trusted by 1,000+ engineers worldwide
              </p>
            </div>
          </div>
        </div>

        {/* Right column — mock dashboard */}
        <DashboardPreview />
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/30 via-indigo-400/20 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Interview in Progress
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <Clock className="h-3.5 w-3.5" /> 08:42
          </div>
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500">
            End Interview
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          {/* AI Interviewer */}
          <div className="rounded-xl border border-border/70 bg-background/50 p-4">
            <div className="mb-3 text-xs font-semibold text-muted-foreground">
              AI Interviewer
            </div>
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Brain className="h-4 w-4" />
              </div>
              <div className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-foreground/80">
                Can you explain the difference between useEffect and useLayoutEffect in React?
              </div>
            </div>
            {/* waveform */}
            <div className="mt-5 flex h-14 items-center gap-1">
              {Array.from({ length: 28 }).map((_, i) => {
                const h = 8 + Math.round(Math.abs(Math.sin(i * 0.6)) * 36);
                return (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-primary/70"
                    style={{ height: `${h}px` }}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-primary">Listening…</p>
                <p className="text-[10px] text-muted-foreground">Tap to stop</p>
              </div>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/10">
                <div className="h-3 w-3 rounded-sm bg-primary" />
              </button>
            </div>
          </div>

          {/* Live Feedback */}
          <div className="rounded-xl border border-border/70 bg-background/50 p-4">
            <div className="mb-3 text-xs font-semibold text-muted-foreground">
              Live Feedback
            </div>
            <div className="flex items-center gap-3">
              <ScoreRing value={78} />
              <div>
                <p className="text-sm font-semibold">Good response!</p>
                <p className="text-xs text-muted-foreground">Keep going, you're doing well.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <FeedbackBar label="Technical Knowledge" value={85} color="#22c55e" />
              <FeedbackBar label="Communication" value={72} color="#3b82f6" />
              <FeedbackBar label="Problem Solving" value={80} color="#a855f7" />
              <FeedbackBar label="Confidence" value={76} color="#f59e0b" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="relative h-16 w-16">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} stroke="currentColor" strokeWidth="6" className="text-muted" fill="none" />
        <circle
          cx="32"
          cy="32"
          r={r}
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="text-primary"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-bold">{value}</div>
    </div>
  );
}

function FeedbackBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

/* ---------------- Stats bar ---------------- */
function StatsBar() {
  const stats = [
    { icon: Users, value: "1,000+", label: "Interviews Completed", tint: "bg-blue-50 text-blue-600" },
    { icon: CheckCircle2, value: "95%", label: "Satisfaction Rate", tint: "bg-emerald-50 text-emerald-600" },
    { icon: Globe, value: "3", label: "Languages Supported", tint: "bg-violet-50 text-violet-600" },
    { icon: Clock, value: "24/7", label: "AI Interview Availability", tint: "bg-amber-50 text-amber-600" },
  ];
  return (
    <section className="mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:grid-cols-4 sm:p-6">
        {stats.map(({ icon: Icon, value, label, tint }) => (
          <div key={label} className="flex items-center gap-3">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tint}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-extrabold tracking-tight sm:text-2xl">{value}</div>
              <div className="truncate text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Features ---------------- */
function Features() {
  const items = [
    {
      icon: Mic,
      title: "Voice Conversations",
      desc: "Speak naturally and get real-time AI responses.",
      tint: "bg-blue-50 text-blue-600",
    },
    {
      icon: MessageSquare,
      title: "AI Follow-ups",
      desc: "Get intelligent follow-up questions based on your answers.",
      tint: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: BarChart3,
      title: "Detailed Feedback",
      desc: "Receive structured feedback with scores and suggestions.",
      tint: "bg-violet-50 text-violet-600",
    },
    {
      icon: Globe,
      title: "Multi-language Support",
      desc: "Practice in English, Hindi, or German with seamless experience.",
      tint: "bg-amber-50 text-amber-600",
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Features</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Everything you need to succeed
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Powerful features designed to help you prepare better and perform confidently.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, desc, tint }) => (
          <div
            key={title}
            className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className={`grid h-12 w-12 place-items-center rounded-xl ${tint}`}>
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */
function HowItWorks() {
  const steps = [
    { icon: Mic, title: "Speak", desc: "Answer questions using your voice naturally.", tint: "bg-blue-50 text-blue-600" },
    { icon: Brain, title: "AI Evaluates", desc: "Our AI analyzes your response in real-time.", tint: "bg-emerald-50 text-emerald-600" },
    { icon: Star, title: "Get Feedback", desc: "Receive instant feedback and improvement tips.", tint: "bg-violet-50 text-violet-600" },
  ];
  return (
    <section id="how" className="border-y border-border bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">How it Works</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Simple steps to interview success
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, desc, tint }, idx) => (
            <div key={title} className="relative text-center">
              {idx < steps.length - 1 && (
                <div className="absolute left-1/2 top-8 hidden h-0.5 w-full -translate-y-1/2 translate-x-8 border-t-2 border-dashed border-border md:block" />
              )}
              <div className={`relative mx-auto grid h-16 w-16 place-items-center rounded-full ${tint} ring-8 ring-background`}>
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-bold">
                {idx + 1}. {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Languages ---------------- */
function Languages() {
  const langs = [
    { flag: "🇬🇧", label: "English" },
    { flag: "🇮🇳", label: "Hindi" },
    { flag: "🇩🇪", label: "German" },
  ];
  return (
    <section id="languages" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Supported Languages
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Practice in your preferred language
        </h2>
      </div>
      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {langs.map((l) => (
          <div
            key={l.label}
            className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
          >
            <span className="text-3xl">{l.flag}</span>
            <span className="text-base font-semibold">{l.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */
function Testimonials() {
  const items = [
    {
      quote:
        "VoiceInterviewAI helped me improve my confidence and communication. The AI feedback is incredibly accurate and helpful!",
      name: "Priya Sharma",
      role: "Frontend Developer",
    },
    {
      quote:
        "Finally a mock interview tool that feels like the real thing. The follow-up questions caught me off guard — in a good way.",
      name: "Marcus Weber",
      role: "Backend Engineer",
    },
    {
      quote:
        "I practiced in Hindi and English. Got hired after two weeks. The structured feedback is what makes it stand out.",
      name: "Rohan Iyer",
      role: "Full-stack Engineer",
    },
  ];
  return (
    <section className="border-y border-border bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Testimonials</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Loved by candidates worldwide
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-0.5 text-amber-400">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="text-sm text-foreground/90">"{t.quote}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-indigo-500" />
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function FAQ() {
  const faqs = [
    {
      q: "How does the AI interview work?",
      a: "The AI asks curated questions grounded in a reference Q&A set, listens to your spoken answer, transcribes it, and either asks a follow-up or moves on. At the end, you get structured feedback with a score.",
    },
    {
      q: "Can I practice in languages other than English?",
      a: "Yes. English, Hindi, and German are supported end-to-end, including speech recognition, follow-ups, and feedback.",
    },
    {
      q: "Is my data secure?",
      a: "Audio is processed transiently for transcription and never persisted server-side. Transcripts stay in your browser session unless you explicitly save them.",
    },
    {
      q: "Do I need any special equipment?",
      a: "Just a modern browser and a microphone. Chrome, Edge, and Safari all work well.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">FAQ</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Questions, answered
        </h2>
      </div>
      <div className="mt-10 space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="overflow-hidden rounded-xl border border-border bg-card">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold sm:text-base">{f.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && <div className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-indigo-400/10 to-background p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="h-4 w-4" /> Ready to ace your next interview?
            </div>
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Start practicing now and unlock your true potential.
            </h3>
          </div>
          <Link
            to="/interview"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02]"
          >
            Start Free Interview <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <LogoMark />
            <span className="text-lg font-extrabold tracking-tight">
              Voice<span className="text-primary">InterviewAI</span>
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            AI-powered voice interviews with intelligent feedback to help you succeed.
          </p>
        </div>
        <FooterCol title="Product" links={["Features", "How it Works", "Languages"]} />
        <FooterCol title="Company" links={["About", "Blog", "Contact"]} />
        <FooterCol title="Resources" links={["Help Center", "Privacy Policy", "Terms of Service"]} />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} VoiceInterviewAI. All rights reserved.</span>
          <span>Built with voice-first AI.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
