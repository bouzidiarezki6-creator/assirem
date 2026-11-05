import { useMemo, useState } from "react"
import {
  FileCode,
  Fingerprint,
  History,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useGovernance } from "@/context/GovernanceContext"
import type { AuditRegistryEntry } from "@/lib/governanceTypes"

const ACTION_DESCRIPTIONS: Record<AuditRegistryEntry["action"], string> = {
  operation_create: "Création d'opération",
  operation_update: "Mise à jour d'opération",
  operation_transition: "Transition de statut",
  operation_suspend: "Arrêté de suspension",
  operation_cancel: "Annulation d'opération",
  operation_close: "Clôture institutionnelle",
  attestation_generated: "Émission d'attestation",
  points_adjusted: "Ajustement de points",
  volunteer_account_status: "Statut compte bénévole",
  admin_user_create: "Affectation responsable",
  admin_user_invite: "Émission d'invitation",
  admin_user_activate: "Activation de compte",
  admin_user_update: "Mise à jour responsable",
  admin_user_territory_change: "Mutation territoriale",
  admin_user_suspend: "Arrêté de suspension de compte",
  admin_user_reactivate: "Réactivation de compte",
  admin_user_revoke: "Révocation de responsable",
  role_assigned: "Attribution de rôle",
  password_reset_request: "Réinitialisation de mot de passe",
  report_exported: "Export de rapport",
  emergency_override: "Publication accélérée d'urgence",
}

