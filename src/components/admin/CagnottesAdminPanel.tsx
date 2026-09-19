import { useMemo, useRef, useState, type FormEvent } from "react"
import {
  Building2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Wallet,
  ImagePlus,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import {
  ASSOCIATION_SECTORS,
  formatCcpDisplay,
  getAssociationSector,
  normalizeCcp,
  type AssociationSectorId,
} from "@/lib/associations"
import { CAGNOTTE_TYPES, formatDzd } from "@/lib/cagnottes"
import { processAnnouncementImage } from "@/lib/eventImage"
import type { Association, Donation } from "@/lib/types"
import { padWilayaCode } from "@/lib/wilayas"
import { cn } from "@/lib/utils"

type SubTab = "ledger" | "associations" | "summary"

const emptyAssocForm = {
  name: "",
  logoDataUrl: null as string | null,
  sectorId: "orphans" as AssociationSectorId,
  ccpAccount: "",
  published: true,
}

export default function CagnottesAdminPanel() {
  const { t } = useI18n()
  const [sub, setSub] = useState<SubTab>("ledger")

  const tabs: { id: SubTab; label: string }[] = [
    { id: "ledger", label: t("admin.cagnottesCrm.sub.ledger") },
    { id: "summary", label: t("admin.cagnottesCrm.sub.summary") },
    { id: "associations", label: t("admin.cagnottesCrm.sub.associations") },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h2">{t("admin.cagnottesCrm.title")}</h1>
        <p className="type-caption mt-1">{t("admin.cagnottesCrm.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-white p-1.5 shadow-soft">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSub(tab.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              sub === tab.id
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sub === "ledger" && <LedgerSection />}
      {sub === "summary" && <SummarySection />}
      {sub === "associations" && <AssociationsSection />}
    </div>
  )
}

function useMoneyLocale() {
  const { locale } = useI18n()
  return locale === "ar" ? "ar-DZ" : locale === "en" ? "en-GB" : "fr-DZ"
}

function LedgerSection() {
  const { data, cancelDonation } = useAppData()
  const { t, formatDateTime } = useI18n()
  const intl = useMoneyLocale()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<"all" | "completed" | "cancelled">("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const donations = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return [...data.donations]
      .filter((d) => (status === "all" ? true : d.status === status))
      .filter((d) => (typeFilter === "all" ? true : d.cagnotteTypeId === typeFilter))
      .filter((d) => {
        if (!needle) return true
        const hay = [
          d.reference,
          d.donorName,
          d.associationName,
          d.associationCcp,
          d.cardLast4,
          d.cagnotteId,
          String(d.wilayaCode),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return hay.includes(needle)
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data.donations, q, status, typeFilter])

  const trackedTotal = donations
    .filter((d) => d.status === "completed")
    .reduce((s, d) => s + d.amount, 0)

  const onCancel = (d: Donation) => {
    const reason = window.prompt(t("admin.cagnottesCrm.cancelPrompt"))
    if (reason == null) return
    const res = cancelDonation(d.id, reason)
    if (!res.ok) window.alert(t(res.error))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t("admin.cagnottesCrm.trackedRevenue")}
          value={formatDzd(trackedTotal, intl)}
        />
        <StatCard
          label={t("admin.cagnottesCrm.donationCount")}
          value={String(donations.filter((d) => d.status === "completed").length)}
        />
        <StatCard
          label={t("admin.cagnottesCrm.cancelledCount")}
          value={String(data.donations.filter((d) => d.status === "cancelled").length)}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("admin.cagnottesCrm.searchDonations")}
            className="h-11 rounded-2xl ps-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-11 rounded-2xl border border-border bg-muted/30 px-3 text-sm font-medium"
        >
          <option value="all">{t("admin.cagnottesCrm.filterAllStatus")}</option>
          <option value="completed">{t("admin.cagnottesCrm.status.completed")}</option>
          <option value="cancelled">{t("admin.cagnottesCrm.status.cancelled")}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-11 rounded-2xl border border-border bg-muted/30 px-3 text-sm font-medium"
        >
          <option value="all">{t("admin.cagnottesCrm.filterAllTypes")}</option>
          {CAGNOTTE_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {t(`cagnottes.types.${type.id}`)}
            </option>
          ))}
        </select>
      </div>

      {donations.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border bg-white py-12 text-center text-muted-foreground">
          {t("admin.cagnottesCrm.emptyDonations")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border/60 bg-white shadow-soft">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-start font-semibold">{t("admin.cagnottesCrm.col.ref")}</th>
                <th className="px-3 py-3 text-start font-semibold">{t("admin.cagnottesCrm.col.date")}</th>
                <th className="px-3 py-3 text-start font-semibold">{t("cagnottes.donorName")}</th>
                <th className="px-3 py-3 text-start font-semibold">{t("admin.cagnottesCrm.col.destination")}</th>
                <th className="px-3 py-3 text-start font-semibold">{t("admin.cagnottesCrm.col.ccp")}</th>
                <th className="px-3 py-3 text-start font-semibold">{t("cagnottes.amount")}</th>
                <th className="px-3 py-3 text-start font-semibold">{t("admin.cagnottesCrm.col.card")}</th>
                <th className="px-3 py-3 text-start font-semibold">{t("admin.cagnottesCrm.col.status")}</th>
                <th className="px-3 py-3 text-end font-semibold">{t("admin.cagnottesCrm.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr
                  key={d.id}
                  className={cn(
                    "border-b border-border/50 last:border-0",
                    d.status === "cancelled" && "bg-rose-50/40 opacity-80"
                  )}
                >
                  <td className="px-3 py-3 font-mono text-xs font-semibold" dir="ltr">
                    {d.reference}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDateTime(d.createdAt)}
                  </td>
                  <td className="px-3 py-3 font-medium">{d.donorName}</td>
                  <td className="px-3 py-3">
                    <div className="space-y-0.5">
                      <p className="font-medium">
                        {d.associationName || t(`cagnottes.types.${d.cagnotteTypeId}`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`cagnottes.types.${d.cagnotteTypeId}`)} · {padWilayaCode(d.wilayaCode)}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground" dir="ltr">
                    {d.associationCcp ? formatCcpDisplay(d.associationCcp) : t("common.emDash")}
                  </td>
                  <td className="px-3 py-3 font-semibold text-primary whitespace-nowrap">
                    {formatDzd(d.amount, intl)}
                  </td>
                  <td className="px-3 py-3 font-mono text-muted-foreground" dir="ltr">
                    •••• {d.cardLast4}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-bold",
                        d.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      )}
                    >
                      {t(`admin.cagnottesCrm.status.${d.status}`)}
                    </span>
                    {d.cancelReason && (
                      <p className="mt-1 max-w-[10rem] truncate text-[11px] text-muted-foreground" title={d.cancelReason}>
                        {d.cancelReason}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-end">
                    {d.status === "completed" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-rose-600"
                        onClick={() => onCancel(d)}
                      >
                        <Ban className="h-4 w-4" />
                        {t("admin.cagnottesCrm.cancel")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SummarySection() {
  const { data } = useAppData()
  const { t } = useI18n()
  const intl = useMoneyLocale()

  const completed = useMemo(
    () => data.donations.filter((d) => d.status === "completed"),
    [data.donations]
  )

  const byType = useMemo(() => {
    return CAGNOTTE_TYPES.map((type) => {
      const rows = completed.filter((d) => d.cagnotteTypeId === type.id)
      return {
        id: type.id,
        count: rows.length,
        total: rows.reduce((s, d) => s + d.amount, 0),
      }
    })
  }, [completed])

  const byAssociation = useMemo(() => {
    const map = new Map<string, { name: string; ccp: string | null; count: number; total: number }>()
    for (const d of completed) {
      if (!d.associationId && !d.associationName) continue
      const key = d.associationId || d.associationName || "unknown"
      const cur = map.get(key) ?? {
        name: d.associationName || key,
        ccp: d.associationCcp,
        count: 0,
        total: 0,
      }
      cur.count += 1
      cur.total += d.amount
      if (!cur.ccp && d.associationCcp) cur.ccp = d.associationCcp
      map.set(key, cur)
    }
    return [...map.values()].sort((a, b) => b.total - a.total)
  }, [completed])

  const byWilaya = useMemo(() => {
    const map = new Map<number, { count: number; total: number }>()
    for (const d of completed) {
      const cur = map.get(d.wilayaCode) ?? { count: 0, total: 0 }
      cur.count += 1
      cur.total += d.amount
      map.set(d.wilayaCode, cur)
    }
    return [...map.entries()]
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12)
  }, [completed])

  const ledgerTotal = completed.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-primary/20 bg-primary/5 px-5 py-4">
        <p className="text-sm font-semibold text-primary">
          {t("admin.cagnottesCrm.reconciliation")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.cagnottesCrm.reconciliationHint", {
            amount: formatDzd(ledgerTotal, intl),
            count: completed.length,
          })}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold">{t("admin.cagnottesCrm.byType")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {byType.map((row) => (
            <div
              key={row.id}
              className="rounded-3xl border border-border/60 bg-white p-4 shadow-soft"
            >
              <p className="font-semibold">{t(`cagnottes.types.${row.id}`)}</p>
              <p className="mt-2 text-2xl font-extrabold text-primary">
                {formatDzd(row.total, intl)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("admin.cagnottesCrm.opsCount", { count: row.count })}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">{t("admin.cagnottesCrm.byAssociation")}</h2>
        {byAssociation.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border bg-white py-8 text-center text-muted-foreground">
            {t("admin.cagnottesCrm.emptyAssocRevenue")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-border/60 bg-white shadow-soft">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">{t("admin.cagnottesCrm.col.association")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("admin.cagnottesCrm.col.ccp")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("admin.cagnottesCrm.col.ops")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("cagnottes.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {byAssociation.map((row) => (
                  <tr key={row.name} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                      {row.ccp ? formatCcpDisplay(row.ccp) : t("common.emDash")}
                    </td>
                    <td className="px-4 py-3">{row.count}</td>
                    <td className="px-4 py-3 font-semibold text-primary">
                      {formatDzd(row.total, intl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">{t("admin.cagnottesCrm.byWilaya")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {byWilaya.map((row) => (
            <div
              key={row.code}
              className="rounded-3xl border border-border/60 bg-white p-4 shadow-soft"
            >
              <p className="text-sm font-semibold">
                {t("admin.cagnottesCrm.wilaya")} {padWilayaCode(row.code)}
              </p>
              <p className="mt-2 text-xl font-extrabold text-primary">
                {formatDzd(row.total, intl)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("admin.cagnottesCrm.opsCount", { count: row.count })}
              </p>
            </div>
          ))}
          {byWilaya.length === 0 && (
            <p className="col-span-full rounded-3xl border border-dashed border-border bg-white py-8 text-center text-muted-foreground">
              {t("admin.cagnottesCrm.emptyDonations")}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function AssociationsSection() {
  const { data, addAssociation, updateAssociation, deleteAssociation } = useAppData()
  const { t, formatDateTime } = useI18n()
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyAssocForm)
  const [error, setError] = useState("")
  const [q, setQ] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [busyLogo, setBusyLogo] = useState(false)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return data.associations
      .filter((a) => {
        if (!needle) return true
        return [a.name, a.ccpAccount, a.sectorId].join(" ").toLowerCase().includes(needle)
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data.associations, q])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyAssocForm)
    setError("")
    setMode("form")
  }

  const openEdit = (a: Association) => {
    setEditingId(a.id)
    setForm({
      name: a.name,
      logoDataUrl: a.logoDataUrl,
      sectorId: a.sectorId,
      ccpAccount: formatCcpDisplay(a.ccpAccount),
      published: a.published,
    })
    setError("")
    setMode("form")
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError("")
    if (editingId) {
      const res = updateAssociation(editingId, {
        name: form.name,
        logoDataUrl: form.logoDataUrl,
        sectorId: form.sectorId,
        ccpAccount: form.ccpAccount,
        published: form.published,
      })
      if ("error" in res) {
        setError(t(res.error))
        return
      }
    } else {
      const res = addAssociation({
        name: form.name,
        logoDataUrl: form.logoDataUrl,
        sectorId: form.sectorId,
        ccpAccount: form.ccpAccount,
        published: form.published,
      })
      if ("error" in res) {
        setError(t(res.error))
        return
      }
    }
    setMode("list")
    setEditingId(null)
    setForm(emptyAssocForm)
  }

  if (mode === "form") {
    return (
      <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-border/60 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">
            {editingId
              ? t("admin.cagnottesCrm.editAssociation")
              : t("admin.cagnottesCrm.addAssociation")}
          </h2>
          <Button type="button" variant="ghost" onClick={() => setMode("list")}>
            {t("admin.common.backToList")}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium">{t("admin.cagnottesCrm.fields.name")}</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("admin.cagnottesCrm.fields.category")}</label>
            <select
              value={form.sectorId}
              onChange={(e) =>
                setForm({ ...form, sectorId: e.target.value as AssociationSectorId })
              }
              className="h-11 w-full rounded-2xl border border-border bg-white px-3 text-sm"
            >
              {ASSOCIATION_SECTORS.map((s) => (
                <option key={s.id} value={s.id}>
                  {t(`cagnottes.sectors.${s.id}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("admin.cagnottesCrm.fields.ccp")}</label>
            <Input
              value={form.ccpAccount}
              onChange={(e) =>
                setForm({
                  ...form,
                  ccpAccount: formatCcpDisplay(normalizeCcp(e.target.value)),
                })
              }
              placeholder="007 99999 00 1234567890"
              dir="ltr"
              required
              className="h-11 rounded-2xl font-mono"
            />
            <p className="text-xs text-muted-foreground">{t("admin.cagnottesCrm.fields.ccpHint")}</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">{t("admin.cagnottesCrm.fields.logo")}</label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted/40">
                {form.logoDataUrl ? (
                  <img src={form.logoDataUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setBusyLogo(true)
                    setError("")
                    const res = await processAnnouncementImage(file)
                    setBusyLogo(false)
                    if (!res.ok) setError(t(res.error))
                    else setForm((f) => ({ ...f, logoDataUrl: res.dataUrl }))
                    if (fileRef.current) fileRef.current.value = ""
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyLogo}
                    onClick={() => fileRef.current?.click()}
                  >
                    {form.logoDataUrl ? <Upload className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
                    {form.logoDataUrl ? t("admin.common.replace") : t("admin.common.upload")}
                  </Button>
                  {form.logoDataUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-rose-600"
                      onClick={() => setForm({ ...form, logoDataUrl: null })}
                    >
                      {t("admin.common.delete")}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t("admin.cagnottesCrm.fields.logoHint")}</p>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            {t("admin.fields.published")}
          </label>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button type="submit">{t("admin.common.save")}</Button>
          <Button type="button" variant="outline" onClick={() => setMode("list")}>
            {t("admin.common.cancel")}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("admin.cagnottesCrm.searchAssociations")}
            className="h-11 rounded-2xl ps-9"
          />
        </div>
        <Button type="button" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("admin.cagnottesCrm.addAssociation")}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border bg-white py-12 text-center text-muted-foreground">
          {t("admin.cagnottesCrm.emptyAssociations")}
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a) => {
            const sector = getAssociationSector(a.sectorId)
            const SectorIcon = sector?.icon ?? Building2
            return (
              <div
                key={a.id}
                className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-white p-4 shadow-soft sm:flex-row sm:items-center"
              >
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl",
                    !a.logoDataUrl && (sector?.accent ?? "bg-primary/10 text-primary")
                  )}
                >
                  {a.logoDataUrl ? (
                    <img src={a.logoDataUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <SectorIcon className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{a.name}</p>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                      {t(`cagnottes.sectors.${a.sectorId}`)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        a.published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {a.published ? t("admin.common.published") : t("admin.common.draft")}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                    CCP {formatCcpDisplay(a.ccpAccount)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t("admin.cagnottesCrm.updatedAt", {
                      date: formatDateTime(a.updatedAt),
                    })}
                  </p>
                </div>
                <div className="flex gap-1 self-end sm:self-center">
                  <Button type="button" size="icon" variant="ghost" onClick={() => openEdit(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-rose-600"
                    onClick={() => {
                      if (confirm(t("admin.common.deleteConfirm"))) deleteAssociation(a.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Wallet className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-primary">{value}</p>
    </div>
  )
}
