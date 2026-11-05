import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Activity,
  Award,
  BarChart3,
  Building2,
  CalendarDays,
  History,
  Layers,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Newspaper,
  ScanLine,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  UserCheck,
  Siren,
  RotateCcw,
  CheckCircle2,
  QrCode,
  FileCheck2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RegistrantQrCode from "@/components/shared/RegistrantQrCode"
import PointsLevelInfo from "@/components/shared/PointsLevelInfo"
import LevelProgressBar from "@/components/shared/LevelProgressBar"
import { getVolunteerTier } from "@/lib/levels"
import QrScanner from "@/components/admin/QrScanner"
import EventAdminPanel from "@/components/admin/EventAdminPanel"

import SosAdminPanel from "@/components/admin/SosAdminPanel"
import VolunteerPointsManager from "@/components/admin/VolunteerPointsManager"
import VolunteerAdminSection from "@/components/admin/VolunteerAdminSection"
import PresenceManager from "@/components/admin/PresenceManager"
import MissionReportsPanel from "@/components/admin/MissionReportsPanel"
import RoleScopeBanner from "@/components/admin/governance/RoleScopeBanner"
import InstitutionalOperationsPanel from "@/components/admin/governance/InstitutionalOperationsPanel"
import AuditRegistryPanel from "@/components/admin/governance/AuditRegistryPanel"
import InstitutionalReportingPanel from "@/components/admin/governance/InstitutionalReportingPanel"
import InstitutionalUsersPanel from "@/components/admin/governance/InstitutionalUsersPanel"
import MissionLeadWorkspace from "@/components/admin/governance/MissionLeadWorkspace"
import LanguageSwitcher from "@/components/layout/LanguageSwitcher"
import {
  ActivityAdminPanel,
  AnnouncementAdminPanel,
  InstitutionAdminPanel,
  NewsAdminPanel,
} from "@/components/admin/SiteContentAdmin"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { GovernanceProvider, useGovernance } from "@/context/GovernanceContext"
import type { InstitutionalRole } from "@/lib/governanceTypes"
import {
  isAdminAuthenticated,
  loginAdmin,
  logoutAdmin,
} from "@/lib/storage"

type Tab =
  | "overview"
  | "missionLead"
  | "operations"
  | "reporting"
  | "auditRegistry"
  | "institutionalUsers"
  | "presence"
  | "reports"
  | "sos"
  | "volunteerAccounts"
  | "institutions"
  | "activities"
  | "announcements"
  | "news"
  | "events"
  | "crm"
  | "points"
  | "scan"

interface TabDef {
  id: Tab
  labelKey: string
  icon: typeof LayoutDashboard
  roles?: InstitutionalRole[]
}

const allTabDefs: TabDef[] = [
  { id: "overview", labelKey: "admin.tabs.overview", icon: LayoutDashboard },
  { id: "missionLead", labelKey: "admin.tabs.missionLead", icon: ShieldCheck, roles: ["mission_lead", "national_admin"] },
  { id: "operations", labelKey: "admin.tabs.operations", icon: Layers },
  { id: "reporting", labelKey: "admin.tabs.reporting", icon: BarChart3 },
  { id: "auditRegistry", labelKey: "admin.tabs.auditRegistry", icon: History, roles: ["national_admin", "national_auditor"] },
  { id: "institutionalUsers", labelKey: "admin.tabs.institutionalUsers", icon: ShieldCheck, roles: ["national_admin", "wilaya_admin", "national_auditor"] },
  { id: "presence", labelKey: "Pointage Présence & QR", icon: QrCode },
  { id: "reports", labelKey: "Rapports de Mission & Audit", icon: FileCheck2 },
  { id: "sos", labelKey: "admin.tabs.sos", icon: Siren },
  { id: "volunteerAccounts", labelKey: "admin.tabs.volunteerAccounts", icon: UserCheck, roles: ["national_admin", "wilaya_admin", "local_coordinator"] },
  { id: "institutions", labelKey: "admin.tabs.institutions", icon: Building2, roles: ["national_admin", "wilaya_admin"] },
  { id: "activities", labelKey: "admin.tabs.activities", icon: Activity, roles: ["national_admin", "wilaya_admin", "local_coordinator"] },
  { id: "announcements", labelKey: "admin.tabs.announcements", icon: Megaphone, roles: ["national_admin", "wilaya_admin"] },
  { id: "news", labelKey: "admin.tabs.news", icon: Newspaper, roles: ["national_admin", "wilaya_admin"] },
  { id: "events", labelKey: "admin.tabs.events", icon: CalendarDays, roles: ["national_admin", "wilaya_admin"] },
  { id: "crm", labelKey: "admin.tabs.crm", icon: Users, roles: ["national_admin", "wilaya_admin", "local_coordinator"] },
  { id: "points", labelKey: "admin.points.title", icon: Award, roles: ["national_admin", "wilaya_admin"] },
  { id: "scan", labelKey: "admin.tabs.scan", icon: ScanLine },
]

