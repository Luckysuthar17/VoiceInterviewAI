export type RecorderHandle = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

export async function startRecording(): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeCandidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  const mime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start(); // no timeslice — single complete file
  let stopped = false;

  const cleanup = () => stream.getTracks().forEach((t) => t.stop());

  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        if (stopped) return;
        stopped = true;
        recorder.onstop = () => {
          cleanup();
          const type = recorder.mimeType || "audio/webm";
          resolve(new Blob(chunks, { type }));
        };
        recorder.stop();
      }),
    cancel: () => {
      if (stopped) return;
      stopped = true;
      try { recorder.stop(); } catch { /* noop */ }
      cleanup();
    },
  };
}

export function extForMime(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  return "webm";
}
