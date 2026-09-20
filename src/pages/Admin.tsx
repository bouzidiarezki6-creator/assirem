import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Activity,
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Newspaper,
  ScanLine,
  Search,
  Trash2,
  Users,
  Wallet,
  Siren,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RegistrantQrCode from "@/components/shared/RegistrantQrCode"
import QrScanner from "@/components/admin/QrScanner"
import EventAdminPanel from "@/components/admin/EventAdminPanel"
import CagnottesAdminPanel from "@/components/admin/CagnottesAdminPanel"
import SosAdminPanel from "@/components/admin/SosAdminPanel"
import LanguageSwitcher from "@/components/layout/LanguageSwitcher"
import {
  ActivityAdminPanel,
  AnnouncementAdminPanel,
  InstitutionAdminPanel,
  NewsAdminPanel,
} from "@/components/admin/SiteContentAdmin"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import {
  isAdminAuthenticated,
  loginAdmin,
  logoutAdmin,
} from "@/lib/storage"

type Tab =
  | "overview"
  | "events"
  | "institutions"
  | "activities"
  | "announcements"
  | "news"
  | "crm"
  | "scan"
  | "cagnottes"
  | "sos"

const tabDefs: { id: Tab; labelKey: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", labelKey: "admin.tabs.overview", icon: LayoutDashboard },
  { id: "institutions", labelKey: "admin.tabs.institutions", icon: Building2 },
  { id: "activities", labelKey: "admin.tabs.activities", icon: Activity },
  { id: "cagnottes", labelKey: "admin.tabs.cagnottes", icon: Wallet },
  { id: "sos", labelKey: "admin.tabs.sos", icon: Siren },
  { id: "announcements", labelKey: "admin.tabs.announcements", icon: Megaphone },
  { id: "news", labelKey: "admin.tabs.news", icon: Newspaper },
  { id: "events", labelKey: "admin.tabs.events", icon: CalendarDays },
  { id: "crm", labelKey: "admin.tabs.crm", icon: Users },
  { id: "scan", labelKey: "admin.tabs.scan", icon: ScanLine },
]

export default function Admin() {
  const [authed, setAuthed] = useState(isAdminAuthenticated())
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("overview")
  const navigate = useNavigate()
  const { t, dir } = useI18n()

  useEffect(() => {
    setAuthed(isAdminAuthenticated())
  }, [])

  if (!authed) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4" dir={dir}>
        <Card className="w-full max-w-md shadow-card border-border/60">
          <CardHeader>
            <div className="flex justify-end mb-2">
              <LanguageSwitcher variant="plain" />
            </div>
            <CardTitle className="text-2xl text-primary">{t("admin.login.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("admin.login.subtitle")}</p>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                if (loginAdmin(password)) {
                  setAuthed(true)
                  setError("")
                } else {
                  setError(t("admin.login.badPassword"))
                }
              }}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  {t("admin.login.password")}
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full">
                {t("admin.login.submit")}
              </Button>
              <Button type="button" variant="ghost" className="w-full" asChild>
                <Link to="/">{t("admin.login.back")}</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface text-foreground" dir={dir}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-white/90 backdrop-blur-md shadow-soft">
        <div className="mx-auto flex h-14 max-w-[100rem] items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-xs font-bold text-primary-foreground shadow-soft">
              ADM
            </div>
            <div>
              <p className="font-bold leading-none">{t("admin.brand")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("admin.brandSub")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="plain" />
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              {t("admin.seeSite")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logoutAdmin()
                setAuthed(false)
              }}
            >
              <LogOut className="h-4 w-4" />
              {t("admin.logout")}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[100rem] gap-6 px-4 sm:px-6 lg:px-10 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-1 rounded-3xl border border-border/60 bg-white p-2 shadow-soft lg:sticky lg:top-20 lg:self-start">
          {tabDefs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                tab === item.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </button>
          ))}
        </aside>

        <main className="min-w-0 space-y-6">
          {tab === "overview" && <OverviewTab onNavigate={setTab} />}
          {tab === "events" && <EventAdminPanel />}
          {tab === "institutions" && <InstitutionAdminPanel />}
          {tab === "activities" && <ActivityAdminPanel />}
          {tab === "cagnottes" && <CagnottesAdminPanel />}
          {tab === "sos" && <SosAdminPanel />}
          {tab === "announcements" && <AnnouncementAdminPanel />}
          {tab === "news" && <NewsAdminPanel />}
          {tab === "crm" && <CrmTab />}
          {tab === "scan" && <ScanTab />}
        </main>
      </div>
    </div>
  )
}

function OverviewTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { data } = useAppData()
  const { t } = useI18n()
  const stats = [
    { label: t("admin.tabs.institutions"), value: data.institutions.length, tab: "institutions" as Tab },
    { label: t("admin.tabs.activities"), value: data.activities.length, tab: "activities" as Tab },

    { label: t("admin.tabs.cagnottes"), value: data.donations.length, tab: "cagnottes" as Tab },
    {
      label: t("admin.tabs.sos"),
      value: data.sosCollectionSites.length + data.sosDamagedSites.length,
      tab: "sos" as Tab,
    },
    { label: t("admin.tabs.announcements"), value: data.announcements.length, tab: "announcements" as Tab },
    { label: t("admin.tabs.news"), value: data.news.length, tab: "news" as Tab },
    { label: t("admin.tabs.events"), value: data.events.length, tab: "events" as Tab },
    { label: t("admin.tabs.crm"), value: data.registrants.length, tab: "crm" as Tab },
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="type-h1">{t("admin.overview.title")}</h1>
        <p className="type-body">{t("admin.overview.subtitle")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.tab}
            type="button"
            onClick={() => onNavigate(s.tab)}
            className="group rounded-3xl border border-border/60 bg-white p-5 text-start shadow-soft interactive-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-primary transition-transform duration-[var(--duration-micro)] group-hover:scale-[1.02]">
              {s.value}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function CrmTab() {
  const { data, deleteRegistrant } = useAppData()
  const { t, formatDateTime } = useI18n()
  const [q, setQ] = useState("")

  const announcementMap = useMemo(() => {
    const m = new Map<string, string>()
    data.announcements.forEach((a) => m.set(a.id, a.title))
    return m
  }, [data.announcements])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return data.registrants
    return data.registrants.filter((r) =>
      [r.lastName, r.firstName, r.birthPlace, r.nationalId, r.qrCode, r.id]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    )
  }, [data.registrants, q])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("admin.crm.title")}</h1>
          <p className="text-sm text-gray-500">{t("admin.crm.subtitle")}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            className="ps-9"
            placeholder={t("admin.crm.search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-start text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">{t("admin.crm.member")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.crm.nin")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.crm.birth")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.crm.announcement")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.crm.qr")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.crm.registeredAt")}</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                  {t("admin.crm.empty")}
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              return (
                <tr key={r.id} className="border-t hover:bg-gray-50/80 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.lastName}</p>
                    <p className="text-gray-600">{r.firstName}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                    {r.id}
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.birthDate}</div>
                    <div className="text-xs text-gray-500">{r.birthPlace}</div>
                  </td>

                  <td className="px-4 py-3">
                    {r.announcementId ? announcementMap.get(r.announcementId) ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <RegistrantQrCode registrant={r} size={96} downloadLabel={t("admin.common.download")} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDateTime(r.registeredAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm(t("admin.crm.deleteConfirm"))) deleteRegistrant(r.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ScanTab() {
  const { data, findRegistrantByScan } = useAppData()
  const { t } = useI18n()
  const [manual, setManual] = useState("")
  const [foundId, setFoundId] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [lastScan, setLastScan] = useState("")
  const [scanning, setScanning] = useState(true)

  const found = useMemo(
    () => (foundId ? data.registrants.find((r) => r.id === foundId) ?? null : null),
    [data.registrants, foundId]
  )



  function lookup(raw: string) {
    const text = raw.trim()
    if (!text) return
    if (text === lastScan && foundId) return
    setLastScan(text)
    const match = findRegistrantByScan(text)
    setFoundId(match?.id ?? null)
    setNotFound(!match)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{t("admin.scan.title")}</h1>
        <p className="text-sm text-gray-500">{t("admin.scan.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("admin.scan.camera")}</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => setScanning((v) => !v)}>
              {scanning ? t("admin.scan.pause") : t("admin.scan.resume")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanning ? (
              <QrScanner
                active={scanning}
                onScan={(text) => {
                  lookup(text)
                  setScanning(false)
                }}
              />
            ) : (
              <p className="rounded-lg border border-dashed py-10 text-center text-sm text-gray-400">
                {t("admin.scan.pausedHint")}
              </p>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("admin.scan.manualLabel")}</label>
              <div className="flex gap-2">
                <Input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  placeholder={t("admin.scan.manualPlaceholder")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") lookup(manual)
                  }}
                />
                <Button
                  type="button"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => lookup(manual)}
                >
                  {t("admin.scan.search")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("admin.scan.profile")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!found && !notFound && (
              <p className="py-12 text-center text-sm text-gray-400">{t("admin.scan.noScan")}</p>
            )}
            {notFound && !found && (
              <p className="py-12 text-center text-sm text-red-600">{t("admin.scan.notFound")}</p>
            )}
            {found && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <RegistrantQrCode
                    registrant={found}
                    size={120}
                    downloadLabel={t("admin.common.download")}
                  />
                  <div className="space-y-1 text-sm flex-1">
                    <p className="text-xl font-bold">
                      {found.lastName} {found.firstName}
                    </p>
                    <p>
                      <span className="text-gray-500">{t("admin.scan.ninLabel")}</span>{" "}
                      <span className="font-mono font-semibold">{found.id}</span>
                    </p>
                    <p>
                      <span className="text-gray-500">{t("admin.scan.birthLabel")}</span>{" "}
                      {found.birthDate} — {found.birthPlace}
                    </p>
                    <p>
                      <span className="text-gray-500">{t("admin.scan.qrLabel")}</span> {found.qrCode}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
