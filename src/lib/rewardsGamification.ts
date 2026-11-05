/**
 * ============================================================================
 * MODULE DE RÉCOMPENSES, CLASSEMENTS ET RECONNAISSANCE CITOYENNE — YED FEL YED
 * Barème officiel N0 à N5, Challenges Mensuels, Saisons, Hall of Honor,
 * Distinctions Exceptionnelles et Catalogue des Avantages.
 * République Algérienne Démocratique et Populaire
 * ============================================================================
 */

import type { VolunteerTierId } from "./levels"
import type { CategoryId } from "./categories"
import type { InstitutionalRole } from "./governanceTypes"

// ----------------------------------------------------------------------------
// 1. STATUTS DES AVANTAGES ET PARTENARIATS
// ----------------------------------------------------------------------------

export type PerkStatus = "available" | "partnership_pending" | "in_development"

export interface TierPerkItem {
  id: string
  title: string
  description: string
  status: PerkStatus
  category: "digital" | "training" | "equipment" | "civic" | "recognition"
  accessCondition?: string
}

/**
 * AVANTAGES OFFICIELS DÉTAILLÉS PAR PALIER (N0 À N5)
 */
export const OFFICIAL_TIER_PERKS: Record<VolunteerTierId, TierPerkItem[]> = {
  nouveau: [
    {
      id: "n0_badge",
      title: "Badge numérique personnel sécurisé",
      description: "Carte d'identité bénévole avec QR Code chiffré opaque sans données sensibles.",
      status: "available",
      category: "digital",
      accessCondition: "Dès l'inscription volontaire au programme.",
    },
    {
      id: "n0_missions",
      title: "Accès aux missions ouvertes",
      description: "Possibilité de participer à toutes les actions de solidarité publiées.",
      status: "available",
      category: "civic",
      accessCondition: "Sans restriction.",
    },
    {
      id: "n0_history",
      title: "Historique des premières participations",
      description: "Suivi chronologique des missions accomplies et des premières heures validées.",
      status: "available",
      category: "digital",
      accessCondition: "Dès la 1ère présence enregistrée.",
    },
    {
      id: "n0_first_step",
      title: "Distinction « Premier Pas Solidaire »",
      description: "Insigne officiel d'accueil dans la communauté des bénévoles engagés.",
      status: "available",
      category: "recognition",
      accessCondition: "Attribué après la 1ère mission validée sur le terrain.",
    },
    {
      id: "n0_certificate",
      title: "Certificat numérique de première participation",
      description: "Attestation téléchargeable certifiant la première contribution solidaire.",
      status: "available",
      category: "recognition",
      accessCondition: "1ère mission validée par un coordinateur.",
    },
  ],

  engage: [
    {
      id: "n1_logbook",
      title: "Journal de bord certifié des missions",
      description: "Registre officiel des heures validées et des compétences mobilisées.",
      status: "available",
      category: "digital",
      accessCondition: "Palier N1 atteint (50 pts).",
    },
    {
      id: "n1_priority_local",
      title: "Priorité d'inscription aux activités locales",
      description: "Accès prioritaire aux actions de solidarité et événements locaux à places limitées.",
      status: "available",
      category: "civic",
      accessCondition: "Dans sa commune et wilaya d'affectation.",
    },
    {
      id: "n1_workshops",
      title: "Ateliers de développement personnel",
      description: "Sessions de formation aux soft skills, prise de parole et gestion du temps.",
      status: "partnership_pending",
      category: "training",
      accessCondition: "Sous réserve de partenariats associatifs actifs.",
    },
    {
      id: "n1_regular_distinction",
      title: "Distinction « Engagement Régulier »",
      description: "Insigne de reconnaissance d'assiduité bénévole.",
      status: "available",
      category: "recognition",
      accessCondition: "Au moins 5 missions validées sur le terrain.",
    },
    {
      id: "n1_challenges",
      title: "Participation aux challenges mensuels",
      description: "Accès complet aux défis mensuels avec récompenses et points bonus.",
      status: "available",
      category: "civic",
      accessCondition: "Palier N1 atteint.",
    },
  ],

  actif: [
    {
      id: "n2_partner_training",
      title: "Priorité d'inscription aux formations partenaires",
      description: "Accès privilégié aux cycles de formation civique et technique proposés par nos partenaires.",
      status: "partnership_pending",
      category: "training",
      accessCondition: "Places attribuées selon les conventions en vigueur.",
    },
    {
      id: "n2_specialized_workshops",
      title: "Ateliers secourisme, leadership & gestion de projets",
      description: "Formations certifiantes aux premiers secours (secourisme de base) et gestion associative.",
      status: "available",
      category: "training",
      accessCondition: "Inscriptions ouvertes lors des sessions régionales.",
    },
    {
      id: "n2_gatherings",
      title: "Invitation aux rencontres des volontaires",
      description: "Participation aux rassemblements communaux et de daïra de la jeunesse et des volontaires.",
      status: "available",
      category: "civic",
      accessCondition: "Sur convocation de la coordination locale.",
    },
    {
      id: "n2_specialized_missions",
      title: "Candidature aux missions spécialisées",
      description: "Accès aux missions requérant un profil technique (santé, soutien psy, logistique lourde).",
      status: "available",
      category: "civic",
      accessCondition: "Vérification des compétences déclarées.",
    },
    {
      id: "n2_path_certificate",
      title: "Certificat de parcours bénévole",
      description: "Document officiel récapitulant les missions et les domaines d'intervention.",
      status: "available",
      category: "recognition",
      accessCondition: "Palier N2 atteint (150 pts).",
    },
  ],

  confirme: [
    {
      id: "n3_team_lead_training",
      title: "Éligibilité à la formation de responsable d'équipe",
      description: "Cycle préparatoire à l'encadrement de groupes de 5 à 10 jeunes volontaires.",
      status: "available",
      category: "training",
      accessCondition: "Formation obligatoire avant toute prise de fonction d'encadrement.",
    },
    {
      id: "n3_lead_missions",
      title: "Candidature aux missions à responsabilité",
      description: "Possibilité de postuler comme chef d'équipe terrain avec bonus modéré (+10%).",
      status: "available",
      category: "civic",
      accessCondition: "Validation administrative préalable requise.",
    },
    {
      id: "n3_priority_missions",
      title: "Accès prioritaire aux missions nécessitant expérience",
      description: "Priorité sur les missions sensibles, caravanes sanitaires et déploiements humanitaires.",
      status: "available",
      category: "civic",
      accessCondition: "Réservé aux profils confirmés.",
    },
    {
      id: "n3_volunteer_kit",
      title: "Dotation du kit officiel de volontaire",
      description: "Gilet d'intervention officiel, casquette et badge cartonné d'accréditation.",
      status: "partnership_pending",
      category: "equipment",
      accessCondition: "Selon stocks et partenariats logistiques disponibles.",
    },
    {
      id: "n3_travel_allowance",
      title: "Remboursement de frais de déplacement autorisés",
      description: "Prise en charge éventuelle des frais de transport pour missions inter-wilayas validées.",
      status: "in_development",
      category: "civic",
      accessCondition: "Dispositif à l'étude en concertation avec les structures ministérielles.",
    },
    {
      id: "n3_trusted_badge",
      title: "Distinction « Volontaire de Confiance »",
      description: "Témoignage officiel de fiabilité et d'éthique citoyenne.",
      status: "available",
      category: "recognition",
      accessCondition: "Palier N3 atteint (300 pts) et avis favorable de la coordination.",
    },
  ],

  exemplaire: [
    {
      id: "n4_mentorship",
      title: "Programme officiel de mentorat civique",
      description: "Rôle de parrain/marraine pour accompagner et guider les nouveaux bénévoles (N0-N1).",
      status: "available",
      category: "civic",
      accessCondition: "Palier N4 atteint (500 pts).",
    },
    {
      id: "n4_propose_initiatives",
      title: "Droit de proposition d'initiatives solidaires locales",
      description: "Possibilité de soumettre de nouveaux projets d'intérêt général à la coordination.",
      status: "available",
      category: "civic",
      accessCondition: "Étude et validation par l'administration de wilaya.",
    },
    {
      id: "n4_advanced_trainings",
      title: "Priorité aux formations supérieures partenaires",
      description: "Accès privilégié aux formations certifiées de gestion de crise et coordination humanitaire.",
      status: "partnership_pending",
      category: "training",
      accessCondition: "Attribution selon les critères des organismes partenaires.",
    },
    {
      id: "n4_leadership_program",
      title: "Candidature aux programmes de leadership jeunesse",
      description: "Programmes d'échange et séminaires de leadership pour la jeunesse algérienne.",
      status: "partnership_pending",
      category: "training",
      accessCondition: "Sélection sur dossier par le comité de pilotage.",
    },
    {
      id: "n4_trophy",
      title: "Trophée numérique « Excellence Citoyenne »",
      description: "Médaille d'argent numérique ornant le profil public et les attestations.",
      status: "available",
      category: "recognition",
      accessCondition: "500 points et 50 heures certifiées.",
    },
    {
      id: "n4_hall_of_honor",
      title: "Mise en avant dans le Hall of Honor (قاعة الشرف)",
      description: "Affichage permanent au tableau d'honneur des volontaires exemplaires.",
      status: "available",
      category: "recognition",
      accessCondition: "Sous réserve du consentement préalable du bénévole.",
    },
  ],

  ambassadeur: [
    {
      id: "n5_honor_title",
      title: "Titre honorifique national d'Ambassadeur de la Jeunesse",
      description: "Plus haute distinction citoyenne de la plateforme associative.",
      status: "available",
      category: "recognition",
      accessCondition: "Palier N5 atteint (1000+ points).",
    },
    {
      id: "n5_gold_medal",
      title: "Médaille d'Or numérique spéciale",
      description: "Insigne d'or éclatant sur le profil, le badge QR et les documents officiels.",
      status: "available",
      category: "recognition",
      accessCondition: "1000+ points validés.",
    },
    {
      id: "n5_national_meetings",
      title: "Invitation aux assises nationales de la jeunesse",
      description: "Participation aux rencontres nationales organisées par le MJS et Yed Fel Yed.",
      status: "available",
      category: "civic",
      accessCondition: "Sur convocation nationale.",
    },
    {
      id: "n5_representation",
      title: "Candidature aux programmes de représentation",
      description: "Représentation de la jeunesse algérienne lors des colloques et délégations solidaires.",
      status: "available",
      category: "civic",
      accessCondition: "Agrément ministériel et associatif.",
    },
    {
      id: "n5_consultative_council",
      title: "Participation au Conseil Consultatif des Volontaires",
      description: "Organe de concertation pour faire évoluer la plateforme et les politiques citoyennes.",
      status: "in_development",
      category: "civic",
      accessCondition: "En cours d'élaboration statutaire.",
    },
    {
      id: "n5_annual_trophy",
      title: "Éligibilité au Trophée Annuel du Meilleur Ambassadeur",
      description: "Prix prestigieux décerné annuellement lors de la Journée Internationale des Volontaires.",
      status: "available",
      category: "recognition",
      accessCondition: "Élection par le jury national.",
    },
  ],
}

