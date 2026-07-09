# Voice Interview Coach

A voice-first mock interview agent grounded in a fixed reference Q&A set. A candidate speaks with it; it transcribes, retrieves the relevant reference, uses an LLM to interview naturally (follow-ups, corrections, staying on track), speaks its reply back, and produces structured feedback at the end.

Supports **English, Hindi, German**.

## Live Website
https://voiceinterviewai.onrender.com/

## Pipeline

```
mic → MediaRecorder → /api/stt (Whisper) → text
       ↓
       + reference Q&A (grounding by index) + history
       ↓
       /api/interview (LLM, structured JSON) → { action, spoken_reply, grade }
       ↓
       /api/tts (gpt-4o-mini-tts) → mp3 → <audio>
```

On interview end, all grades + transcript are sent to `/api/interview` with `mode: "feedback"` for a structured report.

## Reference Q&A

Edit `src/data/interview-questions.json`. No code changes required — the interviewer prompt is built from `question`, `ideal_answer`, `must_cover`, `common_mistakes` per entry.

## Endpoints

- `POST /api/stt` — multipart `file`, `language` → `{ text }`
- `POST /api/tts` — `{ text, voice? }` → `audio/mpeg` stream
- `POST /api/interview` — `{ mode: "start" | "turn" | "feedback", language, currentIndex, followUpsUsed, history, grades? }`

## Retrieval design

For an 8–12 question fixed interview, the interviewer controls flow: we track `currentIndex` client-side and pass the *one* relevant reference entry to the LLM each turn. This is deterministic (right question, always), zero-latency lookup, and easy to reason about. Embedding-based retrieval would only be needed if the candidate could jump between topics arbitrarily.

## Keeping the LLM on rails

- Structured JSON output (`action`, `spoken_reply`, `grade`) — the model must pick one of four discrete actions per turn.
- Max 2 follow-ups per question (enforced in prompt via `followUpsUsed`).
- Explicit "never read the ideal answer verbatim" instruction.
- Reference `ideal_answer` and `must_cover` live in the system prompt, not in the spoken reply — they are grading criteria only.

## Latency notes

Turn = STT (~500–900 ms) + LLM (~700–1500 ms with Gemini 2.5 Flash) + TTS TTFB (~400–800 ms). Streaming TTS via SSE + streaming LLM tokens into a running TTS request would cut perceived latency to <1 s.

## Env

- `GEMINI_API_KEY` — auto-provisioned. Powers STT, TTS, and chat via the Lovable AI Gateway.
