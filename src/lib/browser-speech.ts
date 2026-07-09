/**
 * Wraps the browser's native Web Speech API so the app can run for free
 * during development (no OpenAI quota needed) and as a zero-cost fallback
 * in production.
 *
 * - speakBrowser()      -> window.speechSynthesis   (TTS)
 * - startBrowserRecognition() -> window.SpeechRecognition  (STT)
 *
 * IMPORTANT (fixes "mic starts before greeting finishes"):
 * speakBrowser() resolves its promise only after the `onend` (or `onerror`)
 * event fires. Callers must `await speakBrowser(...)` and only start
 * recording/listening after that promise resolves. Never start
 * startBrowserRecognition() (or the MediaRecorder-based flow) while speech
 * synthesis is still speaking.
 */

// Minimal ambient types so this compiles without @types/dom-speech-recognition.
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const BCP47: Record<string, string> = {
  en: "en-US",
  hi: "hi-IN",
  de: "de-DE",
};

export function browserSpeechSupported(): { tts: boolean; stt: boolean } {
  if (typeof window === "undefined") return { tts: false, stt: false };
  return {
    tts: "speechSynthesis" in window,
    stt: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
  };
}

/**
 * Speaks `text` aloud using the browser's SpeechSynthesis API.
 * Resolves once speech has fully finished playing (onend/onerror).
 * Never starts the microphone; callers are responsible for sequencing.
 */
export function speakBrowser(text: string, language: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) {
      resolve();
      return;
    }
    // Cancel anything queued/speaking so utterances never overlap.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = BCP47[language] ?? "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    const finish = () => resolve();
    utterance.onend = finish;
    utterance.onerror = finish;

    // Some browsers need voices to load asynchronously before speaking reliably.
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const match = voices.find((v) => v.lang === utterance.lang);
      if (match) utterance.voice = match;
    }

    window.speechSynthesis.speak(utterance);
  });
}

export function cancelBrowserSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export type BrowserRecognitionHandle = {
  /** Stops listening and resolves with the recognized text (may be empty). */
  stop: () => Promise<string>;
  /** Aborts without waiting for a final result. */
  cancel: () => void;
};

/**
 * Starts the browser's SpeechRecognition engine. Resolves the returned
 * handle immediately (recognition is running); call `.stop()` to end
 * listening and retrieve the transcribed text.
 *
 * Caller contract: only call this AFTER the interviewer's greeting/reply
 * has finished playing (i.e. after `await speakBrowser(...)` resolves,
 * and only once the UI is in a "listening"/"recording" state), so the
 * mic never opens while the interviewer is still talking.
 */
export async function startBrowserRecognition(language: string): Promise<BrowserRecognitionHandle> {
  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Ctor) {
    throw new Error("Speech recognition is not supported in this browser. Try Chrome or Edge.");
  }

  const recognition = new Ctor();
  recognition.lang = BCP47[language] ?? "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalText = "";
  let stopped = false;

  recognition.onresult = (ev) => {
    let combined = "";
    for (let i = 0; i < ev.results.length; i++) {
      combined += ev.results[i][0].transcript;
    }
    finalText = combined.trim();
  };

  recognition.onerror = () => {
    // Swallow; stop() will resolve with whatever we have so far.
  };

  recognition.start();

  return {
    stop: () =>
      new Promise<string>((resolve) => {
        if (stopped) {
          resolve(finalText);
          return;
        }
        stopped = true;
        recognition.onend = () => resolve(finalText);
        try {
          recognition.stop();
        } catch {
          resolve(finalText);
        }
      }),
    cancel: () => {
      if (stopped) return;
      stopped = true;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
    },
  };
}