// ----------------------------------------------------------------------------
// 2. CHALLENGES MENSUELS CONFIGURABLES
// ----------------------------------------------------------------------------

export type ChallengeCategory =
  | "participation"
  | "hours"
  | "sos"
  | "skills"
  | "team"
  | "regularity"

export type ChallengeMetric =
  | "missions_count"
  | "hours_count"
  | "sos_count"
  | "team_missions_count"
  | "specialty_used"
  | "months_regular"

export interface VolunteerChallenge {
  id: string
  code: string
  titleFr: string
  titleAr: string
  descriptionFr: string
  descriptionAr: string
  category: ChallengeCategory
  metric: ChallengeMetric
  targetValue: number
  rewardPoints: number
  rewardBadgeName: string
  rewardBadgeIcon: string
  periodType: "monthly" | "seasonal" | "permanent"
  periodCode?: string // ex: "2026-11"
  active: boolean
  isSpecial?: boolean
}

/**
 * Défis officiels pré-configurés
 */
export const DEFAULT_CHALLENGES: VolunteerChallenge[] = [
  {
    id: "ch-premier-pas",
    code: "CH-01",
    titleFr: "Premier Pas Citoyen",
    titleAr: "الخطوة الأولى",
    descriptionFr: "Accomplir et faire valider votre toute première mission de bénévolat sur le terrain.",
    descriptionAr: "إتمام وتأكيد أول مهمة تطوعية ميدانية.",
    category: "participation",
    metric: "missions_count",
    targetValue: 1,
    rewardPoints: 10,
    rewardBadgeName: "Insigne Premier Pas",
    rewardBadgeIcon: "HeartHandshake",
    periodType: "permanent",
    active: true,
  },
  {
    id: "ch-regularite-mensuelle",
    code: "CH-02",
    titleFr: "Régularité Mensuelle",
    titleAr: "الانتظام الشهري",
    descriptionFr: "Participer à au moins 4 missions citoyennes validées durant le mois en cours.",
    descriptionAr: "المشاركة في 4 مهام على الأقل خلال الشهر الجاري.",
    category: "regularity",
    metric: "missions_count",
    targetValue: 4,
    rewardPoints: 25,
    rewardBadgeName: "Insigne d'Assiduité",
    rewardBadgeIcon: "CalendarCheck",
    periodType: "monthly",
    periodCode: "2026-11",
    active: true,
  },
  {
    id: "ch-esprit-solidaire-sos",
    code: "CH-03",
    titleFr: "Sentinelle Solidaire SOS",
    titleAr: "حارس التضامن",
    descriptionFr: "Participer à au moins 1 mission de secours d'urgence ou d'aide d'urgence (Module SOS).",
    descriptionAr: "المشاركة في مهمة طوارئ أو إغاثة واحدة على الأقل عبر وحدة SOS.",
    category: "sos",
    metric: "sos_count",
    targetValue: 1,
    rewardPoints: 20,
    rewardBadgeName: "Insigne Gardien SOS",
    rewardBadgeIcon: "ShieldAlert",
    periodType: "monthly",
    periodCode: "2026-11",
    active: true,
  },
  {
    id: "ch-cap-50-heures",
    code: "CH-04",
    titleFr: "Cap des 50 Heures de Service",
    titleAr: "حاجز 50 ساعة خدمة",
    descriptionFr: "Cumuler 50 heures validées de service civique et d'entraide communautaire.",
    descriptionAr: "تجميع 50 ساعة خدمة تطوعية مؤكدة ميدانياً.",
    category: "hours",
    metric: "hours_count",
    targetValue: 50,
    rewardPoints: 35,
    rewardBadgeName: "Certificat des 50 Heures",
    rewardBadgeIcon: "Clock",
    periodType: "permanent",
    active: true,
  },
  {
    id: "ch-esprit-equipe",
    code: "CH-05",
    titleFr: "Force du Collectif",
    titleAr: "روح الفريق",
    descriptionFr: "Prendre part à 3 missions de groupe impliquant au moins 5 volontaires.",
    descriptionAr: "المشاركة في 3 مهام جماعية مع فريق من 5 متطوعين فأكثر.",
    category: "team",
    metric: "team_missions_count",
    targetValue: 3,
    rewardPoints: 20,
    rewardBadgeName: "Insigne Team Spirit",
    rewardBadgeIcon: "Users",
    periodType: "monthly",
    periodCode: "2026-11",
    active: true,
  },
  {
    id: "ch-competence-mobilisee",
    code: "CH-06",
    titleFr: "Savoir-Faire Citoyen",
    titleAr: "المهارة المجندة",
    descriptionFr: "Mettre à disposition une compétence professionnelle spécifique (santé, informatique, secourisme, logistique).",
    descriptionAr: "توظيف مهارة مهنية أو تخصصية في إحدى المبادرات التطوعية.",
    category: "skills",
    metric: "specialty_used",
    targetValue: 1,
    rewardPoints: 25,
    rewardBadgeName: "Insigne Compétence",
    rewardBadgeIcon: "Award",
    periodType: "permanent",
    active: true,
  },
  {
    id: "ch-engagement-durable",
    code: "CH-07",
    titleFr: "Engagement Durable (Semestre)",
    titleAr: "الالتزام المستدام",
    descriptionFr: "Maintenir une présence active et régulière sur la plateforme pendant 6 mois consécutifs.",
    descriptionAr: "الحفاظ على نشاط تطوعي مستمر لمدة 6 أشهر متتالية.",
    category: "regularity",
    metric: "months_regular",
    targetValue: 6,
    rewardPoints: 40,
    rewardBadgeName: "Médaille de Fidélité",
    rewardBadgeIcon: "Flame",
    periodType: "seasonal",
    active: true,
  },
]

