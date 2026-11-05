import { supabase } from "./supabase"
import type {
  AppData,
  EventItem,
  Announcement,
  Activity,
  Institution,
  NewsArticle,
  Registrant,
  VolunteerParticipation,
  Association,
  SosCollectionSite,
  SosDamagedSite,
} from "./types"

async function safeSelect(table: string): Promise<{ data: any[] | null }> {
  if (!supabase) return { data: null }
  try {
    const res = await supabase.from(table).select("*")
    if (res.error) return { data: null }
    return { data: res.data || null }
  } catch {
    return { data: null }
  }
}

export async function loadFromSupabase(): Promise<Partial<AppData> | null> {
  if (!supabase) return null

  try {
    const [
      eventsRes,
      announcementsRes,
      activitiesRes,
      institutionsRes,
      newsRes,
      registrantsRes,
      associationsRes,
      sosCollectionRes,
      sosDamagedRes,
      participationsRes,
    ] = await Promise.all([
      safeSelect("events"),
      safeSelect("announcements"),
      safeSelect("activities"),
      safeSelect("institutions"),
      safeSelect("news"),
      safeSelect("registrants"),
      safeSelect("associations"),
      safeSelect("sos_collection_sites"),
      safeSelect("sos_damaged_sites"),
      safeSelect("participations"),
    ])

    const partial: Partial<AppData> = {}

    if (eventsRes.data && eventsRes.data.length > 0) {
      partial.events = eventsRes.data.map((e: any) => ({
        ...e,
        imageDataUrl: e.image_data_url,
        requiresRegistration: e.requires_registration,
        categoryId: e.category_id || e.categoryId || undefined,
      })) as EventItem[]
    }

    if (announcementsRes.data && announcementsRes.data.length > 0) {
      partial.announcements = announcementsRes.data.map((a: any) => ({
        ...a,
        openFrom: a.open_from,
        openUntil: a.open_until,
        maxSlots: a.max_slots,
      })) as Announcement[]
    }

    if (activitiesRes.data && activitiesRes.data.length > 0) {
      partial.activities = activitiesRes.data.map((a: any) => ({
        ...a,
        imageDataUrl: a.image_data_url,
        categoryId: a.category_id || a.categoryId || undefined,
      })) as Activity[]
    }

    if (institutionsRes.data && institutionsRes.data.length > 0) {
      partial.institutions = institutionsRes.data.map((i: any) => ({
        ...i,
        imageDataUrl: i.image_data_url,
        wilayaCode: i.wilaya_code,
        structureKind: i.structure_kind,
      })) as Institution[]
    }

    if (newsRes.data && newsRes.data.length > 0) {
      partial.news = newsRes.data.map((n: any) => ({
        ...n,
        imageDataUrl: n.image_data_url,
      })) as NewsArticle[]
    }

    if (registrantsRes.data && registrantsRes.data.length > 0) {
      partial.registrants = registrantsRes.data.map((r: any) => ({
        ...r,
        qrCode: r.qr_code,
        lastName: r.last_name,
        firstName: r.first_name,
        birthDate: r.birth_date,
        birthPlace: r.birth_place,
        nationalId: r.national_id,
        announcementId: r.announcement_id,
        eventId: r.event_id,
        activityId: r.activity_id,
        registeredAt: r.registered_at,
      })) as Registrant[]
    }

    if (participationsRes.data && participationsRes.data.length > 0) {
      partial.participations = participationsRes.data.map((p: any) => ({
        ...p,
        volunteerId: p.volunteer_id,
        activityTitle: p.activity_title,
        activityDate: p.activity_date,
        categoryId: p.category_id,
        activityTypeId: p.activity_type_id,
        durationId: p.duration_id,
        responsibilityId: p.responsibility_id,
        hoursCounted: p.hours_counted,
        pointsAwarded: p.points_awarded,
        originalPoints: p.original_points,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        changes: Array.isArray(p.changes) ? p.changes : [],
      })) as VolunteerParticipation[]
    }

    if (associationsRes.data && associationsRes.data.length > 0) {
      partial.associations = associationsRes.data.map((a: any) => ({
        ...a,
        logoDataUrl: a.logo_data_url,
        sectorId: a.sector_id,
        ccpAccount: a.ccp_account,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })) as Association[]
    }

    if (sosCollectionRes.data && sosCollectionRes.data.length > 0) {
      partial.sosCollectionSites = sosCollectionRes.data.map((s: any) => ({
        ...s,
        wilayaCode: s.wilaya_code,
        aidCategories: s.aid_categories,
        adminNote: s.admin_note,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })) as SosCollectionSite[]
    }

    if (sosDamagedRes.data && sosDamagedRes.data.length > 0) {
      partial.sosDamagedSites = sosDamagedRes.data.map((s: any) => ({
        ...s,
        wilayaCode: s.wilaya_code,
        aidCategories: s.aid_categories,
        adminNote: s.admin_note,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })) as SosDamagedSite[]
    }

    return Object.keys(partial).length > 0 ? partial : null
  } catch (err) {
    console.warn("Supabase loading error:", err)
    return null
  }
}

