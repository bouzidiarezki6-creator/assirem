import { useMemo, useState } from "react"
import {
  ArrowRightLeft,
  Check,
  CheckCircle2,
  Copy,
  History,
  KeyRound,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useGovernance } from "@/context/GovernanceContext"
import { useLocationFilter } from "@/context/LocationFilterProvider"
import { padWilayaCode, getWilaya } from "@/lib/wilayas"
import { canManageInstitutionalUser } from "@/lib/abac"
import type {
  InstitutionalRole,
  InstitutionalUser,
  InstitutionalUserStatus,
} from "@/lib/governanceTypes"

const STATUS_LABELS: Record<
  InstitutionalUserStatus,
  { label: string; badge: string }
> = {
  active: { label: "Actif", badge: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  pending_activation: { label: "En attente d'activation", badge: "bg-amber-100 text-amber-900 border-amber-300" },
  suspended: { label: "Suspendu", badge: "bg-rose-100 text-rose-900 border-rose-300" },
  deactivated: { label: "Désactivé / Révoqué", badge: "bg-slate-100 text-slate-700 border-slate-300" },
}

const ROLE_BADGES: Record<InstitutionalRole, { label: string; badge: string; level: string }> = {
  national_admin: {
    label: "Administrateur National",
    badge: "bg-purple-100 text-purple-900 border-purple-300",
    level: "Niveau 1 — National",
  },
  wilaya_admin: {
    label: "Administrateur de Wilaya",
    badge: "bg-blue-100 text-blue-900 border-blue-300",
    level: "Niveau 2 — Wilaya",
  },
  local_coordinator: {
    label: "Coordinateur Local",
    badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
    level: "Niveau 3 — Local",
  },
  mission_lead: {
    label: "Responsable de Mission",
    badge: "bg-teal-100 text-teal-900 border-teal-300",
    level: "Niveau 4 — Terrain",
  },
  national_auditor: {
    label: "Auditeur National",
    badge: "bg-amber-100 text-amber-900 border-amber-300",
    level: "Contrôle Indépendant",
  },
}

export default function InstitutionalUsersPanel() {
  const {
    allUsers,
    currentUser,
    allAuditEntries,
    accountAnomalies,
    addInstitutionalUser,
    setInstitutionalUserStatus,
    sendUserInvitation,
    transferUserOperations,
  } = useGovernance()
  const { wilayas } = useLocationFilter()

  const isNationalAdmin = currentUser.role === "national_admin"
  const isWilayaAdmin = currentUser.role === "wilaya_admin"
  const isAuditor = currentUser.role === "national_auditor"

  // Filter state
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [wilayaFilter, setWilayaFilter] = useState<string>("all")

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<InstitutionalUser | null>(null)
  const [transferTarget, setTransferTarget] = useState<InstitutionalUser | null>(null)
  const [auditTarget, setAuditTarget] = useState<InstitutionalUser | null>(null)
  const [invitationTarget, setInvitationTarget] = useState<InstitutionalUser | null>(null)
  const [createdInvitation, setCreatedInvitation] = useState<{
    userName: string
    userEmail: string
    token: string
    link: string
  } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Add Form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<InstitutionalRole>(
    isNationalAdmin ? "wilaya_admin" : "local_coordinator"
  )
  const [wilayaCode, setWilayaCode] = useState<number>(
    isWilayaAdmin ? (currentUser.wilayaCode || 6) : 6
  )
  const [commune, setCommune] = useState<string>(
    isWilayaAdmin ? (currentUser.commune || "") : ""
  )
  const [structure, setStructure] = useState("Direction de la Jeunesse et des Sports (DJS)")
  const [useInvitationFlow, setUseInvitationFlow] = useState(true)
  const [addError, setAddError] = useState("")

  // Revoke state
  const [revokeStatus, setRevokeStatus] = useState<InstitutionalUserStatus>("suspended")
  const [revokeJustification, setRevokeJustification] = useState("")
  const [revokeError, setRevokeError] = useState("")

  // Transfer state
  const [transferToId, setTransferToId] = useState("")
  const [transferJustification, setTransferJustification] = useState("")
  const [transferSuccess, setTransferSuccess] = useState("")
  const [transferError, setTransferError] = useState("")

  // Current Wilaya display name for wilaya admins
  const currentWilayaInfo = useMemo(() => {
    return currentUser.wilayaCode ? getWilaya(currentUser.wilayaCode) : null
  }, [currentUser.wilayaCode])

  // Filter users according to role permissions and filters
  const filtered = useMemo(() => {
    return allUsers.filter((u) => {
      // Un admin de wilaya ne voit que les comptes de sa propre wilaya ou son propre compte
      if (isWilayaAdmin) {
        if (u.wilayaCode && u.wilayaCode !== currentUser.wilayaCode && u.id !== currentUser.id) {
          return false
        }
      }

      // Search
      const q = search.trim().toLowerCase()
      if (q) {
        const full = `${u.firstName} ${u.lastName} ${u.email} ${u.phone} ${u.structure} ${u.commune || ""} ${u.createdByName || ""}`.toLowerCase()
        if (!full.includes(q)) return false
      }

      // Role filter
      if (roleFilter !== "all" && u.role !== roleFilter) return false

      // Status filter
      if (statusFilter !== "all" && u.status !== statusFilter) return false

      // Wilaya filter (national scope only)
      if (isNationalAdmin || isAuditor) {
        if (wilayaFilter !== "all") {
          if (wilayaFilter === "national") {
            if (u.wilayaCode) return false
          } else {
            if (u.wilayaCode !== Number(wilayaFilter)) return false
          }
        }
      }

      return true
    })
  }, [allUsers, currentUser, isWilayaAdmin, isNationalAdmin, isAuditor, search, roleFilter, statusFilter, wilayaFilter])

  // Audit logs for selected user
  const userAuditEntries = useMemo(() => {
    if (!auditTarget) return []
    return allAuditEntries.filter((entry) => {
      const matchResource = entry.resourceId === auditTarget.id
      const matchActor = entry.actorId === auditTarget.id
      const matchRef = entry.resourceReference?.toLowerCase().includes(auditTarget.email.toLowerCase())
      const matchJustif = entry.justification?.toLowerCase().includes(auditTarget.email.toLowerCase())
      const matchState =
        JSON.stringify(entry.previousState || {}).toLowerCase().includes(auditTarget.email.toLowerCase()) ||
        JSON.stringify(entry.newState || {}).toLowerCase().includes(auditTarget.email.toLowerCase())
      return matchResource || matchActor || matchRef || matchJustif || matchState
    })
  }, [allAuditEntries, auditTarget])

  // Candidates for operation handover (active users in the same wilaya)
  const eligibleTransferees = useMemo(() => {
    if (!transferTarget) return []
    return allUsers.filter(
      (u) =>
        u.id !== transferTarget.id &&
        u.status === "active" &&
        (!transferTarget.wilayaCode || u.wilayaCode === transferTarget.wilayaCode)
    )
  }, [allUsers, transferTarget])

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAddError("")

    if (!email.includes("@")) {
      setAddError("Adresse email professionnelle invalide.")
      return
    }

    if (role === "local_coordinator" && !commune.trim()) {
      setAddError("La commune de rattachement est obligatoire pour un coordinateur local.")
      return
    }

    const assignedWilaya =
      role === "national_admin" || role === "national_auditor"
        ? undefined
        : isWilayaAdmin
        ? (currentUser.wilayaCode || 6)
        : wilayaCode

    const res = addInstitutionalUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      wilayaCode: assignedWilaya,
      commune: role === "local_coordinator" || role === "mission_lead" ? commune.trim() : undefined,
      structure: structure.trim(),
      status: useInvitationFlow ? "pending_activation" : "active",
      mfaEnabled: role === "national_admin" || role === "wilaya_admin",
    })

    if (!res.ok) {
      setAddError(res.error)
    } else {
      setIsAddOpen(false)
      const newUser = res.user
      if (useInvitationFlow && newUser.invitationToken) {
        const link = `${window.location.origin}/admin?invitation=${newUser.invitationToken}&email=${encodeURIComponent(newUser.email)}`
        setCreatedInvitation({
          userName: `${newUser.firstName} ${newUser.lastName}`,
          userEmail: newUser.email,
          token: newUser.invitationToken,
          link,
        })
      }
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
    }
  }

  const handleRevokeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!revokeTarget) return
    setRevokeError("")

    const res = setInstitutionalUserStatus(
      revokeTarget.id,
      revokeStatus,
      revokeJustification
    )

    if (!res.ok) {
      setRevokeError(res.error)
    } else {
      setRevokeTarget(null)
      setRevokeJustification("")
    }
  }

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferTarget || !transferToId) return
    setTransferError("")
    setTransferSuccess("")

    const res = transferUserOperations(
      transferTarget.id,
      transferToId,
      transferJustification
    )

    if (!res.ok) {
      setTransferError(res.error)
    } else {
      setTransferSuccess(`${res.transferredCount} opération(s) transférée(s) avec succès.`)
      setTimeout(() => {
        setTransferTarget(null)
        setTransferJustification("")
        setTransferSuccess("")
      }, 1200)
    }
  }

  const handleGenerateNewInvite = (userId: string) => {
    const res = sendUserInvitation(userId)
    if (res.ok) {
      const target = allUsers.find((u) => u.id === userId)
      if (target) {
        setInvitationTarget({
          ...target,
          invitationToken: res.token,
          invitationExpiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
          status: "pending_activation",
        })
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header section with role-tailored presentation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${
                ROLE_BADGES[currentUser.role]?.badge || "bg-muted text-foreground"
              }`}
            >
              {isNationalAdmin && "Niveau 1 — Autorité Nationale (69 Wilayas)"}
              {isWilayaAdmin &&
                `Niveau 2 — Wilaya de ${currentWilayaInfo?.name || "Affectation"} (${padWilayaCode(currentUser.wilayaCode || 0)})`}
              {isAuditor && "Rôle Transversal — Contrôle Indépendant & Audit"}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="h-7 w-7 text-emerald-700" />
            {isNationalAdmin && "Administration des Accès & Hiérarchie"}
            {isWilayaAdmin && "Gestion des Coordinateurs Locaux"}
            {isAuditor && "Registre des Comptes Administratifs"}
            {!isNationalAdmin && !isWilayaAdmin && !isAuditor && "Répertoire des Responsables Institutionnels"}
          </h1>

          <p className="text-sm text-slate-600 font-medium mt-1">
            {isNationalAdmin &&
              "Contrôle national des administrateurs de wilaya et nomination des auditeurs indépendants (69 wilayas)."}
            {isWilayaAdmin &&
              `Coordination territoriale et affectation des coordinateurs communaux pour la wilaya de ${currentWilayaInfo?.name || "votre ressort"}.`}
            {isAuditor &&
              "Supervision indépendante, détection des anomalies hiérarchiques et journalisation des délégations (Lecture seule stricte)."}
            {!isNationalAdmin && !isWilayaAdmin && !isAuditor &&
              "Consultation du répertoire institutionnel et des périmètres territoriaux."}
          </p>
        </div>

        {/* Action buttons (Strictly gated by ABAC) */}
        {!isAuditor && (isNationalAdmin || isWilayaAdmin) && (
          <Button
            type="button"
            onClick={() => {
              setRole(isNationalAdmin ? "wilaya_admin" : "local_coordinator")
              setWilayaCode(isWilayaAdmin ? (currentUser.wilayaCode || 6) : 6)
              setCommune(isWilayaAdmin ? (currentUser.commune || "") : "")
              setAddError("")
              setIsAddOpen(true)
            }}
            className="rounded-2xl h-11 px-5 font-bold gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            <span>
              {isNationalAdmin ? "Créer un compte administratif" : "Nouveau coordinateur local"}
            </span>
          </Button>
        )}
      </div>

      {/* Auditor / National Admin Anomaly Card */}
      {(isAuditor || isNationalAdmin) && (
        <>
          {accountAnomalies.length > 0 ? (
            <div className="rounded-3xl border border-rose-300 bg-rose-50/80 p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 text-rose-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-rose-900">
                      Anomalies de gouvernance détectées ({accountAnomalies.length})
                    </h3>
                    <span className="text-xs font-semibold bg-rose-200/80 text-rose-900 px-2.5 py-0.5 rounded-full">
                      Vérification requise
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 mt-1">
                    Des comptes administratifs présentent des irrégularités hiérarchiques ou territoriales non conformes aux directives nationales.
                  </p>
                  <div className="mt-3 space-y-2">
                    {accountAnomalies.map((anom) => (
                      <div
                        key={anom.id}
                        className="rounded-2xl bg-white border border-rose-200 p-3 text-xs flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-bold text-foreground">{anom.description}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            Compte: {anom.userEmail} • Sévérité: {anom.severity}
                          </p>
                        </div>
                        <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider bg-rose-100 px-2 py-0.5 rounded-md">
                          {anom.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-soft flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-emerald-900">
                  Registre hiérarchique intègre : Aucune anomalie détectée
                </p>
                <p className="text-[11px] text-emerald-800">
                  Tous les comptes administratifs respectent la chaîne de délégation (Niveau 1 → Niveau 2 → Niveau 3) et le confinement territorial.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Filter Toolbar */}
      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher nom, email, wilaya, structure..."
                className="rounded-2xl h-10 ps-9 text-xs sm:text-sm"
              />
            </div>

            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-10 rounded-2xl border border-input bg-background px-3 text-xs sm:text-sm font-medium"
              >
                <option value="all">Tous les rôles hiérarchiques</option>
                {isNationalAdmin || isAuditor ? (
                  <>
                    <option value="national_admin">Niveau 1 — Administrateurs Nationaux</option>
                    <option value="national_auditor">Rôle Transversal — Auditeurs Nationaux</option>
                    <option value="wilaya_admin">Niveau 2 — Administrateurs de Wilaya</option>
                    <option value="local_coordinator">Niveau 3 — Coordinateurs Locaux</option>
                    <option value="mission_lead">Niveau 4 — Responsables de Mission</option>
                  </>
                ) : (
                  <>
                    <option value="wilaya_admin">Niveau 2 — Administrateur de Wilaya</option>
                    <option value="local_coordinator">Niveau 3 — Coordinateurs Locaux</option>
                    <option value="mission_lead">Niveau 4 — Responsables de Mission</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-2xl border border-input bg-background px-3 text-xs sm:text-sm font-medium"
              >
                <option value="all">Tous les statuts de compte</option>
                <option value="active">Actif</option>
                <option value="pending_activation">En attente d'activation</option>
                <option value="suspended">Suspendu</option>
                <option value="deactivated">Désactivé / Révoqué</option>
              </select>
            </div>

            {(isNationalAdmin || isAuditor) ? (
              <div>
                <select
                  value={wilayaFilter}
                  onChange={(e) => setWilayaFilter(e.target.value)}
                  className="w-full h-10 rounded-2xl border border-input bg-background px-3 text-xs sm:text-sm font-medium"
                >
                  <option value="all">Toutes les wilayas (1 à 69)</option>
                  <option value="national">Échelle Nationale uniquement</option>
                  {wilayas.map((w) => (
                    <option key={w.code} value={w.code}>
                      Wilaya {padWilayaCode(w.code)} — {w.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center px-3 rounded-2xl bg-muted/40 text-xs font-semibold text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 me-1.5 text-emerald-700" />
                <span>Périmètre : {currentWilayaInfo?.name || "Wilaya"} ({padWilayaCode(currentUser.wilayaCode || 0)})</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3 px-4 text-start">Responsable & Contact</th>
                <th className="py-3 px-4 text-start">Rôle & Hiérarchie</th>
                <th className="py-3 px-4 text-start">Périmètre & Structure</th>
                <th className="py-3 px-4 text-start">Chaîne de Délégation</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-end">Actions & Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 font-medium">
                    Aucun compte administratif ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const roleMeta = ROLE_BADGES[u.role] || ROLE_BADGES.local_coordinator
                  const statusMeta = STATUS_LABELS[u.status] || STATUS_LABELS.active
                  const wilayaInfo = u.wilayaCode ? getWilaya(u.wilayaCode) : null
                  const canManage = canManageInstitutionalUser(currentUser, u.role, u.wilayaCode)

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Identity & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 font-bold text-emerald-800 text-sm">
                            {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-slate-600 font-mono font-medium">{u.email}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-0.5">
                              <span>{u.phone}</span>
                              {u.lastLoginAt ? (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  • Connexion: {new Date(u.lastLoginAt).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-600 font-medium">
                                  • Jamais connecté
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Level */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleMeta.badge}`}
                        >
                          {roleMeta.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground block mt-1 font-medium">
                          {roleMeta.level}
                        </span>
                      </td>

                      {/* Structure & Territory */}
                      <td className="py-3.5 px-4 text-xs">
                        <p className="font-semibold text-foreground truncate max-w-xs">{u.structure}</p>
                        <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-emerald-700 shrink-0" />
                          {u.wilayaCode ? (
                            <span>
                              Wilaya {padWilayaCode(u.wilayaCode)} ({wilayaInfo?.name})
                              {u.commune && ` • ${u.commune}`}
                            </span>
                          ) : (
                            <span className="font-semibold text-purple-800">Échelle Nationale</span>
                          )}
                        </p>
                      </td>

                      {/* Delegation Chain (Created by) */}
                      <td className="py-3.5 px-4 text-xs">
                        {u.createdByName ? (
                          <div>
                            <p className="font-bold text-foreground">{u.createdByName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {u.createdByRole ? (ROLE_BADGES[u.createdByRole]?.label || u.createdByRole) : "Autorité"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold bg-muted px-2 py-0.5 rounded-md text-muted-foreground inline-block">
                            Amorce Système (Bootstrap)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusMeta.badge}`}
                        >
                          {statusMeta.label}
                        </span>
                        {u.status === "pending_activation" && u.invitationToken && (
                          <span className="block text-[10px] text-amber-700 mt-1 font-mono">
                            Jeton 72h actif
                          </span>
                        )}
                      </td>

                      {/* Actions & Audit */}
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Audit History button (Visible to all, especially Auditor) */}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setAuditTarget(u)}
                            className="rounded-xl h-8 px-2 text-xs font-semibold gap-1 text-slate-700 hover:bg-slate-50 border-slate-200"
                            title="Consulter l'historique d'audit complet de ce compte"
                          >
                            <History className="h-3.5 w-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Audit</span>
                          </Button>

                          {/* Invitation Button if pending activation */}
                          {u.status === "pending_activation" && (canManage || isNationalAdmin) && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setInvitationTarget(u)}
                              className="rounded-xl h-8 px-2 text-xs font-semibold gap-1 text-amber-800 hover:bg-amber-50 border-amber-300"
                              title="Voir ou régénérer le lien d'invitation"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Lien</span>
                            </Button>
                          )}

                          {/* Management buttons (Gated by ABAC, false for auditor) */}
                          {canManage && (
                            <>
                              {/* Handover / Transfer Operations button */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setTransferTarget(u)
                                  setTransferToId("")
                                  setTransferJustification("")
                                  setTransferSuccess("")
                                  setTransferError("")
                                }}
                                className="rounded-xl h-8 px-2 text-xs font-semibold gap-1 text-slate-700 hover:bg-slate-50 border-slate-200"
                                title="Transférer les opérations en cours vers un successeur"
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Passation</span>
                              </Button>

                              {/* Suspend / Reactivate button */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRevokeTarget(u)
                                  setRevokeStatus(u.status === "active" ? "suspended" : "active")
                                  setRevokeJustification("")
                                  setRevokeError("")
                                }}
                                className={`rounded-xl h-8 px-2 text-xs font-semibold gap-1 ${
                                  u.status === "active"
                                    ? "text-rose-700 hover:bg-rose-50 border-rose-200"
                                    : "text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                }`}
                              >
                                {u.status === "active" ? (
                                  <>
                                    <UserX className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Suspendre</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Réactiver</span>
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CRÉATION D'UN COMPTE ADMINISTRATIF HIÉRARCHISÉ */}
      {isAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-white p-6 shadow-card sm:p-7 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {isNationalAdmin
                      ? "Nomination d'un Responsable de Wilaya ou Auditeur"
                      : "Affectation d'un Coordinateur Local"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Création sécurisée avec traçabilité de l'autorité délégataire
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Prénom <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Karim"
                    className="rounded-2xl mt-1 h-11 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Nom <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Bensaïd"
                    className="rounded-2xl mt-1 h-11 text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Email officiel <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@djs.gov.dz"
                    required
                    className="rounded-2xl mt-1 h-11 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Téléphone officiel <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0550 00 00 00"
                    required
                    className="rounded-2xl mt-1 h-11 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Role selection strictly determined by actor's hierarchy level */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Rôle hiérarchique conféré <span className="text-rose-600">*</span>
                </label>
                {isNationalAdmin ? (
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as InstitutionalRole)}
                    className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
                  >
                    <option value="wilaya_admin">
                      Niveau 2 — Administrateur de Wilaya (Responsable territorial)
                    </option>
                    <option value="national_auditor">
                      Rôle Transversal — Auditeur National (Contrôle indépendant)
                    </option>
                  </select>
                ) : (
                  <div className="mt-1 p-3 rounded-2xl bg-muted/40 border border-border/80 text-xs">
                    <p className="font-bold text-foreground">Niveau 3 — Coordinateur Local</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      En tant qu'administrateur de wilaya, vous pouvez uniquement créer des coordinateurs locaux dans votre wilaya.
                    </p>
                  </div>
                )}
              </div>

              {/* Territory scoping */}
              {role === "wilaya_admin" && (
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Wilaya d'affectation (1 à 69) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={wilayaCode}
                    onChange={(e) => setWilayaCode(Number(e.target.value))}
                    className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
                  >
                    {wilayas.map((w) => (
                      <option key={w.code} value={w.code}>
                        Wilaya {padWilayaCode(w.code)} — {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {role === "local_coordinator" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Wilaya de juridiction
                    </label>
                    <Input
                      value={`${padWilayaCode(isWilayaAdmin ? (currentUser.wilayaCode || 6) : wilayaCode)} — ${currentWilayaInfo?.name || "Wilaya"}`}
                      disabled
                      className="rounded-2xl mt-1 h-11 text-xs bg-muted/60 opacity-80"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Commune / Daïra <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      placeholder="Ex: Akbou, Tazmalt..."
                      required
                      className="rounded-2xl mt-1 h-11 text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Structure représentée <span className="text-rose-600">*</span>
                </label>
                <Input
                  value={structure}
                  onChange={(e) => setStructure(e.target.value)}
                  required
                  placeholder="Direction de la Jeunesse et des Sports (DJS)"
                  className="rounded-2xl mt-1 h-11 text-xs"
                />
              </div>

              {/* Invitation Token Option */}
              <div className="p-3.5 rounded-2xl border border-border/70 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={useInvitationFlow}
                    onChange={(e) => setUseInvitationFlow(e.target.checked)}
                    className="rounded border-input text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Générer un lien d'activation sécurisé (validité 72h)</span>
                </label>
                <p className="text-[11px] text-muted-foreground ps-6">
                  Le compte sera créé au statut "En attente d'activation". Le titulaire définira son mot de passe lors de sa première connexion via le lien chiffré.
                </p>
              </div>

              {addError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                  {addError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 rounded-2xl h-11 text-xs font-semibold"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-2xl h-11 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Confirmer et enregistrer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUCCESS INVITATION CREATED */}
      {createdInvitation && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-white p-6 shadow-card sm:p-7 space-y-4">
            <button
              type="button"
              onClick={() => setCreatedInvitation(null)}
              className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  Compte créé avec succès !
                </h3>
                <p className="text-xs text-muted-foreground">
                  Lien d'activation sécurisé généré pour {createdInvitation.userName}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 text-xs space-y-2">
              <p className="font-semibold text-emerald-950">
                Transmettez ce lien sécurisé au responsable habilité. Ce lien expire dans 72 heures.
              </p>
              <div className="p-2.5 rounded-xl bg-white border border-emerald-300 font-mono text-[11px] break-all select-all text-slate-800">
                {createdInvitation.link}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono bg-muted/40 p-2.5 rounded-xl">
              <span>Jeton : {createdInvitation.token}</span>
              <span className="text-emerald-700 font-bold">Validité : 72h</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={() => copyToClipboard(createdInvitation.link)}
                className="flex-1 rounded-2xl h-11 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-2"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Lien copié dans le presse-papier !</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copier le lien d'activation</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INVITATION / JETON ACTIF */}
      {invitationTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-white p-6 shadow-card sm:p-7 space-y-4">
            <button
              type="button"
              onClick={() => setInvitationTarget(null)}
              className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  Lien d'Invitation & Activation
                </h3>
                <p className="text-xs text-muted-foreground">
                  {invitationTarget.firstName} {invitationTarget.lastName} ({invitationTarget.email})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2 text-xs">
              <p className="font-semibold text-amber-950">
                Lien d'activation actif pour initialiser le mot de passe :
              </p>
              <div className="p-2.5 rounded-xl bg-white border border-amber-300 font-mono text-[11px] break-all select-all text-slate-800">
                {`${window.location.origin}/admin?invitation=${invitationTarget.invitationToken || "INV-NEW"}&email=${encodeURIComponent(invitationTarget.email)}`}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>
                  Expiration : {invitationTarget.invitationExpiresAt ? new Date(invitationTarget.invitationExpiresAt).toLocaleString() : "72h"}
                </span>
                <span className="font-mono font-bold text-amber-800">
                  {invitationTarget.invitationToken || "Génération requise"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleGenerateNewInvite(invitationTarget.id)}
                className="flex-1 rounded-2xl h-11 text-xs font-semibold gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Régénérer (72h)</span>
              </Button>
              <Button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `${window.location.origin}/admin?invitation=${invitationTarget.invitationToken || ""}&email=${encodeURIComponent(invitationTarget.email)}`
                  )
                }
                className="flex-1 rounded-2xl h-11 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-2"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copier le lien</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: AUDIT HISTORY TIMELINE MODAL */}
      {auditTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-2xl rounded-3xl border border-border/80 bg-white p-6 shadow-card sm:p-7 max-h-[90vh] overflow-y-auto space-y-4">
            <button
              type="button"
              onClick={() => setAuditTarget(null)}
              className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                <History className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  Journal d'Audit & Traçabilité du Compte
                </h3>
                <p className="text-xs text-muted-foreground">
                  {auditTarget.firstName} {auditTarget.lastName} • {ROLE_BADGES[auditTarget.role]?.label}
                </p>
              </div>
            </div>

            {/* Account Metadata Card */}
            <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/30 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground text-[11px] block">Identifiant interne</span>
                <span className="font-mono font-bold text-foreground">{auditTarget.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px] block">Créé par</span>
                <span className="font-semibold text-foreground">
                  {auditTarget.createdByName || "Amorce Système"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px] block">Date de création</span>
                <span className="font-semibold text-foreground">
                  {new Date(auditTarget.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Événements cryptographiés ({userAuditEntries.length})
              </h4>

              {userAuditEntries.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
                  Aucun événement d'audit spécifique n'a encore été consigné pour ce compte.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userAuditEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-2xl border border-border/80 bg-white hover:bg-slate-50/60 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
                          {entry.resourceReference || entry.action}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                        <span>Auteur : <strong>{entry.actorName}</strong> ({entry.actorRole})</span>
                        {entry.justification && (
                          <span className="text-slate-700 italic">
                            — « {entry.justification} »
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-between pt-1 border-t border-border/40">
                        <span>Hash : {entry.entryHash.slice(0, 16)}...</span>
                        <span>Séquence #{entry.sequenceNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SUSPENSION / RÉVOCATION AVEC JUSTIFICATION OBLIGATOIRE */}
      {revokeTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-border/80 bg-white p-6 shadow-card sm:p-7 space-y-4">
            <button
              type="button"
              onClick={() => setRevokeTarget(null)}
              className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <form onSubmit={handleRevokeSubmit} className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-800">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    Modification du Statut Administratif
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {revokeTarget.firstName} {revokeTarget.lastName} ({ROLE_BADGES[revokeTarget.role]?.label})
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Nouveau statut
                </label>
                <select
                  value={revokeStatus}
                  onChange={(e) => setRevokeStatus(e.target.value as InstitutionalUserStatus)}
                  className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
                >
                  <option value="active">Actif (Réactiver les accès)</option>
                  <option value="suspended">Suspendu (Accès coupé temporairement)</option>
                  <option value="deactivated">Désactivé / Révoqué définitivement</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Motif et arrêté administratif obligatoire <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={revokeJustification}
                  onChange={(e) => setRevokeJustification(e.target.value)}
                  placeholder="Ex: Arrêté de cessation de fonction n°..., départ en mutation..."
                  rows={3}
                  required
                  className="w-full mt-1 rounded-2xl border border-input bg-background p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {revokeError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                  {revokeError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRevokeTarget(null)}
                  className="flex-1 rounded-2xl h-11 text-xs font-semibold"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-2xl h-11 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                >
                  Enregistrer la décision
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: PASSATION ET TRANSFERT DES OPÉRATIONS */}
      {transferTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-border/80 bg-white p-6 shadow-card sm:p-7 space-y-4">
            <button
              type="button"
              onClick={() => setTransferTarget(null)}
              className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800">
                  <ArrowRightLeft className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    Passation de Charge & Transfert
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Transfert des missions de {transferTarget.firstName} {transferTarget.lastName}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Responsable successeur habilité <span className="text-rose-600">*</span>
                </label>
                <select
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  required
                  className="w-full mt-1 h-11 rounded-2xl border border-input bg-background px-3 text-xs font-medium"
                >
                  <option value="">Sélectionner un successeur...</option>
                  {eligibleTransferees.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} — {u.structure} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Motif / Procès-verbal de passation obligatoire <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={transferJustification}
                  onChange={(e) => setTransferJustification(e.target.value)}
                  placeholder="PV de passation de consigne suite à mobilité ou fin de mission..."
                  rows={3}
                  required
                  className="w-full mt-1 rounded-2xl border border-input bg-background p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {transferError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                  {transferError}
                </div>
              )}

              {transferSuccess && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{transferSuccess}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTransferTarget(null)}
                  className="flex-1 rounded-2xl h-11 text-xs font-semibold"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-2xl h-11 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold"
                >
                  Valider le transfert
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
