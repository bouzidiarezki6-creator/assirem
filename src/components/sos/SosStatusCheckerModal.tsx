import { useState } from "react"
import {
  CheckCircle2,
  Clock,
  Search,
  ShieldAlert,
  X,
  XCircle,
  FileText,
  Truck,
  CalendarCheck,
  CheckCheck,
  Send,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import { WILAYAS_LIST, padWilayaCode, type WilayaMeta } from "@/lib/wilayas"
import type { SosTrackingStatus, SosUnifiedTrackableItem } from "@/lib/sosTypes"

type Props = {
  isOpen: boolean
  onClose: () => void
}

const NINE_STAGES: {
  id: SosTrackingStatus
  num: number
  labelFr: string
  labelAr: string
  descFr: string
  descAr: string
  icon: typeof Clock
  color: string
}[] = [
  {
    id: "received",
    num: 1,
    labelFr: "1. Reçu",
    labelAr: "1. تم الاستلام",
    descFr: "Le dossier a été enregistré sur la plateforme avec une référence unique.",
    descAr: "تم تسجيل الملف في المنصة برقم مرجعي فريد.",
    icon: FileText,
    color: "text-sky-300 bg-sky-500/20 border-sky-500/30",
  },
  {
    id: "under_review",
    num: 2,
    labelFr: "2. En cours de vérification",
    labelAr: "2. قيد التدقيق والمعاينة",
    descFr: "Les services de la DJS ou le coordinateur local vérifient les éléments fournis.",
    descAr: "تقوم مصالح مديرية الشباب والرياضة أو المنسق المحلي بمعاينة المعطيات.",
    icon: Eye,
    color: "text-amber-300 bg-amber-500/20 border-amber-500/30",
  },
  {
    id: "verified",
    num: 3,
    labelFr: "3. Vérifié",
    labelAr: "3. تم التحقق والاعتماد",
    descFr: "Le besoin ou le signalement a été certifié conforme et priorisé.",
    descAr: "تم اعتماد الاحتياج أو الإخطار وتحديد مستوى الأولوية.",
    icon: CheckCircle2,
    color: "text-emerald-300 bg-emerald-500/20 border-emerald-500/30",
  },
  {
    id: "forwarded",
    num: 4,
    labelFr: "4. Transmis aux équipes locales",
    labelAr: "4. محال إلى الفرق المحلية",
    descFr: "Le dossier a été affecté au pôle communal d'intervention concerné.",
    descAr: "تم توجيه الملف إلى الخلية البلدية وفرق التدخل المعنية.",
    icon: Send,
    color: "text-indigo-300 bg-indigo-500/20 border-indigo-500/30",
  },
  {
    id: "scheduled",
    num: 5,
    labelFr: "5. Intervention programmée",
    labelAr: "5. مبرمج للتدخل الميداني",
    descFr: "Une mission terrain a été planifiée avec mobilisation des moyens logistiques.",
    descAr: "تمت جدولة مهمة ميدانية وتعبئة الوسائل اللوجستية المطلوبة.",
    icon: CalendarCheck,
    color: "text-violet-300 bg-violet-500/20 border-violet-500/30",
  },
  {
    id: "in_progress",
    num: 6,
    labelFr: "6. En cours d'intervention",
    labelAr: "6. التدخل جارٍ ميدانياً",
    descFr: "Les équipes sont déployées sur le site pour acheminer l'aide ou exécuter les travaux.",
    descAr: "الفرق متواجدة في الميدان لتوزيع المساعدات أو مباشرة الإجراءات اللازمة.",
    icon: Truck,
    color: "text-amber-300 bg-amber-500/20 border-amber-500/30",
  },
  {
    id: "resolved",
    num: 7,
    labelFr: "7. Résolu sur le terrain",
    labelAr: "7. تم الحل في الميدان",
    descFr: "L'intervention s'est achevée avec succès. Attestation de mission en cours.",
    descAr: "اكتمل التدخل الميداني بنجاح مع استيفاء كافة الأهداف المسطرة.",
    icon: CheckCheck,
    color: "text-emerald-300 bg-emerald-500/20 border-emerald-500/30",
  },
  {
    id: "closed",
    num: 8,
    labelFr: "8. Clôturé administrativement",
    labelAr: "8. مغلق إدارياً ومؤرشف",
    descFr: "Dossier archivé et scellé dans le registre de gouvernance institutionnel.",
    descAr: "تم حفظ الملف وتوثيقه رسمياً في سجل الحوكمة المؤسساتي.",
    icon: CheckCircle2,
    color: "text-slate-300 bg-slate-500/20 border-slate-500/30",
  },
  {
    id: "rejected",
    num: 9,
    labelFr: "9. Rejeté avec motif",
    labelAr: "9. مرفوض مع بيان السبب",
    descFr: "Le dossier n'a pu être validé selon les critères réglementaires énoncés ci-dessous.",
    descAr: "تعذر قبول الطلب استناداً إلى المعايير والتعليلات الموضحة أدناه.",
    icon: XCircle,
    color: "text-rose-300 bg-rose-500/20 border-rose-500/30",
  },
]

export default function SosStatusCheckerModal({ isOpen, onClose }: Props) {
  const { formatDateTime, locale, dir } = useI18n()
  const isAr = locale === "ar"
  const { data } = useAppData()

  const [refInput, setRefInput] = useState("")
  const [foundItem, setFoundItem] = useState<SosUnifiedTrackableItem | null>(null)
  const [searched, setSearched] = useState(false)

  if (!isOpen) return null

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
    const needle = refInput.trim().toUpperCase()
    if (!needle) return

    // 1. Check in SOS Applications
    const app = (data.sosApplications || []).find(
      (a) => a.reference.toUpperCase() === needle || a.id.toUpperCase() === needle
    )
    if (app) {
      let st: SosTrackingStatus = "received"
      if (app.status === "rejected" || app.status === "cancelled") st = "rejected"
      else if (app.status === "accepted" && app.checkOutAt) st = "resolved"
      else if (app.status === "accepted" && app.checkInAt) st = "in_progress"
      else if (app.status === "accepted") st = "scheduled"
      else if (app.status === "waitlist") st = "verified"
      else st = "under_review"

      const stageObj = NINE_STAGES.find((s) => s.id === st) || NINE_STAGES[0]
      setFoundItem({
        reference: app.reference,
        kind: "application",
        title: `Candidature ${app.applicationType === "professional" ? "Professionnelle" : "Bénévole"}`,
        wilayaCode: app.wilayaCode,
        commune: app.commune,
        status: st,
        statusLabelFr: stageObj.labelFr,
        statusLabelAr: stageObj.labelAr,
        submittedAt: app.createdAt,
        updatedAt: app.updatedAt,
        adminNote: app.adminNote,
        contactName: app.fullName,
      })
      return
    }

    // 2. Check in Material Needs
    const need = (data.sosMaterialNeeds || []).find(
      (n) => n.reference.toUpperCase() === needle || n.id.toUpperCase() === needle
    )
    if (need) {
      let st: SosTrackingStatus = "received"
      if (need.status === "rejected") st = "rejected"
      else if (need.status === "closed") st = "closed"
      else if (need.status === "fulfilled") st = "resolved"
      else if (need.status === "validated" && need.receivedQuantity > 0) st = "in_progress"
      else if (need.status === "validated") st = "verified"
      else st = "under_review"

      const stageObj = NINE_STAGES.find((s) => s.id === st) || NINE_STAGES[0]
      setFoundItem({
        reference: need.reference,
        kind: "material_need",
        title: need.title,
        wilayaCode: need.wilayaCode,
        commune: need.commune,
        status: st,
        statusLabelFr: stageObj.labelFr,
        statusLabelAr: stageObj.labelAr,
        submittedAt: need.createdAt,
        updatedAt: need.updatedAt,
        adminNote: need.adminNote,
      })
      return
    }

    // 3. Check in Damaged Sites / Incident Reports
    const site = (data.sosDamagedSites || []).find(
      (s) => s.reference.toUpperCase() === needle || s.id.toUpperCase() === needle
    )
    if (site) {
      let st: SosTrackingStatus = "received"
      if (site.status === "rejected") st = "rejected"
      else if (site.status === "closed") st = "closed"
      else if (site.status === "validated") st = "verified"
      else st = "under_review"

      const stageObj = NINE_STAGES.find((s) => s.id === st) || NINE_STAGES[0]
      setFoundItem({
        reference: site.reference,
        kind: "incident_report",
        title: site.name,
        wilayaCode: site.wilayaCode,
        commune: "Wilaya " + site.wilayaCode,
        status: st,
        statusLabelFr: stageObj.labelFr,
        statusLabelAr: stageObj.labelAr,
        submittedAt: site.createdAt,
        updatedAt: site.updatedAt,
        adminNote: site.adminNote,
      })
      return
    }

    // 4. Check in Interventions
    const inter = (data.sosInterventions || []).find(
      (i) => i.reference.toUpperCase() === needle || i.id.toUpperCase() === needle
    )
    if (inter) {
      let st: SosTrackingStatus = "scheduled"
      if (inter.status === "completed") st = "resolved"
      else if (inter.status === "cancelled") st = "rejected"
      else if (inter.status === "in_progress") st = "in_progress"
      else st = "forwarded"

      const stageObj = NINE_STAGES.find((s) => s.id === st) || NINE_STAGES[0]
      setFoundItem({
        reference: inter.reference,
        kind: "intervention",
        title: inter.title,
        wilayaCode: inter.wilayaCode,
        commune: inter.commune,
        status: st,
        statusLabelFr: stageObj.labelFr,
        statusLabelAr: stageObj.labelAr,
        submittedAt: inter.createdAt,
        updatedAt: inter.updatedAt,
        contactName: inter.coordinatorName,
      })
      return
    }

    setFoundItem(null)
  }

  const currentStage = foundItem
    ? NINE_STAGES.find((s) => s.id === foundItem.status) || NINE_STAGES[0]
    : null

  const wilayaInfo = foundItem
    ? WILAYAS_LIST.find((w: WilayaMeta) => w.code === foundItem.wilayaCode)
    : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
      dir={dir}
    >
      <div className="relative w-full max-w-xl rounded-3xl border border-border/80 bg-card p-6 shadow-card sm:p-7 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 end-5 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-1 mb-4">
          <h3 className="text-xl font-extrabold text-foreground">
            {isAr
              ? "المتابعة العامة لملفات الاستغاثة والطلبات"
              : "Suivi Public des Demandes & Signalements SOS"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "أدخل الرمز المرجعي (طلب مادي، تطوع، أو بلاغ ميداني) لتتبع مرحلة المعالجة الحالية عبر المراحل التسع المعتمدة."
              : "Saisissez la référence officielle (besoin matériel, candidature ou signalement citoyen) pour afficher l'état d'avancement parmi les 9 étapes officielles."}
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <Input
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            placeholder="Ex: YFY-NEED-... / APP-... / SIG-..."
            required
            dir="ltr"
            className="rounded-2xl h-12 font-mono uppercase text-xs sm:text-sm"
          />
          <Button type="submit" className="rounded-2xl h-12 px-6 gap-2 shrink-0 font-bold bg-primary hover:bg-primary/90">
            <Search className="h-4 w-4" />
            <span>{isAr ? "بحث وتتبع" : "Rechercher"}</span>
          </Button>
        </form>

        {searched && (
          <div>
            {foundItem && currentStage ? (
              <div className="space-y-5 rounded-3xl border border-border/80 bg-muted/15 p-5">
                {/* Header of Found Item */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div>
                    <span className="font-mono text-sm font-extrabold text-primary">
                      {foundItem.reference}
                    </span>
                    <h4 className="font-bold text-foreground text-base mt-0.5">
                      {foundItem.title}
                    </h4>
                  </div>
                  <div className="text-xs text-muted-foreground sm:text-end">
                    <p>{formatDateTime(foundItem.submittedAt)}</p>
                    {wilayaInfo && (
                      <p className="font-medium text-foreground">
                        {padWilayaCode(wilayaInfo.code)} — {isAr ? wilayaInfo.name_ar : wilayaInfo.name} ({foundItem.commune})
                      </p>
                    )}
                  </div>
                </div>

                {/* Current Stage Card */}
                <div
                  className={`rounded-2xl border p-4 flex items-start gap-3.5 ${currentStage.color}`}
                >
                  <currentStage.icon className="w-6 h-6 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-sm">
                      {isAr ? currentStage.labelAr : currentStage.labelFr}
                    </p>
                    <p className="text-xs leading-relaxed opacity-90">
                      {isAr ? currentStage.descAr : currentStage.descFr}
                    </p>
                  </div>
                </div>

                {/* Administrative or Coordinator Note */}
                {foundItem.adminNote && (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1 text-xs">
                    <span className="font-bold text-foreground">
                      {isAr ? "ملاحظة التنسيق الإداري والميداني :" : "Note de la coordination :"}
                    </span>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {foundItem.adminNote}
                    </p>
                  </div>
                )}

                {/* Interactive 9-stage Stepper Visualizer */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-foreground">
                    {isAr ? "مراحل مسار المعالجة المعتمد (9 مراحل) :" : "Parcours d'instruction officiel (9 étapes) :"}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 pt-1">
                    {NINE_STAGES.map((st) => {
                      const isCurrent = st.id === foundItem.status
                      const isPassed =
                        foundItem.status !== "rejected" &&
                        st.id !== "rejected" &&
                        st.num <= currentStage.num

                      return (
                        <div
                          key={st.id}
                          title={isAr ? st.labelAr : st.labelFr}
                          className={`rounded-xl p-2 text-center flex flex-col items-center justify-center transition-all ${
                            isCurrent
                              ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 font-bold"
                              : isPassed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-muted text-muted-foreground opacity-60"
                          }`}
                        >
                          <span className="text-xs font-bold">{st.num}</span>
                          <span className="text-[9px] line-clamp-1 mt-0.5">
                            {isAr ? st.labelAr.split(".")[1] : st.labelFr.split(".")[1]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground text-center pt-2">
                  {isAr
                    ? "المنظومة موثقة بسجل الحوكمة لوزارة الشباب والرياضة."
                    : "Traçabilité garantie sous supervision du Ministère de la Jeunesse et des Sports."}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-border/70 p-8 text-center space-y-3 bg-muted/10">
                <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto" />
                <h4 className="font-bold text-foreground text-base">
                  {isAr ? "لم يتم العثور على أي ملف" : "Aucun dossier trouvé"}
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {isAr
                    ? "تأكد من كتابة الرقم المرجعي كما هو موضح في وصل التسجيل (مثال: YFY-NEED-202611-001 أو APP-20261101-...)."
                    : "Vérifiez la saisie de votre référence exacte reçue lors de votre soumission (ex: YFY-NEED-202611-001 ou APP-20261101-...)."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