export async function syncToSupabase(prev: AppData, next: AppData) {
  if (!supabase) return

  try {
    // Events
    if (prev.events !== next.events) {
      const added = next.events.find((n) => !prev.events.some((p) => p.id === n.id))
      const removed = prev.events.find((p) => !next.events.some((n) => n.id === p.id))
      const updated = next.events.find((n) => {
        const p = prev.events.find((x) => x.id === n.id)
        return p && p !== n
      })

      if (added) {
        await supabase.from("events").insert({
          id: added.id,
          title: added.title,
          description: added.description,
          date: added.date,
          location: added.location,
          institution: added.institution,
          image_data_url: added.imageDataUrl,
          requires_registration: added.requiresRegistration,
          published: added.published,
          category_id: added.categoryId || null,
        })
      } else if (removed) {
        await supabase.from("events").delete().eq("id", removed.id)
      } else if (updated) {
        await supabase
          .from("events")
          .update({
            title: updated.title,
            description: updated.description,
            date: updated.date,
            location: updated.location,
            institution: updated.institution,
            image_data_url: updated.imageDataUrl,
            requires_registration: updated.requiresRegistration,
            published: updated.published,
            category_id: updated.categoryId || null,
          })
          .eq("id", updated.id)
      }
    }

    // Announcements
    if (prev.announcements !== next.announcements) {
      const added = next.announcements.find((n) => !prev.announcements.some((p) => p.id === n.id))
      const removed = prev.announcements.find((p) => !next.announcements.some((n) => n.id === p.id))
      const updated = next.announcements.find((n) => {
        const p = prev.announcements.find((x) => x.id === n.id)
        return p && p !== n
      })

      if (added) {
        await supabase.from("announcements").insert({
          id: added.id,
          title: added.title,
          description: added.description,
          open_from: added.openFrom,
          open_until: added.openUntil,
          max_slots: added.maxSlots,
          active: added.active,
        })
      } else if (removed) {
        await supabase.from("announcements").delete().eq("id", removed.id)
      } else if (updated) {
        await supabase
          .from("announcements")
          .update({
            title: updated.title,
            description: updated.description,
            open_from: updated.openFrom,
            open_until: updated.openUntil,
            max_slots: updated.maxSlots,
            active: updated.active,
          })
          .eq("id", updated.id)
      }
    }

    // Activities
    if (prev.activities !== next.activities) {
      const added = next.activities.find((n) => !prev.activities.some((p) => p.id === n.id))
      const removed = prev.activities.find((p) => !next.activities.some((n) => n.id === p.id))
      const updated = next.activities.find((n) => {
        const p = prev.activities.find((x) => x.id === n.id)
        return p && p !== n
      })

      if (added) {
        await supabase.from("activities").insert({
          id: added.id,
          title: added.title,
          description: added.description,
          date: added.date,
          day: added.day,
          month: added.month,
          location: added.location,
          institution: added.institution,
          image_data_url: added.imageDataUrl,
          published: added.published,
          category_id: added.categoryId || null,
        })
      } else if (removed) {
        await supabase.from("activities").delete().eq("id", removed.id)
      } else if (updated) {
        await supabase
          .from("activities")
          .update({
            title: updated.title,
            description: updated.description,
            date: updated.date,
            day: updated.day,
            month: updated.month,
            location: updated.location,
            institution: updated.institution,
            image_data_url: updated.imageDataUrl,
            published: updated.published,
            category_id: updated.categoryId || null,
          })
          .eq("id", updated.id)
      }
    }

    // News
    if (prev.news !== next.news) {
      const added = next.news.find((n) => !prev.news.some((p) => p.id === n.id))
      const removed = prev.news.find((p) => !next.news.some((n) => n.id === p.id))
      const updated = next.news.find((n) => {
        const p = prev.news.find((x) => x.id === n.id)
        return p && p !== n
      })

      if (added) {
        await supabase.from("news").insert({
          id: added.id,
          title: added.title,
          description: added.description,
          category: added.category,
          date: added.date,
          image_data_url: added.imageDataUrl,
          featured: added.featured,
          published: added.published,
        })
      } else if (removed) {
        await supabase.from("news").delete().eq("id", removed.id)
      } else if (updated) {
        await supabase
          .from("news")
          .update({
            title: updated.title,
            description: updated.description,
            category: updated.category,
            date: updated.date,
            image_data_url: updated.imageDataUrl,
            featured: updated.featured,
            published: updated.published,
          })
          .eq("id", updated.id)
      }
    }

    // Participations
    if (prev.participations !== next.participations) {
      const added = next.participations.find((n) => !prev.participations.some((p) => p.id === n.id))
      const updated = next.participations.find((n) => {
        const p = prev.participations.find((x) => x.id === n.id)
        return p && p !== n
      })

      if (added) {
        await supabase.from("participations").insert({
          id: added.id,
          fingerprint: added.fingerprint,
          volunteer_id: added.volunteerId,
          activity_title: added.activityTitle,
          activity_date: added.activityDate,
          category_id: added.categoryId,
          activity_type_id: added.activityTypeId,
          duration_id: added.durationId,
          responsibility_id: added.responsibilityId,
          hours_counted: added.hoursCounted,
          points_awarded: added.pointsAwarded,
          original_points: added.originalPoints,
          status: added.status,
          created_at: added.createdAt,
          updated_at: added.updatedAt,
          changes: added.changes,
        })
      } else if (updated) {
        await supabase
          .from("participations")
          .update({
            points_awarded: updated.pointsAwarded,
            status: updated.status,
            updated_at: updated.updatedAt,
            changes: updated.changes,
          })
          .eq("id", updated.id)
      }
    }
  } catch (err) {
    console.warn("Supabase sync error:", err)
  }
}