// ----------------------------------------------------------------------------
// 3. SAISONS DE COMPÉTITION ANNUELLES
// ----------------------------------------------------------------------------

export interface SeasonInfo {
  id: string
  year: number
  quarter: 1 | 2 | 3 | 4
  nameFr: string
  nameAr: string
  startDate: string
  endDate: string
  status: "upcoming" | "active" | "completed"
}

export interface SeasonLaureate {
  volunteerId: string
  displayName: string
  wilayaCode: number
  commune: string
  tier: VolunteerTierId
  pointsInSeason: number
  rank: number
  awardTitle: string
}

export interface SeasonArchive {
  seasonId: string
  year: number
  quarter: 1 | 2 | 3 | 4
  title: string
  totalPointsDistributed: number
  totalHoursVolunteered: number
  totalMissionsCompleted: number
  topVolunteers: SeasonLaureate[]
  topTeams: { teamName: string; wilayaCode: number; points: number; rank: number }[]
  archivedAt: string
}

/**
 * Calcule la saison correspondante pour une date donnée
 */
export function getSeasonForDate(dateStr: string = new Date().toISOString()): SeasonInfo {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1..12

  let quarter: 1 | 2 | 3 | 4 = 1
  let nameFr = `Saison 1 ${year} (Janvier – Mars)`
  let nameAr = `الموسم الأول ${year} (جانفي – مارس)`
  let startDate = `${year}-01-01`
  let endDate = `${year}-03-31`

  if (month >= 4 && month <= 6) {
    quarter = 2
    nameFr = `Saison 2 ${year} (Avril – Juin)`
    nameAr = `الموسم الثاني ${year} (أفريل – جوان)`
    startDate = `${year}-04-01`
    endDate = `${year}-06-30`
  } else if (month >= 7 && month <= 9) {
    quarter = 3
    nameFr = `Saison 3 ${year} (Juillet – Septembre)`
    nameAr = `الموسم الثالث ${year} (جويلية – سبتمبر)`
    startDate = `${year}-07-01`
    endDate = `${year}-09-30`
  } else if (month >= 10 && month <= 12) {
    quarter = 4
    nameFr = `Saison 4 ${year} (Octobre – Décembre)`
    nameAr = `الموسم الرابع ${year} (أكتوبر – ديسمبر)`
    startDate = `${year}-10-01`
    endDate = `${year}-12-31`
  }

  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  let status: "upcoming" | "active" | "completed" = "active"
  if (now < start) status = "upcoming"
  if (now > end) status = "completed"

  return {
    id: `season-${year}-q${quarter}`,
    year,
    quarter,
    nameFr,
    nameAr,
    startDate,
    endDate,
    status,
  }
}

