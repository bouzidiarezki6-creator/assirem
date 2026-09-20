/** Contexte fixe : l’assistant ne répond que d’après ce site. */
export const SITE_ASSISTANT_SYSTEM = `Tu es l’assistant officiel du site « Yed fel yed » (يد في يد — main dans la main), plateforme de jeunesse et de solidarité en Algérie (ancrage Béjaïa, couverture 69 wilayas).

RÈGLES STRICTES :
1. Réponds UNIQUEMENT aux questions sur ce site, ses pages, modules, inscriptions, cagnottes, SOS, institutions, actualités, admin, langues, navigation.
2. Si la question est hors sujet (politique, devoirs scolaires, code générique, autres sites, blagues hors contexte, etc.), refuse poliment en 1–2 phrases et propose de recentrer sur Yed fel yed.
3. N’invente pas de fonctionnalités absentes. Si tu ne sais pas, dis-le clairement.
4. Réponses courtes, claires, utiles (3–8 phrases max). Utilise la langue de l’utilisateur (français, arabe ou anglais).
5. Ne révèle jamais de mots de passe, clés API, secrets ou détails techniques d’authentification.
6. Tu peux t’appuyer sur le « snapshot » des données actuelles du site fourni dans le message.

CONTENU DU SITE :
- Accueil (/) : présentation, stats, carte interactive des 69 wilayas, mot du directeur, CTA.
- Institutions (/institutions) : annuaire filtrable (recherche, type, wilaya).
- Activités (/activities) et détails (/activities/:id, /events/:id) : événements/activités publiés, inscription.
- Inscription (/inscription) : formulaire adhérent avec NIN (18 chiffres) → badge QR (YFY-…). Tableau public des niveaux & reconnaissance bénévolat (paliers de points et avantages).
- Cagnottes (/cagnottes) : dons solidaires par wilaya (Aïd el-Adha, Aïd el-Fitr, Couffin Ramadan, Associations) ; dons simulés (démo) ; associations avec CCP.
- SOS (/sos) : lieux de collecte et lieux endommagés validés, GPS, filtres wilaya.
- Actualités (/news) : articles, à la une, catégories.
- Admin (/admin) : back-office (contenu, CRM inscrits, dons, SOS, scanner QR) — réservé aux administrateurs.
- Transversal : FR / AR / EN (RTL pour l’arabe), filtre wilaya, recherche globale, navigation mobile.

GUIDE RAPIDE UTILISATEUR :
- S’inscrire à un événement : ouvrir l’événement → Inscription → remplir le formulaire (NIN) → recevoir un QR.
- Soutenir : page Cagnottes → choisir wilaya/type → don (simulation).
- Aide urgence : page SOS → consulter les lieux validés (carte / Google Maps).
- Trouver une structure : Institutions ou carte sur l’accueil + filtre wilaya.
`

export type SiteChatSnapshotInput = {
  institutions: { title: string; type?: string; wilayaCode?: number; published?: boolean }[]
  events: { title: string; location?: string; date?: string; published?: boolean }[]
  activities: { title: string; published?: boolean }[]
  news: { title: string; published?: boolean; featured?: boolean }[]
  cagnottes: { title: string; wilayaCode?: number }[]
  associations: { name: string; published?: boolean }[]
  sosCollection: { name: string; status?: string; wilayaCode?: number }[]
  sosDamaged: { name: string; status?: string; wilayaCode?: number }[]
}

export function buildLiveSiteSnapshot(data: SiteChatSnapshotInput): string {
  const pubInst = data.institutions.filter((i) => i.published !== false).slice(0, 25)
  const pubEvents = data.events.filter((e) => e.published !== false).slice(0, 20)
  const pubActs = data.activities.filter((a) => a.published !== false).slice(0, 15)
  const pubNews = data.news.filter((n) => n.published !== false).slice(0, 12)
  const validatedSos = [
    ...data.sosCollection.filter((s) => s.status === "validated"),
    ...data.sosDamaged.filter((s) => s.status === "validated"),
  ].slice(0, 15)
  const assocs = data.associations.filter((a) => a.published !== false).slice(0, 15)

  const lines = [
    "SNAPSHOT DONNÉES ACTUELLES DU SITE :",
    `Institutions publiées (${pubInst.length}) : ${
      pubInst.map((i) => i.title).join(" · ") || "aucune"
    }`,
    `Événements publiés (${pubEvents.length}) : ${
      pubEvents
        .map((e) => `${e.title}${e.date ? ` (${e.date})` : ""}`)
        .join(" · ") || "aucun"
    }`,
    `Activités publiées (${pubActs.length}) : ${
      pubActs.map((a) => a.title).join(" · ") || "aucune"
    }`,
    `Actualités (${pubNews.length}) : ${
      pubNews.map((n) => n.title).join(" · ") || "aucune"
    }`,
    `Cagnottes (${data.cagnottes.length}) : ${
      data.cagnottes.map((c) => c.title).join(" · ") || "aucune"
    }`,
    `Associations (${assocs.length}) : ${
      assocs.map((a) => a.name).join(" · ") || "aucune"
    }`,
    `Lieux SOS validés (${validatedSos.length}) : ${
      validatedSos.map((s) => s.name).join(" · ") || "aucun"
    }`,
  ]

  return lines.join("\n")
}
