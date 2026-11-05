import { useState } from "react"
import {
  Award,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  Users,
  Target,
  AlertCircle,
} from "lucide-react"
import { useAppData } from "@/context/DataProvider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  volunteerId: string
}

function getChallengeIcon(iconName: string) {
  switch (iconName) {
    case "HeartHandshake":
      return HeartHandshake
    case "CalendarCheck":
      return CalendarCheck
    case "ShieldAlert":
      return ShieldAlert
    case "Clock":
      return Clock
    case "Users":
      return Users
    case "Award":
      return Award
    case "Flame":
      return Flame
    default:
      return Sparkles
  }
}

export default function ChallengesSection({ volunteerId }: Props) {
  const { getChallengesWithProgress, claimChallengeReward } = useAppData()
  const challenges = getChallengesWithProgress(volunteerId)

  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; type: "ok" | "err"; message: string } | null>(null)

  const handleClaim = (challengeId: string) => {
    setClaimingId(challengeId)
    setFeedback(null)

    const res = claimChallengeReward(volunteerId, challengeId)
    if (res.ok) {
      setFeedback({
        id: challengeId,
        type: "ok",
        message: `Félicitations ! Vous avez validé le challenge et débloqué +${res.pointsAwarded} points de solidarité.`,
      })
    } else {
      setFeedback({
        id: challengeId,
        type: "err",
        message: res.error,
      })
    }
    setClaimingId(null)
  }

  const activeCount = challenges.length
  const completedCount = challenges.filter((c) => c.isClaimed).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-700" />
            Challenges Mensuels & Objectifs Solidaires
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Participez aux défis réguliers pour remporter des insignes d'honneur et booster votre engagement.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>
            {completedCount} / {activeCount} défis complétés
          </span>
        </div>
      </div>

      {/* Grid of Challenges */}
      <div className="grid gap-4 md:grid-cols-2">
        {challenges.map((ch) => {
          const IconComponent = getChallengeIcon(ch.rewardBadgeIcon)
          const isFeedback = feedback?.id === ch.id

          return (
            <div
              key={ch.id}
              className={cn(
                "relative flex flex-col justify-between rounded-3xl border p-5 shadow-xs transition-all space-y-4",
                ch.isClaimed
                  ? "border-emerald-200 bg-emerald-50/30"
                  : ch.isCompleted
                  ? "border-emerald-400 bg-white shadow-soft ring-1 ring-emerald-500/30"
                  : "border-border/70 bg-white hover:border-border"
              )}
            >
              {/* Badge & Category Pill */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold transition-colors",
                      ch.isClaimed
                        ? "bg-emerald-100 text-emerald-800"
                        : ch.isCompleted
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-surface text-muted-foreground border border-border/60"
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-foreground">{ch.titleFr}</h3>
                      <span className="text-[10px] font-bold text-muted-foreground font-arabic">
                        ({ch.titleAr})
                      </span>
                    </div>
                    <p className="text-[10px] font-mono font-semibold text-emerald-700 mt-0.5">
                      +{ch.rewardPoints} points · {ch.rewardBadgeName}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                    ch.periodType === "monthly"
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : ch.periodType === "seasonal"
                      ? "bg-purple-50 text-purple-800 border border-purple-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  )}
                >
                  {ch.periodType === "monthly" ? "Mensuel" : ch.periodType === "seasonal" ? "Saisonnier" : "Permanent"}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {ch.descriptionFr}
              </p>

              {/* Progress Bar & Status */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="text-foreground font-mono">
                    {ch.currentProgress} / {ch.targetValue} ({ch.percent}%)
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 rounded-full",
                      ch.isClaimed
                        ? "bg-emerald-700"
                        : ch.isCompleted
                        ? "bg-emerald-600"
                        : "bg-emerald-500/70"
                    )}
                    style={{ width: `${Math.min(100, ch.percent)}%` }}
                  />
                </div>
              </div>

              {/* Feedback Alert if any */}
              {isFeedback && feedback && (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl p-2.5 text-xs font-semibold",
                    feedback.type === "ok"
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  )}
                >
                  {feedback.type === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Action Button */}
              <div>
                {ch.isClaimed ? (
                  <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-100/70 border border-emerald-200 py-2 text-xs font-black text-emerald-800">
                    <Check className="h-4 w-4 text-emerald-700" />
                    <span>Récompense Débloquée & Obtenue</span>
                  </div>
                ) : ch.isCompleted ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleClaim(ch.id)}
                    disabled={claimingId === ch.id}
                    className="w-full rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2 shadow-sm"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Réclamer la récompense (+{ch.rewardPoints} pts)</span>
                  </Button>
                ) : (
                  <div className="text-center rounded-2xl bg-muted/30 border border-border/40 py-2 text-[11px] font-semibold text-muted-foreground">
                    Objectif en cours · Complétez la mission pour débloquer
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
