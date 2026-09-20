import { SITE_ASSISTANT_SYSTEM } from "./siteKnowledge"

export type ChatTurn = {
  role: "user" | "model"
  text: string
}

type GeminiPart = { text?: string }
type GeminiContent = { role?: string; parts?: GeminiPart[] }
type GeminiResponse = {
  candidates?: { content?: GeminiContent }[]
  error?: { message?: string }
}

const MODEL = "gemini-2.5-flash"

function getApiKey(): string | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  return key?.trim() ? key.trim() : null
}

export function isGeminiConfigured(): boolean {
  return Boolean(getApiKey())
}

export async function askSiteAssistant(options: {
  question: string
  history: ChatTurn[]
  liveSnapshot: string
  locale: string
}): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error("missing_api_key")
  }

  const systemText = [
    SITE_ASSISTANT_SYSTEM,
    "",
    options.liveSnapshot,
    "",
    `Langue de l’interface utilisateur : ${options.locale}. Réponds dans la langue de la question.`,
  ].join("\n")

  const contents: GeminiContent[] = [
    ...options.history.slice(-8).map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text: options.question.trim() }] },
  ]

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemText }],
      },
      contents,
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 512,
      },
    }),
  })

  const data = (await res.json()) as GeminiResponse

  if (!res.ok) {
    throw new Error(data.error?.message || `gemini_http_${res.status}`)
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim()

  if (!text) {
    throw new Error("empty_response")
  }

  return text
}
