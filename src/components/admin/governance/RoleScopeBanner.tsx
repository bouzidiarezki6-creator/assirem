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
    <div className="rounded-3xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white p-4 sm:p-5 shadow-soft">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* User Identity & Role */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white font-black text-lg shadow-xs">
            {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {currentUser.firstName} {currentUser.lastName}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-extrabold border ${
                  currentUser.role === "national_admin"
                    ? "bg-purple-100 text-purple-950 border-purple-300"
                    : currentUser.role === "wilaya_admin"
                    ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                    : currentUser.role === "local_coordinator"
                    ? "bg-blue-100 text-blue-950 border-blue-300"
                    : currentUser.role === "mission_lead"
                    ? "bg-amber-100 text-amber-950 border-amber-300"
                    : "bg-slate-100 text-slate-900 border-slate-300"
                }`}
              >
                <Shield className="h-3.5 w-3.5 text-current" />
                <span>{roleMeta.labelFr}</span>
                <span className="text-[10px] opacity-80">({roleMeta.labelAr})</span>
              </span>

              {currentUser.role === "national_auditor" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-950 border border-rose-300">
                  <Eye className="h-3 w-3 text-rose-700" /> Mode Audit — Lecture Seule Stricte
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
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-700">
              Session administrative & Rôle
            </span>
            <div className="relative mt-1">
              <select
                value={currentUser.id}
                onChange={(e) => switchUser(e.target.value)}
                className="h-9 rounded-2xl border border-emerald-300 bg-white px-3 pe-8 text-xs font-bold text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
              >
                {allUsers.map((u) => {
                  const meta = ROLE_CAPABILITIES[u.role]
                  return (
                    <option key={u.id} value={u.id} className="text-slate-900 font-semibold bg-white">
                      {u.firstName} {u.lastName} — {meta.labelFr} {u.wilayaCode ? `(${padWilayaCode(u.wilayaCode)})` : "[Nat]"}
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute end-2.5 top-2.5 h-3.5 w-3.5 text-emerald-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Territorial Restriction Notice for local/wilaya roles */}
      {currentUser.role !== "national_admin" && currentUser.role !== "national_auditor" && (
        <div className="mt-3.5 pt-3 border-t border-emerald-200/80 flex items-center gap-2 text-xs text-emerald-950 bg-emerald-100/80 border border-emerald-200 rounded-xl px-3.5 py-2 font-medium">
          <Lock className="h-4 w-4 text-emerald-800 shrink-0" />
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
