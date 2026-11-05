import { useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  AlertCircle,
  Award,
  Bell,
  CalendarCheck,
  Check,
  CheckCheck,
  CheckCircle2,
  Crown,
  Footprints,
  HandHeart,
  HeartHandshake,
  Leaf,
  LogOut,
  Medal,
  QrCode,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useVolunteerAuth } from "@/context/VolunteerAuthContext"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import {
  VOLUNTEER_TIERS,
  getLevelProgress,
  getVolunteerTier,
} from "@/lib/levels"
import type { VolunteerSkill } from "@/lib/types"
import type { BadgeWithProgress } from "@/lib/badgeEngine"
import { cn } from "@/lib/utils"
import VolunteerBadgeCard from "@/components/volunteer/VolunteerBadgeCard"

const ALL_SKILLS: { id: VolunteerSkill; label: string }[] = [
  { id: "first_aid", label: "Premiers secours" },
  { id: "health", label: "Santé & Soins" },
  { id: "psychology", label: "Soutien psychologique" },
  { id: "logistics", label: "Logistique & Stock" },
  { id: "transport", label: "Transport & Conduite" },
  { id: "construction", label: "Construction & Bricolage" },
  { id: "it", label: "Informatique & Numérique" },
  { id: "education", label: "Éducation & Soutien scolaire" },
  { id: "communication", label: "Communication & Photo" },
  { id: "environment", label: "Environnement & Nettoyage" },
  { id: "distribution", label: "Distribution & Collecte" },
  { id: "other", label: "Autres compétences" },
]

type EspaceTab =
  | "overview"
  | "badge"
  | "badges"
  | "points"
  | "levels"
  | "participations"
  | "notifications"
  | "profile"

