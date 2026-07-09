/**
 * Chooses which speech provider the client uses.
 *
 * Default (development, no keys required):
 *   - STT: browser SpeechRecognition
 *   - TTS: browser SpeechSynthesis
 *
 * Production upgrade (opt-in, requires OPENAI_API_KEY on the server):
 *   Set these in your .env / hosting provider env vars:
 *     VITE_STT_PROVIDER=openai
 *     VITE_TTS_PROVIDER=openai
 *
 * These are VITE_-prefixed because they're read on the client to decide
 * whether to call the browser APIs directly or hit /api/stt / /api/tts.
 */

export type SttProvider = "browser" | "openai";
export type TtsProvider = "browser" | "openai";

export function getSttProvider(): SttProvider {
  const v = import.meta.env.VITE_STT_PROVIDER;
  return v === "openai" ? "openai" : "browser";
}

export function getTtsProvider(): TtsProvider {
  const v = import.meta.env.VITE_TTS_PROVIDER;
  return v === "openai" ? "openai" : "browser";
}