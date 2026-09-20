import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, MessageCircle, Send, X } from "lucide-react"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { Button } from "@/components/ui/button"
import { askSiteAssistant, isGeminiConfigured, type ChatTurn } from "@/lib/geminiChat"
import { buildLiveSiteSnapshot } from "@/lib/siteKnowledge"
import { CAGNOTTE_TYPES } from "@/lib/cagnottes"
import { motion as motionTokens } from "@/lib/motion"
import { cn } from "@/lib/utils"

type UiMessage = {
  id: string
  role: "user" | "assistant"
  text: string
}

export default function SiteChatBubble() {
  const { t, locale, dir } = useI18n()
  const { data } = useAppData()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const configured = isGeminiConfigured()

  const liveSnapshot = useMemo(
    () =>
      buildLiveSiteSnapshot({
        institutions: data.institutions.map((i) => ({
          title: i.name,
          type: i.type,
          wilayaCode: i.wilayaCode,
          published: i.published,
        })),
        events: data.events.map((e) => ({
          title: e.title,
          location: e.location,
          date: e.date,
          published: e.published,
        })),
        activities: data.activities.map((a) => ({
          title: a.title,
          published: a.published,
        })),
        news: data.news.map((n) => ({
          title: n.title,
          published: n.published,
          featured: n.featured,
        })),
        cagnottes: data.cagnottes.map((c) => ({
          title: CAGNOTTE_TYPES.find((t) => t.id === c.typeId)?.id ?? c.typeId,
          wilayaCode: c.wilayaCode,
        })),
        associations: data.associations.map((a) => ({
          name: a.name,
          published: a.published,
        })),
        sosCollection: data.sosCollectionSites.map((s) => ({
          name: s.name,
          status: s.status,
          wilayaCode: s.wilayaCode,
        })),
        sosDamaged: data.sosDamagedSites.map((s) => ({
          name: s.name,
          status: s.status,
          wilayaCode: s.wilayaCode,
        })),
      }),
    [data]
  )

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open, busy])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const question = input.trim()
    if (!question || busy) return

    if (!configured) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", text: question },
        { id: crypto.randomUUID(), role: "assistant", text: t("chat.errors.missingKey") },
      ])
      setInput("")
      return
    }

    const history: ChatTurn[] = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      text: m.text,
    }))

    setInput("")
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: question },
    ])
    setBusy(true)

    try {
      const answer = await askSiteAssistant({
        question,
        history,
        liveSnapshot,
        locale,
      })
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: answer },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: t("chat.errors.failed") },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={cn(
        "fixed z-[60] flex flex-col items-end gap-3",
        "bottom-[5.5rem] end-4 lg:bottom-6 lg:end-6"
      )}
    >
      <AnimatePresence>
        {open && (
          <motion.section
            key="chat-panel"
            role="dialog"
            aria-label={t("chat.title")}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: motionTokens.standard, ease: motionTokens.ease }}
            className="flex h-[min(28rem,70vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border/70 bg-white shadow-elevated"
            dir={dir}
          >
            <header className="flex items-start justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground">
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{t("chat.title")}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-primary-foreground/85">
                  {t("chat.subtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 transition hover:bg-white/15"
                aria-label={t("chat.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-surface/80 px-3 py-3">
              {messages.length === 0 && (
                <div className="rounded-2xl bg-white px-3 py-2.5 text-sm text-muted-foreground shadow-soft">
                  {t("chat.welcome")}
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-soft",
                    m.role === "user"
                      ? "ms-auto bg-primary text-primary-foreground"
                      : "me-auto bg-white text-foreground"
                  )}
                >
                  {m.text}
                </div>
              ))}
              {busy && (
                <div className="me-auto flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-muted-foreground shadow-soft">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("chat.thinking")}
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="border-t border-border/60 bg-white p-2.5">
              <div className="flex items-end gap-2">
                <label className="sr-only" htmlFor="site-chat-input">
                  {t("chat.placeholder")}
                </label>
                <textarea
                  id="site-chat-input"
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("chat.placeholder")}
                  className="max-h-24 min-h-10 flex-1 resize-none rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-primary focus:ring-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      void onSubmit(e)
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={busy || !input.trim()}
                  aria-label={t("chat.send")}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-expanded={open}
        aria-label={open ? t("chat.close") : t("chat.open")}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated",
          "ring-2 ring-white/80 transition hover:bg-primary/92"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </div>
  )
}
