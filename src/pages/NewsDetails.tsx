import { useState, useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, ArrowRight, Calendar, Clock, Share2, Check, Newspaper, Bookmark, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import EmptyState from "@/components/shared/EmptyState"
import NewsCard from "@/components/shared/NewsCard"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"

export default function NewsDetails() {
  const { id } = useParams<{ id: string }>()
  const { data } = useAppData()
  const { t, dir, formatDateLong } = useI18n()
  const [copied, setCopied] = useState(false)

  const article = useMemo(
    () => data.news.find((n) => n.id === id && n.published),
    [data.news, id]
  )

  const relatedArticles = useMemo(() => {
    if (!article) return []
    return data.news
      .filter((n) => n.published && n.id !== article.id)
      .slice(0, 3)
  }, [data.news, article])

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  if (!article) {
    return (
      <div className="page-shell section-gap">
        <EmptyState
          icon={Newspaper}
          title={t("news.notFound") || "Actualité introuvable"}
          description={t("news.notFoundHint") || "Cet article n'existe pas ou a été déplacé."}
          actionLabel={t("news.backNews") || "Retour aux actualités"}
          actionTo="/news"
        />
      </div>
    )
  }

  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft
  const readingTime = Math.max(2, Math.ceil((article.description.length + (article.content?.length || 500)) / 400))

  return (
    <div className="min-h-screen bg-surface">
      {/* Top navigation bar */}
      <div className="border-b border-border/50 bg-white/75 backdrop-blur-md sticky top-16 z-30">
        <div className="content-width flex items-center justify-between h-14">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <BackArrow className="w-4 h-4" />
            <span>{t("news.backNews") || "Retour aux actualités"}</span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-xs font-semibold gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary">{t("news.copied") || "Lien copié !"}</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>{t("news.share") || "Partager"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Hero Cover Image */}
      <div className="relative w-full aspect-[16/8] max-h-[440px] md:max-h-[500px] bg-muted overflow-hidden">
        {article.imageDataUrl ? (
          <img
            src={article.imageDataUrl}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/15 via-muted to-primary/5 flex items-center justify-center">
            <Newspaper className="w-16 h-16 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
      </div>

      {/* Article Content Sheet */}
      <div className="content-width -mt-16 sm:-mt-24 relative z-20 pb-20">
        <article className="max-w-4xl mx-auto bg-white rounded-3xl border border-border/60 shadow-soft p-6 sm:p-10 md:p-12 space-y-8">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
              <Bookmark className="w-3.5 h-3.5" />
              {article.category}
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
              {formatDateLong(article.date)}
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
              {readingTime} min
            </span>

            {article.featured && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <Sparkles className="w-3 h-3" />
                À la une
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.2] text-balance">
            {article.title}
          </h1>

          {/* Lead Description */}
          <p className="text-lg md:text-xl font-medium text-foreground/80 leading-relaxed border-l-4 rtl:border-l-0 rtl:border-r-4 border-primary pl-4 rtl:pl-0 rtl:pr-4 py-1 bg-muted/30 rounded-r-2xl rtl:rounded-r-none rtl:rounded-l-2xl">
            {article.description}
          </p>

          {/* Body Content */}
          <div className="space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed pt-2">
            {article.content ? (
              <div className="whitespace-pre-line space-y-4">
                {article.content}
              </div>
            ) : (
              <>
                <p>
                  Dans le cadre des initiatives solidaires et citoyennes portées par la plateforme <strong>Yed fel yed</strong>, cet événement reflète l'engagement continu pour le bien-être communautaire, l'encouragement de la jeunesse et le soutien aux initiatives locales.
                </p>
                <p>
                  Les organisateurs et les équipes sur le terrain ont mis en place l'ensemble des moyens humains et matériels pour assurer le bon déroulement des activités, favoriser la participation active de toutes et de tous, et créer un espace d'échange constructif et bienveillant.
                </p>
                <div className="my-6 p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                  <h3 className="font-bold text-foreground text-base">Points clés à retenir :</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm md:text-base text-muted-foreground">
                    <li>Mobilisation active des bénévoles et partenaires locaux.</li>
                    <li>Accès libre et accompagnement personnalisé pour les participants.</li>
                    <li>Suivi continu via la plateforme solidaire Yed fel yed.</li>
                  </ul>
                </div>
                <p>
                  Pour plus d'informations ou pour participer aux prochaines sessions, n'hésitez pas à consulter notre calendrier d'activités ou à contacter l'équipe via le formulaire dédié.
                </p>
              </>
            )}
          </div>

          {/* Footer of the article */}
          <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              Plateforme <strong>Yed fel yed</strong> · Information et Solidarité
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                {copied ? (t("news.copied") || "Copié !") : (t("news.share") || "Partager")}
              </Button>

              <Button asChild size="sm">
                <Link to="/news">
                  {t("news.backNews") || "Retour aux actualités"}
                </Link>
              </Button>
            </div>
          </div>
        </article>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="max-w-4xl mx-auto mt-14 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {t("news.otherNews") || "Autres actualités"}
              </h2>
              <Link
                to="/news"
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t("common.viewAll") || "Tout voir"}
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/news/${rel.id}`}
                  className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl"
                >
                  <NewsCard
                    category={rel.category}
                    date={rel.date.replace(/-/g, "/")}
                    title={rel.title}
                    description={rel.description}
                    image={rel.imageDataUrl || undefined}
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
