import { useEffect, useState } from "react"
import QRCode from "qrcode"
import {
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  Printer,
  ShieldCheck,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DigitalAttestation } from "@/lib/governanceTypes"
import { padWilayaCode, getWilaya } from "@/lib/wilayas"

type Props = {
  attestation: DigitalAttestation | null
  onClose: () => void
}

const ACTION_LABELS: Record<DigitalAttestation["actionType"], { fr: string; color: string }> = {
  submission: { fr: "Dépôt et Soumission", color: "bg-blue-100 text-blue-900 border-blue-200" },
  verification: { fr: "Vérification Technique", color: "bg-indigo-100 text-indigo-900 border-indigo-200" },
  approval: { fr: "Approbation Hiérarchique", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  publication: { fr: "Publication Officielle", color: "bg-teal-100 text-teal-900 border-teal-200" },
  completion: { fr: "Validation d'Exécution", color: "bg-cyan-100 text-cyan-900 border-cyan-200" },
  closure: { fr: "Clôture Institutionnelle Définitive", color: "bg-purple-100 text-purple-900 border-purple-200" },
  suspension: { fr: "Arrêté de Suspension", color: "bg-amber-100 text-amber-900 border-amber-200" },
  rejection: { fr: "Décision de Rejet", color: "bg-rose-100 text-rose-900 border-rose-200" },
  emergency_override: { fr: "Publication Accélérée d'Urgence", color: "bg-orange-100 text-orange-900 border-orange-200" },
}

export default function AttestationModal({ attestation, onClose }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!attestation?.qrPayload) return
    let active = true
    QRCode.toDataURL(attestation.qrPayload, {
      width: 192,
      margin: 1,
      color: { dark: "#065f46", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (active) setQrUrl(url)
      })
      .catch((err) => {
        console.error("Failed to generate QR code", err)
      })
    return () => {
      active = false
    }
  }, [attestation?.qrPayload])

  if (!attestation) return null

  const wilayaInfo = getWilaya(attestation.wilayaCode)
  const actionMeta = ACTION_LABELS[attestation.actionType] || { fr: attestation.actionType, color: "bg-slate-100" }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white"
    >
      <div className="relative w-full max-w-2xl rounded-3xl border border-border/80 bg-white p-6 shadow-2xl sm:p-8 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-6">
        {/* Close Button (Hidden in Print) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors print:hidden"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-6">
          {/* Institutional Official Header */}
          <div className="border-b-2 border-emerald-800/80 pb-4 text-center">
            <p className="text-[11px] font-bold tracking-widest text-emerald-950 uppercase">
              République Algérienne Démocratique et Populaire
            </p>
            <p className="text-xs font-semibold text-emerald-800 font-arabic mt-0.5">
              الجمهورية الجزائرية الديمقراطية الشعبية
            </p>
            <p className="text-[11px] font-medium text-muted-foreground mt-1">
              Ministère de la Jeunesse et des Sports — Plateforme « Yed fel yed » (يد في يد)
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-200">
              <FileCheck2 className="h-4 w-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-900 tracking-wide uppercase">
                Attestation Numérique de Décision Institutionnelle
              </span>
            </div>
          </div>

          {/* Certificate Identification Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/30 p-4 rounded-2xl border border-border/60 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Numéro d'Attestation</span>
              <span className="font-mono font-bold text-emerald-800 text-sm tracking-tight">{attestation.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Date & Horodatage Certifié</span>
              <span className="font-semibold text-foreground">
                {new Date(attestation.timestamp).toLocaleString("fr-DZ", {
                  dateStyle: "long",
                  timeStyle: "medium",
                })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Opération Référée</span>
              <span className="font-semibold text-foreground">{attestation.operationReference}</span>
              <span className="font-mono text-[10px] text-muted-foreground block">ID: {attestation.operationId}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Territoire & Compétence</span>
              <span className="font-semibold text-foreground">
                {wilayaInfo ? `${padWilayaCode(wilayaInfo.code)} — ${wilayaInfo.nameFr}` : `Wilaya ${attestation.wilayaCode}`}
                {attestation.commune ? ` (${attestation.commune})` : " (Toute la Wilaya)"}
              </span>
            </div>
          </div>

          {/* Action Badge & Signer Details */}
          <div className="rounded-2xl border border-border/80 p-4 space-y-3 bg-white shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">Nature de l'Acte :</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${actionMeta.color}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {actionMeta.fr}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60 text-xs">
              <div>
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">Signataire Agréé</span>
                <p className="font-bold text-foreground text-sm">{attestation.actorName}</p>
                <p className="text-muted-foreground text-[11px] font-mono">Agent Ref: {attestation.actorId}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">Qualité & Structure</span>
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{attestation.actorRole.replace("_", " ").toUpperCase()}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{attestation.structure}</p>
              </div>
            </div>
          </div>

          {/* Justification Mandataire */}
          <div className="space-y-1.5 text-xs">
            <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wide">
              Motivation Institutionnelle & Justification Réglementaire :
            </span>
            <p className="text-foreground italic leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              « {attestation.justification} »
            </p>
          </div>

          {/* Cryptographic Proof & QR Code */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/20 p-4">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <Fingerprint className="h-4 w-4 text-emerald-700" />
                <span>Empreinte Cryptographique SHA-256 de l'opération :</span>
              </div>
              <p className="font-mono text-[10px] sm:text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-emerald-200 select-all break-all shadow-2xs font-bold">
                {attestation.documentHash}
              </p>
              {attestation.previousAttestationHash && (
                <p className="text-[10px] text-muted-foreground truncate">
                  Chaînage antérieur : {attestation.previousAttestationHash.slice(0, 24)}...
                </p>
              )}
            </div>

            {/* Verification QR */}
            <div className="flex flex-col items-center shrink-0">
              <div className="rounded-xl border border-border bg-white p-2 shadow-xs">
                {qrUrl ? (
                  <img src={qrUrl} alt="QR Code de vérification" className="h-24 w-24 object-contain" />
                ) : (
                  <div className="h-24 w-24 bg-slate-100 flex items-center justify-center text-[10px] text-muted-foreground">
                    Chargement...
                  </div>
                )}
              </div>
              <span className="text-[9px] text-muted-foreground mt-1 font-semibold">
                Scanner pour vérifier
              </span>
            </div>
          </div>

          {/* Institutional Disclaimer */}
          <div className="text-[10px] text-muted-foreground leading-relaxed border-t border-border/80 pt-3 text-center">
            <p className="font-semibold text-slate-700">
              Mentions réglementaires & Authenticité
            </p>
            <p>
              La présente attestation constitue une preuve numérique interne de validation d'opération citoyenne enregistrée sur la plateforme <strong>Yed fel yed (يد في يد)</strong> pour le compte du Ministère de la Jeunesse et des Sports. L'authenticité du document et l'intégrité de la décision sont vérifiables en scannant le code QR ci-contre.
            </p>
          </div>
        </div>

        {/* Action Buttons (Hidden in print) */}
        <div className="flex gap-2.5 pt-6 border-t border-border/80 print:hidden mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-2xl h-11 text-xs font-semibold"
          >
            Fermer
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="flex-1 rounded-2xl h-11 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-2 shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer / Exporter PDF</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
