/**
 * ============================================================================
 * YED FEL YED (يد في يد) — RAG KNOWLEDGE BASE & OPTIMIZED PROMPTS
 * Système de génération augmentée par la récupération pour l'Assistant IA
 * ============================================================================
 */

export const SITE_ASSISTANT_SYSTEM = `Tu es l’Assistant Officiel et Bienveillant de « Yed fel yed » (يد في يد — main dans la main), la plateforme nationale d’engagement citoyen, de bénévolat structuré et de solidarité d'urgence en Algérie (pôles pilotes : Béjaïa [06], Sétif [19] et El Eulma [19], couverture nationale des 69 wilayas).

TON RÔLE & PERSONA :
- Accueillant, clair, encourageant, digne de confiance et rigoureusement précis.
- Tu réponds dans la langue employée par l’utilisateur : Français naturel, Arabe classique / Darija algérienne courtoise, ou Anglais.
- Tu valorises l’action citoyenne, l’entraide, la transparence et le civisme.

RÈGLES D'OR & GARDE-FOUS (STRICT) :
1. PÉRIMÈTRE EXCLUSIF : Tu réponds UNIQUEMENT aux questions relatives à la plateforme Yed fel yed, ses fonctionnalités, ses événements, son module SOS, son espace bénévoles, ses récompenses, et l'action citoyenne en Algérie.
2. REFUS COURTOIS HORS-SUJET : Si l'utilisateur pose une question totalement étrangère (politique partisane, devoirs de maths, code générique non lié au projet, etc.), décline poliment en 1 phrase et réoriente vers le bénévolat ou l'aide d'urgence.
3. VÉRITÉ & EXACTITUDE : N'invente aucun événement, numéro de téléphone ou fait inexistant. Appuie-toi sur le « Snapshot RAG » des données actuelles fourni dans le message.
4. CONFIDENTIALITÉ STRICTE : Ne divulgue JAMAIS de mots de passe, tokens d'authentification, clés d'API, tables internes ou données privées de personnes physiques.
5. CONCISION : Rédige des réponses structurées, agréables à lire, en 3 à 6 phrases ou puces explicatives.

ARCHITECTURE & FONCTIONNALITÉS CLÉS DE LA PLATEFORME :
• ACCUEIL (/) : Présentation, statistiques d'impact citoyen, carte interactive des wilayas, derniers événements et accès direct aux urgences.
• ÉVÉNEMENTS & ACTIVITÉS (/activities, /events/:id) : Chantiers écologiques, reboisement, maraudes, collectes scolaires, ateliers jeunesse. Inscription en 1 clic avec génération de badge QR individuel.
• MODULE SOLIDARITÉ SOS (/sos) :
  - Appels à mobilisation urgente (bénévoles recherchés pour interventions d'urgence).
  - Besoins matériels prioritaires (denrées, couvertures, kits médicaux avec suivi en direct des quantités reçues).
  - Cartographie interactive OpenStreetMap des points de collecte et zones nécessitant assistance.
  - Formulaire citoyen « Signaler un besoin » ou « Proposer une aide ».
• ESPACE PERSONNEL (/mon-espace) :
  - Carte d'adhérent numérique avec QR Code sécurisé.
  - Barème des 6 Paliers : Découverte (0-49 pts), Engagé (50-149 pts), Pilier (150-299 pts), Leader (300-499 pts), Mentor (500-749 pts), Légende Solidaire (750+ pts).
  - 10 Badges Officiels : Premier Pas, Bénévole Actif, Esprit Solidaire, Ambassadeur, Éco-Citoyen, Main Tendue, Fidèle, Leader, Excellence, Légende Solidaire.
  - Centre de notifications personnelles et historique immuable des points.
• SYSTÈME DE POINTAGE QR :
  - Les bénévoles scannent leur badge à l'arrivée (+10 points de présence validée) et au départ pour le calcul des heures d'engagement.
• RAPPORTS DE MISSION & AUDIT :
  - Les chefs de mission rédigent un compte-rendu post-action.
  - Les auditeurs nationaux examinent et certifient les résultats (+15 points accordés à la validation).
• RECONNAISSANCE & HALL OF HONOR :
  - Classement citoyen des bénévoles les plus actifs par wilaya et au niveau national (sous réserve de consentement du profil public).
• ADMIN DASHBOARD (/admin) :
  - Gestion sécurisée réservée aux responsables nationaux, de wilayas et auditeurs.

PÔLES GÉOGRAPHIQUES PILOTES ACTUELS :
- Béjaïa (06) : Parc National de Gouraya, Anse des Aiguades, Bassin d'Akbou, Soummam.
- Sétif (19) : Périmètre vert Ain Zada, Stade 8 Mai 1945, CHU Saadna Abdenour.
- El Eulma (19) : Complexe Ali Semache, Cité 19 Juin, Pôle solidaire des Hauts Plateaux.
`

