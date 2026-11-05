import { useMemo, useState } from "react"
import {
  Crown,
  Medal,
  Award,
  Trophy,
  Sparkles,
  Users,
} from "lucide-react"
import { useAppData } from "@/context/DataProvider"
import { cn } from "@/lib/utils"

type HonorSubTab =
  | "ambassadors"
  | "exemplary"
  | "champions"
  | "teams"
  | "initiatives"
  | "seasons"

export default function HallOfHonorSection() {
  const { getHallOfHonorData } = useAppData()
  const honorData = useMemo(() => getHallOfHonorData(), [getHallOfHonorData])

  const [activeSubTab, setActiveSubTab] = useState<HonorSubTab>("ambassadors")

  return (
    <div className="space-y-8">
      {/* 1. Prestigous Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/80 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-6 sm:p-8 text-white shadow-soft">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-xs border border-white/15">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span>قاعة الشرف · Tableau National d'Excellence Citoyenne</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Hall of Honor — قاعة الشرف
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Hommage solennel aux citoyennes et citoyens d'Algérie, aux équipes solidaires et aux initiatives remarquables dont l'engagement exemplaire inspire toute la jeunesse.
          </p>
        </div>

        {/* Subtle decorative background watermarks */}
        <div className="absolute -end-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <Crown className="h-64 w-64" />
        </div>
      </div>

      {/* 2. Navigation Pills between the 6 Honor Spaces */}
      <div className="flex gap-2 overflow-x-auto pb-1 bg-surface/50 p-1.5 rounded-2xl border border-border/60 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab("ambassadors")}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all",
            activeSubTab === "ambassadors"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Crown className="h-4 w-4 text-amber-300" />
          <span>Ambassadeurs (N5)</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
            {honorData.ambassadors.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("exemplary")}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all",
            activeSubTab === "exemplary"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Medal className="h-4 w-4 text-emerald-200" />
          <span>Volontaires Exemplaires (N4)</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
            {honorData.exemplaryVolunteers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("champions")}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all",
            activeSubTab === "champions"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>Champions du Mois</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("teams")}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all",
            activeSubTab === "teams"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-4 w-4 text-emerald-200" />
          <span>Meilleures Équipes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("initiatives")}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all",
            activeSubTab === "initiatives"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Award className="h-4 w-4 text-emerald-200" />
          <span>Initiatives Solidaires</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("seasons")}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all",
            activeSubTab === "seasons"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Trophy className="h-4 w-4 text-amber-300" />
          <span>Lauréats des Saisons</span>
        </button>
      </div>

      {/* 3. Section Content based on selected SubTab */}

      {/* A. Ambassadeurs Nationaux (N5) */}
      {activeSubTab === "ambassadors" && (
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <span>Les Ambassadeurs Nationaux de la Solidarité (Palier N5)</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Volontaires ayant franchi le seuil des 1000 points d'engagement civique certifié à travers l'Algérie.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {honorData.ambassadors.length === 0 ? (
              <p className="col-span-2 py-8 text-center text-xs text-muted-foreground italic">
                Aucun ambassadeur N5 actuellement enregistré.
              </p>
            ) : (
              honorData.ambassadors.map((amb) => (
                <div
                  key={amb.volunteerId}
                  className="relative rounded-3xl border border-amber-300/80 bg-gradient-to-br from-amber-50/40 via-white to-emerald-50/20 p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-lg shadow-xs ring-2 ring-amber-300">
                        N5
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-foreground">
                            {amb.displayName}
                          </h4>
                          <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[9px] font-black uppercase">
                            Ambassadeur
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {amb.wilayaCode > 0
                            ? `Wilaya ${String(amb.wilayaCode).padStart(2, "0")} · ${amb.commune}`
                            : "Algérie"}
                        </p>
                      </div>
                    </div>

                    <div className="text-end">
                      <span className="text-base font-black text-emerald-800 font-mono">
                        {amb.totalPoints} pts
                      </span>
                      <span className="block text-[10px] text-muted-foreground font-mono">
                        {amb.hoursCount} heures certifiées
                      </span>
                    </div>
                  </div>

                  {amb.highlightQuote && (
                    <blockquote className="rounded-2xl bg-white/80 border border-amber-200/60 p-3 text-xs italic text-muted-foreground">
                      « {amb.highlightQuote} »
                    </blockquote>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/50 text-muted-foreground font-medium">
                    <span>Missions validées : <strong className="text-foreground">{amb.missionsCount}</strong></span>
                    <span>Distinctions d'honneur : <strong className="text-foreground">6 / 6</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* B. Volontaires Exemplaires (N4) */}
      {activeSubTab === "exemplary" && (
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Medal className="h-5 w-5 text-emerald-700" />
              <span>Tableau des Volontaires Exemplaires (Palier N4)</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Volontaires ayant accumulé plus de 500 points et fait preuve d'une assiduité remarquable.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {honorData.exemplaryVolunteers.map((vol) => (
              <div
                key={vol.volunteerId}
                className="rounded-3xl border border-emerald-200/80 bg-white p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                      N4
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-foreground">{vol.displayName}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        {vol.wilayaCode > 0 ? `Wilaya ${vol.wilayaCode} · ${vol.commune}` : "Territoire"}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-emerald-800">
                    {vol.totalPoints} pts
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50 font-mono">
                  <span>{vol.missionsCount} missions</span>
                  <span>{vol.hoursCount}h de terrain</span>
                  <span className="text-emerald-700 font-bold">Mentor Civique</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C. Champions du Mois */}
      {activeSubTab === "champions" && (
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>Podium National des Champions du Mois</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Classement fondé exclusivement sur les missions et heures validées au cours du mois en cours.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {honorData.monthlyChampions.slice(0, 3).map((ch, idx) => (
              <div
                key={ch.volunteerId}
                className={cn(
                  "rounded-3xl border p-5 text-center shadow-xs space-y-3 relative overflow-hidden",
                  idx === 0
                    ? "border-amber-300 bg-gradient-to-b from-amber-50/70 to-white ring-2 ring-amber-400/20"
                    : "border-border/70 bg-white"
                )}
              >
                <div className="flex justify-center">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl font-black text-sm shadow-xs",
                      idx === 0
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : idx === 1
                        ? "bg-slate-200 text-slate-800"
                        : "bg-amber-800/10 text-amber-900"
                    )}
                  >
                    #{idx + 1}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-foreground">{ch.displayName}</h4>
                  <p className="text-xs text-muted-foreground">
                    Wilaya {ch.wilayaCode > 0 ? ch.wilayaCode : ""} · {ch.commune}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <span className="text-base font-black text-emerald-800 font-mono">
                    +{ch.periodScore} pts ce mois-ci
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D. Meilleures Équipes */}
      {activeSubTab === "teams" && (
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-700" />
              <span>Les Équipes Solidaires les Plus Engagées</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Reconnaissance des collectifs citoyens, comités et équipes de secours d'urgence.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {honorData.topTeams.map((team) => (
              <div
                key={team.teamId}
                className="flex items-center justify-between rounded-3xl border border-border/70 bg-white p-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 font-black text-xs border border-emerald-200">
                    #{team.rank}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-foreground">{team.teamName}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {team.commune} (Wilaya {team.wilayaCode}) · {team.membersCount} membres
                    </p>
                  </div>
                </div>

                <div className="text-end">
                  <span className="font-mono text-xs font-black text-emerald-800">
                    {team.periodScore} pts
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-mono">
                    {team.missionsCompleted} missions
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* E. Initiatives Solidaires Remarquables */}
      {activeSubTab === "initiatives" && (
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-700" />
              <span>Initiatives Citoyennes Remarquables de l'Année</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Projets et actions de solidarité ayant eu le plus grand impact direct sur la communauté.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {honorData.remarkableInitiatives.map((init) => (
              <div
                key={init.id}
                className="rounded-3xl border border-border/70 bg-white p-5 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                    <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5">
                      Wilaya {init.wilayaCode} · {init.commune}
                    </span>
                    <span className="font-mono">{init.year}</span>
                  </div>
                  <h4 className="text-xs font-black text-foreground leading-snug">
                    {init.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {init.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-center text-[10px]">
                  <div className="rounded-xl bg-surface p-2">
                    <span className="block text-muted-foreground">Bénéficiaires</span>
                    <strong className="text-foreground font-mono text-xs">{init.beneficiariesCount}</strong>
                  </div>
                  <div className="rounded-xl bg-surface p-2">
                    <span className="block text-muted-foreground">Volontaires</span>
                    <strong className="text-emerald-700 font-mono text-xs">{init.volunteersInvolved}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* F. Lauréats des Saisons */}
      {activeSubTab === "seasons" && (
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-2">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span>Palmarès Historique des Saisons de Compétition</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Archives des vainqueurs et distinctions décernées lors des 4 saisons annuelles.
            </p>
          </div>

          <div className="space-y-3">
            {honorData.seasonLaureates.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground italic">
                La Saison 4 en cours est active. Les lauréats seront proclamés à la clôture du trimestre.
              </p>
            ) : (
              honorData.seasonLaureates.map((s, idx) => (
                <div
                  key={`${s.volunteerId}-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900 font-black text-xs border border-amber-300">
                      #{s.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-foreground">{s.displayName}</h4>
                        <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.2 text-[9px] font-bold">
                          {s.awardTitle}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Wilaya {s.wilayaCode} · {s.commune} · Palier {s.tier.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="text-start sm:text-end shrink-0">
                    <span className="font-mono text-xs font-black text-emerald-800">
                      +{s.pointsInSeason} pts saisonniers
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      Certificat d'Excellence Délivré
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
