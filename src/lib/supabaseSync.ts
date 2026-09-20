import { supabase } from "./supabase"
import type { AppData, EventItem, Announcement, Activity, Institution, NewsArticle, Registrant, Cagnotte, Donation, Association, SosCollectionSite, SosDamagedSite } from "./types"

export async function loadFromSupabase(): Promise<AppData> {
  const [
    { data: events },
    { data: announcements },
    { data: activities },
    { data: institutions },
    { data: news },
    { data: registrants },
    { data: cagnottes },
    { data: associations },
    { data: donations },
    { data: sos_collection_sites },
    { data: sos_damaged_sites }
  ] = await Promise.all([
    supabase.from('events').select('*'),
    supabase.from('announcements').select('*'),
    supabase.from('activities').select('*'),
    supabase.from('institutions').select('*'),
    supabase.from('news').select('*'),
    supabase.from('registrants').select('*'),
    supabase.from('cagnottes').select('*'),
    supabase.from('associations').select('*'),
    supabase.from('donations').select('*'),
    supabase.from('sos_collection_sites').select('*'),
    supabase.from('sos_damaged_sites').select('*')
  ])

  return {
    events: (events || []).map(e => ({
      ...e,
      imageDataUrl: e.image_data_url,
      requiresRegistration: e.requires_registration
    })) as EventItem[],
    announcements: (announcements || []).map(a => ({
      ...a,
      openFrom: a.open_from,
      openUntil: a.open_until,
      maxSlots: a.max_slots
    })) as Announcement[],
    activities: (activities || []).map(a => ({
      ...a,
      imageDataUrl: a.image_data_url
    })) as Activity[],
    institutions: (institutions || []).map(i => ({
      ...i,
      imageDataUrl: i.image_data_url,
      wilayaCode: i.wilaya_code,
      structureKind: i.structure_kind
    })) as Institution[],
    news: (news || []).map(n => ({
      ...n,
      imageDataUrl: n.image_data_url
    })) as NewsArticle[],

    registrants: (registrants || []).map(r => ({
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
      registeredAt: r.registered_at
    })) as Registrant[],

    cagnottes: (cagnottes || []).map(c => ({
      ...c,
      typeId: c.type_id,
      wilayaCode: c.wilaya_code,
      goalAmount: c.goal_amount,
      raisedAmount: c.raised_amount
    })) as Cagnotte[],
    associations: (associations || []).map(a => ({
      ...a,
      logoDataUrl: a.logo_data_url,
      sectorId: a.sector_id,
      ccpAccount: a.ccp_account,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    })) as Association[],
    donations: (donations || []).map(d => ({
      ...d,
      cagnotteId: d.cagnotte_id,
      cagnotteTypeId: d.cagnotte_type_id,
      wilayaCode: d.wilaya_code,
      associationId: d.association_id,
      associationName: d.association_name,
      associationCcp: d.association_ccp,
      donorName: d.donor_name,
      cardLast4: d.card_last4,
      cancelReason: d.cancel_reason,
      cancelledAt: d.cancelled_at,
      createdAt: d.created_at
    })) as Donation[],
    sosCollectionSites: (sos_collection_sites || []).map(s => ({
      ...s,
      wilayaCode: s.wilaya_code,
      aidCategories: s.aid_categories,
      adminNote: s.admin_note,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    })) as SosCollectionSite[],
    sosDamagedSites: (sos_damaged_sites || []).map(s => ({
      ...s,
      wilayaCode: s.wilaya_code,
      aidCategories: s.aid_categories,
      adminNote: s.admin_note,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    })) as SosDamagedSite[]
  }
}

