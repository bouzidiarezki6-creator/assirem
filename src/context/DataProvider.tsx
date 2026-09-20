import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { loadFromSupabase, syncToSupabase } from "../lib/supabaseSync"
import {
  createId,
  type Activity,
  type Announcement,
  type AppData,
  type Association,
  type Donation,
  type EventItem,
  type Institution,
  type NewsArticle,
  type Registrant,
  type SosCollectionSite,
  type SosDamagedSite,
} from "@/lib/storage"
import type { SosAidCategoryId, SosRequestStatus, VolunteerParticipation } from "@/lib/types"
import { isValidGps } from "@/lib/sos"
import { createQrCode, parseQrScan } from "@/lib/qr"
import type { AssociationSectorId } from "@/lib/associations"
import { isValidCcp, normalizeCcp } from "@/lib/associations"
import type { CategoryId } from "@/lib/categories"
import {
  calculateVolunteerPoints,
  participationFingerprint,
  type ActivityTypeId,
  type DurationId,
  type ResponsibilityId,
  type PointsInput,
  type PointsBreakdown,
} from "@/lib/volunteerPoints"

export type ValidateParticipationInput = {
  volunteerId: string
  activityTitle: string
  activityDate: string
  categoryId: CategoryId
  activityTypeId?: ActivityTypeId
  durationId?: DurationId
  responsibilityId?: ResponsibilityId
  customPoints?: number
  hoursCounted?: number
  adminNote?: string
}

type DataContextValue = {
  data: AppData
  addEvent: (item: Omit<EventItem, "id">) => void
  updateEvent: (id: string, item: Partial<EventItem>) => void
  deleteEvent: (id: string) => void
  addAnnouncement: (item: Omit<Announcement, "id">) => void
  updateAnnouncement: (id: string, item: Partial<Announcement>) => void
  deleteAnnouncement: (id: string) => void
  addActivity: (item: Omit<Activity, "id">) => void
  updateActivity: (id: string, item: Partial<Activity>) => void
  deleteActivity: (id: string) => void
  addInstitution: (item: Omit<Institution, "id">) => void
  updateInstitution: (id: string, item: Partial<Institution>) => void
  deleteInstitution: (id: string) => void
  addNews: (item: Omit<NewsArticle, "id">) => void
  updateNews: (id: string, item: Partial<NewsArticle>) => void
  deleteNews: (id: string) => void
  addRegistrant: (
    item: Omit<Registrant, "id" | "qrCode" | "points" | "registeredAt">
  ) => Registrant | { error: string }
  deleteRegistrant: (id: string) => void
  findRegistrantByScan: (raw: string) => Registrant | null
  previewParticipationPoints: (input: PointsInput) => PointsBreakdown | null
  validateParticipation: (input: ValidateParticipationInput) => { ok: true; participation: VolunteerParticipation } | { ok: false; error: string }
  cancelParticipation: (participationId: string, reason: string) => { ok: true } | { ok: false; error: string }
  modifyParticipationPoints: (participationId: string, newPoints: number, reason: string) => { ok: true } | { ok: false; error: string }
  getVolunteerParticipations: (volunteerId: string) => VolunteerParticipation[]
  getVolunteerStats: (volunteerId: string) => { totalPoints: number; activityCount: number; hoursVolunteered: number }
  addDonation: (input: {
    cagnotteId: string
    amount: number
    donorName: string
    cardNumber: string
    associationId?: string | null
    associationName?: string | null
  }) => Donation | { error: string }
  cancelDonation: (
    donationId: string,
    reason: string
  ) => { ok: true } | { ok: false; error: string }
  addAssociation: (item: {
    name: string
    logoDataUrl: string | null
    sectorId: AssociationSectorId
    ccpAccount: string
    published?: boolean
  }) => Association | { error: string }
  updateAssociation: (
    id: string,
    item: Partial<Omit<Association, "id" | "createdAt">>
  ) => Association | { error: string }
  deleteAssociation: (id: string) => void
  addSosCollectionSite: (item: {
    name: string
    lat: number
    lng: number
    wilayaCode: number
    aidCategories: SosAidCategoryId[]
  }) => SosCollectionSite | { error: string }
  updateSosCollectionSite: (
    id: string,
    item: Partial<Omit<SosCollectionSite, "id" | "reference" | "createdAt">>
  ) => SosCollectionSite | { error: string }
  deleteSosCollectionSite: (id: string) => void
  addSosDamagedSite: (item: {
    name: string
    lat: number
    lng: number
    wilayaCode: number
    aidCategories: SosAidCategoryId[]
  }) => SosDamagedSite | { error: string }
  updateSosDamagedSite: (
    id: string,
    item: Partial<Omit<SosDamagedSite, "id" | "reference" | "createdAt">>
  ) => SosDamagedSite | { error: string }
  deleteSosDamagedSite: (id: string) => void
}

