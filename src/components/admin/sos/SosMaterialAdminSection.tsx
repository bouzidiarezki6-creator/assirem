import { useState, useMemo, type FormEvent } from "react"
import { Check, Edit3, MoreVertical, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { SOS_MATERIAL_CATEGORIES, parseGpsCoord } from "@/lib/sos"
import type {
  SosMaterialCategory,
  SosMaterialNeed,
  SosMaterialStatus,
  SosPriorityLevel,
} from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

export default function SosMaterialAdminSection() {
  const { t, locale } = useI18n()
  const { wilayas, selectedCode } = useLocationFilter()
  const {
    data,
    addSosMaterialNeed,
    updateSosMaterialNeed,
    deleteSosMaterialNeed,
  } = useAppData()

  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState<string>("all")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState("")
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Form fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<SosMaterialCategory>("food_water")
  const [wilayaCode, setWilayaCode] = useState(selectedCode ?? 6)
  const [commune, setCommune] = useState("Akbou")
  const [address, setAddress] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [requiredQuantity, setRequiredQuantity] = useState("100")
  const [receivedQuantity, setReceivedQuantity] = useState("0")
  const [unit, setUnit] = useState("colis")
  const [priority, setPriority] = useState<SosPriorityLevel>("high")
  const [deadline, setDeadline] = useState("")
  const [status, setStatus] = useState<SosMaterialStatus>("validated")
  const [adminNote, setAdminNote] = useState("")

  const needs = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data.sosMaterialNeeds || []).filter((m) => {
      if (filterCat !== "all" && m.category !== filterCat) return false
      if (!needle) return true
      return [m.title, m.commune, m.reference, String(m.wilayaCode)]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [data.sosMaterialNeeds, filterCat, search])

  const openNewForm = () => {
    setEditingId(null)
    setTitle("")
    setDescription("")
    setCategory("food_water")
    setWilayaCode(selectedCode ?? 6)
    setCommune("Akbou")
    setAddress("")
    setLat("")
    setLng("")
    setRequiredQuantity("100")
    setReceivedQuantity("0")
    setUnit("colis")
    setPriority("high")
    setDeadline("")
    setStatus("validated")
    setAdminNote("")
    setFormError("")
    setShowForm(true)
  }

  const openEditForm = (m: SosMaterialNeed) => {
    setEditingId(m.id)
    setTitle(m.title)
    setDescription(m.description || "")
    setCategory(m.category)
    setWilayaCode(m.wilayaCode)
    setCommune(m.commune)
    setAddress(m.address || "")
    setLat(m.lat != null ? String(m.lat) : "")
    setLng(m.lng != null ? String(m.lng) : "")
    setRequiredQuantity(String(m.requiredQuantity))
    setReceivedQuantity(String(m.receivedQuantity || 0))
    setUnit(m.unit)
    setPriority(m.priority)
    setDeadline(m.deadline || "")
    setStatus(m.status)
    setAdminNote(m.adminNote || "")
    setFormError("")
    setShowForm(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFormError("")

    const reqQty = Number(requiredQuantity)
    if (!reqQty || reqQty <= 0) {
      setFormError("La quantité requise doit être supérieure à 0.")
      return
    }

    const latN = lat.trim() ? parseGpsCoord(lat) : undefined
    const lngN = lng.trim() ? parseGpsCoord(lng) : undefined

    if (editingId) {
      const recQty = Number(receivedQuantity) || 0
      const res = updateSosMaterialNeed(editingId, {
        title: title.trim(),
        description: description.trim(),
        category,
        wilayaCode,
        commune: commune.trim(),
        address: address.trim() || undefined,
        lat: latN ?? undefined,
        lng: lngN ?? undefined,
        requiredQuantity: reqQty,
        receivedQuantity: recQty,
        unit: unit.trim(),
        priority,
        deadline: deadline || undefined,
        status,
        adminNote: adminNote.trim(),
      })
      if ("error" in res) {
        setFormError(t(res.error))
        return
      }
    } else {
      const res = addSosMaterialNeed({
        title: title.trim(),
        description: description.trim(),
        category,
        wilayaCode,
        commune: commune.trim(),
        address: address.trim() || undefined,
        lat: latN ?? undefined,
        lng: lngN ?? undefined,
        requiredQuantity: reqQty,
        unit: unit.trim(),
        priority,
        deadline: deadline || undefined,
        status,
        adminNote: adminNote.trim(),
      })
      if ("error" in res) {
        setFormError(t(res.error))
        return
      }
    }

    setShowForm(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">
            {t("admin.sosCrm.tabs.needs")} ({needs.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Déclaration, mise à jour des ressources reçues et suivi des dons.
          </p>
        </div>

        <Button
          type="button"
          onClick={showForm ? () => setShowForm(false) : openNewForm}
          className="rounded-2xl gap-2"
        >
          <Plus className="h-4 w-4" />
          {showForm ? t("common.cancel") : t("admin.sosCrm.actions.addNeed")}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-border/80 bg-white p-6 shadow-soft animate-fade-in"
        >
          <h3 className="text-base font-extrabold text-foreground">
            {editingId ? "Modifier le besoin matériel" : t("admin.sosCrm.actions.addNeed")}
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Titre du besoin *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Colis alimentaires et eau pour familles sinistrées"
                required
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Catégorie *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SosMaterialCategory)}
                className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
              >
                {SOS_MATERIAL_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t(c.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Priorité d'urgence *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as SosPriorityLevel)}
                className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
              >
                <option value="critical">Critique (Danger immédiat)</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Standard</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Quantité nécessaire *</label>
              <Input
                type="number"
                min="1"
                value={requiredQuantity}
                onChange={(e) => setRequiredQuantity(e.target.value)}
                required
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Unité de mesure *</label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="colis, kg, litres, cartons, tentes..."
                required
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            {editingId && (
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Quantité reçue à ce jour
                </label>
                <Input
                  type="number"
                  min="0"
                  value={receivedQuantity}
                  onChange={(e) => setReceivedQuantity(e.target.value)}
                  className="rounded-2xl mt-1 h-11"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-foreground">Statut de validation *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SosMaterialStatus)}
                className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
              >
                <option value="validated">Validé & Publié</option>
                <option value="fulfilled">Totalement satisfait (Clôturé)</option>
                <option value="pending">En attente de vérification</option>
                <option value="closed">Fermé / Suspendu</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Wilaya *</label>
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
              <label className="text-xs font-semibold text-foreground">Commune *</label>
              <Input
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                placeholder="Akbou, Sidi Aïch..."
                required
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Adresse ou point de dépôt</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dépôt municipal Z.I. Akbou, Hangar 2..."
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Latitude GPS (optionnel)</label>
              <Input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="36.4578"
                dir="ltr"
                className="rounded-2xl mt-1 h-11 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Longitude GPS (optionnel)</label>
              <Input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="4.5421"
                dir="ltr"
                className="rounded-2xl mt-1 h-11 font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Description détaillée</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Précisions sur les denrées acceptées, conditionnement..."
                className="rounded-2xl mt-1 h-11"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Note interne administrative</label>
              <Input
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Suivi interne..."
                className="rounded-2xl mt-1 h-11"
              />
            </div>
          </div>

          {formError && <p className="text-xs font-semibold text-rose-600">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="rounded-2xl"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="rounded-2xl">
              {editingId ? t("common.save") : "Créer le besoin"}
            </Button>
          </div>
        </form>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par référence, titre, commune..."
            className="h-11 rounded-2xl ps-11 text-xs sm:text-sm"
          />
        </div>

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
        >
          <option value="all">Toutes les catégories</option>
          {SOS_MATERIAL_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {t(c.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {/* Needs Table */}
      <div className="overflow-x-auto rounded-3xl border border-border/70 bg-white shadow-soft">
        <table className="w-full text-start text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
              <th className="p-4 text-start">Réf & Titre</th>
              <th className="p-4 text-start">Catégorie</th>
              <th className="p-4 text-start">Localisation</th>
              <th className="p-4 text-start">Progression</th>
              <th className="p-4 text-start">Priorité</th>
              <th className="p-4 text-start">Statut</th>
              <th className="p-4 text-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {needs.map((m) => {
              const remaining = Math.max(0, m.requiredQuantity - (m.receivedQuantity || 0))
              const percent = Math.min(
                100,
                Math.round(((m.receivedQuantity || 0) / m.requiredQuantity) * 100)
              )
              const w = wilayas.find((x) => x.code === m.wilayaCode)
              return (
                <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-[10px] text-muted-foreground block">
                      {m.reference}
                    </span>
                    <strong className="text-foreground text-sm font-bold block">{m.title}</strong>
                    {m.adminNote && (
                      <span className="text-[10px] text-muted-foreground italic">
                        Note: {m.adminNote}
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    {t(`sos.material.${m.category}`)}
                  </td>
                  <td className="p-4">
                    <span>{m.commune}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      W.{padWilayaCode(m.wilayaCode)} ({locale === "ar" ? w?.name_ar : w?.name})
                    </span>
                  </td>
                  <td className="p-4 min-w-[140px]">
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span>
                        {m.receivedQuantity} / {m.requiredQuantity} {m.unit}
                      </span>
                      <span className="text-primary font-bold">{percent}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Reste {remaining} {m.unit}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                        m.priority === "critical" && "bg-rose-100 text-rose-800",
                        m.priority === "high" && "bg-amber-100 text-amber-800",
                        m.priority === "medium" && "bg-blue-100 text-blue-800",
                        m.priority === "low" && "bg-emerald-100 text-emerald-800"
                      )}
                    >
                      {t(`sos.priorities.${m.priority}`)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                        m.status === "validated" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                        m.status === "fulfilled" && "bg-teal-50 text-teal-700 border border-teal-200",
                        m.status === "pending" && "bg-indigo-50 text-indigo-700 border border-indigo-200",
                        m.status === "closed" && "bg-muted text-muted-foreground",
                        m.status === "rejected" && "bg-rose-50 text-rose-700 border border-rose-200"
                      )}
                    >
                      {m.status === "validated"
                        ? "Validé"
                        : m.status === "fulfilled"
                        ? "Satisfait"
                        : m.status === "pending"
                        ? "En attente"
                        : m.status === "closed"
                        ? "Fermé"
                        : "Rejeté"}
                    </span>
                  </td>
                  <td className="p-4 text-end relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === m.id ? null : m.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      aria-label="Actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuId === m.id && (
                      <div className="absolute right-4 top-12 z-20 w-44 rounded-2xl border border-border/80 bg-white p-1.5 shadow-xl animate-fade-in text-start">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null)
                            openEditForm(m)
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-primary" />
                          Modifier
                        </button>

                        <div className="my-1 border-t border-border/40" />

                        <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                          Changer statut :
                        </div>
                        {(["validated", "fulfilled", "pending", "closed"] as SosMaterialStatus[]).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                updateSosMaterialNeed(m.id, { status: st })
                                setActiveMenuId(null)
                              }}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs",
                                m.status === st
                                  ? "font-bold text-primary bg-primary/5"
                                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                              )}
                            >
                              <span className="capitalize">{st === "validated" ? "Validé" : st === "fulfilled" ? "Satisfait" : st === "pending" ? "En attente" : "Fermé"}</span>
                              {m.status === st && <Check className="h-3 w-3" />}
                            </button>
                          )
                        )}

                        <div className="my-1 border-t border-border/40" />

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null)
                            if (confirm(`Supprimer le besoin "${m.title}" ?`)) {
                              deleteSosMaterialNeed(m.id)
                            }
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {needs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Aucun besoin matériel trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
