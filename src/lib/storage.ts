import type {
  AppData,
  Activity,
  Announcement,
  Association,
  Cagnotte,
  Donation,
  EventItem,
  Institution,
  NewsArticle,
  Registrant,
  SosCollectionSite,
  SosDamagedSite,
} from "./types"
import { CAGNOTTE_TYPES } from "./cagnottes"
import { seedAssociationsFromCatalog } from "./associations"
import type { CategoryId } from "./categories"

const STORAGE_KEY = "yfy-akbou-data-v3"
const AUTH_KEY = "yfy-akbou-admin"

function uid() {
  return crypto.randomUUID()
}

function buildSeedCagnottes(): Cagnotte[] {
  const list: Cagnotte[] = []
  for (let code = 1; code <= 69; code++) {
    for (const type of CAGNOTTE_TYPES) {
      const variance = ((code * 17 + type.id.length * 31) % 40) / 100
      const goal = Math.round(type.defaultGoal * (0.85 + variance))
      const raised = Math.round(goal * (((code * 13 + type.id.charCodeAt(0)) % 55) / 100))
      list.push({
        id: `cag-${String(code).padStart(2, "0")}-${type.id}`,
        typeId: type.id,
        wilayaCode: code,
        goalAmount: goal,
        raisedAmount: raised,
        published: true,
      })
    }
  }
  return list
}