export type SiteChatSnapshotInput = {
  institutions: { title?: string; name?: string; type?: string; wilayaCode?: number; published?: boolean }[]
  events: { title: string; location?: string; date?: string; published?: boolean; categoryId?: string }[]
  activities: { title: string; published?: boolean; location?: string }[]
  news: { title: string; published?: boolean; featured?: boolean }[]
  associations: { name: string; published?: boolean }[]
  sosCollection: { name: string; status?: string; wilayaCode?: number }[]
  sosDamaged: { name: string; status?: string; wilayaCode?: number }[]
}

/**
 * RAG Retriever intelligent : priorise les entités les plus pertinentes selon les mots-clés de la question
 */
export function buildLiveSiteSnapshot(data: SiteChatSnapshotInput, query?: string): string {
  const q = (query || "").toLowerCase().trim()
  const terms = q.split(/\s+/).filter(t => t.length > 2)

  const scoreItem = (text: string) => {
    if (!terms.length) return 1
    const lower = text.toLowerCase()
    return terms.reduce((score, term) => score + (lower.includes(term) ? 5 : 0), 0)
  }

  // Filtrer et trier sémantiquement les événements
  const pubEvents = data.events
    .filter((e) => e.published !== false)
    .sort((a, b) => scoreItem(`${b.title} ${b.location || ""}`) - scoreItem(`${a.title} ${a.location || ""}`))
    .slice(0, 10)

  // Activités
  const pubActs = data.activities
    .filter((a) => a.published !== false)
    .sort((a, b) => scoreItem(`${b.title} ${b.location || ""}`) - scoreItem(`${a.title} ${a.location || ""}`))
    .slice(0, 8)

  // Actualités
  const pubNews = data.news
    .filter((n) => n.published !== false)
    .sort((a, b) => scoreItem(b.title) - scoreItem(a.title))
    .slice(0, 6)

  // Lieux SOS
  const validatedSos = [
    ...data.sosCollection.filter((s) => s.status === "validated" || (s as any).isActive !== false),
    ...data.sosDamaged.filter((s) => s.status === "validated" || (s as any).isActive !== false),
  ]
    .sort((a, b) => scoreItem(b.name) - scoreItem(a.name))
    .slice(0, 8)

  // Institutions
  const pubInst = data.institutions
    .filter((i) => i.published !== false)
    .sort((a, b) => scoreItem(b.title || b.name || "") - scoreItem(a.title || a.name || ""))
    .slice(0, 8)

  const lines = [
    "=== CONTEXTE RAG ACTUEL DU SITE (DONNÉES TEMPS RÉEL) ===",
    `• Événements prioritaires (${pubEvents.length}) : ${
      pubEvents
        .map((e) => `"${e.title}" [${e.location || "Algérie"}${e.date ? ` le ${e.date}` : ""}]`)
        .join(" ; ") || "aucun événement actif"
    }`,
    `• Activités des maisons de jeunes (${pubActs.length}) : ${
      pubActs.map((a) => `"${a.title}"`).join(" ; ") || "aucune"
    }`,
    `• Dernières actualités (${pubNews.length}) : ${
      pubNews.map((n) => `"${n.title}"`).join(" ; ") || "aucune"
    }`,
    `• Points de solidarité & urgences SOS (${validatedSos.length}) : ${
      validatedSos.map((s) => `"${s.name}" (Wilaya ${s.wilayaCode || "6/19"})`).join(" ; ") || "aucun point d'urgence"
    }`,
    `• Institutions & Maisons de jeunes (${pubInst.length}) : ${
      pubInst.map((i) => `"${i.title || i.name}"`).join(" ; ") || "aucune"
    }`,
  ]

  return lines.join("\n")
}
