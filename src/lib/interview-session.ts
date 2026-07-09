import { useEffect, useState } from "react";

export type SessionSnapshot = {
  status: "idle" | "greeting" | "listening" | "recording" | "thinking" | "speaking" | "done";
  domain: string;
  experience: string;
  language: string;
  questionNumber: number;
  total: number;
  avgScore: number;
  lastQuestion: string;
  updatedAt: number;
};

const KEY = "viai:session";
const EVT = "viai:session-updated";

export function writeSession(snapshot: SessionSnapshot | null) {
  if (typeof window === "undefined") return;
  try {
    if (snapshot === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* noop */
  }
}

export function readSession(): SessionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionSnapshot;
  } catch {
    return null;
  }
}

export function useLiveSession(): SessionSnapshot | null {
  const [snap, setSnap] = useState<SessionSnapshot | null>(null);
  useEffect(() => {
    setSnap(readSession());
    const handler = () => setSnap(readSession());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return snap;
}

export const DOMAINS: { id: string; label: string; description: string }[] = [
  { id: "software-engineer", label: "Software Engineer", description: "General backend / full-stack screening" },
  { id: "frontend-developer", label: "Frontend Developer", description: "React, TypeScript, browser & UX" },
  { id: "backend-developer", label: "Backend Developer", description: "APIs, databases, distributed systems" },
  { id: "fullstack-developer", label: "Full-Stack Developer", description: "End-to-end web engineering" },
  { id: "data-engineer", label: "Data Engineer", description: "Pipelines, warehouses, SQL, streaming" },
  { id: "data-scientist", label: "Data Scientist", description: "Statistics, ML modelling, experimentation" },
  { id: "ml-engineer", label: "ML / AI Engineer", description: "Model training, deployment, LLM apps" },
  { id: "devops-engineer", label: "DevOps / SRE", description: "CI/CD, Kubernetes, observability, on-call" },
  { id: "mobile-developer", label: "Mobile Developer", description: "iOS / Android / React Native" },
  { id: "product-manager", label: "Product Manager", description: "Product sense, prioritisation, metrics" },
];

export const EXPERIENCES: { id: string; label: string; description: string }[] = [
  { id: "fresher", label: "Fresher (0 yrs)", description: "New grad / entry level" },
  { id: "1-2", label: "1–2 years", description: "Junior engineer" },
  { id: "3-5", label: "3–5 years", description: "Mid-level engineer" },
  { id: "6-8", label: "6–8 years", description: "Senior engineer" },
  { id: "9+", label: "9+ years", description: "Staff / principal / lead" },
];

export function domainLabel(id: string): string {
  return DOMAINS.find((d) => d.id === id)?.label ?? id;
}

export function experienceLabel(id: string): string {
  return EXPERIENCES.find((e) => e.id === id)?.label ?? id;
}