const DataContext = createContext<DataContextValue | null>(null)

let lastData: AppData | null = null;

function persist(next: AppData) {
  if (lastData) {
    syncToSupabase(lastData, next).catch(console.error)
  }
  lastData = next;
  return next
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, _setLocal] = useState<AppData | null>(null)

  const setLocal = useCallback((updater: (prev: AppData) => AppData) => {
    _setLocal(prev => prev ? updater(prev) : null)
  }, [])

  useEffect(() => {
    loadFromSupabase().then(res => {
      lastData = res;
      _setLocal(res);
    }).catch(console.error);
  }, []);



  const addEvent = useCallback((item: Omit<EventItem, "id">) => {
    setLocal((prev) => persist({ ...prev, events: [{ ...item, id: createId() }, ...prev.events] }))
  }, [])

  const updateEvent = useCallback((id: string, item: Partial<EventItem>) => {
    setLocal((prev) =>
      persist({
        ...prev,
        events: prev.events.map((e) => (e.id === id ? { ...e, ...item } : e)),
      })
    )
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setLocal((prev) => persist({ ...prev, events: prev.events.filter((e) => e.id !== id) }))
  }, [])

  const addAnnouncement = useCallback((item: Omit<Announcement, "id">) => {
    setLocal((prev) =>
      persist({ ...prev, announcements: [{ ...item, id: createId() }, ...prev.announcements] })
    )
  }, [])

  const updateAnnouncement = useCallback((id: string, item: Partial<Announcement>) => {
    setLocal((prev) =>
      persist({
        ...prev,
        announcements: prev.announcements.map((a) => (a.id === id ? { ...a, ...item } : a)),
      })
    )
  }, [])

  const deleteAnnouncement = useCallback((id: string) => {
    setLocal((prev) =>
      persist({ ...prev, announcements: prev.announcements.filter((a) => a.id !== id) })
    )
  }, [])

  const addActivity = useCallback((item: Omit<Activity, "id">) => {
    setLocal((prev) =>
      persist({ ...prev, activities: [{ ...item, id: createId() }, ...prev.activities] })
    )
  }, [])

  const updateActivity = useCallback((id: string, item: Partial<Activity>) => {
    setLocal((prev) =>
      persist({
        ...prev,
        activities: prev.activities.map((a) => (a.id === id ? { ...a, ...item } : a)),
      })
    )
  }, [])

  const deleteActivity = useCallback((id: string) => {
    setLocal((prev) =>
      persist({ ...prev, activities: prev.activities.filter((a) => a.id !== id) })
    )
  }, [])

  const addInstitution = useCallback((item: Omit<Institution, "id">) => {
    setLocal((prev) =>
      persist({
        ...prev,
        institutions: [{ ...item, id: createId() }, ...prev.institutions],
      })
    )
  }, [])

  const updateInstitution = useCallback((id: string, item: Partial<Institution>) => {
    setLocal((prev) =>
      persist({
        ...prev,
        institutions: prev.institutions.map((i) => (i.id === id ? { ...i, ...item } : i)),
      })
    )
  }, [])

  const deleteInstitution = useCallback((id: string) => {
    setLocal((prev) =>
      persist({ ...prev, institutions: prev.institutions.filter((i) => i.id !== id) })
    )
  }, [])

  const addNews = useCallback((item: Omit<NewsArticle, "id">) => {
    setLocal((prev) =>
      persist({ ...prev, news: [{ ...item, id: createId() }, ...prev.news] })
    )
  }, [])

  const updateNews = useCallback((id: string, item: Partial<NewsArticle>) => {
    setLocal((prev) =>
      persist({
        ...prev,
        news: prev.news.map((n) => (n.id === id ? { ...n, ...item } : n)),
      })
    )
  }, [])

  const deleteNews = useCallback((id: string) => {
    setLocal((prev) => persist({ ...prev, news: prev.news.filter((n) => n.id !== id) }))
  }, [])


  const addRegistrant = useCallback(
    (item: Omit<Registrant, "id" | "qrCode" | "points" | "registeredAt">) => {
      const nin = item.nationalId.trim()
      const prev = lastData!
      if (prev.registrants.some((r) => r.nationalId === nin || r.id === nin)) {
        return { error: "errors.ninAlreadyRegistered" }
      }

      const created: Registrant = {
        ...item,
        nationalId: nin,
        id: nin,
        qrCode: createQrCode(nin),
        points: 0,
        registeredAt: new Date().toISOString(),
      }

      setLocal((current) => {
        if (current.registrants.some((r) => r.nationalId === nin || r.id === nin)) {
          return current
        }
        return persist({ ...current, registrants: [created, ...current.registrants] })
      })

      return created
    },
    []
  )

  function syncVolunteerPoints(d: AppData, volunteerId: string): AppData {
    const points = (d.participations || [])
      .filter((p) => p.volunteerId === volunteerId && p.status === "validated")
      .reduce((sum, p) => sum + p.pointsAwarded, 0)
    return {
      ...d,
      registrants: d.registrants.map((r) =>
        r.id === volunteerId ? { ...r, points } : r
      ),
    }
  }

  const deleteRegistrant = useCallback((id: string) => {
    setLocal((prev) =>
      persist({
        ...prev,
        registrants: prev.registrants.filter((r) => r.id !== id),
        participations: (prev.participations || []).filter((p) => p.volunteerId !== id),
      })
    )
  }, [])

  const findRegistrantByScan = useCallback(
    (raw: string) => {
      const parsed = parseQrScan(raw)
      if (!parsed) return null
      return (
        data!.registrants.find(
          (r) =>
            (parsed.nin && (r.nationalId === parsed.nin || r.id === parsed.nin)) ||
            (parsed.id && (r.id === parsed.id || r.nationalId === parsed.id)) ||
            (parsed.code && r.qrCode.toUpperCase() === parsed.code.toUpperCase())
        ) ?? null
      )
    },
    [data]
  )

  const previewParticipationPoints = useCallback((input: PointsInput) => {
    return calculateVolunteerPoints(input)
  }, [])

  const validateParticipation = useCallback((input: ValidateParticipationInput) => {
    const title = input.activityTitle.trim()
    if (!title) return { ok: false as const, error: "errors.activityTitleRequired" }
    if (!input.activityDate) return { ok: false as const, error: "errors.dateRequired" }

    const current = data || lastData
    if (!current) return { ok: false as const, error: "errors.volunteerNotFound" }

    const volunteer = current.registrants.find(
      (r) => r.id === input.volunteerId || r.nationalId === input.volunteerId
    )
    if (!volunteer) return { ok: false as const, error: "errors.volunteerNotFound" }

    const activityTypeId = input.activityTypeId || "standard"
    const durationId = input.durationId || "h2_4"
    const responsibilityId = input.responsibilityId || "participant"

    const fingerprint = participationFingerprint({
      volunteerId: volunteer.id,
      activityTitle: title,
      activityDate: input.activityDate,
      categoryId: input.categoryId,
      activityTypeId,
    })

    const existing = current.participations?.find(
      (p) => p.fingerprint === fingerprint && p.status === "validated"
    )
    if (existing) {
      return {
        ok: false as const,
        error: "errors.duplicateParticipation",
      }
    }

    let finalPoints = 0
    let hoursCounted = input.hoursCounted ?? 0

    if (typeof input.customPoints === "number" && input.customPoints >= 0) {
      finalPoints = Math.round(input.customPoints)
    } else {
      const breakdown = calculateVolunteerPoints({
        categoryId: input.categoryId,
        activityTypeId,
        durationId,
        responsibilityId,
      })
      finalPoints = breakdown.finalPoints
      hoursCounted = breakdown.hoursCounted
    }

    const now = new Date().toISOString()
    const participation: VolunteerParticipation = {
      id: createId(),
      fingerprint,
      volunteerId: volunteer.id,
      activityTitle: title,
      activityDate: input.activityDate,
      categoryId: input.categoryId,
      activityTypeId,
      durationId,
      responsibilityId,
      hoursCounted,
      pointsAwarded: finalPoints,
      originalPoints: finalPoints,
      status: "validated",
      createdAt: now,
      updatedAt: now,
      changes: input.adminNote
        ? [
            {
              id: createId(),
              at: now,
              previousPoints: 0,
              newPoints: finalPoints,
              reason: "Attribution initiale",
              adminNote: input.adminNote,
            },
          ]
        : [],
    }

    setLocal((prev) => {
      const next: AppData = {
        ...prev,
        participations: [participation, ...(prev.participations || [])],
      }
      return persist(syncVolunteerPoints(next, volunteer.id))
    })

    return { ok: true as const, participation }
  }, [data])

  const cancelParticipation = useCallback((participationId: string, reason: string) => {
    const note = reason.trim()
    if (!note) return { ok: false as const, error: "errors.cancelReasonRequired" }

    let volunteerId = ""
    setLocal((prev) => {
      const target = (prev.participations || []).find((p) => p.id === participationId)
      if (!target || target.status === "cancelled") return prev
      volunteerId = target.volunteerId
      const now = new Date().toISOString()
      const next: AppData = {
        ...prev,
        participations: prev.participations.map((p) =>
          p.id === participationId
            ? {
                ...p,
                status: "cancelled" as const,
                pointsAwarded: 0,
                updatedAt: now,
                changes: [
                  ...p.changes,
                  {
                    id: createId(),
                    at: now,
                    previousPoints: p.pointsAwarded,
                    newPoints: 0,
                    reason: "Annulation",
                    adminNote: note,
                  },
                ],
              }
            : p
        ),
      }
      return persist(syncVolunteerPoints(next, volunteerId))
    })

    if (!volunteerId) return { ok: false as const, error: "errors.participationNotFound" }
    return { ok: true as const }
  }, [])

  const modifyParticipationPoints = useCallback(
    (participationId: string, newPoints: number, reason: string) => {
      const note = reason.trim()
      if (!note) return { ok: false as const, error: "errors.modifyReasonRequired" }
      if (!Number.isFinite(newPoints) || newPoints < 0) {
        return { ok: false as const, error: "errors.invalidPoints" }
      }
      const rounded = Math.round(newPoints)

      let volunteerId = ""
      let error: string | null = null

      setLocal((prev) => {
        const target = (prev.participations || []).find((p) => p.id === participationId)
        if (!target) {
          error = "errors.participationMissing"
          return prev
        }
        if (target.status !== "validated") {
          error = "errors.onlyValidatedEditable"
          return prev
        }
        if (target.pointsAwarded === rounded) {
          error = "errors.noChangeIdentical"
          return prev
        }
        volunteerId = target.volunteerId
        const now = new Date().toISOString()
        const next: AppData = {
          ...prev,
          participations: prev.participations.map((p) =>
            p.id === participationId
              ? {
                  ...p,
                  pointsAwarded: rounded,
                  updatedAt: now,
                  changes: [
                    ...p.changes,
                    {
                      id: createId(),
                      at: now,
                      previousPoints: p.pointsAwarded,
                      newPoints: rounded,
                      reason: "errors.adminModification",
                      adminNote: note,
                    },
                  ],
                }
              : p
          ),
        }
        return persist(syncVolunteerPoints(next, volunteerId))
      })

      if (error) return { ok: false as const, error }
      return { ok: true as const }
    },
    []
  )

  const getVolunteerParticipations = useCallback(
    (volunteerId: string) => {
      const current = data || lastData
      if (!current) return []
      return (current.participations || [])
        .filter((p: VolunteerParticipation) => p.volunteerId === volunteerId)
        .sort((a: VolunteerParticipation, b: VolunteerParticipation) =>
          b.activityDate.localeCompare(a.activityDate) || b.createdAt.localeCompare(a.createdAt)
        )
    },
    [data]
  )

  const getVolunteerStats = useCallback(
    (volunteerId: string) => {
      const current = data || lastData
      if (!current) return { totalPoints: 0, activityCount: 0, hoursVolunteered: 0 }
      const list = (current.participations || []).filter(
        (p: VolunteerParticipation) => p.volunteerId === volunteerId && p.status === "validated"
      )
      return {
        totalPoints: list.reduce((s: number, p: VolunteerParticipation) => s + p.pointsAwarded, 0),
        activityCount: list.length,
        hoursVolunteered: list.reduce((s: number, p: VolunteerParticipation) => s + p.hoursCounted, 0),
      }
    },
    [data]
  )



  const addDonation = useCallback(
    (input: {
      cagnotteId: string
      amount: number
      donorName: string
      cardNumber: string
      associationId?: string | null
      associationName?: string | null
    }): Donation | { error: string } => {
      const amount = Math.round(Number(input.amount))
      if (!Number.isFinite(amount) || amount < 100) {
        return { error: "cagnottes.errors.amount" }
      }
      const digits = input.cardNumber.replace(/\D/g, "")
      if (digits.length < 13) {
        return { error: "cagnottes.errors.card" }
      }
      const name = input.donorName.trim()
      if (name.length < 2) {
        return { error: "cagnottes.errors.name" }
      }

      let created: Donation | null = null
      setLocal((prev) => {
        const pot = prev.cagnottes.find((c) => c.id === input.cagnotteId && c.published)
        if (!pot) return prev

        const assocId = input.associationId ?? null
        const assoc = assocId
          ? prev.associations.find((a) => a.id === assocId && a.published)
          : null
        const associationName =
          input.associationName?.trim() || assoc?.name || null
        const associationCcp = assoc?.ccpAccount || null

        const id = createId()
        const stamp = new Date().toISOString()
        created = {
          id,
          reference: `DON-${stamp.slice(0, 10).replace(/-/g, "")}-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
          cagnotteId: input.cagnotteId,
          cagnotteTypeId: pot.typeId,
          wilayaCode: pot.wilayaCode,
          associationId: assocId,
          associationName,
          associationCcp,
          amount,
          donorName: name,
          cardLast4: digits.slice(-4),
          status: "completed",
          createdAt: stamp,
          cancelledAt: null,
          cancelReason: null,
        }
        return persist({
          ...prev,
          donations: [created!, ...prev.donations],
          cagnottes: prev.cagnottes.map((c) =>
            c.id === input.cagnotteId
              ? { ...c, raisedAmount: c.raisedAmount + amount }
              : c
          ),
        })
      })

      if (!created) return { error: "cagnottes.errors.cagnotte" }
      return created
    },
    []
  )

  const cancelDonation = useCallback(
    (donationId: string, reason: string): { ok: true } | { ok: false; error: string } => {
      const note = reason.trim()
      if (note.length < 3) return { ok: false, error: "admin.cagnottesCrm.errors.cancelReason" }

      let ok = false
      setLocal((prev) => {
        const donation = prev.donations.find((d) => d.id === donationId)
        if (!donation || donation.status !== "completed") return prev
        ok = true
        const stamp = new Date().toISOString()
        return persist({
          ...prev,
          donations: prev.donations.map((d) =>
            d.id === donationId
              ? {
                  ...d,
                  status: "cancelled",
                  cancelledAt: stamp,
                  cancelReason: note,
                }
              : d
          ),
          cagnottes: prev.cagnottes.map((c) =>
            c.id === donation.cagnotteId
              ? {
                  ...c,
                  raisedAmount: Math.max(0, c.raisedAmount - donation.amount),
                }
              : c
          ),
        })
      })
      return ok ? { ok: true } : { ok: false, error: "admin.cagnottesCrm.errors.cancelMissing" }
    },
    []
  )

  const addAssociation = useCallback(
    (item: {
      name: string
      logoDataUrl: string | null
      sectorId: AssociationSectorId
      ccpAccount: string
      published?: boolean
    }): Association | { error: string } => {
      const name = item.name.trim()
      if (name.length < 2) return { error: "admin.cagnottesCrm.errors.assocName" }
      const ccp = normalizeCcp(item.ccpAccount)
      if (!isValidCcp(ccp)) return { error: "admin.cagnottesCrm.errors.ccp" }

      const stamp = new Date().toISOString()
      const created: Association = {
        id: createId(),
        name,
        logoDataUrl: item.logoDataUrl,
        sectorId: item.sectorId,
        ccpAccount: ccp,
        published: item.published ?? true,
        createdAt: stamp,
        updatedAt: stamp,
      }
      setLocal((prev) =>
        persist({ ...prev, associations: [created, ...prev.associations] })
      )
      return created
    },
    []
  )

  const updateAssociation = useCallback(
    (
      id: string,
      item: Partial<Omit<Association, "id" | "createdAt">>
    ): Association | { error: string } => {
      let updated: Association | null = null
      let error: string | null = null

      setLocal((prev) => {
        const current = prev.associations.find((a) => a.id === id)
        if (!current) {
          error = "admin.cagnottesCrm.errors.assocMissing"
          return prev
        }

        const name = item.name !== undefined ? item.name.trim() : current.name
        if (name.length < 2) {
          error = "admin.cagnottesCrm.errors.assocName"
          return prev
        }

        const ccpRaw = item.ccpAccount !== undefined ? item.ccpAccount : current.ccpAccount
        const ccp = normalizeCcp(ccpRaw)
        if (!isValidCcp(ccp)) {
          error = "admin.cagnottesCrm.errors.ccp"
          return prev
        }

        updated = {
          ...current,
          name,
          logoDataUrl:
            item.logoDataUrl !== undefined ? item.logoDataUrl : current.logoDataUrl,
          sectorId: item.sectorId ?? current.sectorId,
          ccpAccount: ccp,
          published:
            item.published !== undefined ? item.published : current.published,
          updatedAt: new Date().toISOString(),
        }

        return persist({
          ...prev,
          associations: prev.associations.map((a) => (a.id === id ? updated! : a)),
        })
      })

      if (error) return { error }
      if (!updated) return { error: "admin.cagnottesCrm.errors.assocMissing" }
      return updated
    },
    []
  )

  const deleteAssociation = useCallback((id: string) => {
    setLocal((prev) =>
      persist({
        ...prev,
        associations: prev.associations.filter((a) => a.id !== id),
      })
    )
  }, [])

  const addSosCollectionSite = useCallback(
    (item: {
      name: string
      lat: number
      lng: number
      wilayaCode: number
      aidCategories: SosAidCategoryId[]
    }): SosCollectionSite | { error: string } => {
      const name = item.name.trim()
      if (name.length < 2) return { error: "sos.errors.name" }
      if (!isValidGps(item.lat, item.lng)) return { error: "sos.errors.gps" }
      if (!Number.isFinite(item.wilayaCode) || item.wilayaCode < 1 || item.wilayaCode > 69) {
        return { error: "sos.errors.wilaya" }
      }
      if (!item.aidCategories.length) return { error: "sos.errors.aidCategories" }

      const id = createId()
      const stamp = new Date().toISOString()
      const created: SosCollectionSite = {
        id,
        reference: `SOS-LC-${stamp.slice(0, 10).replace(/-/g, "")}-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
        name,
        lat: item.lat,
        lng: item.lng,
        wilayaCode: item.wilayaCode,
        aidCategories: [...new Set(item.aidCategories)],
        status: "pending",
        adminNote: "",
        createdAt: stamp,
        updatedAt: stamp,
      }
      setLocal((prev) =>
        persist({
          ...prev,
          sosCollectionSites: [created, ...prev.sosCollectionSites],
        })
      )
      return created
    },
    []
  )

  const updateSosCollectionSite = useCallback(
    (
      id: string,
      item: Partial<Omit<SosCollectionSite, "id" | "reference" | "createdAt">>
    ): SosCollectionSite | { error: string } => {
      let updated: SosCollectionSite | null = null
      setLocal((prev) => {
        const current = prev.sosCollectionSites.find((r) => r.id === id)
        if (!current) return prev
        const lat = item.lat ?? current.lat
        const lng = item.lng ?? current.lng
        if (item.lat !== undefined || item.lng !== undefined) {
          if (!isValidGps(lat, lng)) return prev
        }
        const aidCategories =
          item.aidCategories !== undefined
            ? [...new Set(item.aidCategories)]
            : current.aidCategories ?? []
        if (item.aidCategories !== undefined && aidCategories.length === 0) return prev
        updated = {
          ...current,
          ...item,
          name: item.name !== undefined ? item.name.trim() : current.name,
          lat,
          lng,
          aidCategories,
          adminNote: item.adminNote !== undefined ? item.adminNote.trim() : current.adminNote,
          status: (item.status as SosRequestStatus | undefined) ?? current.status,
          updatedAt: new Date().toISOString(),
        }
        return persist({
          ...prev,
          sosCollectionSites: prev.sosCollectionSites.map((r) =>
            r.id === id ? updated! : r
          ),
        })
      })
      if (!updated) return { error: "admin.sosCrm.errors.missing" }
      return updated
    },
    []
  )

  const deleteSosCollectionSite = useCallback((id: string) => {
    setLocal((prev) =>
      persist({
        ...prev,
        sosCollectionSites: prev.sosCollectionSites.filter((r) => r.id !== id),
      })
    )
  }, [])

  const addSosDamagedSite = useCallback(
    (item: {
      name: string
      lat: number
      lng: number
      wilayaCode: number
      aidCategories: SosAidCategoryId[]
    }): SosDamagedSite | { error: string } => {
      const name = item.name.trim()
      if (name.length < 2) return { error: "sos.errors.name" }
      if (!isValidGps(item.lat, item.lng)) return { error: "sos.errors.gps" }
      if (!Number.isFinite(item.wilayaCode) || item.wilayaCode < 1 || item.wilayaCode > 69) {
        return { error: "sos.errors.wilaya" }
      }
      if (!item.aidCategories.length) return { error: "sos.errors.aidCategories" }

      const id = createId()
      const stamp = new Date().toISOString()
      const created: SosDamagedSite = {
        id,
        reference: `SOS-LE-${stamp.slice(0, 10).replace(/-/g, "")}-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
        name,
        lat: item.lat,
        lng: item.lng,
        wilayaCode: item.wilayaCode,
        aidCategories: [...new Set(item.aidCategories)],
        status: "pending",
        adminNote: "",
        createdAt: stamp,
        updatedAt: stamp,
      }
      setLocal((prev) =>
        persist({
          ...prev,
          sosDamagedSites: [created, ...prev.sosDamagedSites],
        })
      )
      return created
    },
    []
  )

  const updateSosDamagedSite = useCallback(
    (
      id: string,
      item: Partial<Omit<SosDamagedSite, "id" | "reference" | "createdAt">>
    ): SosDamagedSite | { error: string } => {
      let updated: SosDamagedSite | null = null
      setLocal((prev) => {
        const current = prev.sosDamagedSites.find((r) => r.id === id)
        if (!current) return prev
        const lat = item.lat ?? current.lat
        const lng = item.lng ?? current.lng
        if (item.lat !== undefined || item.lng !== undefined) {
          if (!isValidGps(lat, lng)) return prev
        }
        const aidCategories =
          item.aidCategories !== undefined
            ? [...new Set(item.aidCategories)]
            : current.aidCategories
        if (item.aidCategories !== undefined && aidCategories.length === 0) return prev
        updated = {
          ...current,
          ...item,
          name: item.name !== undefined ? item.name.trim() : current.name,
          lat,
          lng,
          aidCategories,
          adminNote: item.adminNote !== undefined ? item.adminNote.trim() : current.adminNote,
          status: (item.status as SosRequestStatus | undefined) ?? current.status,
          updatedAt: new Date().toISOString(),
        }
        return persist({
          ...prev,
          sosDamagedSites: prev.sosDamagedSites.map((r) =>
            r.id === id ? updated! : r
          ),
        })
      })
      if (!updated) return { error: "admin.sosCrm.errors.missing" }
      return updated
    },
    []
  )

  const deleteSosDamagedSite = useCallback((id: string) => {
    setLocal((prev) =>
      persist({
        ...prev,
        sosDamagedSites: prev.sosDamagedSites.filter((r) => r.id !== id),
      })
    )
  }, [])

  const value = useMemo(
    () => ({
      data,
      addEvent,
      updateEvent,
      deleteEvent,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      addActivity,
      updateActivity,
      deleteActivity,
      addInstitution,
      updateInstitution,
      deleteInstitution,
      addNews,
      updateNews,
      deleteNews,
      addRegistrant,
      deleteRegistrant,
      findRegistrantByScan,
      previewParticipationPoints,
      validateParticipation,
      cancelParticipation,
      modifyParticipationPoints,
      getVolunteerParticipations,
      getVolunteerStats,
      addDonation,
      cancelDonation,
      addAssociation,
      updateAssociation,
      deleteAssociation,
      addSosCollectionSite,
      updateSosCollectionSite,
      deleteSosCollectionSite,
      addSosDamagedSite,
      updateSosDamagedSite,
      deleteSosDamagedSite,
    }),
    [
      data,
      addEvent,
      updateEvent,
      deleteEvent,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      addActivity,
      updateActivity,
      deleteActivity,
      addInstitution,
      updateInstitution,
      deleteInstitution,
      addNews,
      updateNews,
      deleteNews,
      addRegistrant,
      deleteRegistrant,
      findRegistrantByScan,
      previewParticipationPoints,
      validateParticipation,
      cancelParticipation,
      modifyParticipationPoints,
      getVolunteerParticipations,
      getVolunteerStats,
      addDonation,
      cancelDonation,
      addAssociation,
      updateAssociation,
      deleteAssociation,
      addSosCollectionSite,
      updateSosCollectionSite,
      deleteSosCollectionSite,
      addSosDamagedSite,
      updateSosDamagedSite,
      deleteSosDamagedSite,
    ]
  )

  if (!data || !lastData) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  return <DataContext.Provider value={value as any}>{children}</DataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useAppData must be used within DataProvider")
  return ctx
}
