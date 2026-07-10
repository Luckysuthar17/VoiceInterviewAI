# Voice Interview AI

A voice-first mock interview agent grounded in a fixed reference Q&A set. A candidate speaks with it; it transcribes, retrieves the relevant reference, uses an LLM to interview naturally (follow-ups, corrections, staying on track), speaks its reply back, and produces structured feedback at the end.

Supports **English, Hindi, German**.

## Live Website
https://voiceinterviewai.onrender.com/

## Pipeline

```
mic → MediaRecorder → /api/stt (Groq Whisper large-v3-turbo) → text
       ↓
       + reference Q&A (grounding by index) + history
       ↓
       /api/interview (Groq Llama-3.3-70B, structured JSON) → { action, spoken_reply, grade }
       ↓
       /api/tts (Groq PlayAI TTS) → mp3 → <audio>
```

On interview end, all grades + transcript are sent to `/api/interview` with `mode: "feedback"` for a structured report.

A browser-native fallback (Web Speech API for STT/TTS) is retained in `src/lib/browser-speech.ts` and used automatically if a Groq call fails, so a transient API issue degrades the experience instead of breaking it.

## Reference Q&A

Edit `src/data/interview-questions.json`. No code changes required — the interviewer prompt is built from `question`, `ideal_answer`, `must_cover`, `common_mistakes` per entry.

## Endpoints

- `POST /api/stt` — multipart `file`, `language` → `{ text }` (Groq `whisper-large-v3-turbo`)
- `POST /api/tts` — `{ text, voice? }` → `audio/mpeg` stream (Groq `playai-tts`)
- `POST /api/interview` — `{ mode: "start" | "turn" | "feedback", language, currentIndex, followUpsUsed, history, grades? }` (Groq `llama-3.3-70b-versatile`)

## Retrieval design

For an 8–12 question fixed interview, the interviewer controls flow: we track `currentIndex` client-side and pass the *one* relevant reference entry to the LLM each turn. This is deterministic (right question, always), zero-latency lookup, and easy to reason about. Embedding-based retrieval would only be needed if the candidate could jump between topics arbitrarily.

## Keeping the LLM on rails

- Structured JSON output (`action`, `spoken_reply`, `grade`) — the model must pick one of four discrete actions per turn.
- Max 2 follow-ups per question (enforced in prompt via `followUpsUsed`).
- Explicit "never read the ideal answer verbatim" instruction.
- Reference `ideal_answer` and `must_cover` live in the system prompt, not in the spoken reply — they are grading criteria only.

## Latency notes

Turn = STT (~0.3–1s on Groq's Whisper endpoint) + LLM (~0.7–1.5s on Groq's Llama-3.3-70B, LPU inference) + TTS (~0.3–0.8s). Streaming TTS + streaming LLM tokens into a running TTS request would cut perceived latency further.

## Env

- `GROQ_API_KEY` — powers STT (`whisper-large-v3-turbo`), TTS (`playai-tts`), and interview/chat logic (`llama-3.3-70b-versatile`) via the Groq API. One key for the entire pipeline.
- `NODE_ENV` — `development` locally.
- `PORT` — optional, defaults per hosting provider.
