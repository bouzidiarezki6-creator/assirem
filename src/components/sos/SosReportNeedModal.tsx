import { useState, type FormEvent } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Package,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { SOS_MATERIAL_CATEGORIES } from "@/lib/sos"
import type { SosMaterialCategory, SosPriorityLevel } from "@/lib/types"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function SosReportNeedModal({ isOpen, onClose }: Props) {
  const { t } = useI18n()
  const { wilayas, selectedCode } = useLocationFilter()
  const { addSosMaterialNeed } = useAppData()

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<SosMaterialCategory>("food_water")
  const [description, setDescription] = useState("")
  const [wilayaCode, setWilayaCode] = useState(selectedCode ?? 6)
  const [commune, setCommune] = useState("Akbou")
  const [address, setAddress] = useState("")
  const [requiredQuantity, setRequiredQuantity] = useState("50")
  const [unit, setUnit] = useState("colis")
  const [priority, setPriority] = useState<SosPriorityLevel>("high")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")

  const [error, setError] = useState("")
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Veuillez saisir un intitulé pour ce besoin.")
      return
    }

    const qty = Number(requiredQuantity)
    if (!qty || qty <= 0) {
      setError("Veuillez indiquer une quantité estimée supérieure à zéro.")
      return
    }

    const fullDescription = [
      description.trim(),
      contactName.trim() ? `Contact référent : ${contactName.trim()}` : "",
      contactPhone.trim() ? `Téléphone : ${contactPhone.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n")

    const res = addSosMaterialNeed({
      title: title.trim(),
      description: fullDescription,
      category,
      wilayaCode,
      commune: commune.trim(),
      address: address.trim() || undefined,
      requiredQuantity: qty,
      unit: unit.trim() || "unités",
      priority,
      status: "pending", // Citizens submit in pending state for admin validation
    })

    if ("error" in res) {
      setError(t(res.error))
      return
    }

    setSubmittedRef(res.reference)
  }

  const handleReset = () => {
    setSubmittedRef(null)
    setTitle("")
    setDescription("")
    setAddress("")
    setContactName("")
    setContactPhone("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex flex-col w-full max-w-xl max-h-[90vh] rounded-3xl bg-card shadow-2xl border border-border/60 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/50 px-6 py-5 bg-muted/20">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
              <Package className="h-4 w-4" />
              Signalement solidaire
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
              Signaler un besoin urgent
            </h2>
            <p className="text-xs text-muted-foreground">
              Déclarez une situation ou un besoin matériel afin que nos équipes et bénévoles puissent intervenir.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submittedRef ? (
          <div className="p-8 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-foreground">
                Votre signalement a été enregistré avec succès !
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                Votre signalement sera examiné en priorité par la cellule de coordination locale avant validation et publication.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-950/40 p-4 max-w-sm mx-auto">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase block tracking-wider">
                Numéro de référence du signalement
              </span>
              <span className="text-2xl font-black font-mono text-emerald-200 tracking-wider">
                {submittedRef}
              </span>
              <span className="text-[10px] text-emerald-300/90 block mt-1">
                Conservez cette référence pour suivre l'état de votre demande.
              </span>
            </div>

            <Button
              type="button"
              onClick={handleReset}
              className="rounded-2xl bg-primary px-8"
            >
              Fermer la fenêtre
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {error && (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Catégorie du besoin */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Catégorie du besoin *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SosMaterialCategory)}
                className="w-full rounded-2xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:outline-none"
              >
                {SOS_MATERIAL_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {t(cat.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Titre */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Intitulé du besoin *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Eau potable et colis alimentaires pour 30 familles"
                required
                className="h-10 rounded-2xl text-xs"
              />
            </div>

            {/* Quantité & Unité */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Quantité nécessaire estimée *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={requiredQuantity}
                  onChange={(e) => setRequiredQuantity(e.target.value)}
                  required
                  className="h-10 rounded-2xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Unité
                </label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="colis, litres, couvertures..."
                  className="h-10 rounded-2xl text-xs"
                />
              </div>
            </div>

            {/* Wilaya & Commune */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Wilaya *
                </label>
                <select
                  value={wilayaCode}
                  onChange={(e) => setWilayaCode(Number(e.target.value))}
                  className="w-full rounded-2xl border border-border/80 bg-card text-foreground px-3 py-2 text-xs font-semibold focus:border-primary focus:outline-none"
                >
                  {wilayas.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Commune / Localité *
                </label>
                <Input
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder="Ex : Akbou"
                  required
                  className="h-10 rounded-2xl text-xs bg-card border-border/70 text-foreground"
                />
              </div>
            </div>

            {/* Adresse ou point de repère */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Adresse ou repère précis
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex : Quartier Guendouza, près de l'école..."
                className="h-10 rounded-2xl text-xs bg-card border-border/70 text-foreground"
              />
            </div>

            {/* Priorité */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Niveau d'urgence constaté
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "medium", label: "Modéré", color: "hover:border-blue-300" },
                    { id: "high", label: "Élevé", color: "hover:border-amber-300" },
                    { id: "critical", label: "Critique", color: "hover:border-rose-300" },
                  ] as const
                ).map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setPriority(lvl.id)}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition-all ${
                      priority === lvl.id
                        ? "border-primary bg-primary/10 text-primary"
                        : `border-border/70 bg-card text-muted-foreground ${lvl.color}`
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description détaillée */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Détails de la situation
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Précisez la situation des personnes touchées, accès aux routes, etc."
                className="w-full rounded-2xl border border-border/80 bg-card text-foreground p-3 text-xs focus:border-primary focus:outline-none"
              />
            </div>

            {/* Contact référent */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Votre nom / contact
                </label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ex : Karim M."
                  className="h-10 rounded-2xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Numéro de téléphone
                </label>
                <Input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="0550..."
                  className="h-10 rounded-2xl text-xs"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/40">
              <Button type="button" variant="ghost" onClick={handleReset} className="rounded-2xl text-xs">
                Annuler
              </Button>
              <Button type="submit" className="rounded-2xl bg-primary px-6 text-xs font-bold">
                Transmettre le signalement
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
