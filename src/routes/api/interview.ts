import { createFileRoute } from "@tanstack/react-router";
import {
  QUESTIONS,
  buildInterviewerSystemPrompt,
  buildFeedbackSystemPrompt,
} from "@/lib/interview-prompt";

type ChatMessage = { role: "user" | "assistant"; content: string };

async function callGateway(body: unknown) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Gateway ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return (await res.json()) as {
    choices: { message: { content: string } }[];
  };
}

function parseJsonLoose<T>(raw: string): T {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  const slice = first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;
  return JSON.parse(slice) as T;
}

export const Route = createFileRoute("/api/interview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json()) as {
          mode: "turn" | "feedback" | "start";
          language: string;
          currentIndex: number;
          followUpsUsed: number;
          history: ChatMessage[];
          grades?: Array<{
            questionId: string;
            question: string;
            score: number;
            note: string;
          }>;
        };

        try {
          if (payload.mode === "start") {
            const q = QUESTIONS.questions[0];
            const sys = `You are a friendly interviewer. Greet the candidate briefly in ${payload.language === "hi" ? "Hindi" : payload.language === "de" ? "German" : "English"}, mention this is a mock interview for a ${QUESTIONS.role}, and ask the first question naturally. Keep it under 40 words total. Return ONLY the spoken text, no JSON.`;
            const out = await callGateway({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: sys },
                { role: "user", content: `First question to weave in: ${q.question}` },
              ],
            });
            return Response.json({
              action: "advance",
              spoken_reply: out.choices[0].message.content.trim(),
            });
          }

          if (payload.mode === "feedback") {
            const sys = buildFeedbackSystemPrompt(payload.language);
            const transcript = payload.history
              .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
              .join("\n");
            const grades = (payload.grades ?? [])
              .map(
                (g) =>
                  `- [${g.questionId}] ${g.question}\n  score: ${g.score}/5\n  note: ${g.note}`,
              )
              .join("\n");
            const out = await callGateway({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: sys },
                {
                  role: "user",
                  content: `TRANSCRIPT:\n${transcript}\n\nPER-QUESTION GRADES:\n${grades}`,
                },
              ],
              response_format: { type: "json_object" },
            });
            const parsed = parseJsonLoose(out.choices[0].message.content);
            return Response.json({ feedback: parsed });
          }

          // mode === "turn"
          const sys = buildInterviewerSystemPrompt({
            language: payload.language,
            currentIndex: payload.currentIndex,
            followUpsUsed: payload.followUpsUsed,
          });
          const out = await callGateway({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: sys },
              ...payload.history.map((m) => ({ role: m.role, content: m.content })),
            ],
            response_format: { type: "json_object" },
          });
          const parsed = parseJsonLoose<{
            action: "follow_up" | "advance" | "correct_and_advance" | "end";
            spoken_reply: string;
            grade?: { score: number; covered: string[]; missed: string[]; note: string };
          }>(out.choices[0].message.content);
          return Response.json(parsed);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