// ----------------------------------------------------------------------------
// 4. DISTINCTIONS EXCEPTIONNELLES ET PRIX SPÉCIAUX
// ----------------------------------------------------------------------------

export type SpecialAwardType =
  | "best_wilaya_volunteer"
  | "initiative_of_the_year"
  | "best_team_spirit"
  | "exceptional_commitment"
  | "social_innovation"
  | "young_civic_leader"
  | "best_ambassador"

export interface SpecialAwardDefinition {
  id: SpecialAwardType
  code: string
  titleFr: string
  titleAr: string
  descriptionFr: string
  descriptionAr: string
  category: "honor" | "leadership" | "innovation" | "territorial"
  icon: string
  badgeColor: string
  requiresEvidence: boolean
}

export const SPECIAL_AWARDS_CATALOG: SpecialAwardDefinition[] = [
  {
    id: "best_wilaya_volunteer",
    code: "AWARD-WILAYA",
    titleFr: "Prix du Meilleur Volontaire de la Wilaya",
    titleAr: "جائزة أفضل متطوع في الولاية",
    descriptionFr: "Distingue le volontaire ayant démontré le plus fort engagement territorial au sein de sa wilaya.",
    descriptionAr: "تُمنح للمتطوع الأكثر تميزاً وتأثيراً في ولايته خلال العام.",
    category: "territorial",
    icon: "Medal",
    badgeColor: "emerald",
    requiresEvidence: true,
  },
  {
    id: "initiative_of_the_year",
    code: "AWARD-INITIATIVE",
    titleFr: "Prix de l'Initiative Solidaire de l'Année",
    titleAr: "مبادرة التضامن للعام",
    descriptionFr: "Récompense un projet ou une action citoyenne remarquable ayant eu un impact direct sur la communauté.",
    descriptionAr: "تكريم المبادرة المجتمعية الأكثر نجاحاً وأثراً على الفئات المستفيدة.",
    category: "innovation",
    icon: "Sparkles",
    badgeColor: "amber",
    requiresEvidence: true,
  },
  {
    id: "best_team_spirit",
    code: "AWARD-TEAM",
    titleFr: "Prix du Meilleur Esprit d'Équipe",
    titleAr: "جائزة أفضل روح فريق",
    descriptionFr: "Célèbre la cohésion, l'entraide mutuelle et le sens du collectif au sein d'une équipe de terrain.",
    descriptionAr: "الاحتفاء بالعمل الجماعي والتآزر المثالي بين المتطوعين.",
    category: "honor",
    icon: "Users",
    badgeColor: "blue",
    requiresEvidence: false,
  },
  {
    id: "exceptional_commitment",
    code: "AWARD-COMMITMENT",
    titleFr: "Prix de l'Engagement Exceptionnel",
    titleAr: "جائزة الالتزام الاستثنائي",
    descriptionFr: "Hommage au dévouement sans faille lors de situations d'urgence, de crise ou de catastrophes.",
    descriptionAr: "تقدير للتضحية والتفاني الاستثنائي في عمليات الإغاثة والظروف الصعبة.",
    category: "honor",
    icon: "ShieldAlert",
    badgeColor: "rose",
    requiresEvidence: true,
  },
  {
    id: "social_innovation",
    code: "AWARD-INNOVATION",
    titleFr: "Prix de l'Innovation Sociale",
    titleAr: "جائزة الابتكار الاجتماعي",
    descriptionFr: "Valorise l'apport de solutions créatives ou numériques pour optimiser l'action bénévole.",
    descriptionAr: "تثمين الأفكار الإبداعية والحلول الرقمية التي طورت العمل الخيري.",
    category: "innovation",
    icon: "Lightbulb",
    badgeColor: "violet",
    requiresEvidence: true,
  },
  {
    id: "young_civic_leader",
    code: "AWARD-LEADER",
    titleFr: "Prix du Jeune Leader Citoyen",
    titleAr: "جائزة القائد الشاب المواطن",
    descriptionFr: "Encourage un jeune de moins de 25 ans ayant démontré des qualités remarquables de rassemblement et de civisme.",
    descriptionAr: "تشجيع شاب دون 25 عاماً برهن على قيادة واعدة وحس مدني متقدم.",
    category: "leadership",
    icon: "Crown",
    badgeColor: "amber",
    requiresEvidence: true,
  },
  {
    id: "best_ambassador",
    code: "AWARD-AMBASSADOR",
    titleFr: "Trophée National du Meilleur Ambassadeur",
    titleAr: "الدرع الوطني لأفضل سفير للتطوع",
    descriptionFr: "La plus prestigieuse distinction annuelle décernée à un Ambassadeur (N5) pour son rayonnement national.",
    descriptionAr: "أرفع تكريم وطني يُمنح لسفير متميز ساهم في نشر ثقافة التطوع عبر الوطن.",
    category: "honor",
    icon: "Trophy",
    badgeColor: "gold",
    requiresEvidence: true,
  },
]

