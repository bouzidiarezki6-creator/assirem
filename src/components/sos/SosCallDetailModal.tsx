import { useState } from "react"
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Shield,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { getProfessionMeta, isCallFull, mapsUrl } from "@/lib/sos"
import type { SosCall } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"
import SosApplicationModal from "./SosApplicationModal"

type Props = {
  call: SosCall | null
  isOpen: boolean
  onClose: () => void
}

export default function SosCallDetailModal({ call, isOpen, onClose }: Props) {
  const { t, locale } = useI18n()
  const { wilayas } = useLocationFilter()
  const [showApplyModal, setShowApplyModal] = useState(false)

  if (!isOpen || !call) return null

  const isPro = call.type === "professional"
  const profMeta = getProfessionMeta(call.professionId)
  const full = isCallFull(call) || call.status === "full"

  const w = wilayas.find((x) => x.code === call.wilayaCode)
  const wilayaLabel = w
    ? `${padWilayaCode(call.wilayaCode)} — ${locale === "ar" ? w.name_ar : w.name}`
    : padWilayaCode(call.wilayaCode)

  const remaining = Math.max(0, call.requiredSlots - (call.acceptedCount || 0))
  const percent = Math.min(
    100,
    Math.round(((call.acceptedCount || 0) / call.requiredSlots) * 100)
  )

  const urgencyColors: Record<string, string> = {
    critical: "bg-rose-50 text-rose-700 border-rose-200",
    urgent: "bg-amber-50 text-amber-700 border-amber-200",
    moderate: "bg-blue-50 text-blue-700 border-blue-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div
          role="dialog"
          aria-modal="true"
          className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl bg-card shadow-2xl border border-border/60 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border/50 px-6 py-5 bg-muted/20">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                    urgencyColors[call.urgencyLevel] || urgencyColors.urgent
                  )}
                >
                  {call.urgencyLevel === "critical" && <AlertCircle className="h-3 w-3" />}
                  {t(
                    `sos.priorities.${
                      call.urgencyLevel === "urgent" ? "high" : call.urgencyLevel
                    }`
                  )}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    isPro ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  )}
                >
                  {isPro ? <Briefcase className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                  {isPro
                    ? call.customProfessionTitle ||
                      (profMeta ? t(profMeta.labelKey) : "Professionnel")
                    : t("sos.calls.volTitle")}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Réf : {call.reference}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground leading-snug">
                {call.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* 1. Présentation de la mission */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" />
                Présentation de la mission
              </h3>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line bg-muted/20 p-4 rounded-2xl border border-border/40">
                {call.description || "Aucune description complémentaire renseignée pour cette mission."}
              </p>
            </section>

            {/* 2. Profil recherché */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-primary" />
                Profil recherché & compétences
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/50 bg-card p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Profession ou rôle
                  </span>
                  <span className="text-sm font-bold text-foreground block">
                    {call.customProfessionTitle ||
                      (profMeta ? t(profMeta.labelKey) : "Bénévole polyvalent")}
                  </span>
                  {isPro && (
                    <span className="text-[11px] text-muted-foreground">
                      Qualifications requises :{" "}
                      <strong>
                        {call.mandatoryQualifications ? "Obligatoires (diplôme/expérience)" : "Optionnelles"}
                      </strong>
                    </span>
                  )}
                </div>

                {call.requiredEquipment && (
                  <div className="rounded-2xl border border-border/50 bg-card p-3.5 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground block flex items-center gap-1">
                      <Wrench className="h-3 w-3 text-primary" />
                      Matériel éventuellement requis
                    </span>
                    <span className="text-sm font-semibold text-foreground block">
                      {call.requiredEquipment}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* 3. Localisation et horaires */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                Localisation et horaires
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/50 bg-card p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Zone géographique
                  </span>
                  <span className="text-sm font-bold text-foreground block">
                    {call.commune}, {wilayaLabel}
                  </span>
                  {call.address && (
                    <span className="text-xs text-muted-foreground block">
                      {call.address}
                    </span>
                  )}
                  {call.lat != null && call.lng != null && (
                    <a
                      href={mapsUrl(call.lat, call.lng)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline mt-1 pt-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ouvrir la localisation sur la carte
                    </a>
                  )}
                </div>

                <div className="rounded-2xl border border-border/50 bg-card p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground block flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" />
                    Période & Horaires
                  </span>
                  <span className="text-sm font-bold text-foreground block">
                    {call.startDate} {call.endDate ? `→ ${call.endDate}` : ""}
                  </span>
                  {call.timeSchedule && (
                    <span className="text-xs text-muted-foreground block flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {call.timeSchedule}
                    </span>
                  )}
                  {call.estimatedDuration && (
                    <span className="text-xs text-muted-foreground block">
                      Durée estimée : {call.estimatedDuration}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* 4. Places disponibles & Jauge */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                Places disponibles & Mobilisation
              </h3>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">
                    {t("sos.calls.slotsInfo", {
                      accepted: call.acceptedCount || 0,
                      total: call.requiredSlots,
                    })}
                  </span>
                  <span className="font-extrabold text-primary">{percent}%</span>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/80">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 rounded-full",
                      full ? "bg-amber-500" : "bg-primary"
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  {full ? (
                    <span className="font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/40">
                      {t("sos.calls.fullBadge")} — Inscriptions ouvertes en liste d'attente
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40">
                      {t("sos.calls.remainingSlots", { count: remaining })}
                    </span>
                  )}

                  <span className="text-muted-foreground font-medium">
                    {call.receivedCount || 0} candidature(s) enregistrée(s)
                  </span>
                </div>
              </div>
            </section>

            {/* 5. Conditions de participation */}
            {call.conditions && (
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Conditions de participation
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground bg-muted/20 p-3.5 rounded-2xl border border-border/40 whitespace-pre-line">
                  {call.conditions}
                </p>
              </section>
            )}

            {/* 6. Responsable de la mission */}
            {call.coordinatorName && (
              <section className="rounded-2xl border border-border/50 bg-card p-3.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground font-medium block">
                    {t("sos.calls.coordinator")}
                  </span>
                  <span className="font-bold text-foreground text-sm block">
                    {call.coordinatorName}
                  </span>
                </div>
                {call.coordinatorContact && (
                  <span className="font-mono text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
                    {call.coordinatorContact}
                  </span>
                )}
              </section>
            )}
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between gap-3 border-t border-border/50 px-6 py-4 bg-muted/10">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl text-xs">
              Fermer
            </Button>

            <button
              type="button"
              onClick={() => setShowApplyModal(true)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold shadow-soft transition-all active:scale-[0.98]",
                full
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {full ? (
                <>
                  <Clock className="h-4 w-4" />
                  {t("sos.calls.joinWaitlist")}
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Proposer mon aide
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <SosApplicationModal
          call={call}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false)
            onClose()
          }}
        />
      )}
    </>
  )
}

