import {
  Building,
  ChevronDown,
  Eye,
  Lock,
  MapPin,
  Shield,
} from "lucide-react"
import { useGovernance } from "@/context/GovernanceContext"
import { ROLE_CAPABILITIES } from "@/lib/abac"
import { padWilayaCode, getWilaya } from "@/lib/wilayas"

export default function RoleScopeBanner() {
  const { currentUser, allUsers, switchUser } = useGovernance()

  const roleMeta = ROLE_CAPABILITIES[currentUser.role]
  const wilayaInfo = currentUser.wilayaCode ? getWilaya(currentUser.wilayaCode) : null

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-card via-card to-surface p-4 sm:p-5 shadow-soft">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* User Identity & Role */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white font-black text-lg shadow-xs">
            {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-foreground">
                {currentUser.firstName} {currentUser.lastName}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-extrabold border ${
                  currentUser.role === "national_admin"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    : currentUser.role === "wilaya_admin"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : currentUser.role === "local_coordinator"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : currentUser.role === "mission_lead"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : "bg-muted text-foreground border-border"
                }`}
              >
                <Shield className="h-3.5 w-3.5 text-current" />
                <span>{roleMeta.labelFr}</span>
                <span className="text-[10px] opacity-80">({roleMeta.labelAr})</span>
              </span>

              {currentUser.role === "national_auditor" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-300 border border-rose-500/30">
                  <Eye className="h-3 w-3 text-rose-400" /> Mode Audit — Lecture Seule Stricte
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1.5">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Building className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                {currentUser.structure}
              </span>

              {/* Territory scope */}
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                {currentUser.role === "national_admin" || currentUser.role === "national_auditor" ? (
                  <span className="font-bold text-emerald-900">
                    Périmètre National (69 Wilayas)
                  </span>
                ) : (
                  <span className="font-bold text-emerald-950">
                    Wilaya {padWilayaCode(currentUser.wilayaCode!)} — {wilayaInfo?.name}
                    {currentUser.commune && ` (${currentUser.commune})`}
                  </span>
                )}
              </span>

              <span className="font-mono text-slate-600 font-medium">
                {currentUser.email}
              </span>
            </div>
          </div>
        </div>

        {/* Role Switcher Toolbar (Testing & Supervision) */}
        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">
              Session administrative & Rôle
            </span>
            <div className="relative mt-1">
              <select
                value={currentUser.id}
                onChange={(e) => switchUser(e.target.value)}
                className="h-9 rounded-2xl border border-border/70 bg-card px-3 pe-8 text-xs font-bold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                {allUsers.map((u) => {
                  const meta = ROLE_CAPABILITIES[u.role]
                  return (
                    <option key={u.id} value={u.id} className="text-foreground font-semibold bg-card">
                      {u.firstName} {u.lastName} — {meta.labelFr} {u.wilayaCode ? `(${padWilayaCode(u.wilayaCode)})` : "[Nat]"}
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute end-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Territorial Restriction Notice for local/wilaya roles */}
      {currentUser.role !== "national_admin" && currentUser.role !== "national_auditor" && (
        <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center gap-2 text-xs text-foreground bg-primary/10 border border-primary/20 rounded-xl px-3.5 py-2 font-medium">
          <Lock className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong className="font-bold text-emerald-950">Contrôle ABAC Actif :</strong> Vos autorisations d'accès et d'action sont strictement limitées à votre territoire d'affectation (
            {currentUser.wilayaCode && `Wilaya ${padWilayaCode(currentUser.wilayaCode)}`}
            {currentUser.commune && ` / Commune de ${currentUser.commune}`}). Les données hors périmètre sont inaccessibles.
          </span>
        </div>
      )}
    </div>
  )
}