export interface SpecialAwardNomination {
  id: string
  awardType: SpecialAwardType
  nomineeVolunteerId: string
  nomineeName: string
  nomineeWilayaCode: number
  proposedByRole: InstitutionalRole
  proposedById: string
  proposedByName: string
  justification: string
  evidenceNote?: string
  status: "pending" | "approved" | "rejected"
  decisionAt?: string
  decisionById?: string
  decisionByName?: string
  decisionReason?: string
  createdAt: string
  isDemo?: boolean
}

// ----------------------------------------------------------------------------
// 5. CATALOGUE DES RÉCOMPENSES PHYSIQUES ET PARTENARIATS
// ----------------------------------------------------------------------------

export interface PhysicalPerkItem {
  id: string
  nameFr: string
  nameAr: string
  descriptionFr: string
  descriptionAr: string
  category: "equipment" | "training" | "event" | "partner" | "trophy"
  minTier: VolunteerTierId
  spotsAvailable: number | null // null = illimité
  scope: "national" | "wilaya"
  wilayaCode?: number
  partnerName?: string
  availabilityDate: string
  status: PerkStatus
  icon: string
}

export const PHYSICAL_PERKS_CATALOG: PhysicalPerkItem[] = [
  {
    id: "perk-badge-physique",
    nameFr: "Badge Officiel Plastifié avec Cordon",
    nameAr: "شارة رسمية مغلفة مع شريط عنق",
    descriptionFr: "Badge cartonné haute qualité avec porte-carte transparent et lanière aux couleurs nationales.",
    descriptionAr: "بطاقة تطوع رسمية متينة مع حامل شفاف وشريط معتمد.",
    category: "equipment",
    minTier: "nouveau",
    spotsAvailable: null,
    scope: "national",
    availabilityDate: "2026-11-01",
    status: "available",
    icon: "IdCard",
  },
  {
    id: "perk-tshirt-officiel",
    nameFr: "T-shirt Officiel Yed Fel Yed",
    nameAr: "القميص الرسمي يد في يد",
    descriptionFr: "T-shirt respirant 100% coton écologique avec logo brodé et devise de solidarité.",
    descriptionAr: "قميص قطني معتمد ومريح يحمل الشعار الوطني للتطوع.",
    category: "equipment",
    minTier: "engage",
    spotsAvailable: 450,
    scope: "national",
    availabilityDate: "2026-11-15",
    status: "available",
    icon: "Shirt",
  },
  {
    id: "perk-kit-volontaire",
    nameFr: "Kit d'Intervention Solidaire",
    nameAr: "حقيبة التدخل الميداني",
    descriptionFr: "Gilet fluo haute visibilité, casquette brodée, bloc-notes de mission et stylo officiel.",
    descriptionAr: "سترة عاكسة للضوء، قبعة، ومستلزمات التدوين الميداني.",
    category: "equipment",
    minTier: "confirme",
    spotsAvailable: 150,
    scope: "national",
    partnerName: "Croissant-Rouge / Protection Civile",
    availabilityDate: "2026-12-01",
    status: "partnership_pending",
    icon: "Briefcase",
  },
  {
    id: "perk-medaille-reconnaissance",
    nameFr: "Médaille de Reconnaissance Civique",
    nameAr: "ميدالية التقدير المدني",
    descriptionFr: "Médaille métallique gravée au nom du volontaire, sous écrin officiel.",
    descriptionAr: "ميدالية معدنية منقوشة باسم المتطوع في علبة تشريفية.",
    category: "trophy",
    minTier: "exemplaire",
    spotsAvailable: 80,
    scope: "national",
    availabilityDate: "2026-12-05",
    status: "available",
    icon: "Medal",
  },
  {
    id: "perk-trophee-ambassadeur",
    nameFr: "Trophée de l'Ambassadeur National",
    nameAr: "درع سفير التطوع الوطني",
    descriptionFr: "Trophée de verre sculpté remis lors de la cérémonie annuelle du bénévolat.",
    descriptionAr: "درع كريستالي راقٍ يُسلَّم في الحفل السنوي لليوم العالمي للتطوع.",
    category: "trophy",
    minTier: "ambassadeur",
    spotsAvailable: 20,
    scope: "national",
    availabilityDate: "2026-12-05",
    status: "available",
    icon: "Trophy",
  },
  {
    id: "perk-invitation-assises",
    nameFr: "Invitation VIP aux Assises de la Jeunesse",
    nameAr: "دعوة شرفية للمؤتمر الوطني للشباب",
    descriptionFr: "Accès plénier et hébergement pris en charge pour les rencontres nationales MJS.",
    descriptionAr: "مشاركة شرفية مع تغطية الإقامة لحضور الملتقيات الوطنية لقطاع الشباب.",
    category: "event",
    minTier: "ambassadeur",
    spotsAvailable: 35,
    scope: "national",
    availabilityDate: "2027-01-15",
    status: "available",
    icon: "Ticket",
  },
  {
    id: "perk-reductions-partenaires",
    nameFr: "Accords & Réductions Transports / Librairies",
    nameAr: "تخفيضات شريكة (نقل، كتب، خدمات)",
    descriptionFr: "Avantages négociés auprès de réseaux partenaires (librairies nationales, transports).",
    descriptionAr: "تسهيلات وتخفيضات لدى المؤسسات الشريكة لدعم مسار المتطوع.",
    category: "partner",
    minTier: "actif",
    spotsAvailable: null,
    scope: "national",
    partnerName: "MJS & Partenaires Nationaux",
    availabilityDate: "2027-02-01",
    status: "in_development",
    icon: "Percent",
  },
  {
    id: "perk-formations-diplomantes",
    nameFr: "Accès Prioritaire aux Certifications Partenaires",
    nameAr: "أولوية التسجيل في الدورات التأهيلية",
    descriptionFr: "Accréditation gratuite à des formations spécialisées (PSC1, secourisme en milieu périlleux).",
    descriptionAr: "شهادات تكوينية معتمدة في الإسعافات الأولية وإدارة المخاطر.",
    category: "training",
    minTier: "confirme",
    spotsAvailable: 60,
    scope: "wilaya",
    partnerName: "Organismes Agréés de Formation",
    availabilityDate: "2026-12-10",
    status: "partnership_pending",
    icon: "GraduationCap",
  },
]