export async function syncToSupabase(prev: AppData, next: AppData) {
  // Events
  if (prev.events !== next.events) {
    const added = next.events.find(n => !prev.events.some(p => p.id === n.id))
    const removed = prev.events.find(p => !next.events.some(n => n.id === p.id))
    const updated = next.events.find(n => {
      const p = prev.events.find(x => x.id === n.id)
      return p && p !== n
    })

    if (added) {
      await supabase.from('events').insert({
        id: added.id, title: added.title, description: added.description, date: added.date,
        location: added.location, institution: added.institution, image_data_url: added.imageDataUrl,
        requires_registration: added.requiresRegistration, published: added.published
      })
    } else if (removed) {
      await supabase.from('events').delete().eq('id', removed.id)
    } else if (updated) {
      await supabase.from('events').update({
        title: updated.title, description: updated.description, date: updated.date,
        location: updated.location, institution: updated.institution, image_data_url: updated.imageDataUrl,
        requires_registration: updated.requiresRegistration, published: updated.published
      }).eq('id', updated.id)
    }
  }

  // Announcements
  if (prev.announcements !== next.announcements) {
    const added = next.announcements.find(n => !prev.announcements.some(p => p.id === n.id))
    const removed = prev.announcements.find(p => !next.announcements.some(n => n.id === p.id))
    const updated = next.announcements.find(n => {
      const p = prev.announcements.find(x => x.id === n.id)
      return p && p !== n
    })

    if (added) {
      await supabase.from('announcements').insert({
        id: added.id, title: added.title, description: added.description, open_from: added.openFrom,
        open_until: added.openUntil, max_slots: added.maxSlots, active: added.active
      })
    } else if (removed) {
      await supabase.from('announcements').delete().eq('id', removed.id)
    } else if (updated) {
      await supabase.from('announcements').update({
        title: updated.title, description: updated.description, open_from: updated.openFrom,
        open_until: updated.openUntil, max_slots: updated.maxSlots, active: updated.active
      }).eq('id', updated.id)
    }
  }

  // Activities
  if (prev.activities !== next.activities) {
    const added = next.activities.find(n => !prev.activities.some(p => p.id === n.id))
    const removed = prev.activities.find(p => !next.activities.some(n => n.id === p.id))
    const updated = next.activities.find(n => {
      const p = prev.activities.find(x => x.id === n.id)
      return p && p !== n
    })

    if (added) {
      await supabase.from('activities').insert({
        id: added.id, title: added.title, description: added.description, date: added.date,
        day: added.day, month: added.month, location: added.location, institution: added.institution,
        image_data_url: added.imageDataUrl, published: added.published
      })
    } else if (removed) {
      await supabase.from('activities').delete().eq('id', removed.id)
    } else if (updated) {
      await supabase.from('activities').update({
        title: updated.title, description: updated.description, date: updated.date,
        day: updated.day, month: updated.month, location: updated.location, institution: updated.institution,
        image_data_url: updated.imageDataUrl, published: updated.published
      }).eq('id', updated.id)
    }
  }

  // Institutions
  if (prev.institutions !== next.institutions) {
    const added = next.institutions.find(n => !prev.institutions.some(p => p.id === n.id))
    const removed = prev.institutions.find(p => !next.institutions.some(n => n.id === p.id))
    const updated = next.institutions.find(n => {
      const p = prev.institutions.find(x => x.id === n.id)
      return p && p !== n
    })

    if (added) {
      await supabase.from('institutions').insert({
        id: added.id, name: added.name, type: added.type, location: added.location, phone: added.phone,
        image_data_url: added.imageDataUrl, published: added.published, wilaya_code: added.wilayaCode,
        lat: added.lat, lng: added.lng, structure_kind: added.structureKind, authority: added.authority
      })
    } else if (removed) {
      await supabase.from('institutions').delete().eq('id', removed.id)
    } else if (updated) {
      await supabase.from('institutions').update({
        name: updated.name, type: updated.type, location: updated.location, phone: updated.phone,
        image_data_url: updated.imageDataUrl, published: updated.published, wilaya_code: updated.wilayaCode,
        lat: updated.lat, lng: updated.lng, structure_kind: updated.structureKind, authority: updated.authority
      }).eq('id', updated.id)
    }
  }

  // News
  if (prev.news !== next.news) {
    const added = next.news.find(n => !prev.news.some(p => p.id === n.id))
    const removed = prev.news.find(p => !next.news.some(n => n.id === p.id))
    const updated = next.news.find(n => {
      const p = prev.news.find(x => x.id === n.id)
      return p && p !== n
    })

    if (added) {
      await supabase.from('news').insert({
        id: added.id, title: added.title, description: added.description, category: added.category,
        date: added.date, image_data_url: added.imageDataUrl, featured: added.featured, published: added.published
      })
    } else if (removed) {
      await supabase.from('news').delete().eq('id', removed.id)
    } else if (updated) {
      await supabase.from('news').update({
        title: updated.title, description: updated.description, category: updated.category,
        date: updated.date, image_data_url: updated.imageDataUrl, featured: updated.featured, published: updated.published
      }).eq('id', updated.id)
    }
  }


  // Registrants
  if (prev.registrants !== next.registrants) {
    const added = next.registrants.find(n => !prev.registrants.some(p => p.id === n.id))
    const removed = prev.registrants.find(p => !next.registrants.some(n => n.id === p.id))
    const updated = next.registrants.find(n => {
      const p = prev.registrants.find(x => x.id === n.id)
      return p && p !== n
    })

    if (added) {
      await supabase.from('registrants').insert({
        id: added.id, qr_code: added.qrCode, last_name: added.lastName, first_name: added.firstName,
        birth_date: added.birthDate, birth_place: added.birthPlace, national_id: added.nationalId,
        points: added.points, announcement_id: added.announcementId, event_id: added.eventId,
        activity_id: added.activityId, registered_at: added.registeredAt
      })
    } else if (removed) {
      await supabase.from('registrants').delete().eq('id', removed.id)
    } else if (updated) {
      await supabase.from('registrants').update({
        qr_code: updated.qrCode, last_name: updated.lastName, first_name: updated.firstName,
        birth_date: updated.birthDate, birth_place: updated.birthPlace, national_id: updated.nationalId,
        points: updated.points, announcement_id: updated.announcementId, event_id: updated.eventId,
        activity_id: updated.activityId
      }).eq('id', updated.id)
    }
  }

  // Cagnottes
  if (prev.cagnottes !== next.cagnottes) {
    const updated = next.cagnottes.find(n => {
      const p = prev.cagnottes.find(x => x.id === n.id)
      return p && p !== n
    })
    if (updated) {
      await supabase.from('cagnottes').update({ raised_amount: updated.raisedAmount, published: updated.published }).eq('id', updated.id)
    }
  }

  // Donations
  if (prev.donations !== next.donations) {
    const added = next.donations.find(n => !prev.donations.some(p => p.id === n.id))
    const updated = next.donations.find(n => {
      const p = prev.donations.find(x => x.id === n.id)
      return p && p !== n
    })
    if (added) {
      await supabase.from('donations').insert({
        id: added.id, reference: added.reference, cagnotte_id: added.cagnotteId, cagnotte_type_id: added.cagnotteTypeId,
        wilaya_code: added.wilayaCode, association_id: added.associationId, association_name: added.associationName,
        association_ccp: added.associationCcp, amount: added.amount, donor_name: added.donorName,
        card_last4: added.cardLast4, status: added.status, cancel_reason: added.cancelReason, cancelled_at: added.cancelledAt
      })
    } else if (updated) {
      await supabase.from('donations').update({
        status: updated.status, cancel_reason: updated.cancelReason, cancelled_at: updated.cancelledAt
      }).eq('id', updated.id)
    }
  }

  // Associations
  if (prev.associations !== next.associations) {
    const added = next.associations.find(n => !prev.associations.some(p => p.id === n.id))
    const removed = prev.associations.find(p => !next.associations.some(n => n.id === p.id))
    const updated = next.associations.find(n => {
      const p = prev.associations.find(x => x.id === n.id)
      return p && p !== n
    })

    if (added) {
      await supabase.from('associations').insert({
        id: added.id, name: added.name, logo_data_url: added.logoDataUrl, sector_id: added.sectorId,
        ccp_account: added.ccpAccount, published: added.published
      })
    } else if (removed) {
      await supabase.from('associations').delete().eq('id', removed.id)
    } else if (updated) {
      await supabase.from('associations').update({
        name: updated.name, logo_data_url: updated.logoDataUrl, sector_id: updated.sectorId,
        ccp_account: updated.ccpAccount, published: updated.published
      }).eq('id', updated.id)
    }
  }

  // Sos Collection Sites
  if (prev.sosCollectionSites !== next.sosCollectionSites) {
    const added = next.sosCollectionSites.find(n => !prev.sosCollectionSites.some(p => p.id === n.id))
    const removed = prev.sosCollectionSites.find(p => !next.sosCollectionSites.some(n => n.id === p.id))
    const updated = next.sosCollectionSites.find(n => {
      const p = prev.sosCollectionSites.find(x => x.id === n.id)
      return p && p !== n
    })

    if (added) {
      await supabase.from('sos_collection_sites').insert({
        id: added.id, reference: added.reference, name: added.name, lat: added.lat, lng: added.lng,
        wilaya_code: added.wilayaCode, aid_categories: added.aidCategories, status: added.status, admin_note: added.adminNote
      })
    } else if (removed) {
      await supabase.from('sos_collection_sites').delete().eq('id', removed.id)
    } else if (updated) {
      await supabase.from('sos_collection_sites').update({
        name: updated.name, lat: updated.lat, lng: updated.lng, wilaya_code: updated.wilayaCode,
        aid_categories: updated.aidCategories, status: updated.status, admin_note: updated.adminNote
      }).eq('id', updated.id)
    }
  }

  // Sos Damaged Sites
  if (prev.sosDamagedSites !== next.sosDamagedSites) {
    const added = next.sosDamagedSites.find(n => !prev.sosDamagedSites.some(p => p.id === n.id))
    const removed = prev.sosDamagedSites.find(p => !next.sosDamagedSites.some(n => n.id === p.id))
    const updated = next.sosDamagedSites.find(n => {
      const p = prev.sosDamagedSites.find(x => x.id === n.id)
      return p && p !== n
    })

    if (added) {
      await supabase.from('sos_damaged_sites').insert({
        id: added.id, reference: added.reference, name: added.name, lat: added.lat, lng: added.lng,
        wilaya_code: added.wilayaCode, aid_categories: added.aidCategories, status: added.status, admin_note: added.adminNote
      })
    } else if (removed) {
      await supabase.from('sos_damaged_sites').delete().eq('id', removed.id)
    } else if (updated) {
      await supabase.from('sos_damaged_sites').update({
        name: updated.name, lat: updated.lat, lng: updated.lng, wilaya_code: updated.wilayaCode,
        aid_categories: updated.aidCategories, status: updated.status, admin_note: updated.adminNote
      }).eq('id', updated.id)
    }
  }
}

