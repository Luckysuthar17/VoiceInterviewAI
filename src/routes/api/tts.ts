import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.GROQ_API_KEY;
        if (!key) return new Response("Missing GEMINI_API_KEY", { status: 500 });

        const { text, voice } = (await request.json()) as {
          text: string;
          voice?: string;
        };
        if (!text || !text.trim()) {
          return new Response("Empty text", { status: 400 });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice: voice ?? "alloy",
            response_format: "mp3",
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          return new Response(`TTS failed: ${res.status} ${errText}`, {
            status: res.status,
          });
        }

        return new Response(res.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