const seedData: AppData = {
  events: [
    {
      id: uid(),
      title: "يوم شباب ولاية بجاية",
      description: "تظاهرة شبابية تجمع المؤسسات والجمعيات الشبانية لولاية بجاية.",
      date: "2026-06-25",
      location: "بجاية",
      institution: "يد في يد",
      imageDataUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
      categoryId: "evenementiel",
      requiresRegistration: true,
      published: true,
    },
    {
      id: uid(),
      title: "ملتقى الابتكار والبرمجة",
      description: "ورشات تدريبية وعرض مشاريع رقمية مبتكرة لشباب المنطقة.",
      date: "2026-07-10",
      location: "أميزور",
      institution: "بيت الشباب أميزور",
      imageDataUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
      categoryId: "educatif",
      requiresRegistration: false,
      published: true,
    },
    {
      id: uid(),
      title: "حملة تشجير وحماية الغابات",
      description: "مبادرة بيئية كبرى لإعادة تشجير المناطق الغابية وحمايتها.",
      date: "2026-07-18",
      location: "أقبو",
      institution: "يد في يد",
      imageDataUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80",
      categoryId: "environnemental",
      requiresRegistration: true,
      published: true,
    },
    {
      id: uid(),
      title: "مخيم صيفي وأنشطة كشفية",
      description: "مخيم تدريبي وتطوعي للشباب على شاطئ توجة مع أنشطة استكشافية.",
      date: "2026-08-01",
      location: "توجة",
      institution: "مخيم الشباب توجة",
      imageDataUrl: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80",
      categoryId: "scoutisme",
      requiresRegistration: true,
      published: true,
    },
    {
      id: uid(),
      title: "قافلة التضامن والصحة الجوارية",
      description: "فحوصات طبية واستشارات وقائية وتوزيع طرود للمحتاجين.",
      date: "2026-08-15",
      location: "سيدي عيش",
      institution: "يد في يد",
      imageDataUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
      categoryId: "sante",
      requiresRegistration: false,
      published: true,
    },
    {
      id: uid(),
      title: "توزيع المساعدات للأسر المعوزة",
      description: "مبادرة خيرية للتكفل بالعائلات وتوزيع الاحتياجات الأساسية.",
      date: "2026-08-22",
      location: "بجاية وسط",
      institution: "يد في يد",
      imageDataUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
      categoryId: "social",
      requiresRegistration: false,
      published: true,
    },
  ],
  announcements: [
    {
      id: uid(),
      title: "فتح باب التسجيل — المخيمات الصيفية",
      description: "التسجيل مفتوح للمنخرطين في مؤسسات الشباب للمشاركة في المخيمات الصيفية.",
      openFrom: "2026-05-01",
      openUntil: "2026-06-15",
      maxSlots: 120,
      active: true,
    },
    {
      id: uid(),
      title: "تسجيل ورشات البرمجة",
      description: "انضم إلى ورشات البرمجة للمبتدئين.",
      openFrom: "2026-06-01",
      openUntil: "2026-06-20",
      maxSlots: 40,
      active: true,
    },
  ],
  activities: [
    {
      id: uid(),
      title: "ورشة البرمجة للمبتدئين",
      description: "تعلم أساسيات البرمجة بلغة Python مع مدربين متخصصين.",
      date: "2026-06-15",
      day: "15",
      month: "جوان",
      location: "بجاية",
      institution: "بيت الشباب بجاية",
      imageDataUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
      published: true,
    },
    {
      id: uid(),
      title: "يوم رياضي مفتوح",
      description: "يوم كامل من الأنشطة الرياضية المتنوعة للشباب.",
      date: "2026-06-20",
      day: "20",
      month: "جوان",
      location: "تيزي وزو",
      institution: "المركب الرياضي تيزي وزو",
      imageDataUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
      published: true,
    },
    {
      id: uid(),
      title: "مخيم صيفي للشباب",
      description: "مخيم لمدة 5 أيام على شاطئ توجة.",
      date: "2026-07-01",
      day: "1",
      month: "جويلية",
      location: "توجة",
      institution: "مخيم الشباب توجة",
      imageDataUrl: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80",
      published: true,
    },
    {
      id: uid(),
      title: "مسابقة الابتكار العلمي",
      description: "عرض مشاريع علمية من شباب المؤسسات.",
      date: "2026-07-08",
      day: "8",
      month: "جويلية",
      location: "أميزور",
      institution: "بيت الشباب أميزور",
      imageDataUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
      published: true,
    },
  ],
  institutions: [
    {
      id: uid(),
      name: "بيت الشباب بجاية",
      type: "بيت الشباب",
      location: "بجاية وسط",
      phone: "034 21 00 00",
      imageDataUrl: "https://images.unsplash.com/photo-1541888090710-530182ce6a7a?w=800&q=80",
      published: true,
      wilayaCode: 6,
      lat: 36.7525,
      lng: 5.0833,
      structureKind: "maison_jeunes",
      authority: "Yed fel yed",
    },
    {
      id: uid(),
      name: "دار الشباب أميزور",
      type: "دار الشباب",
      location: "أميزور، بجاية",
      phone: "",
      imageDataUrl: "https://images.unsplash.com/photo-1541888090710-530182ce6a7a?w=800&q=80",
      published: true,
      wilayaCode: 6,
      lat: 36.6431,
      lng: 4.9069,
      structureKind: "maison_jeunes",
      authority: "Yed fel yed",
    },
    {
      id: uid(),
      name: "مخيم الشباب توجة",
      type: "مخيم صيفي",
      location: "توجة، بجاية",
      phone: "",
      imageDataUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80",
      published: true,
      wilayaCode: 6,
      lat: 36.761,
      lng: 4.833,
      structureKind: "camp",
      authority: "Yed fel yed",
    },
    {
      id: uid(),
      name: "المركز الثقافي أقبو",
      type: "مركز ثقافي",
      location: "أقبو، بجاية",
      phone: "034 35 00 00",
      imageDataUrl: "https://images.unsplash.com/photo-1518398046578-8cca57782e17?w=800&q=80",
      published: true,
      wilayaCode: 6,
      lat: 36.62,
      lng: 4.68,
      structureKind: "centre_culturel",
      authority: "DJS",
    },
    {
      id: uid(),
      name: "ملعب جواري تيشي",
      type: "ملعب جواري",
      location: "تيشي، بجاية",
      phone: "",
      imageDataUrl: "https://images.unsplash.com/photo-1529900965798-fa561d3106e2?w=800&q=80",
      published: true,
      wilayaCode: 6,
      lat: 36.748,
      lng: 5.057,
      structureKind: "terrain",
      authority: "DJS",
    },
    {
      id: uid(),
      name: "المركب الرياضي تيزي وزو",
      type: "مركب رياضي",
      location: "تيزي وزو",
      phone: "026 21 00 00",
      imageDataUrl: "https://images.unsplash.com/photo-1529900965798-fa561d3106e2?w=800&q=80",
      published: true,
      wilayaCode: 15,
      lat: 36.7117,
      lng: 4.0458,
      structureKind: "terrain",
      authority: "DJS",
    },
    {
      id: uid(),
      name: "Maison de jeunes El Madania",
      type: "Maison de jeunes",
      location: "El Madania, Alger",
      phone: "021 00 00 00",
      imageDataUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&q=80",
      published: true,
      wilayaCode: 16,
      lat: 36.743,
      lng: 3.067,
      structureKind: "maison_jeunes",
      authority: "Yed fel yed",
    },
    {
      id: uid(),
      name: "Auberge de jeunesse Bab El Oued",
      type: "Auberge de jeunesse",
      location: "Bab El Oued, Alger",
      phone: "",
      imageDataUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80",
      published: true,
      wilayaCode: 16,
      lat: 36.791,
      lng: 3.05,
      structureKind: "auberge",
      authority: "Yed fel yed",
    },
    {
      id: uid(),
      name: "Foyer de jeunes Bir Mourad Raïs",
      type: "Foyer de jeunes",
      location: "Bir Mourad Raïs, Alger",
      phone: "",
      imageDataUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
      published: true,
      wilayaCode: 16,
      lat: 36.737,
      lng: 3.04,
      structureKind: "foyer",
      authority: "DJS",
    },
    {
      id: uid(),
      name: "Maison de jeunes Oran Centre",
      type: "Maison de jeunes",
      location: "Oran",
      phone: "041 00 00 00",
      imageDataUrl: "https://images.unsplash.com/photo-1541888090710-530182ce6a7a?w=800&q=80",
      published: true,
      wilayaCode: 31,
      lat: 35.697,
      lng: -0.634,
      structureKind: "maison_jeunes",
      authority: "Yed fel yed",
    },
    {
      id: uid(),
      name: "Auberge de jeunesse Canastel",
      type: "Auberge de jeunesse",
      location: "Canastel, Oran",
      phone: "",
      imageDataUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80",
      published: true,
      wilayaCode: 31,
      lat: 35.74,
      lng: -0.58,
      structureKind: "auberge",
      authority: "Yed fel yed",
    },
    {
      id: uid(),
      name: "Maison de jeunes Constantine",
      type: "Maison de jeunes",
      location: "Constantine",
      phone: "031 00 00 00",
      imageDataUrl: "https://images.unsplash.com/photo-1541888090710-530182ce6a7a?w=800&q=80",
      published: true,
      wilayaCode: 25,
      lat: 36.365,
      lng: 6.6147,
      structureKind: "maison_jeunes",
      authority: "Yed fel yed",
    },
    {
      id: uid(),
      name: "Maison de jeunes Sétif",
      type: "Maison de jeunes",
      location: "Sétif",
      phone: "",
      imageDataUrl: "https://images.unsplash.com/photo-1541888090710-530182ce6a7a?w=800&q=80",
      published: true,
      wilayaCode: 19,
      lat: 36.1911,
      lng: 5.4137,
      structureKind: "maison_jeunes",
      authority: "DJS",
    },
    {
      id: uid(),
      name: "Maison de jeunes Annaba",
      type: "Maison de jeunes",
      location: "Annaba",
      phone: "",
      imageDataUrl: "https://images.unsplash.com/photo-1541888090710-530182ce6a7a?w=800&q=80",
      published: true,
      wilayaCode: 23,
      lat: 36.9,
      lng: 7.767,
      structureKind: "maison_jeunes",
      authority: "Yed fel yed",
    },
    {
      id: uid(),
      name: "Maison de jeunes Blida",
      type: "Maison de jeunes",
      location: "Blida",
      phone: "",
      imageDataUrl: "https://images.unsplash.com/photo-1541888090710-530182ce6a7a?w=800&q=80",
      published: true,
      wilayaCode: 9,
      lat: 36.47,
      lng: 2.828,
      structureKind: "maison_jeunes",
      authority: "Yed fel yed",
    },
  ],
  news: [
    {
      id: uid(),
      category: "مقال مميز",
      date: "2026-09-19",
      title: "انطلاق برنامج المخيمات الصيفية",
      description: "ملخص خبر يوم شباب ولاية بجاية - انطلاق برنامج المخيمات الصيفية.",
      imageDataUrl: "https://images.unsplash.com/photo-1504280390227-351bfb01debc?w=800&q=80",
      featured: true,
      published: true,
    },
    {
      id: uid(),
      category: "أخبار",
      date: "2026-09-17",
      title: "تكريم المتطوعين الشباب",
      description: "ملخص خبر يوم شباب ولاية بجاية - تكريم المتطوعين الشباب.",
      imageDataUrl: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&q=80",
      featured: false,
      published: true,
    },
    {
      id: uid(),
      category: "رياضة",
      date: "2026-09-16",
      title: "افتتاح ملعب خماسي جديد",
      description: "ملخص خبر يوم شباب ولاية بجاية - افتتاح ملعب خماسي جديد.",
      imageDataUrl: "https://images.unsplash.com/photo-1518605368461-1eb47b8fb62b?w=800&q=80",
      featured: false,
      published: true,
    },
    {
      id: uid(),
      category: "ثقافة",
      date: "2026-09-15",
      title: "معرض الكتاب الشبابي",
      description: "ملخص خبر يوم شباب ولاية بجاية - معرض الكتاب الشبابي.",
      imageDataUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80",
      featured: false,
      published: true,
    },
    {
      id: uid(),
      category: "صحة",
      date: "2026-09-14",
      title: "حملة التطعيم والوقاية",
      description: "ملخص خبر يوم شباب ولاية بجاية - حملة التطعيم والوقاية.",
      imageDataUrl: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800&q=80",
      featured: false,
      published: true,
    },
  ],
  registrants: [],
  participations: [],
  cagnottes: buildSeedCagnottes(),
  donations: [],
  associations: seedAssociationsFromCatalog(),
  sosCollectionSites: [],
  sosDamagedSites: [],
}

