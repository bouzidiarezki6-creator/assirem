import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Award, CheckCircle2, Clock, ShieldCheck, Sparkles, UserCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { useVolunteerAuth } from "@/context/VolunteerAuthContext"
import { getProfessionMeta } from "@/lib/sos"
import type { SosCall } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"

type Props = {
  call: SosCall | null
  onClose: () => void
  onSuccess?: () => void
}

export default function SosApplicationModal({ call, onClose, onSuccess }: Props) {
  const { t, locale } = useI18n()
  const { wilayas } = useLocationFilter()
  const { submitSosApplication } = useAppData()
  const { currentVolunteer, isAuthenticated } = useVolunteerAuth()

  const [fullName, setFullName] = useState(
    currentVolunteer ? `${currentVolunteer.firstName} ${currentVolunteer.lastName}` : ""
  )
  const [phone, setPhone] = useState(currentVolunteer?.phone || "")
  const [email, setEmail] = useState(currentVolunteer?.email || "")
  const [nationalId, setNationalId] = useState("")
  const [wilayaCode, setWilayaCode] = useState(currentVolunteer?.wilayaCode ?? call?.wilayaCode ?? 6)
  const [commune, setCommune] = useState(currentVolunteer?.commune ?? call?.commune ?? "")
  const [experienceYears, setExperienceYears] = useState("3")
  const [qualifications, setQualifications] = useState("")
  const [availability, setAvailability] = useState("")
  const [hasTransport, setHasTransport] = useState(false)
  const [skillsNotes, setSkillsNotes] = useState("")
  const [message, setMessage] = useState("")

  const [error, setError] = useState("")
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)
  const [isWaitlisted, setIsWaitlisted] = useState(false)

  if (!call) return null

  const isPro = call.type === "professional"
  const profMeta = getProfessionMeta(call.professionId)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (nationalId.trim() && !/^\d{18}$/.test(nationalId.trim())) {
      setError("Le NIN doit être composé exactement de 18 chiffres.")
      return
    }

    const res = submitSosApplication({
      callId: call.id,
      applicationType: call.type,
      volunteerId: currentVolunteer?.id,
      fullName,
      phone,
      email: email.trim() || undefined,
      nationalId: nationalId.trim() || undefined,
      wilayaCode,
      commune,
      professionId: call.professionId,
      customProfession: call.customProfessionTitle,
      experienceYears: isPro ? Number(experienceYears) || 0 : undefined,
      qualifications: isPro ? qualifications : undefined,
      availability,
      hasTransport,
      skillsNotes: skillsNotes.trim() || undefined,
      message: message.trim() || undefined,
    })

    if (!res.ok) {
      setError(t(res.error))
      return
    }

    setSubmittedRef(res.application.reference)
    setIsWaitlisted(res.application.isWaitlisted || res.application.status === "waitlist")
    if (onSuccess) onSuccess()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl rounded-3xl border border-border/80 bg-card p-6 shadow-card sm:p-7 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {submittedRef ? (
          <div className="flex flex-col items-center py-4 text-center space-y-4">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                isWaitlisted ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {isWaitlisted ? <Clock className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
            </div>

            <h3 className="text-xl font-extrabold text-foreground">
              {t("sos.calls.appSuccessTitle")}
            </h3>

            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 font-mono text-sm font-bold text-primary select-all">
              {t("sos.calls.appSuccessRef", { ref: submittedRef })}
            </div>

            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              {isWaitlisted
                ? t("sos.calls.appSuccessWaitlist")
                : t("sos.calls.appSuccessPending")}
            </p>

            {/* Volunteer Program Integration Notice */}
            {isAuthenticated && currentVolunteer ? (
              <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-start flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-200 leading-relaxed">
                  <p className="font-bold text-emerald-300">
                    Candidature liée à votre compte ({currentVolunteer.volunteerCode})
                  </p>
                  <p className="mt-0.5 text-emerald-300/90">
                    Dès que votre présence sera validée sur le terrain, vos points d'urgence seront directement ajoutés à votre espace personnel.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full rounded-2xl border border-border bg-muted/30 p-4 text-start flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Award className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-foreground">
                    <p className="font-bold text-foreground">
                      Envie de suivre vos participations et gagner des récompenses ?
                    </p>
                    <p className="text-muted-foreground">
                      Rejoignez gratuitement le programme bénévole pour obtenir votre badge et accumuler des points citoyens.
                    </p>
                  </div>
                </div>
                <Link
                  to="/rejoindre"
                  onClick={onClose}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Rejoindre</span>
                </Link>
              </div>
            )}

            <div className="pt-2">
              <Button type="button" onClick={onClose} className="rounded-2xl px-7">
                {t("common.close")}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-extrabold text-foreground">
                  {isPro ? t("sos.calls.appModalTitlePro") : t("sos.calls.appModalTitleVol")}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{call.title}</p>
              </div>
            </div>

            {/* Authenticated volunteer notice */}
            {isAuthenticated && currentVolunteer && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
                  <UserCheck className="h-4 w-4 text-emerald-700" />
                  <span>
                    Bénévole connecté : <strong>{currentVolunteer.firstName} {currentVolunteer.lastName}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {currentVolunteer.points} pts
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">{t("sos.calls.appModalSubtitle")}</p>

            <div className="space-y-3 pt-1">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t("sos.calls.fullName")}
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Amine Benali"
                    required
                    className="rounded-2xl mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t("sos.calls.phone")}
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05 / 06 / 07..."
                    required
                    dir="ltr"
                    className="rounded-2xl mt-1 h-11 font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t("sos.calls.email")}
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amine@exemple.dz"
                    dir="ltr"
                    className="rounded-2xl mt-1 h-11"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t("sos.calls.nationalId")}
                  </label>
                  <Input
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 18))}
                    placeholder="18 chiffres"
                    dir="ltr"
                    className="rounded-2xl mt-1 h-11 font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t("sos.calls.nationalIdHint")}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t("sos.calls.wilaya")}
                  </label>
                  <select
                    value={wilayaCode}
                    onChange={(e) => setWilayaCode(Number(e.target.value))}
                    className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
                  >
                    {wilayas.map((w) => (
                      <option key={w.code} value={w.code}>
                        {padWilayaCode(w.code)} — {locale === "ar" ? w.name_ar : w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t("sos.calls.commune")}
                  </label>
                  <Input
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    placeholder="Akbou, Béjaïa..."
                    required
                    className="rounded-2xl mt-1 h-11"
                  />
                </div>
              </div>

              {isPro && (
                <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
                  <div className="flex items-center justify-between text-xs font-bold text-primary">
                    <span>
                      {call.customProfessionTitle || (profMeta ? t(profMeta.labelKey) : "Profession")}
                    </span>
                    {profMeta?.requiresLicense && (
                      <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full">
                        Profession Réglementée
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        {t("sos.calls.experienceYears")}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="rounded-2xl mt-1 h-11 bg-card border-border/70"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        {t("sos.calls.qualifications")}
                      </label>
                      <Input
                        value={qualifications}
                        onChange={(e) => setQualifications(e.target.value)}
                        placeholder="Diplôme d'État, inscription à l'ordre..."
                        required={profMeta?.requiresLicense}
                        className="rounded-2xl mt-1 h-11 bg-card border-border/70"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t("sos.calls.availability")}
                </label>
                <Input
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="Ex: Tous les jours de 08h à 17h, ou week-ends..."
                  required
                  className="rounded-2xl mt-1 h-11"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hasTransport"
                  checked={hasTransport}
                  onChange={(e) => setHasTransport(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="hasTransport" className="text-xs font-medium text-foreground cursor-pointer">
                  {t("sos.calls.hasTransport")}
                </label>
              </div>

              {!isPro && (
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {t("sos.calls.skillsNotes")}
                  </label>
                  <Input
                    value={skillsNotes}
                    onChange={(e) => setSkillsNotes(e.target.value)}
                    placeholder="Permis B/C, secourisme, manutention..."
                    className="rounded-2xl mt-1 h-11"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground">
                  {t("sos.calls.message")}
                </label>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Remarque éventuelle pour le coordinateur..."
                  className="rounded-2xl mt-1 h-11"
                />
              </div>
            </div>

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

            <div className="flex gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-2xl h-11"
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="flex-1 rounded-2xl h-11">
                {t("sos.calls.submitApplication")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