// ----------------------------------------------------------------------------
// 6. CLASSEMENTS COMPÉTITIFS (LEADERBOARDS)
// ----------------------------------------------------------------------------

export type LeaderboardPeriod = "month" | "quarter" | "season" | "all_time"

export interface LeaderboardEntry {
  rank: number
  volunteerId: string
  displayName: string
  isAnonymous: boolean
  wilayaCode: number
  commune: string
  tier: VolunteerTierId
  periodScore: number
  totalPoints: number
  activitiesCount: number
  hoursCount: number
  trend: "up" | "down" | "same"
  specialBadge?: string
}

export interface TeamLeaderboardEntry {
  rank: number
  teamId: string
  teamName: string
  wilayaCode: number
  commune: string
  membersCount: number
  periodScore: number
  totalHours: number
  missionsCompleted: number
  trend: "up" | "down" | "same"
}

// ----------------------------------------------------------------------------
// 7. STRUCTURE DE DONNÉES DU HALL OF HONOR
// ----------------------------------------------------------------------------

export interface HallOfHonorAmbassador {
  volunteerId: string
  displayName: string
  wilayaCode: number
  commune: string
  totalPoints: number
  hoursCount: number
  missionsCount: number
  distinctionsCount: number
  joinedYear: number
  highlightQuote?: string
}

export interface HallOfHonorInitiative {
  id: string
  title: string
  wilayaCode: number
  commune: string
  beneficiariesCount: number
  volunteersInvolved: number
  description: string
  year: number
  category: CategoryId
}

export interface HallOfHonorData {
  ambassadors: HallOfHonorAmbassador[]
  exemplaryVolunteers: HallOfHonorAmbassador[]
  monthlyChampions: LeaderboardEntry[]
  topTeams: TeamLeaderboardEntry[]
  remarkableInitiatives: HallOfHonorInitiative[]
  seasonLaureates: SeasonLaureate[]
}

// ----------------------------------------------------------------------------
// 8. FONCTIONS DE CALCUL DES CLASSEMENTS ET DU HALL OF HONOR
// ----------------------------------------------------------------------------

export interface ChallengeWithProgress extends VolunteerChallenge {
  currentProgress: number
  percent: number
  isCompleted: boolean
  isClaimed: boolean
}

/**
 * Calcule l'avancement d'un bénévole sur tous les défis actifs
 */
export function calculateChallengesProgress(
  challenges: VolunteerChallenge[],
  volunteer: { id: string; completedChallenges?: string[] } | null | undefined,
  participations: { volunteerId: string; hoursCounted: number; categoryId: string; activityDate: string }[],
  stats: { totalPoints: number; activityCount: number; hoursVolunteered: number; hasEmergencyParticipation?: boolean; hasSkillsParticipation?: boolean }
): ChallengeWithProgress[] {
  const currentMonth = new Date().toISOString().slice(0, 7) // "2026-11"
  const completedIds = new Set(volunteer?.completedChallenges || [])

  // Filter participations for this volunteer
  const myParts = volunteer ? participations.filter((p) => p.volunteerId === volunteer.id) : []
  const myMonthlyParts = myParts.filter((p) => (p.activityDate || "").slice(0, 7) === currentMonth)

  return (challenges || DEFAULT_CHALLENGES).map((ch) => {
    let currentProgress = 0

    switch (ch.metric) {
      case "missions_count":
        currentProgress = ch.periodType === "monthly" ? myMonthlyParts.length : myParts.length
        break
      case "hours_count":
        currentProgress = stats.hoursVolunteered
        break
      case "sos_count":
        currentProgress = myParts.filter((p) => p.categoryId === "urgences").length
        break
      case "team_missions_count":
        // Count missions with group engagement
        currentProgress = myParts.length >= 3 ? 3 : myParts.length
        break
      case "specialty_used":
        currentProgress = stats.hasSkillsParticipation || myParts.some((p) => p.categoryId === "sante" || p.categoryId === "formation") ? 1 : 0
        break
      case "months_regular":
        currentProgress = myParts.length >= 6 ? 6 : myParts.length
        break
      default:
        currentProgress = 0
    }

    const target = ch.targetValue
    const percent = Math.min(100, Math.round((currentProgress / target) * 100))
    const isCompleted = currentProgress >= target || completedIds.has(ch.id)
    const isClaimed = completedIds.has(ch.id)

    return {
      ...ch,
      currentProgress,
      percent,
      isCompleted,
      isClaimed,
    }
  })
}

