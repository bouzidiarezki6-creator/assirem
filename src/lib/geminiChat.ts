import { SITE_ASSISTANT_SYSTEM } from "./siteKnowledge"

export type ChatTurn = {
  role: "user" | "model"
  text: string
}

type GeminiPart = { text?: string }
type GeminiContent = { role?: string; parts?: GeminiPart[] }
type GeminiResponse = {
  candidates?: { content?: GeminiContent }[]
  error?: { message?: string; code?: number }
}

const MODEL = "gemini-2.5-flash"

function getApiKey(): string | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  return key?.trim() ? key.trim() : null
}

export function isGeminiConfigured(): boolean {
  return Boolean(getApiKey())
}

/**
 * ============================================================================
 * RATE LIMITER (Fenêtre glissante anti-abus / protection des quotas)
 * Max 5 requêtes par tranche de 30 secondes, délai minimal de 2 secondes
 * ============================================================================
 */
const requestTimestamps: number[] = []
const WINDOW_MS = 30_000 // 30s
const MAX_REQUESTS_PER_WINDOW = 5
const MIN_INTERVAL_MS = 2_000 // 2s

function checkRateLimit(locale: string): string | null {
  const now = Date.now()

  // 1. Vérifier l'intervalle minimal entre requêtes consécutives
  if (requestTimestamps.length > 0) {
    const last = requestTimestamps[requestTimestamps.length - 1]
    if (now - last < MIN_INTERVAL_MS) {
      if (locale === "ar") {
        return "⏳ يرجى الانتظار لحظة قصيرة قبل إرسال رسالتك التالية (ثانيتان)."
      }
      return "⏳ Veuillez patienter un court instant (2 secondes) avant votre prochaine question."
    }
  }

  // 2. Nettoyer les requêtes hors de la fenêtre glissante
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - WINDOW_MS) {
    requestTimestamps.shift()
  }

  // 3. Vérifier la limite de requêtes par fenêtre
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    if (locale === "ar") {
      return "⚠️ لقد أرسلت عدة رسائل في وقت وجيز. يرجى الانتظار 30 ثانية لتتمكن من المتابعة."
    }
    return "⚠️ Vous avez envoyé plusieurs questions rapidement. Veuillez patienter environ 30 secondes pour reprendre la conversation."
  }

  // Enregistrer le timestamp
  requestTimestamps.push(now)
  return null
}

export async function askSiteAssistant(options: {
  question: string
  history: ChatTurn[]
  liveSnapshot: string
  locale: string
}): Promise<string> {
  // 1. Vérification du Rate Limiting
  const rateLimitNotice = checkRateLimit(options.locale)
  if (rateLimitNotice) {
    return rateLimitNotice
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error("missing_api_key")
  }

  // 2. Construction du prompt système enrichi avec RAG
  const systemText = [
    SITE_ASSISTANT_SYSTEM,
    "",
    options.liveSnapshot,
    "",
    `Directives linguistiques : Interface en langue "${options.locale}". Si l'utilisateur s'adresse en arabe, réponds en arabe fluide et chaleureux. S'il s'adresse en français, réponds en français soigné et concis.`,
  ].join("\n")

  // 3. Historique tronqué pour garder le contexte fluide (6 derniers tours max)
  const contents: GeminiContent[] = [
    ...options.history.slice(-6).map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text: options.question.trim() }] },
  ]

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

  try {
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
          maxOutputTokens: 600,
          topP: 0.85,
        },
      }),
    })

    const data = (await res.json()) as GeminiResponse

    if (!res.ok) {
      if (res.status === 429) {
        return options.locale === "ar"
          ? "⚠️ الخدمة الذكية تشهد ضغطاً حالياً. يرجى الانتظار دقيقة والمحاولة مجدداً."
          : "⚠️ L'assistant est momentanément très sollicité. Veuillez réessayer dans une minute."
      }
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
  } catch (err: any) {
    if (err.message === "missing_api_key") throw err
    console.warn("Gemini Chat request error:", err)
    return options.locale === "ar"
      ? "عذراً، تعذر الاتصال بالمساعد الذكي في الوقت الحالي. يمكنك استعراض الأحداث والمبادرات مباشرة عبر القائمة."
      : "Désolé, une brève interruption empêche de joindre l'assistant pour le moment. Vous pouvez consulter directement les événements et urgences depuis le menu."
  }
}
