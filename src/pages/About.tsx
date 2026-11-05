import { Link } from "react-router-dom"
import {
  ShieldCheck,
  Target,
  Award,
  Users,
  Building2,
  HeartHandshake,
  CheckCircle2,
  FileText,
  MapPin,
  ArrowRight,
  HandHeart,
  Globe2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/context/I18nProvider"

export default function About() {
  const { t, dir, locale } = useI18n()
  const isAr = locale === "ar"

  const values = [
    {
      title: isAr ? "التضامن الفاعل" : "Solidarité Agissante",
      desc: isAr
        ? "تسخير طاقات المجتمع المدني والشباب للاستجابة السريعة والفعالة للاحتياجات الإنسانية والمبادرات الجوارية."
        : "Mobiliser les énergies de la jeunesse et de la société civile pour répondre avec célérité aux besoins humains et territoriaux.",
      icon: HandHeart,
    },
    {
      title: isAr ? "الشفافية والمساءلة" : "Transparence & Traçabilité",
      desc: isAr
        ? "سجل إداري غير قابل للتعديل يوثق كل تدخّل وتبرع ونقطة تطوع بنزاهة تامة خاضعة للرقابة المؤسساتية."
        : "Un registre immuable et vérifiable qui consigne chaque action, don et heure de bénévolat sous contrôle institutionnel rigoureux.",
      icon: ShieldCheck,
    },
    {
      title: isAr ? "القرب الميداني (69 ولاية)" : "Proximité Territoriale (69 Wilayas)",
      desc: isAr
        ? "شبكة موحدة تشمل كافة ولايات الوطن من البلديات المركزية إلى القرى والمناطق النائية."
        : "Un maillage opérationnel unifié couvrant les 69 wilayas, des centres urbains aux zones les plus enclavées.",
      icon: MapPin,
    },
    {
      title: isAr ? "المسؤولية والمواطنة" : "Responsabilité Citoyenne",
      desc: isAr
        ? "ترسيخ ثقافة الواجب والمشاركة الإيجابية في بناء الوطن وحماية البيئة والتراث الوطني."
        : "Ancrer la culture du devoir citoyen, de la préservation de l'environnement et du service désintéressé pour la nation.",
      icon: CheckCircle2,
    },
    {
      title: isAr ? "تمكين الشباب والابتكار" : "Autonomisation de la Jeunesse",
      desc: isAr
        ? "توفير فضاء رقمي يثمن كفاءات الشباب الجزائري ويكافئ مساهماتهم عبر شارات ومسارات معترف بها."
        : "Offrir un tremplin digital valorisant les compétences de la jeunesse algérienne via des attestations et un système de reconnaissance officiel.",
      icon: Award,
    },
  ]

  const domains = [
    {
      title: isAr ? "الشباب والتربية المدنية" : "Jeunesse & Éducation Populaire",
      desc: isAr
        ? "تأطير ورشات تفاعلية، نوادي علمية، ومخيمات تدريبية تصقل مواهب الشباب وتنمي قدراتهم القيادية."
        : "Animation d'ateliers d'apprentissage, clubs scientifiques et séjours éducatifs favorisant l'épanouissement et le leadership.",
      icon: Users,
    },
    {
      title: isAr ? "التدخلات الإنسانية والاستعجالية" : "Urgences & Solidarité Humanitaire",
      desc: isAr
        ? "إدارة منظومة الاستغاثة وتوجيه المساعدات المادية والفرق المتخصصة في الكوارث والظروف الاستثنائية."
        : "Coordination du dispositif SOS, acheminement des denrées, et déploiement ciblé des professionnels et volontaires.",
      icon: HeartHandshake,
    },
    {
      title: isAr ? "برنامج مكافآت العمل التطوعي" : "Programme National de Bénévolat",
      desc: isAr
        ? "نظام رقمي وطني لحساب ساعات التطوع، وترقية المستويات وتوفير شارات رقمية رسمية."
        : "Système officiel de capitalisation des heures de bénévolat avec passage de grades (N0 à N5) et attestations certifiées.",
      icon: Award,
    },
    {
      title: isAr ? "شبكة الهياكل والمؤسسات الشبانية" : "Infrastructures de Jeunesse & Sports",
      desc: isAr
        ? "ربط وتنشيط دور وبيوت الشباب، المركبات الرياضية الجوارية والمخيمات الصيفية عبر الوطن."
        : "Mise en réseau des maisons de jeunes, auberges, complexes sportifs de proximité et camps de vacances à l'échelle nationale.",
      icon: Building2,
    },
    {
      title: isAr ? "البيئة والعمل الميداني الأخضر" : "Environnement & Éco-citoyenneté",
      desc: isAr
        ? "حملات تشجير كبرى، تنظيف الفضاءات الطبيعية، وحماية الشواطئ والمحميات الوطنية بالتعاون مع المجتمع المدني."
        : "Campagnes massives de reboisement, assainissement des sites naturels et sensibilisation active au développement durable.",
      icon: Sparkles,
    },
    {
      title: isAr ? "الحوكمة والتحول الرقمي" : "Gouvernance & Numérisation MJS",
      desc: isAr
        ? "أدوات رقابة، لوحات قيادة إحصائية، وتوزيع الصلاحيات الإقليمية لضمان سيادة القرار وحسن التسيير."
        : "Outils de pilotage sectoriel, tableaux de bord de wilaya et délégation sécurisée des pouvoirs pour l'administration publique.",
      icon: ShieldCheck,
    },
  ]

  const steps = [
    {
      num: "01",
      title: isAr ? "رصد الاحتياج أو الإعلان عن النشاط" : "Signalement ou Programmation",
      desc: isAr
        ? "يقوم المواطنون أو المؤسسات أو الجمعيات بالتعبير عن حاجة ميدانية أو نشر نشاط شبابي مرخص."
        : "Citoyens, institutions ou associations expriment un besoin humanitaire ou planifient une activité agréée.",
    },
    {
      num: "02",
      title: isAr ? "التحقق والاعتماد المؤسساتي" : "Instruction & Validation DJS",
      desc: isAr
        ? "تقوم مصالح مديرية الشباب والرياضة أو المنسقين المحليين بمراجعة الطلب والموافقة عليه بعد المعاينة."
        : "Les services de wilaya (DJS) ou coordinateurs locaux instruisent la demande et la certifient sur le terrain.",
    },
    {
      num: "03",
      title: isAr ? "التعبئة الميدانية والتنسيق" : "Mobilisation & Exécution",
      desc: isAr
        ? "توجيه المتطوعين، توزيع المهام الميدانية، والتحقق من الحضور عبر مسح رمز الاستجابة السريعة (QR Code)."
        : "Déploiement des équipes, distribution des tâches et pointage en direct par QR Code d'engagement.",
    },
    {
      num: "04",
      title: isAr ? "التسجيل الإداري والتوثيق" : "Clôture & Traçabilité Scellée",
      desc: isAr
        ? "إصدار تقرير ختامي، توثيق السجل الرقمي غير القابل للتزوير وتحديث رصيد المتطوعين تلقائياً."
        : "Rapport de fin d'intervention, scellement cryptographique dans le registre d'audit et octroi des points.",
    },
  ]

  return (
    <div className="min-h-screen bg-surface" dir={dir}>
      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-surface to-surface border-b border-border/60 py-16 md:py-24">
        <div className="content-width relative z-10 text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs md:text-sm font-bold text-primary">
            <Globe2 className="w-4 h-4" />
            <span>
              {isAr
                ? "الجمهورية الجزائرية الديمقراطية الشعبية — وزارة الشباب والرياضة"
                : "République Algérienne Démocratique et Populaire — Ministère de la Jeunesse et des Sports"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.15] text-balance">
            {isAr ? (
              <>
                منصة <span className="text-primary">يد في يد</span> الوطنية
                <br />
                رؤية جديدة للعمل التضامني والشبابي
              </>
            ) : (
              <>
                Plateforme Nationale <span className="text-primary">Yed fel yed</span>
                <br />
                L'Engagement Citoyen au Cœur de la Nation
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            {isAr
              ? "منظومة رقمية مؤسساتية موحدة تهدف إلى تنشيط العمل التضامني، تأطير طاقات الشباب الجزائري عبر الـ 69 ولاية، وضمان التنسيق السلس والشفاف بين المجتمع المدني ومصالح الدولة."
              : "Un écosystème numérique institutionnel dédié à la solidarité, à l'encadrement des initiatives de la jeunesse algérienne à travers les 69 wilayas, et à la coordination fluide entre la société civile et les services de l'État."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button asChild size="lg" className="rounded-full shadow-soft bg-primary hover:bg-primary/90 font-bold px-8">
              <Link to="/activities">
                {t("home.ctaActivities")}
                <ArrowRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full font-bold px-8">
              <Link to="/sos">
                {isAr ? "منظومة الاستغاثة SOS" : "Dispositif SOS & Urgences"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Qui sommes-nous & Mission / Vision */}
      <section className="section-block">
        <div className="content-width grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-secondary-foreground">
              <Target className="w-4 h-4 text-primary" />
              <span>{isAr ? "من نحن ورسالتنا" : "Origine & Vocation Institutionnelle"}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              {isAr
                ? "جسر التضامن بين الشباب الجزائري ومؤسسات الدولة"
                : "Le trait d'union moderne entre la jeunesse algérienne et les institutions publiques"}
            </h2>

            <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
              {isAr
                ? "تأسست منصة «يد في يد» كاستجابة استراتيجية للحاجة الملحة إلى تنظيم جهود العمل التطوعي وتوثيقها وفق أعلى معايير الشفافية والموثوقية. إنها تمثل الواجهة الرقمية الموحدة لقطاع الشباب، المفتوحة أمام جميع المواطنين دون أي تمييز أو تعقيد إداري."
                : "La plateforme « Yed fel yed » (يد في يد) est née de la volonté d'organiser, de moderniser et de valoriser les initiatives solidaires et citoyennes en Algérie. Conçue comme un instrument d'intérêt public, elle offre un cadre unifié, accessible et transparent pour catalyser l'énergie bénévole au service de l'intérêt général."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-soft">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary" />
                  {isAr ? "رؤيتنا الاستراتيجية" : "Notre Vision"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr
                    ? "جزائر متضامنة ورقمية يقود فيها الشباب قاطرة التنمية المستدامة والمواطنة الفاعلة."
                    : "Une Algérie solidaire, agile et numérisée où chaque jeune est un acteur reconnu du développement national."}
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-soft">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {isAr ? "مهمتنا اليومية" : "Notre Mission"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr
                    ? "توفير أدوات آمنة تضمن سرعة الاستجابة، نزاهة التوزيع وتكريم البذل الإنساني."
                    : "Fournir des outils technologiques rigoureux garantissant réactivité de secours, équité de distribution et reconnaissance officielle du don de soi."}
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-border/70 overflow-hidden shadow-card bg-white p-2">
              <img
                src="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1000&q=80"
                alt="Engagement citoyen"
                className="w-full aspect-[4/3] object-cover rounded-2xl"
              />
            </div>
            <div className="absolute -bottom-6 start-6 bg-white rounded-2xl p-4 shadow-card border border-border/70 max-w-xs hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  69
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {isAr ? "تغطية وطنية شاملة" : "Couverture Nationale"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isAr ? "69 ولاية في خدمة الوطن" : "69 wilayas interconnectées"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nos 5 Valeurs */}
      <section className="section-block bg-white/60 border-y border-border/50 py-16">
        <div className="content-width space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? "المبادئ التوجيهية" : "Principes Fondateurs"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground">
              {isAr ? "قيمنا الخمس الراسخة" : "Nos Cinq Valeurs Cardinales"}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              {isAr
                ? "ترتكز منصة يد في يد على ميثاق أخلاقي وتنظيمي صارم يضمن موثوقية العمل المشترك."
                : "Chaque interaction sur la plateforme repose sur une charte éthique et opérationnelle sans compromis."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {values.map((val, idx) => {
              const Icon = val.icon
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-border/70 bg-white p-6 shadow-soft space-y-3 flex flex-col justify-between interactive-lift"
                >
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-foreground text-base leading-snug">{val.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{val.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 6 Domaines d'Intervention */}
      <section className="section-block py-16">
        <div className="content-width space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-secondary-foreground">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>{isAr ? "مجالات النشاط" : "Champs d'Action"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground">
              {isAr ? "مجالات التدخل الستة الكبرى" : "Nos Six Domaines d'Intervention"}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              {isAr
                ? "تغطي المنصة جميع جوانب التنشيط الشباني والعمل الإنساني الجواري."
                : "Une synergie complète entre la vie associative, les infrastructures publiques et la réponse humanitaire."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {domains.map((dom, i) => {
              const Icon = dom.icon
              return (
                <div
                  key={i}
                  className="rounded-3xl border border-border/70 bg-white p-6 md:p-7 shadow-soft space-y-3 interactive-lift"
                >
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">{dom.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{dom.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Fonctionnement en 4 étapes */}
      <section className="section-block bg-muted/30 border-y border-border/60 py-16">
        <div className="content-width space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground">
              {isAr ? "كيف تعمل المنصة؟" : "Le Cycle Opérationnel en 4 Étapes"}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              {isAr
                ? "من الفكرة الميدانية إلى الاعتماد الإداري والتوثيق النهائي."
                : "De l'expression du besoin jusqu'à la certification institutionnelle et la reconnaissance des bénévoles."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, i) => (
              <div
                key={i}
                className="rounded-3xl border border-border/80 bg-white p-6 shadow-soft relative overflow-hidden"
              >
                <span className="text-4xl font-black text-primary/15 absolute top-4 end-4">
                  {st.num}
                </span>
                <div className="relative z-10 space-y-2">
                  <h3 className="font-bold text-foreground text-base pt-4">{st.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement Transparence & Audit */}
      <section className="section-block py-16">
        <div className="content-width">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5 p-8 md:p-12 shadow-soft space-y-6 max-w-4xl mx-auto text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-soft">
              <FileText className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground">
              {isAr
                ? "الالتزام بالشفافية والرقابة الإدارية الصارمة"
                : "Engagement de Transparence & Registre d'Audit Scellé"}
            </h2>

            <p className="text-muted-foreground leading-relaxed text-sm md:text-base max-w-2xl mx-auto">
              {isAr
                ? "تعتمد منصة «يد في يد» بنية سجل رقمي مشفر (SHA-256) يربط كل عملية إدارية، ترقية نقاط، أو إغلاق ملف إغاثة بهوية المسؤول التنفيذي. لا يمكن حذف أو تزوير أي قيد، مما يتيح لهيئات التفتيش والرقابة الوطنية إجراء تدقيق شامل في أي لحظة."
                : "Yed fel yed intègre une architecture de journalisation cryptographique (SHA-256) garantissant qu'aucune opération administrative, attribution de points ou clôture de dossier SOS ne peut être altérée ou effacée. Ce système garantit aux corps d'inspection de l'État une traçabilité intégrale et vérifiable à tout instant."}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild className="rounded-full shadow-soft bg-primary hover:bg-primary/90 font-bold px-7">
                <Link to="/institutions">
                  <Building2 className="w-4 h-4 mr-2" />
                  {isAr ? "دليل الهياكل والمؤسسات" : "Consulter les Structures"}
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full font-bold px-7">
                <Link to="/rejoindre">
                  <Users className="w-4 h-4 mr-2" />
                  {isAr ? "الانضمام لبرنامج المتطوعين" : "Programme Bénévoles"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