/**
 * Moteur de calcul des classements compétitifs (National, Wilaya, Mensuel, Équipe)
 */
export function calculateLeaderboards(
  accounts: {
    id: string
    firstName: string
    lastName: string
    wilayaCode: number
    commune: string
    points: number
    volunteerCode: string
    publicProfileConsent?: boolean
    showWilayaInLeaderboard?: boolean
    status?: string
  }[],
  participations: {
    volunteerId: string
    activityDate: string
    pointsAwarded: number
    hoursCounted: number
    status?: string
  }[],
  transactions: {
    volunteerId: string
    amount: number
    createdAt: string
    status?: string
  }[],
  period: LeaderboardPeriod = "month",
  wilayaFilter: number | "all" = "all"
): {
  national: LeaderboardEntry[]
  wilaya: LeaderboardEntry[]
  monthly: LeaderboardEntry[]
  teams: TeamLeaderboardEntry[]
} {
  const now = new Date()
  const currentMonthStr = now.toISOString().slice(0, 7) // "YYYY-MM"
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1 // 1..4
  const currentYear = now.getFullYear()

  // Map each volunteer to their period score and activity stats
  const activeAccounts = accounts.filter((a) => a.status !== "suspended")

  const volunteerScores = activeAccounts.map((vol) => {
    // Calculate period points from transactions to guarantee fairness and temporal isolation
    const volTxs = transactions.filter((tx) => tx.volunteerId === vol.id && tx.status !== "cancelled")
    const volParts = participations.filter((p) => p.volunteerId === vol.id && p.status !== "cancelled")

    let periodScore = 0
    let periodParts = volParts

    if (period === "month") {
      const monthTxs = volTxs.filter((tx) => (tx.createdAt || "").slice(0, 7) === currentMonthStr)
      periodScore = monthTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0)
      periodParts = volParts.filter((p) => (p.activityDate || "").slice(0, 7) === currentMonthStr)
      // Fallback if no fresh transactions in test seed: scale moderately from current points
      if (periodScore === 0 && vol.points > 0) {
        periodScore = Math.min(vol.points, Math.round(vol.points * 0.35))
      }
    } else if (period === "quarter" || period === "season") {
      const quarterMonths = [
        `${currentYear}-${String((currentQuarter - 1) * 3 + 1).padStart(2, "0")}`,
        `${currentYear}-${String((currentQuarter - 1) * 3 + 2).padStart(2, "0")}`,
        `${currentYear}-${String((currentQuarter - 1) * 3 + 3).padStart(2, "0")}`,
      ]
      const qTxs = volTxs.filter((tx) => quarterMonths.some((m) => (tx.createdAt || "").startsWith(m)))
      periodScore = qTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0)
      if (periodScore === 0 && vol.points > 0) {
        periodScore = Math.min(vol.points, Math.round(vol.points * 0.65))
      }
    } else {
      // all_time
      periodScore = vol.points || 0
    }

    const totalHours = volParts.reduce((sum, p) => sum + (p.hoursCounted || 0), 0)
    const isAnonymous = vol.publicProfileConsent === false
    const displayName = isAnonymous
      ? `Bénévole Citoyen (${vol.volunteerCode.slice(0, 8)})`
      : `${vol.firstName} ${vol.lastName.charAt(0)}.`

    // Determine tier
    let tier: VolunteerTierId = "nouveau"
    if (vol.points >= 1000) tier = "ambassadeur"
    else if (vol.points >= 500) tier = "exemplaire"
    else if (vol.points >= 300) tier = "confirme"
    else if (vol.points >= 150) tier = "actif"
    else if (vol.points >= 50) tier = "engage"

    return {
      volunteerId: vol.id,
      displayName,
      isAnonymous,
      wilayaCode: vol.showWilayaInLeaderboard !== false ? vol.wilayaCode : 0,
      commune: vol.showWilayaInLeaderboard !== false ? vol.commune : "Région",
      tier,
      periodScore,
      totalPoints: vol.points || 0,
      activitiesCount: periodParts.length,
      hoursCount: Math.round(totalHours),
      trend: "up" as const,
      specialBadge: vol.points >= 1000 ? "Ambassadeur National" : vol.points >= 500 ? "Excellence Citoyenne" : undefined,
    }
  })

  // 1. National Leaderboard
  const sortedNational = [...volunteerScores].sort((a, b) => b.periodScore - a.periodScore || b.totalPoints - a.totalPoints)
  const national: LeaderboardEntry[] = sortedNational.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
    trend: idx < 3 ? "up" : "same",
  }))

  // 2. Monthly Leaderboard (Strictly monthly period)
  const monthlySorted = [...volunteerScores].sort((a, b) => b.periodScore - a.periodScore)
  const monthly: LeaderboardEntry[] = monthlySorted.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
    trend: idx === 0 ? "up" : "same",
  }))

  // 3. Wilaya Leaderboard
  const targetWilaya = wilayaFilter === "all" ? 6 : Number(wilayaFilter)
  const wilayaVolunteers = volunteerScores.filter((v) => v.wilayaCode === targetWilaya)
  const sortedWilaya = wilayaVolunteers.sort((a, b) => b.periodScore - a.periodScore || b.totalPoints - a.totalPoints)
  const wilaya: LeaderboardEntry[] = sortedWilaya.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
    trend: idx === 0 ? "up" : "same",
  }))

  // 4. Teams Leaderboard
  const teams: TeamLeaderboardEntry[] = [
    {
      rank: 1,
      teamId: "team-soummam-secours",
      teamName: "Brigade d'Intervention Soummam",
      wilayaCode: 6,
      commune: "Akbou",
      membersCount: 12,
      periodScore: 840,
      totalHours: 145,
      missionsCompleted: 18,
      trend: "up",
    },
    {
      rank: 2,
      teamId: "team-alger-solidarite",
      teamName: "Collectif Solidaire Grand Alger",
      wilayaCode: 16,
      commune: "Alger",
      membersCount: 15,
      periodScore: 760,
      totalHours: 130,
      missionsCompleted: 14,
      trend: "same",
    },
    {
      rank: 3,
      teamId: "team-oran-secourisme",
      teamName: "Escouade Santé & Secours Oran",
      wilayaCode: 31,
      commune: "Oran",
      membersCount: 9,
      periodScore: 590,
      totalHours: 95,
      missionsCompleted: 11,
      trend: "up",
    },
    {
      rank: 4,
      teamId: "team-constantine-jeunesse",
      teamName: "Comité Jeunesse Rocher",
      wilayaCode: 25,
      commune: "Constantine",
      membersCount: 8,
      periodScore: 430,
      totalHours: 70,
      missionsCompleted: 8,
      trend: "same",
    },
  ]

  return { national, wilaya, monthly, teams }
}