export default function MonEspace() {
  const navigate = useNavigate()
  const { formatDate } = useI18n()
  const { wilayas } = useLocationFilter()
  const {
    currentVolunteer,
    isAuthenticated,
    loading,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
  } = useVolunteerAuth()

  const {
    data,
    getVolunteerParticipations,
    getVolunteerStats,
    getVolunteerTransactions,
    getVolunteerBadges,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppData()

  const [tab, setTab] = useState<EspaceTab>("overview")
  const [badgeCategoryFilter, setBadgeCategoryFilter] = useState<string>("all")

  // Profile edit state
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editWilaya, setEditWilaya] = useState(6)
  const [editCommune, setEditCommune] = useState("")
  const [editSkills, setEditSkills] = useState<VolunteerSkill[]>([])
  const [profileMsg, setProfileMsg] = useState<{ text: string; error?: boolean } | null>(null)

  // Password change state
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [pwdMsg, setPwdMsg] = useState<{ text: string; error?: boolean } | null>(null)

  // Load profile state when opening profile tab
  const initProfileForm = () => {
    if (!currentVolunteer) return
    setEditFirstName(currentVolunteer.firstName)
    setEditLastName(currentVolunteer.lastName)
    setEditPhone(currentVolunteer.phone)
    setEditWilaya(currentVolunteer.wilayaCode)
    setEditCommune(currentVolunteer.commune)
    setEditSkills(currentVolunteer.skills || [])
    setProfileMsg(null)
    setPwdMsg(null)
  }

  // Calculations
  const stats = useMemo(() => {
    if (!currentVolunteer) return { totalPoints: 0, activityCount: 0, hoursVolunteered: 0 }
    return getVolunteerStats(currentVolunteer.id)
  }, [currentVolunteer, getVolunteerStats])

  const participations = useMemo(() => {
    if (!currentVolunteer) return []
    return getVolunteerParticipations(currentVolunteer.id)
  }, [currentVolunteer, getVolunteerParticipations])

  const transactions = useMemo(() => {
    if (!currentVolunteer) return []
    return getVolunteerTransactions(currentVolunteer.id)
  }, [currentVolunteer, getVolunteerTransactions])

  // Notifications
  const volunteerNotifications = useMemo(() => {
    if (!currentVolunteer) return []
    return (data.notifications || [])
      .filter((n) => n.volunteerId === currentVolunteer.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [currentVolunteer, data.notifications])

  const unreadCount = useMemo(() => {
    return volunteerNotifications.filter((n) => !n.read).length
  }, [volunteerNotifications])

  // Badges & Progress
  const badgesList: BadgeWithProgress[] = useMemo(() => {
    if (!currentVolunteer) return []
    return getVolunteerBadges(currentVolunteer.id)
  }, [currentVolunteer, getVolunteerBadges])

  const earnedBadgesCount = useMemo(() => {
    return badgesList.filter((b) => b.isEarned).length
  }, [badgesList])

  // Filtered badges
  const filteredBadges = useMemo(() => {
    if (badgeCategoryFilter === "all") return badgesList
    return badgesList.filter((b) => b.category === badgeCategoryFilter)
  }, [badgesList, badgeCategoryFilter])

  // SOS missions this volunteer applied to
  const sosApplications = useMemo(() => {
    if (!currentVolunteer) return []
    return (data.sosApplications || []).filter(
      (a) =>
        a.volunteerId === currentVolunteer.id ||
        (a.phone && a.phone === currentVolunteer.phone) ||
        (a.email && a.email.toLowerCase() === currentVolunteer.email.toLowerCase())
    )
  }, [currentVolunteer, data.sosApplications])

  const progress = useMemo(() => {
    const pts = currentVolunteer?.points ?? 0
    return getLevelProgress(pts)
  }, [currentVolunteer?.points])

  const tier = useMemo(() => {
    const pts = currentVolunteer?.points ?? 0
    return getVolunteerTier(pts)
  }, [currentVolunteer?.points])

  if (loading) {
    return (
      <div className="page-shell flex h-96 items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-xs text-muted-foreground font-semibold">Chargement de votre espace bénévole...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !currentVolunteer) {
    return (
      <div className="page-shell section-gap">
        <div className="mx-auto max-w-lg rounded-3xl border border-border/70 bg-card p-8 sm:p-12 text-center shadow-card space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
            <HeartHandshake className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground">Espace Bénévole Yed Fel Yed</h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Connectez-vous pour accéder à votre badge officiel, suivre vos points, consulter vos distinctions et gérer vos missions de solidarité.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/rejoindre"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary/90 transition-all"
            >
              Se connecter ou s'inscrire
            </Link>
            <Link
              to="/sos"
              className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-6 py-3 text-xs font-bold text-foreground hover:bg-muted/40 transition-all"
            >
              Consulter les urgences
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)

    const res = await updateProfile({
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      phone: editPhone.trim(),
      wilayaCode: editWilaya,
      commune: editCommune.trim(),
      skills: editSkills,
    })

    if (!res.ok) {
      setProfileMsg({ text: res.error || "Erreur de mise à jour", error: true })
      return
    }

    setProfileMsg({ text: "Votre profil a été mis à jour avec succès." })
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPwdMsg(null)

    if (newPassword !== newPasswordConfirm) {
      setPwdMsg({ text: "Les mots de passe ne correspondent pas.", error: true })
      return
    }

    const res = await changePassword(newPassword)
    if (!res.ok) {
      setPwdMsg({ text: res.error || "Erreur lors du changement de mot de passe.", error: true })
      return
    }

    setNewPassword("")
    setNewPasswordConfirm("")
    setPwdMsg({ text: "Votre mot de passe a été modifié avec succès." })
  }

  const handleDeleteAccount = async () => {
    if (
      confirm(
        "Êtes-vous sûr(e) de vouloir supprimer définitivement votre compte bénévole ? Cette action est irréversible."
      )
    ) {
      await deleteAccount()
      navigate("/")
    }
  }

  const tabsConfig = [
    { id: "overview" as const, label: "Vue d'ensemble", icon: Sparkles },
    { id: "badge" as const, label: "Mon badge QR", icon: QrCode },
    { id: "badges" as const, label: "Mes Badges", icon: Medal, count: earnedBadgesCount },
    { id: "points" as const, label: "Mes points", icon: Award, count: currentVolunteer.points || 0 },
    { id: "levels" as const, label: "Mes niveaux", icon: TrendingUp },
    {
      id: "participations" as const,
      label: "Mes participations",
      icon: Users,
      count: participations.length + sosApplications.length,
    },
    { id: "notifications" as const, label: "Notifications", icon: Bell, count: unreadCount },
    { id: "profile" as const, label: "Mon profil", icon: User },
  ]

  // Helper pour render icône de badge
  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "Footprints":
        return <Footprints className="h-6 w-6" />
      case "Sparkles":
        return <Sparkles className="h-6 w-6" />
      case "HeartHandshake":
        return <HeartHandshake className="h-6 w-6" />
      case "Award":
        return <Award className="h-6 w-6" />
      case "Leaf":
        return <Leaf className="h-6 w-6" />
      case "HandHeart":
        return <HandHeart className="h-6 w-6" />
      case "CalendarCheck":
        return <CalendarCheck className="h-6 w-6" />
      case "Users":
        return <Users className="h-6 w-6" />
      case "Star":
        return <Star className="h-6 w-6" />
      case "Crown":
        return <Crown className="h-6 w-6" />
      default:
        return <Medal className="h-6 w-6" />
    }
  }

  return (
    <div className="page-shell section-gap">
      {/* 1. Header Banner */}
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-border/70 bg-gradient-to-r from-emerald-950/40 via-card to-card p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-wider text-primary">
                {tier.id === "ambassadeur" ? "Ambassadeur d'Honneur" : `Bénévole · ${tier.labelFr}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              Bonjour, {currentVolunteer.firstName} !
            </h1>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
              <span>Code : <strong className="font-mono text-foreground">{currentVolunteer.volunteerCode}</strong></span>
              <span>·</span>
              <span>Membre depuis le {formatDate(currentVolunteer.createdAt)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-500/40 transition-all shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        </div>
      </section>

      {/* 2. Navigation Tabs Bar */}
      <div className="mx-auto w-full max-w-5xl flex gap-2 overflow-x-auto pb-1 scrollbar-none bg-muted/40 p-1.5 rounded-2xl border border-border/50">
        {tabsConfig.map((tb) => {
          const Icon = tb.icon
          const active = tab === tb.id
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => {
                setTab(tb.id)
                if (tb.id === "profile") initProfileForm()
              }}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-extrabold transition-all",
                active
                  ? "bg-card text-primary shadow-soft border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tb.label}
              {tb.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    active
                      ? "bg-primary/10 text-primary"
                      : tb.id === "notifications" && tb.count > 0
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tb.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 3. Tab Contents */}
      <div className="mx-auto w-full max-w-5xl">
        {/* A. VUE D'ENSEMBLE */}
        {tab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Total des points
                </span>
                <p className="text-3xl font-black text-primary">
                  {currentVolunteer.points || 0} pts
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Attribués par validation officielle
                </p>
              </div>

              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Niveau & Palier
                </span>
                <p className="text-3xl font-black text-foreground">
                  Niveau {progress.level}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Palier {tier.labelFr}
                </p>
              </div>

              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Badges débloqués
                </span>
                <p className="text-3xl font-black text-foreground">
                  {earnedBadgesCount} / 10
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Distinctions d'engagement
                </p>
              </div>

              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Heures de bénévolat
                </span>
                <p className="text-3xl font-black text-foreground">
                  {stats.hoursVolunteered > 0 ? `${stats.hoursVolunteered}h` : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {stats.activityCount || participations.length} missions accomplies
                </p>
              </div>
            </div>

            {/* Level Progression Card */}
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Progression vers le {progress.isMaxLevel ? "Palier Suprême" : progress.nextTierName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {progress.isMaxLevel ? (
                      <strong className="text-primary">Félicitations ! Vous avez atteint le palier maximal Ambassadeur.</strong>
                    ) : (
                      <>Plus que <strong className="text-primary">{progress.remaining} points</strong> pour franchir ce palier solidaire.</>
                    )}
                  </p>
                </div>
                <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {progress.percent}% complété
                </span>
              </div>

              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-1">
                <span>Palier actuel : <strong className="text-foreground">{tier.labelFr}</strong></span>
                <span>Prochain seuil : <strong className="text-foreground">{progress.isMaxLevel ? "1000+ pts" : `${progress.requiredForLevel + tier.minPoints} pts`}</strong></span>
              </div>
            </div>

            {/* Quick Shortcuts */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div
                onClick={() => setTab("badge")}
                className="cursor-pointer rounded-3xl border border-border/70 bg-card p-6 shadow-soft hover:border-primary/40 hover:shadow-card transition-all flex items-center gap-4 group"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-foreground">Badge QR Officiel</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Présentez-le pour pointer votre présence
                  </p>
                </div>
              </div>

              <div
                onClick={() => setTab("badges")}
                className="cursor-pointer rounded-3xl border border-border/70 bg-card p-6 shadow-soft hover:border-primary/40 hover:shadow-card transition-all flex items-center gap-4 group"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                  <Medal className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-foreground">Badges & Trophées</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {earnedBadgesCount} obtenus · {10 - earnedBadgesCount} en cours
                  </p>
                </div>
              </div>

              <div
                onClick={() => setTab("notifications")}
                className="cursor-pointer rounded-3xl border border-border/70 bg-card p-6 shadow-soft hover:border-primary/40 hover:shadow-card transition-all flex items-center gap-4 group"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-foreground">Notifications</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} non lue(s)` : "Toutes les alertes sont à jour"}
                  </p>
                </div>
              </div>
            </div>

            {/* Latest Notifications Preview */}
            {volunteerNotifications.length > 0 && (
              <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Dernières activités & récompenses
                  </h3>
                  <button
                    type="button"
                    onClick={() => setTab("notifications")}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Voir tout ({volunteerNotifications.length})
                  </button>
                </div>

                <div className="divide-y divide-border/40">
                  {volunteerNotifications.slice(0, 3).map((notif) => (
                    <div key={notif.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-bold text-foreground">{notif.title}</strong>
                          {!notif.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{notif.message}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* B. MON BADGE BÉNÉVOLE */}
        {tab === "badge" && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="max-w-xl mx-auto space-y-1">
              <h2 className="text-xl font-extrabold text-foreground">
                Votre Badge Bénévole Officiel
              </h2>
              <p className="text-xs text-muted-foreground">
                Présentez ce QR Code lors de votre arrivée sur le terrain pour faire valider votre pointage et créditer vos points automatiquement (+10 pts).
              </p>
            </div>

            <VolunteerBadgeCard volunteer={currentVolunteer} />
          </div>
        )}

        {/* C. MES BADGES & MÉDAILLES (10 BADGES AUTOMATIQUES) */}
        {tab === "badges" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Collection Officielle de Badges
                </span>
                <p className="text-2xl sm:text-3xl font-black text-foreground mt-1">
                  {earnedBadgesCount} / 10 badges débloqués
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Attribués automatiquement dès que vous remplissez les conditions sur le terrain.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
                  Anti-doublon certifié
                </span>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(
                [
                  { id: "all", label: "Tous les badges" },
                  { id: "progression", label: "Progression" },
                  { id: "impact", label: "Impact & Solidarité" },
                  { id: "regularite", label: "Régularité" },
                  { id: "leadership", label: "Leadership" },
                  { id: "excellence", label: "Excellence" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setBadgeCategoryFilter(f.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                    badgeCategoryFilter === f.id
                      ? "bg-foreground text-background"
                      : "bg-card border border-border/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Badges Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBadges.map((badge) => {
                const rarityStyle =
                  badge.rarity === "legendaire"
                    ? "border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-card text-amber-300"
                    : badge.rarity === "epique"
                    ? "border-purple-500/40 bg-gradient-to-b from-purple-950/30 to-card text-purple-300"
                    : badge.rarity === "rare"
                    ? "border-sky-500/40 bg-gradient-to-b from-sky-950/30 to-card text-sky-300"
                    : "border-border/70 bg-card text-emerald-400"

                return (
                  <div
                    key={badge.id}
                    className={cn(
                      "rounded-3xl border p-5 shadow-soft space-y-3 transition-all",
                      badge.isEarned
                        ? "border-primary/50 bg-gradient-to-b from-primary/10 via-card to-card"
                        : "border-border/60 bg-card/60 opacity-80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-soft",
                          badge.isEarned
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {renderBadgeIcon(badge.illustration)}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border",
                            rarityStyle
                          )}
                        >
                          {badge.rarity}
                        </span>
                        {badge.isEarned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                            <Check className="h-3 w-3" />
                            Obtenu
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {badge.remaining} {badge.unit} restant(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-foreground">{badge.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {badge.description}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{badge.conditions}</span>
                        <span className="font-mono font-bold text-foreground">
                          {badge.current} / {badge.target}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            badge.isEarned ? "bg-primary" : "bg-primary/50"
                          )}
                          style={{ width: `${badge.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* D. MES POINTS */}
        {tab === "points" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Solde actuel certifié
                </span>
                <p className="text-3xl sm:text-4xl font-black text-primary mt-1">
                  {currentVolunteer.points || 0} points
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Calculés et attribués automatiquement après validation de présence ou rapport.
                </p>
              </div>

              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs text-primary max-w-sm">
                <span className="font-bold block">Protection de solde :</span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Les points sont attribués exclusivement après validation officielle du responsable de mission ou de l'audit.
                </span>
              </div>
            </div>

            {/* Transactions History Table */}
            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-foreground">
                Historique des attributions & opérations ({transactions.length})
              </h3>

              <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-soft">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-4 text-start">Date</th>
                      <th className="p-4 text-start">Motif / Mission</th>
                      <th className="p-4 text-center">Points</th>
                      <th className="p-4 text-end">Nouveau solde</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4 text-muted-foreground font-mono">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="p-4">
                          <strong className="text-foreground text-sm block">
                            {tx.missionTitle || tx.reason}
                          </strong>
                          {tx.adminNote && (
                            <span className="text-[10px] text-muted-foreground italic block">
                              Note admin : {tx.adminNote}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-black",
                              tx.amount >= 0
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            )}
                          >
                            {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} pts
                          </span>
                        </td>
                        <td className="p-4 text-end font-bold text-foreground">
                          {tx.balanceAfter} pts
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Aucune transaction de points enregistrée pour le moment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* E. MES NIVEAUX */}
        {tab === "levels" && (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span>Niveau {progress.level} — Palier {progress.tierLabel}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Une progression continue récompensant l'assiduité, les heures de présence et la contribution réelle.
                  </p>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Solde : {currentVolunteer.points || 0} pts
                </span>
              </div>

              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-1">
                <span>Progression : {progress.percent}% du palier</span>
                {progress.isMaxLevel ? (
                  <span className="font-bold text-primary">Palier Ambassadeur d'Honneur atteint !</span>
                ) : (
                  <span>
                    Encore <strong className="text-primary">{progress.remaining} points</strong> pour atteindre le palier {progress.nextTierName}.
                  </span>
                )}
              </div>
            </div>

            {/* All Tiers Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ps-1">
                La Grille des 6 Paliers Institutionnels
              </h4>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {VOLUNTEER_TIERS.map((tItem) => {
                  const isCurrent = tier.id === tItem.id
                  return (
                    <div
                      key={tItem.id}
                      className={cn(
                        "rounded-3xl border p-5 shadow-soft transition-all",
                        isCurrent
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-border/60 bg-card"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-primary/10 text-primary font-bold text-xs font-mono">
                          N{tItem.level + 1}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-0.5">
                            Palier Actuel
                          </span>
                        )}
                      </div>
                      <h5 className="text-sm font-extrabold text-foreground">
                        {tItem.labelFr}
                      </h5>
                      <p className="text-xs font-semibold text-primary mt-0.5">
                        {tItem.minPoints} {tItem.maxPoints !== null ? `à ${tItem.maxPoints} pts` : "pts et plus"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        {tItem.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* F. MES PARTICIPATIONS */}
        {tab === "participations" && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. Participations officielles validées */}
            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-foreground">
                Missions validées sur le terrain ({participations.length})
              </h3>

              <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-soft">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-4 text-start">Date</th>
                      <th className="p-4 text-start">Intitulé de la mission</th>
                      <th className="p-4 text-start">Catégorie</th>
                      <th className="p-4 text-center">Points attribués</th>
                      <th className="p-4 text-end">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {participations.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4 text-muted-foreground font-mono">
                          {p.activityDate}
                        </td>
                        <td className="p-4">
                          <strong className="text-foreground text-sm block">
                            {p.activityTitle}
                          </strong>
                          {p.hoursCounted > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {p.hoursCounted}h comptabilisées
                            </span>
                          )}
                        </td>
                        <td className="p-4 capitalize text-muted-foreground">
                          {p.categoryId}
                        </td>
                        <td className="p-4 text-center font-bold text-primary">
                          +{p.pointsAwarded} pts
                        </td>
                        <td className="p-4 text-end">
                          <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                            Participation validée
                          </span>
                        </td>
                      </tr>
                    ))}
                    {participations.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Aucune participation validée pour l'instant.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Candidatures SOS en cours */}
            {sosApplications.length > 0 && (
              <div className="space-y-3 pt-4">
                <h3 className="text-base font-extrabold text-foreground">
                  Vos candidatures aux missions SOS ({sosApplications.length})
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  {sosApplications.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {app.reference}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                            app.status === "accepted" && "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
                            app.status === "pending" && "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
                            app.status === "waitlist" && "bg-amber-500/20 text-amber-300 border border-amber-500/30",
                            app.status === "rejected" && "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          )}
                        >
                          {app.status === "accepted"
                            ? "Acceptée"
                            : app.status === "pending"
                            ? "En attente de validation"
                            : app.status === "waitlist"
                            ? "Liste d'attente"
                            : "Refusée"}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-foreground">
                        {app.customProfession || app.applicationType} · {app.commune}
                      </h4>

                      <div className="text-[11px] text-muted-foreground flex justify-between pt-1 border-t border-border/40">
                        <span>Soumis le {formatDate(app.createdAt)}</span>
                        {app.pointsAwarded ? (
                          <span className="font-bold text-primary">+{app.pointsAwarded} pts</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* G. NOTIFICATIONS */}
        {tab === "notifications" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Centre d'Alertes & Notifications
                </span>
                <p className="text-xl sm:text-2xl font-black text-foreground mt-1">
                  Vos notifications en temps réel ({volunteerNotifications.length})
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Points crédités, badges obtenus, promotions de niveau et validations de mission.
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead(currentVolunteer.id)}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-card border border-border/80 px-4 py-2 text-xs font-bold text-foreground hover:bg-muted/40 transition-all"
                >
                  <CheckCheck className="h-4 w-4 text-primary" />
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="space-y-3">
              {volunteerNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={cn(
                    "cursor-pointer rounded-3xl border p-5 shadow-soft transition-all flex items-start gap-4",
                    !n.read
                      ? "border-primary/40 bg-gradient-to-r from-primary/10 via-card to-card"
                      : "border-border/60 bg-card hover:border-border"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                      !n.read ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Bell className="h-5 w-5" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">{n.title}</h4>
                        {!n.read && (
                          <span className="rounded-full bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 border border-primary/30">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>

                    {n.points && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary pt-1">
                        +{n.points} points crédités à votre solde
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {volunteerNotifications.length === 0 && (
                <div className="rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center text-xs text-muted-foreground">
                  <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  Aucune notification pour le moment.
                </div>
              )}
            </div>
          </div>
        )}

        {/* H. MON PROFIL */}
        {tab === "profile" && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            {profileMsg && (
              <div
                className={cn(
                  "rounded-2xl p-4 text-xs font-semibold flex items-center gap-2",
                  profileMsg.error
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                )}
              >
                {profileMsg.error ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            {/* Edit Personal Info */}
            <form
              onSubmit={handleProfileSubmit}
              className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-soft space-y-4"
            >
              <h3 className="text-base font-extrabold text-foreground pb-2 border-b border-border/40">
                Informations Personnelles
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Prénom</label>
                  <Input
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                    className="h-11 rounded-2xl text-xs bg-card border-border/70 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nom</label>
                  <Input
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                    className="h-11 rounded-2xl text-xs bg-card border-border/70 text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Adresse e-mail (identifiant)</label>
                <Input
                  value={currentVolunteer.email}
                  disabled
                  className="h-11 rounded-2xl text-xs bg-muted/40 cursor-not-allowed border-border/70 text-muted-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Numéro de téléphone</label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    className="h-11 rounded-2xl text-xs bg-card border-border/70 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Wilaya</label>
                  <select
                    value={editWilaya}
                    onChange={(e) => setEditWilaya(Number(e.target.value))}
                    className="w-full h-11 rounded-2xl border border-border/70 bg-card text-foreground px-3 text-xs font-semibold focus:border-primary focus:outline-none"
                  >
                    {wilayas.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Commune</label>
                <Input
                  value={editCommune}
                  onChange={(e) => setEditCommune(e.target.value)}
                  required
                  className="h-11 rounded-2xl text-xs bg-card border-border/70 text-foreground"
                />
              </div>

              {/* Skills edit */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <label className="text-xs font-bold text-foreground block">
                  Mes compétences & domaines d'action
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SKILLS.map((sk) => {
                    const active = editSkills.includes(sk.id)
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => {
                          setEditSkills((prev) =>
                            prev.includes(sk.id) ? prev.filter((s) => s !== sk.id) : [...prev, sk.id]
                          )
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border",
                          active
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-card text-muted-foreground border-border/70 hover:text-foreground hover:border-border"
                        )}
                      >
                        <span>{sk.label}</span>
                        {active && <Check className="h-3 w-3" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" className="rounded-2xl bg-primary text-xs font-bold px-6 text-primary-foreground">
                  Enregistrer les modifications
                </Button>
              </div>
            </form>

            {/* Change Password Card */}
            <form
              onSubmit={handlePasswordSubmit}
              className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-soft space-y-4"
            >
              <h3 className="text-base font-extrabold text-foreground pb-2 border-b border-border/40">
                Sécurité & Mot de passe
              </h3>

              {pwdMsg && (
                <div
                  className={cn(
                    "rounded-2xl p-3 text-xs font-semibold flex items-center gap-2",
                    pwdMsg.error
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  )}
                >
                  <span>{pwdMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nouveau mot de passe</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6 caractères min."
                    required
                    className="h-11 rounded-2xl text-xs bg-card border-border/70 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Confirmation</label>
                  <Input
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    required
                    className="h-11 rounded-2xl text-xs bg-card border-border/70 text-foreground"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="outline" className="rounded-2xl text-xs font-bold border-border/80 bg-card text-foreground">
                  Mettre à jour le mot de passe
                </Button>
              </div>
            </form>

            {/* Delete Account Card */}
            <div className="rounded-3xl border border-rose-500/30 bg-rose-950/20 p-6 shadow-soft space-y-2">
              <h4 className="text-sm font-bold text-rose-300">
                Zone de suppression
              </h4>
              <p className="text-xs text-muted-foreground">
                Si vous souhaitez quitter le programme de récompenses, vous pouvez supprimer votre compte. Vos participations passées resteront archivées de manière anonyme.
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDeleteAccount}
                  className="rounded-2xl text-xs font-bold text-rose-300 border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/40"
                >
                  Supprimer mon compte bénévole
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
