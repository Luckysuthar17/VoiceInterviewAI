import { createFileRoute } from "@tanstack/react-router";

const LANG_MAP: Record<string, string> = {
  en: "en",
  hi: "hi",
  de: "de",
};

export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const inbound = await request.formData();
        const file = inbound.get("file");
        const language = String(inbound.get("language") ?? "en");
        if (!(file instanceof File) || file.size < 512) {
          return new Response(
            JSON.stringify({ error: "Recording was empty. Please try again." }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-mini-transcribe");
        upstream.append("file", file, file.name || "recording.wav");
        const iso = LANG_MAP[language];
        if (iso) upstream.append("language", iso);

        const res = await fetch(
          "https://ai.gateway.lovable.dev/v1/audio/transcriptions",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${key}` },
            body: upstream,
          },
        );

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          return new Response(
            JSON.stringify({ error: `Transcription failed: ${res.status} ${errText}` }),
            { status: res.status, headers: { "content-type": "application/json" } },
          );
        }

        const data = (await res.json()) as { text?: string };
        return new Response(JSON.stringify({ text: data.text ?? "" }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