export default function Admin() {
  const [authed, setAuthed] = useState(isAdminAuthenticated())
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { t, dir } = useI18n()

  useEffect(() => {
    setAuthed(isAdminAuthenticated())
  }, [])

  if (!authed) {
    return (
      <div className="admin-theme min-h-screen bg-surface flex items-center justify-center p-4 text-foreground" dir={dir}>
        <Card className="w-full max-w-md shadow-card border-border/60 bg-white">
          <CardHeader>
            <div className="flex justify-end mb-2">
              <LanguageSwitcher variant="plain" />
            </div>
            <CardTitle className="text-2xl font-black text-emerald-800">{t("admin.login.title")}</CardTitle>
            <p className="text-sm text-slate-600 font-medium">{t("admin.login.subtitle")}</p>
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
    <GovernanceProvider>
      <AdminDashboard onLogout={() => setAuthed(false)} />
    </GovernanceProvider>
  )
}

function DemoDataToolbar() {
  const { reloadDemoData, clearDemoData, demoStats } = useAppData()
  const [notification, setNotification] = useState<string | null>(null)

  const handleReset = () => {
    if (
      confirm(
        "Confirmer la réinitialisation des données de démonstration pour Béjaïa, Sétif et El Eulma ?\n\nVos données réelles créées ne seront pas modifiées."
      )
    ) {
      reloadDemoData()
      setNotification("Les données de démonstration (Béjaïa, Sétif, El Eulma) ont été réinitialisées avec succès.")
      setTimeout(() => setNotification(null), 4000)
    }
  }

  const handlePurge = () => {
    if (
      confirm(
        "Confirmer la suppression des données de démonstration ?\n\nATTENTION : Seules les données marquées DEMO seront supprimées. Vos données réelles restent 100% intactes."
      )
    ) {
      clearDemoData()
      setNotification("Les données de démonstration ont été purgées. Seules vos données réelles subsistent.")
      setTimeout(() => setNotification(null), 4000)
    }
  }

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-card to-card p-3.5 sm:p-4 shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs shadow-xs">
            DEMO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-foreground uppercase tracking-wide">
                Données de démonstration actives
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                Béjaïa · Sétif · El Eulma
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              {demoStats.events} événements · {demoStats.activities} activités · {demoStats.volunteers} bénévoles · {demoStats.operations} opérations · {demoStats.institutions} institutions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={handleReset}
            className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser Démo
          </Button>

          {demoStats.totalDemoItems > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handlePurge}
              className="h-8 rounded-xl border-border/80 hover:bg-red-950/50 hover:text-red-300 hover:border-red-500/40 text-muted-foreground text-xs font-bold gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" /> Purger Démo
            </Button>
          )}
        </div>
      </div>

      {notification && (
        <div className="mt-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/50 px-3 py-1.5 text-xs font-semibold text-emerald-300 animate-fade-in flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  )
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { currentUser } = useGovernance()
  const [tab, setTab] = useState<Tab>("overview")
  const [selectedVolunteerForPoints, setSelectedVolunteerForPoints] = useState<string | null>(null)
  const navigate = useNavigate()
  const { t, dir } = useI18n()

  // Filter tabs according to the active institutional role (ABAC)
  const allowedTabs = useMemo(() => {
    return allTabDefs.filter((td) => !td.roles || td.roles.includes(currentUser.role))
  }, [currentUser.role])

  // If active tab is not allowed for the current role, fallback to first allowed tab
  useEffect(() => {
    if (!allowedTabs.some((td) => td.id === tab)) {
      setTab(allowedTabs[0]?.id || "operations")
    }
  }, [allowedTabs, tab])

  return (
    <div className="admin-theme min-h-screen bg-surface text-foreground font-sans" dir={dir}>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-soft">
        <div className="mx-auto flex h-14 max-w-[100rem] items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <img
              src="/LOGO.png"
              alt="Logo"
              className="h-8 w-auto object-contain shrink-0"
            />
            <div>
              <p className="font-extrabold text-slate-900 leading-none">{t("admin.brand")}</p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{t("admin.brandSub")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="plain" />
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="border-slate-300 text-slate-800 font-semibold hover:bg-slate-100">
              {t("admin.seeSite")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logoutAdmin()
                onLogout()
              }}
              className="text-slate-700 hover:text-red-700 hover:bg-red-50 font-semibold"
            >
              <LogOut className="h-4 w-4" />
              {t("admin.logout")}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[100rem] gap-6 px-4 sm:px-6 lg:px-10 py-6 lg:grid-cols-[250px_1fr]">
        {/* Navigation Sidebar */}
        <aside className="space-y-1 rounded-3xl border border-slate-200 bg-white p-2 shadow-soft lg:sticky lg:top-20 lg:self-start">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation Institutionnelle
          </div>
          {allowedTabs.map((item) => {
            let label = t(item.labelKey)
            if (item.id === "institutionalUsers") {
              if (currentUser.role === "national_admin") label = "Administration des accès"
              else if (currentUser.role === "wilaya_admin") label = "Coordinateurs locaux"
              else if (currentUser.role === "national_auditor") label = "Registre des comptes"
            }
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-bold transition-colors ${
                  tab === item.id
                    ? "bg-emerald-700 text-white shadow-soft"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            )
          })}
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 space-y-6">
          {/* Institutional Role & Territory Banner with fast role switcher */}
          <RoleScopeBanner />

          {/* Demo Data Management Toolbar */}
          <DemoDataToolbar />

          {/* Tab Views */}
          {tab === "overview" && <OverviewTab onNavigate={setTab} />}
          {tab === "missionLead" && <MissionLeadWorkspace />}
          {tab === "operations" && <InstitutionalOperationsPanel />}
          {tab === "reporting" && <InstitutionalReportingPanel />}
          {tab === "auditRegistry" && <AuditRegistryPanel />}
          {tab === "institutionalUsers" && <InstitutionalUsersPanel />}
          {tab === "presence" && <PresenceManager />}
          {tab === "reports" && <MissionReportsPanel />}

          {tab === "sos" && <SosAdminPanel />}
          {tab === "volunteerAccounts" && <VolunteerAdminSection />}
          {tab === "institutions" && <InstitutionAdminPanel />}
          {tab === "activities" && <ActivityAdminPanel />}
          {tab === "announcements" && <AnnouncementAdminPanel />}
          {tab === "news" && <NewsAdminPanel />}
          {tab === "events" && <EventAdminPanel />}
          {tab === "crm" && (
            <CrmTab
              onAwardPoints={(id) => {
                setSelectedVolunteerForPoints(id)
                setTab("points")
              }}
            />
          )}
          {tab === "points" && (
            <VolunteerPointsManager initialVolunteerId={selectedVolunteerForPoints} />
          )}
          {tab === "scan" && (
            <ScanTab
              onAwardPoints={(id) => {
                setSelectedVolunteerForPoints(id)
                setTab("points")
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function OverviewTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { data } = useAppData()
  const { kpis, operations, auditEntries, currentUser } = useGovernance()
  const { t } = useI18n()

  const stats = [
    {
      label: "Opérations sous ma gestion",
      value: operations.length,
      tab: "operations" as Tab,
      color: "text-emerald-700",
    },
    {
      label: "Espace Chef de Mission (Terrain)",
      value: (data.sosInterventions || []).length,
      tab: "missionLead" as Tab,
      color: "text-amber-700",
      roles: ["mission_lead", "national_admin"],
    },
    {
      label: "Opérations validées & scellées",
      value: kpis.byStage.validated + kpis.byStage.consolidated,
      tab: "reporting" as Tab,
      color: "text-purple-700",
    },
    {
      label: "Blocs au registre d'audit",
      value: auditEntries.length,
      tab: "auditRegistry" as Tab,
      color: "text-indigo-700",
      roles: ["national_admin", "national_auditor"],
    },
    {
      label: "Fiches de présence certifiées",
      value: (data.presenceRecords || []).length,
      tab: "presence" as Tab,
      color: "text-emerald-700",
    },
    {
      label: "Rapports de mission & audit",
      value: (data.missionReports || []).length,
      tab: "reports" as Tab,
      color: "text-blue-700",
    },
    {
      label: t("admin.tabs.volunteerAccounts"),
      value: (data.volunteerAccounts || []).length,
      tab: "volunteerAccounts" as Tab,
      color: "text-emerald-700",
      roles: ["national_admin", "wilaya_admin", "local_coordinator"],
    },
    {
      label: t("admin.tabs.sos"),
      value: (data.sosCollectionSites?.length || 0) + (data.sosDamagedSites?.length || 0),
      tab: "sos" as Tab,
      color: "text-rose-700",
    },
    {
      label: t("admin.tabs.institutions"),
      value: data.institutions.length,
      tab: "institutions" as Tab,
      roles: ["national_admin", "wilaya_admin"],
    },
    {
      label: t("admin.tabs.activities"),
      value: data.activities.length,
      tab: "activities" as Tab,
      roles: ["national_admin", "wilaya_admin", "local_coordinator"],
    },
    {
      label: t("admin.tabs.crm"),
      value: data.registrants.length,
      tab: "crm" as Tab,
      roles: ["national_admin", "wilaya_admin", "local_coordinator"],
    },
  ]

  const visibleStats = stats.filter(
    (s) => !s.roles || s.roles.includes(currentUser.role)
  )

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{t("admin.overview.title")}</h1>
        <p className="text-sm text-slate-600 font-medium">{t("admin.overview.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visibleStats.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onNavigate(s.tab)}
            className="group rounded-3xl border border-slate-200 bg-white p-5 text-start shadow-soft interactive-lift hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="text-xs text-slate-600 font-bold">{s.label}</p>
            <p className={`mt-3 text-3xl font-black tracking-tight transition-transform duration-[var(--duration-micro)] group-hover:scale-[1.02] ${s.color || "text-emerald-700"}`}>
              {s.value}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function CrmTab({ onAwardPoints }: { onAwardPoints: (id: string) => void }) {
  const { data, deleteRegistrant } = useAppData()
  const { t, formatDateTime } = useI18n()
  const [q, setQ] = useState("")

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
          <h1 className="text-2xl font-black text-emerald-800">{t("admin.crm.title")}</h1>
          <p className="text-sm text-slate-600 font-medium">{t("admin.crm.subtitle")}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("admin.crm.search")}
            className="ps-9 border-slate-300 bg-white text-slate-900"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-soft">
        <table className="w-full text-start text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold text-slate-800 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">{t("admin.crm.member")}</th>
              <th className="py-3 px-4">{t("admin.crm.nin")}</th>
              <th className="py-3 px-4">{t("admin.crm.birth")}</th>
              <th className="py-3 px-4">{t("admin.crm.qr")}</th>
              <th className="py-3 px-4">{t("pointsInfo.colPoints")}</th>
              <th className="py-3 px-4">{t("admin.crm.registeredAt")}</th>
              <th className="py-3 px-4 text-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filtered.map((r) => {
              return (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {r.lastName} {r.firstName}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800">{r.nationalId}</td>
                  <td className="py-3 px-4 text-slate-700 text-xs font-medium">
                    {r.birthDate} — {r.birthPlace}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-emerald-800">
                    <span className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
                      {r.qrCode}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 font-mono font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs">
                      {r.points ?? 0} pts
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs font-medium">
                    {formatDateTime(r.registeredAt)}
                  </td>
                  <td className="py-3 px-4 text-end space-x-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => onAwardPoints(r.id)}
                    >
                      {t("admin.crm.validateActivity")}
                    </Button>
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

function ScanTab({ onAwardPoints }: { onAwardPoints: (id: string) => void }) {
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
        <Card className="border-slate-200 bg-white shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-bold text-slate-900">{t("admin.scan.camera")}</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => setScanning((v) => !v)} className="border-slate-300 text-slate-800 font-semibold">
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
              <p className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500 font-medium">
                {t("admin.scan.pausedHint")}
              </p>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">{t("admin.scan.manualLabel")}</label>
              <div className="flex gap-2">
                <Input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  placeholder={t("admin.scan.manualPlaceholder")}
                  className="border-slate-300 bg-white text-slate-900 font-medium"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") lookup(manual)
                  }}
                />
                <Button
                  type="button"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                  onClick={() => lookup(manual)}
                >
                  {t("admin.scan.search")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">{t("admin.scan.profile")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!found && !notFound && (
              <p className="py-12 text-center text-sm text-slate-500 font-medium">{t("admin.scan.noScan")}</p>
            )}
            {notFound && !found && (
              <p className="py-12 text-center text-sm text-rose-600 font-bold">{t("admin.scan.notFound")}</p>
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
                    <p className="text-xl font-black text-slate-900">
                      {found.lastName} {found.firstName}
                    </p>
                    <p>
                      <span className="text-slate-600 font-medium">{t("admin.scan.ninLabel")}</span>{" "}
                      <span className="font-mono font-bold text-slate-800">{found.id}</span>
                    </p>
                    <p>
                      <span className="text-slate-600 font-medium">{t("admin.scan.birthLabel")}</span>{" "}
                      <span className="text-slate-800 font-semibold">{found.birthDate} — {found.birthPlace}</span>
                    </p>
                    <p>
                      <span className="text-slate-600 font-medium">{t("admin.scan.qrLabel")}</span>{" "}
                      <span className="font-mono font-bold text-emerald-800">{found.qrCode}</span>
                    </p>
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-600">
                            {t("pointsInfo.colPoints")}:
                          </span>
                          <span className="text-base font-black text-emerald-700 tabular-nums">
                            {found.points ?? 0} pts
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-800">
                            {t(`pointsInfo.level${getVolunteerTier(found.points ?? 0).level}.status`)}
                          </span>
                          <PointsLevelInfo points={found.points ?? 0} />
                        </div>
                      </div>
                      <LevelProgressBar points={found.points ?? 0} />
                      <Button
                        type="button"
                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-1.5 mt-2 h-9 rounded-xl"
                        onClick={() => onAwardPoints(found.id)}
                      >
                        <Award className="h-4 w-4" />
                        {t("admin.points.validate")}
                      </Button>
                    </div>
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
