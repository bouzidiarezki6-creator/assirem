import { useMemo, useState } from "react"
import {
  Crown,
  TrendingUp,
  Users,
  Eye,
  EyeOff,
} from "lucide-react"
import { useAppData } from "@/context/DataProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { useVolunteerAuth } from "@/context/VolunteerAuthContext"
import type { LeaderboardPeriod, LeaderboardEntry } from "@/lib/rewardsGamification"
import { cn } from "@/lib/utils"

type LeaderboardTab = "national" | "wilaya" | "monthly" | "teams"

type Props = {
  currentVolunteerId: string
  userWilayaCode: number
}

export default function LeaderboardsSection({ currentVolunteerId, userWilayaCode }: Props) {
  const { getVolunteerLeaderboards } = useAppData()
  const { wilayas } = useLocationFilter()
  const { currentVolunteer, updateProfile } = useVolunteerAuth()

  const [activeTab, setActiveTab] = useState<LeaderboardTab>("monthly")
  const [period, setPeriod] = useState<LeaderboardPeriod>("month")
  const [selectedWilaya, setSelectedWilaya] = useState<number>(userWilayaCode || 6)
  const [updatingConsent, setUpdatingConsent] = useState(false)

  const leaderboards = useMemo(() => {
    return getVolunteerLeaderboards(period, selectedWilaya)
  }, [getVolunteerLeaderboards, period, selectedWilaya])

  const togglePublicConsent = async () => {
    if (!currentVolunteer || updatingConsent) return
    setUpdatingConsent(true)
    const current = currentVolunteer.publicProfileConsent !== false
    await updateProfile({ publicProfileConsent: !current })
    setUpdatingConsent(false)
  }

  const currentList = useMemo(() => {
    switch (activeTab) {
      case "national":
        return leaderboards.national
      case "wilaya":
        return leaderboards.wilaya
      case "monthly":
        return leaderboards.monthly
      default:
        return leaderboards.national
    }
  }, [activeTab, leaderboards])

  return (
    <div className="space-y-6">
      {/* 1. Header & Privacy Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Classements Compétitifs & Émulation Citoyenne
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Valorisation de l'engagement périodique sur la base exclusive des activités validées sur le terrain.
          </p>
        </div>

        {/* Privacy consent control */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePublicConsent}
            disabled={updatingConsent}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all shadow-xs",
              currentVolunteer?.publicProfileConsent !== false
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                : "border-border bg-white text-muted-foreground hover:bg-muted/40"
            )}
            title="Gérer la visibilité de votre nom sur les classements publics"
          >
            {currentVolunteer?.publicProfileConsent !== false ? (
              <>
                <Eye className="h-3.5 w-3.5 text-emerald-700" />
                <span>Profil Public Actif</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Mode Anonyme Actif</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Leaderboard Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 bg-muted/40 p-1 rounded-2xl border border-border/50">
          <button
            type="button"
            onClick={() => setActiveTab("monthly")}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
              activeTab === "monthly" ? "bg-white text-emerald-800 shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Champions du Mois
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("national")}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
              activeTab === "national" ? "bg-white text-emerald-800 shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Classement National
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wilaya")}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
              activeTab === "wilaya" ? "bg-white text-emerald-800 shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Par Wilaya
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("teams")}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
              activeTab === "teams" ? "bg-white text-emerald-800 shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Par Équipe
          </button>
        </div>

        {/* Sub-Filters: Period & Wilaya Selectors */}
        <div className="flex items-center gap-2">
          {activeTab !== "teams" && activeTab !== "monthly" && (
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as LeaderboardPeriod)}
              className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="month">Période : Ce Mois-ci</option>
              <option value="season">Période : Saison Actuelle (T4)</option>
              <option value="all_time">Période : Historique Global</option>
            </select>
          )}

          {activeTab === "wilaya" && (
            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(Number(e.target.value))}
              className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {wilayas.map((w) => (
                <option key={w.code} value={w.code}>
                  Wilaya {String(w.code).padStart(2, "0")} — {w.nameFr}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 3. Competitive Podium Top 3 (if not in teams tab and list has at least 1) */}
      {activeTab !== "teams" && currentList.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
          {/* Rank 2 (Silver) */}
          <PodiumCard entry={currentList[1]} rank={2} medalColor="bg-slate-200 text-slate-800 border-slate-300" />
          {/* Rank 1 (Gold) */}
          <PodiumCard entry={currentList[0]} rank={1} medalColor="bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/30" isFirst />
          {/* Rank 3 (Bronze) */}
          <PodiumCard entry={currentList[2]} rank={3} medalColor="bg-amber-800/10 text-amber-900 border-amber-700/30" />
        </div>
      )}

      {/* 4. Table Ranking */}
      <div className="rounded-3xl border border-border/80 bg-white overflow-hidden shadow-sm">
        {activeTab === "teams" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-surface/80 border-b border-border/60 text-muted-foreground font-semibold">
                  <th className="py-3 px-4 text-start">Rang</th>
                  <th className="py-3 px-4 text-start">Équipe Solidaire</th>
                  <th className="py-3 px-4 text-start">Territoire</th>
                  <th className="py-3 px-4 text-center">Effectif</th>
                  <th className="py-3 px-4 text-center">Missions</th>
                  <th className="py-3 px-4 text-end">Score Période</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {leaderboards.teams.map((t) => (
                  <tr key={t.teamId} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-black">
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-xl font-black text-xs",
                          t.rank === 1
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : t.rank === 2
                            ? "bg-slate-100 text-slate-800"
                            : t.rank === 3
                            ? "bg-amber-800/10 text-amber-900"
                            : "bg-surface text-muted-foreground"
                        )}
                      >
                        #{t.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-700" />
                        <span>{t.teamName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {t.commune} (Wilaya {String(t.wilayaCode).padStart(2, "0")})
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium">
                      {t.membersCount} volontaires
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                      {t.missionsCompleted}
                    </td>
                    <td className="py-3 px-4 text-end font-extrabold text-emerald-800 font-mono text-sm">
                      {t.periodScore} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-surface/80 border-b border-border/60 text-muted-foreground font-semibold">
                  <th className="py-3 px-4 text-start">Rang</th>
                  <th className="py-3 px-4 text-start">Volontaire</th>
                  <th className="py-3 px-4 text-start">Wilaya</th>
                  <th className="py-3 px-4 text-center">Palier</th>
                  <th className="py-3 px-4 text-center">Tendance</th>
                  <th className="py-3 px-4 text-end">Score Période</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {currentList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground italic">
                      Aucun volontaire enregistré pour cette sélection.
                    </td>
                  </tr>
                ) : (
                  currentList.map((entry) => {
                    const isMe = entry.volunteerId === currentVolunteerId

                    return (
                      <tr
                        key={entry.volunteerId}
                        className={cn(
                          "transition-colors",
                          isMe ? "bg-emerald-50/80 font-bold" : "hover:bg-surface/40"
                        )}
                      >
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-xl font-black text-xs",
                              entry.rank === 1
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : entry.rank === 2
                                ? "bg-slate-200 text-slate-800"
                                : entry.rank === 3
                                ? "bg-amber-800/10 text-amber-900"
                                : "bg-surface text-muted-foreground font-mono"
                            )}
                          >
                            #{entry.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-foreground">
                              {entry.displayName}
                            </span>
                            {isMe && (
                              <span className="rounded-full bg-emerald-700 text-white px-2 py-0.5 text-[9px] font-black uppercase">
                                Vous
                              </span>
                            )}
                            {entry.specialBadge && (
                              <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[9px] font-bold">
                                {entry.specialBadge}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {entry.wilayaCode > 0
                            ? `Wilaya ${String(entry.wilayaCode).padStart(2, "0")} · ${entry.commune}`
                            : "Non communiqué"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-bold uppercase font-mono">
                            {entry.tier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center text-emerald-600">
                            <TrendingUp className="h-3.5 w-3.5" />
                          </span>
                        </td>
                        <td className="py-3 px-4 text-end">
                          <span className="font-mono text-sm font-black text-emerald-800">
                            {entry.periodScore} pts
                          </span>
                          <span className="block text-[10px] text-muted-foreground font-mono">
                            ({entry.totalPoints} pts cumulés)
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function PodiumCard({
  entry,
  rank,
  medalColor,
  isFirst = false,
}: {
  entry?: LeaderboardEntry
  rank: number
  medalColor: string
  isFirst?: boolean
}) {
  if (!entry) return null

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between rounded-3xl border p-4 text-center transition-all shadow-xs",
        isFirst
          ? "border-amber-300 bg-gradient-to-b from-amber-50/60 to-white -translate-y-2 shadow-sm"
          : "border-border/70 bg-white"
      )}
    >
      <div className="space-y-1 flex flex-col items-center">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-2xl font-black text-xs shadow-xs", medalColor)}>
          #{rank}
        </div>
        <p className="text-xs font-black text-foreground truncate max-w-[120px]">
          {entry.displayName}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {entry.wilayaCode > 0 ? `Wilaya ${entry.wilayaCode}` : "Territoire"}
        </p>
      </div>

      <div className="pt-2 mt-2 border-t border-border/40 w-full">
        <span className="text-sm font-black text-emerald-800 font-mono">
          {entry.periodScore} pts
        </span>
      </div>
    </div>
  )
}
