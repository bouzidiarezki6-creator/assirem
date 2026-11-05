import { useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  HeartHandshake,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useVolunteerAuth } from "@/context/VolunteerAuthContext"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { padWilayaCode } from "@/lib/wilayas"
import type { VolunteerSkill } from "@/lib/types"
import { cn } from "@/lib/utils"

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

export default function Rejoindre() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectPath = searchParams.get("redirect") || "/mon-espace"

  const { currentVolunteer, isAuthenticated, signup, login } = useVolunteerAuth()
  const { wilayas } = useLocationFilter()

  // Mode: "signup" or "login"
  const [mode, setMode] = useState<"signup" | "login">(
    searchParams.get("mode") === "login" ? "login" : "signup"
  )

  // Signup form fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [wilayaCode, setWilayaCode] = useState(6) // Default Béjaïa
  const [commune, setCommune] = useState("Akbou")
  const [birthDate, setBirthDate] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<VolunteerSkill[]>([])
  const [acceptTerms, setAcceptTerms] = useState(false)

  // Status & error handling
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const toggleSkill = (skill: VolunteerSkill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (!acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation et la politique de confidentialité pour rejoindre le programme.")
      return
    }

    if (password !== passwordConfirm) {
      setError("Les deux mots de passe ne correspondent pas.")
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.")
      return
    }

    setSubmitting(true)
    const res = await signup({
      firstName,
      lastName,
      email,
      phone,
      password,
      wilayaCode,
      commune,
      birthDate: birthDate || undefined,
      skills: selectedSkills,
    })
    setSubmitting(false)

    if (!res.ok) {
      setError(res.error || "Une erreur est survenue lors de l'inscription.")
      return
    }

    navigate(redirectPath)
  }

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    setSubmitting(true)
    const res = await login(email, password)
    setSubmitting(false)

    if (!res.ok) {
      setError(res.error || "Identifiants invalides.")
      return
    }

    navigate(redirectPath)
  }

  // If already authenticated
  if (isAuthenticated && currentVolunteer) {
    return (
      <div className="page-shell section-gap">
        <div className="mx-auto max-w-xl text-center space-y-6 rounded-3xl border border-border/70 bg-white p-8 sm:p-12 shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground">
              Vous êtes déjà connecté(e) !
            </h1>
            <p className="text-sm text-muted-foreground">
              Bienvenue, <strong>{currentVolunteer.firstName} {currentVolunteer.lastName}</strong>.
              Vous pouvez accéder directement à votre espace de récompenses et suivre vos participations.
            </p>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              onClick={() => navigate("/mon-espace")}
              className="rounded-2xl bg-primary px-8 py-3 font-bold"
            >
              Accéder à Mon Espace
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell section-gap">
      {/* Header section */}
      <section className="relative mx-auto w-full max-w-4xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black text-primary">
          <HeartHandshake className="h-4 w-4" />
          Programme Bénévoles & Récompenses · يد في يد
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
          Rejoignez le programme des bénévoles
        </h1>

        <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Votre engagement compte. Rejoignez notre communauté de bénévoles, participez aux initiatives solidaires et suivez l'impact de vos actions.
        </p>

        {/* Note reassuring visitors that public access remains completely free without account */}
        <p className="text-xs text-muted-foreground bg-muted/40 py-2.5 px-4 rounded-2xl max-w-xl mx-auto border border-border/50 font-medium">
          La consultation de la plateforme et les actions solidaires restent entièrement libres et accessibles sans inscription. L'inscription est réservée aux bénévoles souhaitant suivre leurs attestations et points de reconnaissance.
        </p>
      </section>

      {/* Main Form Container */}
      <div className="mx-auto w-full max-w-xl">
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-card">
          {/* Tabs: Créer un compte vs Se connecter */}
          <div className="grid grid-cols-2 border-b border-border/50 bg-muted/20 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMode("signup")
                setError("")
              }}
              className={cn(
                "rounded-2xl py-3 text-xs sm:text-sm font-extrabold transition-all",
                mode === "signup"
                  ? "bg-white text-primary shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Créer un compte
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("login")
                setError("")
              }}
              className={cn(
                "rounded-2xl py-3 text-xs sm:text-sm font-extrabold transition-all",
                mode === "login"
                  ? "bg-white text-primary shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Se connecter
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* FORM 1: CONNEXION */}
            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
                {/* Sélecteur Rapide Démo 1-Clic */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3 sm:p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Comptes Démo (Connexion Rapide 1-Clic)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("amine.meziane.demo@yedfelyed.dz")
                        setPassword("demo123456")
                        setError("")
                      }}
                      className="text-left rounded-xl bg-card border border-emerald-500/30 hover:border-emerald-400 p-2 text-[11px] font-bold shadow-2xs hover:bg-emerald-950/60 transition-colors"
                    >
                      <span className="block font-black text-emerald-300">Amine Meziane</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Béjaïa · 480 pts</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmail("yasmine.kaci.demo@yedfelyed.dz")
                        setPassword("demo123456")
                        setError("")
                      }}
                      className="text-left rounded-xl bg-card border border-emerald-500/30 hover:border-emerald-400 p-2 text-[11px] font-bold shadow-2xs hover:bg-emerald-950/60 transition-colors"
                    >
                      <span className="block font-black text-emerald-300">Yasmine Kaci</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Sétif · 920 pts</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmail("walid.boudiaf.demo@yedfelyed.dz")
                        setPassword("demo123456")
                        setError("")
                      }}
                      className="text-left rounded-xl bg-card border border-emerald-500/30 hover:border-emerald-400 p-2 text-[11px] font-bold shadow-2xs hover:bg-emerald-950/60 transition-colors"
                    >
                      <span className="block font-black text-emerald-300">Walid Boudiaf</span>
                      <span className="text-[10px] text-muted-foreground font-medium">El Eulma · 250 pts</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmail("nabila.aitouali.demo@yedfelyed.dz")
                        setPassword("demo123456")
                        setError("")
                      }}
                      className="text-left rounded-xl bg-card border border-emerald-500/30 hover:border-emerald-400 p-2 text-[11px] font-bold shadow-2xs hover:bg-emerald-950/60 transition-colors"
                    >
                      <span className="block font-black text-emerald-300">Nabila Ait-Ouali</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Akbou · 1450 pts</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("karim.saadi.demo@yedfelyed.dz")
                      setPassword("demo123456")
                      setError("")
                    }}
                    className="w-full text-left rounded-xl bg-rose-950/50 border border-rose-500/30 hover:border-rose-400 p-1.5 px-2 text-[10px] font-bold text-rose-300 transition-colors"
                  >
                    <span>Karim Saadi (El Eulma · Compte Suspendu pour test de modération)</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Adresse e-mail
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: karim.benali@example.com"
                    required
                    className="h-11 rounded-2xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Mot de passe
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-11 rounded-2xl text-xs"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-2xl bg-primary text-sm font-bold shadow-soft"
                  >
                    {submitting ? "Connexion en cours..." : "Me connecter à mon espace"}
                  </Button>
                </div>

                <div className="text-center pt-2 text-xs text-muted-foreground">
                  <span>Pas encore inscrit ? </span>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-bold text-primary hover:underline"
                  >
                    Créer un compte bénévole
                  </button>
                </div>
              </form>
            )}

            {/* FORM 2: CRÉATION DE COMPTE */}
            {mode === "signup" && (
              <form onSubmit={handleSignupSubmit} className="space-y-4 animate-fade-in">
                {/* Nom & Prénom */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Prénom *</label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ex: Karim"
                      required
                      className="h-11 rounded-2xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Nom *</label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ex: Benali"
                      required
                      className="h-11 rounded-2xl text-xs"
                    />
                  </div>
                </div>

                {/* E-mail & Téléphone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Adresse e-mail *</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="karim@example.com"
                      required
                      className="h-11 rounded-2xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Numéro de téléphone *</label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0550112233"
                      required
                      className="h-11 rounded-2xl text-xs"
                    />
                  </div>
                </div>

                {/* Wilaya & Commune */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Wilaya *</label>
                    <select
                      value={wilayaCode}
                      onChange={(e) => setWilayaCode(Number(e.target.value))}
                      className="w-full h-11 rounded-2xl border border-input bg-background px-3 text-xs font-semibold focus:border-primary focus:outline-none"
                    >
                      {wilayas.map((w) => (
                        <option key={w.code} value={w.code}>
                          {padWilayaCode(w.code)} — {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Commune *</label>
                    <Input
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      placeholder="Ex: Akbou"
                      required
                      className="h-11 rounded-2xl text-xs"
                    />
                  </div>
                </div>

                {/* Date de naissance (optionnelle) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Date de naissance (facultative)
                  </label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-11 rounded-2xl text-xs"
                  />
                </div>

                {/* Mots de passe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Mot de passe *</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="6 caractères min."
                      required
                      className="h-11 rounded-2xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Confirmation *</label>
                    <Input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      required
                      className="h-11 rounded-2xl text-xs"
                    />
                  </div>
                </div>

                {/* Compétences & Domaines d'intérêt (facultatifs) */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Compétences & centres d'intérêt (facultatif)
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      {selectedSkills.length} sélectionnée(s)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {ALL_SKILLS.map((sk) => {
                      const active = selectedSkills.includes(sk.id)
                      return (
                        <button
                          key={sk.id}
                          type="button"
                          onClick={() => toggleSkill(sk.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border",
                            active
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-white text-muted-foreground border-border/70 hover:text-foreground hover:border-border"
                          )}
                        >
                          <span>{sk.label}</span>
                          {active && <Check className="h-3 w-3" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Conditions d'utilisation obligatoires */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 rounded-2xl border border-border/60 bg-muted/20 p-3.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      J'accepte les conditions d'utilisation et la politique de confidentialité du programme de bénévolat Yed fel yed.
                    </span>
                  </label>
                </div>

                {/* Bouton de soumission */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-2xl bg-primary text-sm font-bold shadow-soft"
                  >
                    {submitting ? "Création du compte..." : "Créer mon compte bénévole"}
                  </Button>
                </div>

                <div className="text-center pt-1 text-xs text-muted-foreground">
                  <span>Vous avez déjà un compte ? </span>
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-bold text-primary hover:underline"
                  >
                    Se connecter
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
