import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type GatewayLikeResponse = {
  choices: {
    message: {
      content: string;
    };
  }[];
};

type GroqCallOptions = {
  jsonMode?: boolean;
};

export async function callGemini(
  messages: ChatMessage[],
  options: GroqCallOptions = {}
): Promise<GatewayLikeResponse> {

  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const response = await groq.chat.completions.create({

    model: "llama-3.3-70b-versatile",

    temperature: 0.7,

    messages,

    ...(options.jsonMode
      ? {
          response_format: {
            type: "json_object",
          },
        }
      : {}),
  });

  return {
    choices: [
      {
        message: {
          content:
            response.choices[0]?.message?.content ??
            "",
        },
      },
    ],
  };
}