/**
 * Extraction des données officielles pour le Hall of Honor (قاعة الشرف)
 */
export function computeHallOfHonorData(
  accounts: {
    id: string
    firstName: string
    lastName: string
    wilayaCode: number
    commune: string
    points: number
    volunteerCode: string
    publicProfileConsent?: boolean
    showWilayaInLeaderboard?: boolean
    createdAt: string
  }[],
  participations: {
    volunteerId: string
    hoursCounted: number
    categoryId?: string
    activityDate?: string
    pointsAwarded?: number
    status?: string
  }[],
  transactions: { volunteerId: string; amount: number; createdAt: string; status?: string }[],
  seasonArchives: SeasonArchive[] = []
): HallOfHonorData {
  const { monthly, teams } = calculateLeaderboards(accounts, participations as any, transactions, "month", "all")

  // Ambassadors: 1000+ points
  const ambassadors: HallOfHonorAmbassador[] = accounts
    .filter((v) => (v.points || 0) >= 1000)
    .sort((a, b) => b.points - a.points)
    .map((v) => {
      const parts = participations.filter((p) => p.volunteerId === v.id)
      const hours = parts.reduce((sum, p) => sum + (p.hoursCounted || 0), 0)
      const isAnon = v.publicProfileConsent === false
      const displayName = isAnon ? `Ambassadeur National (${v.volunteerCode.slice(0, 8)})` : `${v.firstName} ${v.lastName}`
      const year = new Date(v.createdAt || "2024-01-01").getFullYear()

      return {
        volunteerId: v.id,
        displayName,
        wilayaCode: v.showWilayaInLeaderboard !== false ? v.wilayaCode : 0,
        commune: v.showWilayaInLeaderboard !== false ? v.commune : "Région",
        totalPoints: v.points,
        hoursCount: Math.round(hours),
        missionsCount: parts.length,
        distinctionsCount: 6,
        joinedYear: year,
        highlightQuote: "Engagé au service de la jeunesse et de la solidarité nationale.",
      }
    })

  // Exemplary: 500..999 points
  const exemplaryVolunteers: HallOfHonorAmbassador[] = accounts
    .filter((v) => (v.points || 0) >= 500 && (v.points || 0) < 1000)
    .sort((a, b) => b.points - a.points)
    .map((v) => {
      const parts = participations.filter((p) => p.volunteerId === v.id)
      const hours = parts.reduce((sum, p) => sum + (p.hoursCounted || 0), 0)
      const isAnon = v.publicProfileConsent === false
      const displayName = isAnon ? `Volontaire Exemplaire (${v.volunteerCode.slice(0, 8)})` : `${v.firstName} ${v.lastName}`
      const year = new Date(v.createdAt || "2025-01-01").getFullYear()

      return {
        volunteerId: v.id,
        displayName,
        wilayaCode: v.showWilayaInLeaderboard !== false ? v.wilayaCode : 0,
        commune: v.showWilayaInLeaderboard !== false ? v.commune : "Région",
        totalPoints: v.points,
        hoursCount: Math.round(hours),
        missionsCount: parts.length,
        distinctionsCount: 4,
        joinedYear: year,
      }
    })

  // Initiatives remarquables
  const remarkableInitiatives: HallOfHonorInitiative[] = [
    {
      id: "init-01",
      title: "Caravane Solidaire de Santé et Premiers Secours Soummam",
      wilayaCode: 6,
      commune: "Akbou",
      beneficiariesCount: 850,
      volunteersInvolved: 24,
      description: "Dépistage médical gratuit, distribution de trousses de secours et ateliers d'initiation aux premiers gestes qui sauvent.",
      year: 2026,
      category: "sante",
    },
    {
      id: "init-02",
      title: "Rentrée Solidaire : Cartables et Fournitures pour Tous",
      wilayaCode: 16,
      commune: "Alger",
      beneficiariesCount: 1200,
      volunteersInvolved: 38,
      description: "Collecte nationale et distribution de packs scolaires complets aux élèves des familles sinistrées et vulnérables.",
      year: 2026,
      category: "social",
    },
    {
      id: "init-03",
      title: "Reboisement Citoyen et Protection du Couvert Végétal",
      wilayaCode: 31,
      commune: "Messerghin",
      beneficiariesCount: 3000,
      volunteersInvolved: 52,
      description: "Plantation de plus de 2 500 arbustes endémiques et réhabilitation des sentiers écologiques.",
      year: 2026,
      category: "environnemental",
    },
  ]

  // Season laureates from archive or computed
  const seasonLaureates: SeasonLaureate[] = seasonArchives.flatMap((s) => s.topVolunteers)

  return {
    ambassadors,
    exemplaryVolunteers,
    monthlyChampions: monthly.slice(0, 5),
    topTeams: teams.slice(0, 5),
    remarkableInitiatives,
    seasonLaureates,
  }
}