function load(): AppData {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      raw = localStorage.getItem("odej-akbou-data-v3")
    }
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData))
      return structuredClone(seedData)
    }
    const parsed = JSON.parse(raw) as Partial<AppData>
    let changed = false

    const registrants = (parsed.registrants ?? []).map((r) => {
      let next = { ...r }
      let localChanged = false
      if (!next.qrCode) {
        const part = (next.nationalId || next.id).replace(/-/g, "").slice(0, 10).toUpperCase()
        next = { ...next, qrCode: `YFY-${part}` }
        localChanged = true
      }
      if (typeof next.points !== "number") {
        next = { ...next, points: 0 }
        localChanged = true
      }
      if (next.nationalId && next.id !== next.nationalId) {
        next = { ...next, id: next.nationalId }
        localChanged = true
      }
      if (localChanged) changed = true
      return next
    })

    const events = (parsed.events && parsed.events.length >= 4 ? parsed.events : seedData.events).map((e, idx) => {
      let next = { ...e }
      if (next.imageDataUrl === undefined) {
        next = { ...next, imageDataUrl: null }
        changed = true
      }
      if (typeof next.requiresRegistration !== "boolean") {
        next = { ...next, requiresRegistration: false }
        changed = true
      }
      if (!next.categoryId) {
        const cats: CategoryId[] = ["evenementiel", "educatif", "environnemental", "scoutisme", "sante", "social"]
        next = { ...next, categoryId: cats[idx % cats.length] }
        changed = true
      }
      return next
    })

    const activities = (parsed.activities ?? seedData.activities).map((a) => {
      if (a.imageDataUrl === undefined) {
        changed = true
        return { ...a, imageDataUrl: null }
      }
      return a
    })

    let institutions = parsed.institutions ?? seedData.institutions
    if (!parsed.institutions) changed = true
    const geoReady = institutions.some((i) => typeof i.wilayaCode === "number" && typeof i.lat === "number")
    if (!geoReady) {
      institutions = structuredClone(seedData.institutions)
      changed = true
    }

    const news = parsed.news ?? seedData.news
    if (!parsed.news) changed = true

    let cagnottes = parsed.cagnottes ?? []
    if (!parsed.cagnottes || cagnottes.length < CAGNOTTE_TYPES.length * 69) {
      cagnottes = structuredClone(seedData.cagnottes)
      changed = true
    }

    const donations = (parsed.donations ?? []).map((d) => {
      let next = { ...d }
      let localChanged = false
      if (next.associationId === undefined) {
        next = { ...next, associationId: null }
        localChanged = true
      }
      if (next.associationName === undefined) {
        next = { ...next, associationName: null }
        localChanged = true
      }
      if (!next.reference) {
        next = {
          ...next,
          reference: `DON-${next.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`,
        }
        localChanged = true
      }
      if (!next.cagnotteTypeId || typeof next.wilayaCode !== "number") {
        const pot = (parsed.cagnottes ?? []).find((c) => c.id === next.cagnotteId)
        next = {
          ...next,
          cagnotteTypeId: next.cagnotteTypeId ?? pot?.typeId ?? "associations",
          wilayaCode: typeof next.wilayaCode === "number" ? next.wilayaCode : pot?.wilayaCode ?? 0,
        }
        localChanged = true
      }
      if (next.associationCcp === undefined) {
        next = { ...next, associationCcp: null }
        localChanged = true
      }
      if (!next.status) {
        next = { ...next, status: "completed" }
        localChanged = true
      }
      if (next.cancelledAt === undefined) {
        next = { ...next, cancelledAt: null }
        localChanged = true
      }
      if (next.cancelReason === undefined) {
        next = { ...next, cancelReason: null }
        localChanged = true
      }
      if (localChanged) changed = true
      return next
    })
    if (!parsed.donations) changed = true

    let associations = parsed.associations ?? []
    if (!parsed.associations || associations.length === 0) {
      associations = seedAssociationsFromCatalog()
      changed = true
    } else {
      associations = associations.map((a) => {
        let next = { ...a }
        let localChanged = false
        if (next.logoDataUrl === undefined) {
          next = { ...next, logoDataUrl: null }
          localChanged = true
        }
        if (typeof next.ccpAccount !== "string") {
          next = { ...next, ccpAccount: "" }
          localChanged = true
        }
        if (typeof next.published !== "boolean") {
          next = { ...next, published: true }
          localChanged = true
        }
        if (!next.createdAt) {
          next = { ...next, createdAt: new Date().toISOString() }
          localChanged = true
        }
        if (!next.updatedAt) {
          next = { ...next, updatedAt: next.createdAt }
          localChanged = true
        }
        if (localChanged) changed = true
        return next
      })
    }

    const sosCollectionSites = (parsed.sosCollectionSites ?? []).map((site) => {
      if (Array.isArray((site as SosCollectionSite).aidCategories)) return site as SosCollectionSite
      changed = true
      return { ...(site as SosCollectionSite), aidCategories: [] }
    })
    if (!parsed.sosCollectionSites) changed = true

    const sosDamagedSites = (parsed.sosDamagedSites ?? []).map((site) => {
      if (Array.isArray((site as SosDamagedSite).aidCategories)) return site as SosDamagedSite
      changed = true
      return { ...(site as SosDamagedSite), aidCategories: [] }
    })
    if (!parsed.sosDamagedSites) changed = true

    const participations = (parsed.participations ?? []).map((p) => ({
      ...p,
      changes: Array.isArray(p.changes) ? p.changes : [],
    }))

    const next: AppData = {
      events,
      announcements: parsed.announcements ?? seedData.announcements,
      activities,
      institutions,
      news,
      registrants,
      participations,
      cagnottes,
      donations,
      associations,
      sosCollectionSites,
      sosDamagedSites,
    }

    if (
      changed ||
      !parsed.participations ||

      !parsed.institutions ||
      !parsed.news ||
      !parsed.cagnottes ||
      !parsed.donations ||
      !parsed.associations ||
      !parsed.sosCollectionSites ||
      !parsed.sosDamagedSites
    ) {
      save(next)
    }
    return next
  } catch {
    return structuredClone(seedData)
  }
}

function save(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getData(): AppData {
  return load()
}

export function setData(data: AppData) {
  save(data)
}

export function createId() {
  return uid()
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === "1" || sessionStorage.getItem("odej-akbou-admin") === "1"
}

export function loginAdmin(password: string): boolean {
  if (password === "admin123") {
    sessionStorage.setItem(AUTH_KEY, "1")
    return true
  }
  return false
}

export function logoutAdmin() {
  sessionStorage.removeItem(AUTH_KEY)
}

export type {
  AppData,
  Activity,
  Announcement,
  Association,
  Cagnotte,
  Donation,
  EventItem,
  Institution,
  NewsArticle,
  Registrant,
  SosCollectionSite,
  SosDamagedSite,
}
