/**
 * Minimal Gemini REST client used to replace the Lovable AI Gateway.
 *
 * We call Google's Generative Language API directly using GEMINI_API_KEY.
 * Docs: https://ai.google.dev/api/generate-content
 *
 * We keep the shape of the response we hand back to interview.ts identical
 * to what the old Lovable/OpenAI-compatible gateway returned
 * ({ choices: [{ message: { content } }] }) so the rest of interview.ts
 * (parseJsonLoose, etc.) does not need to change.
 */

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export type GatewayLikeResponse = {
  choices: { message: { content: string } }[];
};

type GeminiCallOptions = {
  /** When true, ask Gemini to return raw JSON (mirrors OpenAI's response_format: json_object). */
  jsonMode?: boolean;
};

/**
 * Calls Gemini with a list of chat-style messages (system + user/assistant turns)
 * and returns a gateway-shaped response so callers don't need to change.
 */
export async function callGemini(
  messages: ChatMessage[],
  options: GeminiCallOptions = {},
): Promise<GatewayLikeResponse> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");

  // Gemini wants system instructions separated from the conversation turns.
  const systemMessages = messages.filter((m) => m.role === "system");
  const turns = messages.filter((m) => m.role !== "system");

  const systemInstruction = systemMessages.length
    ? { parts: [{ text: systemMessages.map((m) => m.content).join("\n\n") }] }
    : undefined;

  const contents = turns.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig: {
      temperature: 0.7,
      ...(options.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

  return { choices: [{ message: { content: text } }] };
}