export default function AuditRegistryPanel() {
  const { auditEntries, verifyAuditIntegrity } = useGovernance()

  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [selectedEntry, setSelectedEntry] = useState<AuditRegistryEntry | null>(null)
  const [integrityResult, setIntegrityResult] = useState<{
    tested: boolean
    valid: boolean
    count: number
    error?: string
  } | null>(null)

  const filtered = useMemo(() => {
    return auditEntries.filter((entry) => {
      const q = search.trim().toLowerCase()
      if (q) {
        const full = `${entry.actorName} ${entry.actorRole} ${entry.action} ${entry.resourceReference || ""} ${entry.resourceId} ${entry.justification || ""}`.toLowerCase()
        if (!full.includes(q)) return false
      }
      if (actionFilter !== "all" && entry.action !== actionFilter) return false
      return true
    })
  }, [auditEntries, search, actionFilter])

  const handleTestIntegrity = () => {
    const res = verifyAuditIntegrity()
    setIntegrityResult({
      tested: true,
      valid: res.valid,
      count: res.totalChecked,
      error: res.error,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <History className="h-7 w-7 text-emerald-700" />
            Registre des activités et des décisions
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Journal centralisé, immuable et infalsifiable de toutes les décisions, validations et modifications institutionnelles.
          </p>
        </div>

        {/* Cryptographic Chain Integrity Button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleTestIntegrity}
            className="rounded-2xl h-10 px-4 text-xs font-bold gap-2 bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs"
          >
            <Fingerprint className="h-4 w-4" />
            <span>Vérifier l'intégrité de la chaîne</span>
          </Button>
        </div>
      </div>

      {/* Live Integrity Banner (if tested) */}
      {integrityResult?.tested && (
        <div
          className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
            integrityResult.valid
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-rose-50 border-rose-300 text-rose-950"
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            {integrityResult.valid ? (
              <ShieldCheck className="h-6 w-6 text-emerald-700 shrink-0" />
            ) : (
              <ShieldAlert className="h-6 w-6 text-rose-700 shrink-0" />
            )}
            <div>
              <p className="font-extrabold">
                {integrityResult.valid
                  ? "Chaîne cryptographique SHA-256 certifiée intacte"
                  : "Alerte de sécurité : rupture d'intégrité détectée"}
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                {integrityResult.valid
                  ? `${integrityResult.count} blocs séquentiels vérifiés. Aucun événement supprimé ou modifié rétroactivement.`
                  : `Erreur : ${integrityResult.error}`}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-white px-2.5 py-1 rounded-full border border-black/10 shrink-0 text-slate-900">
            {integrityResult.count} BLOCS
          </span>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-soft">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute start-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par responsable, action, référence d'opération, motif..."
                className="ps-10 rounded-2xl h-10 text-xs sm:text-sm border-slate-300 bg-white text-slate-900 font-medium"
              />
            </div>

            <div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full h-10 rounded-2xl border border-slate-300 bg-white text-slate-900 px-3 text-xs sm:text-sm font-semibold"
              >
                <option value="all">Toutes les actions sensibles</option>
                <option value="operation_create">Créations d'opération</option>
                <option value="operation_transition">Transitions de statut</option>
                <option value="attestation_generated">Émissions d'attestation</option>
                <option value="emergency_override">Urgences accélérées</option>
                <option value="operation_suspend">Suspensions</option>
                <option value="operation_close">Clôtures</option>
                <option value="admin_user_create">Affectations responsables</option>
                <option value="admin_user_revoke">Révocations</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3 px-3 text-start w-16">Bloc #</th>
                <th className="py-3 px-3 text-start">Horodatage</th>
                <th className="py-3 px-3 text-start">Responsable</th>
                <th className="py-3 px-3 text-start">Action</th>
                <th className="py-3 px-3 text-start">Ressource</th>
                <th className="py-3 px-3 text-start">Motif / Justification</th>
                <th className="py-3 px-3 text-end">Empreinte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    Aucun événement d'audit ne correspond aux filtres.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Block Sequence Number */}
                    <td className="py-3 px-3 font-mono text-xs font-black text-emerald-800">
                      #{String(entry.sequenceNumber).padStart(3, "0")}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-3 text-xs whitespace-nowrap text-slate-600 font-mono font-medium">
                      {new Date(entry.timestamp).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 text-xs">{entry.actorName}</p>
                      <p className="text-[10px] text-slate-600 font-medium capitalize">
                        {entry.actorRole.replace("_", " ")}
                      </p>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-[11px] font-bold text-slate-900">
                        {ACTION_DESCRIPTIONS[entry.action] || entry.action}
                      </span>
                    </td>

                    {/* Resource */}
                    <td className="py-3 px-3 font-mono text-xs">
                      <span className="font-bold text-slate-900">
                        {entry.resourceReference || entry.resourceId}
                      </span>
                      <span className="block text-[10px] text-slate-600 uppercase font-semibold">
                        {entry.resourceType}
                      </span>
                    </td>

                    {/* Justification */}
                    <td className="py-3 px-3 text-xs max-w-xs truncate text-slate-700 font-medium">
                      {entry.justification ? (
                        <span className="italic">« {entry.justification} »</span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Actions & Hash inspector */}
                    <td className="py-3 px-3 text-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedEntry(entry)}
                        className="rounded-xl h-7 px-2 text-[10px] font-mono font-bold gap-1 text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                        title="Inspecter le bloc et les états"
                      >
                        <Fingerprint className="h-3 w-3" />
                        <span>{entry.entryHash.slice(0, 8)}...</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutability Notice */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-muted-foreground flex items-center gap-2.5">
        <Lock className="h-4 w-4 text-emerald-700 shrink-0" />
        <span>
          <strong>Garantie de non-répudiation :</strong> Chaque action enregistrée est scellée par une chaîne d'empreintes cryptographiques SHA-256 reliée au bloc précédent. Aucune entrée ne peut être écrasée ou effacée. Toute régularisation produit un nouveau bloc documenté.
        </span>
      </div>

      {/* Block Inspector Modal */}
      {selectedEntry && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-2xl rounded-3xl border border-border/80 bg-white p-6 shadow-card max-h-[90vh] overflow-y-auto space-y-4">
            <button
              type="button"
              onClick={() => setSelectedEntry(null)}
              className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-border/80 pb-3">
              <Fingerprint className="h-6 w-6 text-emerald-700" />
              <div>
                <h3 className="text-base font-black text-foreground">
                  Bloc d'Audit #{String(selectedEntry.sequenceNumber).padStart(3, "0")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Identifiant UUID : {selectedEntry.id}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-2xl border border-border/70 bg-slate-50 p-3 space-y-1">
                <p className="text-muted-foreground">Responsable :</p>
                <p className="font-bold text-foreground">{selectedEntry.actorName} ({selectedEntry.actorRole})</p>
                <p className="text-muted-foreground">ID Compte : <span className="font-mono">{selectedEntry.actorId}</span></p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-slate-50 p-3 space-y-1">
                <p className="text-muted-foreground">Horodatage serveur :</p>
                <p className="font-bold text-foreground font-mono">{selectedEntry.timestamp}</p>
                <p className="text-muted-foreground">Action : <strong className="text-emerald-800">{selectedEntry.action}</strong></p>
              </div>
            </div>

            {selectedEntry.justification && (
              <div className="rounded-2xl border border-border/70 bg-emerald-50/40 p-3 text-xs space-y-1">
                <p className="font-bold text-emerald-950">Justification enregistrée :</p>
                <p className="italic text-foreground">« {selectedEntry.justification} »</p>
              </div>
            )}

            {/* State Diffs (Previous vs New) */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-emerald-700" />
                Détail des états (Différences avant / après)
              </p>
              <div className="grid gap-2 sm:grid-cols-2 text-xs font-mono">
                <div className="rounded-2xl border border-border p-3 bg-slate-50 overflow-x-auto">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    État antérieur (Previous State)
                  </p>
                  <pre className="text-[11px] text-slate-700">
                    {JSON.stringify(selectedEntry.previousState || {}, null, 2)}
                  </pre>
                </div>
                <div className="rounded-2xl border border-emerald-200 p-3 bg-emerald-50/30 overflow-x-auto">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase mb-1">
                    Nouvel état (New State)
                  </p>
                  <pre className="text-[11px] text-emerald-950">
                    {JSON.stringify(selectedEntry.newState || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Hash chain pointers */}
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 text-xs space-y-2 font-mono">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold">EMPREINTE DU BLOC ACTUEL (SHA-256) :</p>
                <p className="font-bold text-foreground break-all select-all">{selectedEntry.entryHash}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold">POINTEUR VERS LE BLOC PRÉCÉDENT :</p>
                <p className="text-slate-600 break-all select-all">{selectedEntry.previousEntryHash}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="rounded-2xl px-6"
              >
                Fermer l'inspecteur
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
