import { createClient } from "@supabase/supabase-js"
import {
  DEMO_EVENTS,
  DEMO_ACTIVITIES,
  DEMO_ANNOUNCEMENTS,
  DEMO_INSTITUTIONS,
  DEMO_NEWS,
  DEMO_VOLUNTEERS,
  DEMO_POINT_TRANSACTIONS,
  DEMO_ASSOCIATIONS,
  DEMO_SOS_COLLECTION_SITES,
  DEMO_SOS_DAMAGED_SITES,
  DEMO_SOS_MATERIAL_NEEDS,
  DEMO_SOS_CALLS,
  DEMO_SOS_APPLICATIONS,
  DEMO_SOS_INTERVENTIONS,
  DEMO_INSTITUTIONAL_USERS,
  DEMO_PRESENCE_RECORDS,
  DEMO_MISSION_REPORTS,
  DEMO_NOTIFICATIONS
} from '../src/lib/demoData'

const url = "https://rmlmovunysnwotwynpsj.supabase.co"
const key = "sb_publishable_U5R_FpGxH2Zj15W3KxiKJg_M0xKeEL3"

const supabase = createClient(url, key)

async function seedTable(tableName: string, records: any[], mapper?: (r: any) => any) {
  const formatted = mapper ? records.map(mapper) : records
  console.log(`Seeding [${tableName}] (${formatted.length} records)...`)
  const { data, error } = await supabase.from(tableName).upsert(formatted).select()
  if (error) {
    console.error(`❌ Error seeding ${tableName}:`, error.message)
    return false
  } else {
    console.log(`✅ [${tableName}] seeded successfully! (${data.length} records)`)
    return true
  }
}

async function run() {
  console.log("=== SEEDING REAL DEMO DATA DIRECTLY TO SUPABASE ===")

  // 1. Events
  await seedTable('events', DEMO_EVENTS, e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    location: e.location,
    institution: e.institution,
    image_data_url: e.imageDataUrl,
    category_id: e.categoryId,
    requires_registration: e.requiresRegistration,
    published: e.published,
    status: e.status,
    hours: e.hours,
    conditions: e.conditions,
    capacity: e.capacity,
    registered_count: e.registeredCount,
    wilaya_code: e.wilayaCode,
    commune: e.commune,
    is_demo: true
  }))

  // 2. Announcements
  await seedTable('announcements', DEMO_ANNOUNCEMENTS, a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    open_from: a.openFrom,
    open_until: a.openUntil,
    max_slots: a.maxSlots,
    active: a.active,
    is_demo: true
  }))

  // 3. Activities
  await seedTable('activities', DEMO_ACTIVITIES, a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    date: a.date,
    day: a.day,
    month: a.month,
    location: a.location,
    institution: a.institution,
    image_data_url: a.imageDataUrl,
    category_id: a.categoryId,
    published: a.published,
    status: a.status,
    hours: a.hours,
    conditions: a.conditions,
    capacity: a.capacity,
    registered_count: a.registeredCount,
    wilaya_code: a.wilayaCode,
    commune: a.commune,
    is_demo: true
  }))

  // 4. Institutions
  await seedTable('institutions', DEMO_INSTITUTIONS, i => ({
    id: i.id,
    name: i.name,
    type: i.type,
    location: i.location,
    phone: i.phone,
    image_data_url: i.imageDataUrl,
    published: i.published,
    wilaya_code: i.wilayaCode,
    commune: i.commune,
    lat: i.lat,
    lng: i.lng,
    structure_kind: i.structureKind,
    authority: i.authority,
    is_verified: i.isVerified,
    email: i.email,
    hours: i.hours,
    is_demo: true
  }))

  // 5. News
  await seedTable('news', DEMO_NEWS, n => ({
    id: n.id,
    title: n.title,
    description: n.description,
    content: n.content,
    category: n.category,
    category_id: n.categoryId,
    date: n.date,
    image_data_url: n.imageDataUrl,
    featured: n.featured,
    published: n.published,
    wilaya_code: n.wilayaCode,
    commune: n.commune,
    is_demo: true
  }))

  // 6. Associations
  await seedTable('associations', DEMO_ASSOCIATIONS, ass => ({
    id: ass.id,
    name: ass.name,
    logo_data_url: ass.logoDataUrl,
    sector_id: ass.sectorId,
    ccp_account: ass.ccpAccount,
    published: ass.published,
    is_demo: true
  }))

  // 7. Volunteer Accounts
  await seedTable('volunteer_accounts', DEMO_VOLUNTEERS, v => ({
    id: v.id,
    email: v.email,
    first_name: v.firstName,
    last_name: v.lastName,
    phone: v.phone,
    wilaya_code: v.wilayaCode,
    commune: v.commune,
    birth_date: v.birthDate,
    skills: v.skills,
    interests: v.interests,
    volunteer_code: v.volunteerCode,
    points: v.points,
    status: v.status,
    is_verified: v.isVerified,
    public_profile_consent: v.publicProfileConsent,
    show_wilaya_in_leaderboard: v.showWilayaInLeaderboard,
    earned_badges: v.earnedBadges || [],
    bio: v.bio,
    is_demo: true
  }))

  // 8. Point Transactions
  await seedTable('volunteer_point_transactions', DEMO_POINT_TRANSACTIONS, tx => ({
    id: tx.id,
    volunteer_id: tx.volunteerId,
    amount: tx.amount,
    balance_after: tx.balanceAfter,
    reason: tx.reason,
    source: 'sos_mission',
    mission_title: tx.missionTitle,
    reference_id: tx.id,
    admin_note: tx.adminNote,
    author_name: tx.authorName,
    author_role: tx.authorRole,
    status: 'validated',
    is_demo: true
  }))

  // 9. SOS Calls
  await seedTable('sos_calls', DEMO_SOS_CALLS, c => ({
    id: c.id,
    reference: c.reference,
    title: c.title,
    description: c.description,
    mission_type: c.missionType,
    wilaya_code: c.wilayaCode,
    commune: c.commune,
    address: c.address,
    lat: c.lat,
    lng: c.lng,
    volunteers_needed: c.volunteersNeeded,
    volunteers_registered: c.volunteersRegistered,
    volunteers_present: c.volunteersPresent,
    start_date: c.startDate,
    end_date: c.endDate,
    start_time: c.startTime,
    end_time: c.endTime,
    required_skills: c.requiredSkills,
    urgency: c.urgency,
    status: c.status,
    supervising_authority: c.supervisingAuthority,
    admin_note: c.adminNote,
    is_demo: true
  }))

  // 10. SOS Material Needs
  await seedTable('sos_material_needs', DEMO_SOS_MATERIAL_NEEDS, m => ({
    id: m.id,
    reference: m.reference,
    title: m.title,
    description: m.description,
    category: m.category,
    wilaya_code: m.wilayaCode,
    commune: m.commune,
    address: m.address,
    lat: m.lat,
    lng: m.lng,
    required_quantity: m.requiredQuantity,
    unit: m.unit,
    received_quantity: m.receivedQuantity,
    priority: m.priority,
    deadline: m.deadline,
    status: m.status,
    admin_note: m.adminNote,
    is_demo: true
  }))

  // 11. SOS Collection Sites
  await seedTable('sos_collection_sites', DEMO_SOS_COLLECTION_SITES, cs => ({
    id: cs.id,
    name: cs.name,
    location: cs.location,
    wilaya_code: cs.wilayaCode,
    commune: cs.commune,
    address: cs.address,
    lat: cs.lat,
    lng: cs.lng,
    phone: cs.phone,
    responsible_name: cs.responsibleName,
    aid_categories: cs.aidCategories,
    is_active: cs.isActive,
    admin_note: cs.adminNote,
    is_demo: true
  }))

  // 12. SOS Damaged Sites
  await seedTable('sos_damaged_sites', DEMO_SOS_DAMAGED_SITES, ds => ({
    id: ds.id,
    name: ds.name,
    location: ds.location,
    wilaya_code: ds.wilayaCode,
    commune: ds.commune,
    address: ds.address,
    lat: ds.lat,
    lng: ds.lng,
    damage_type: ds.damageType,
    severity: ds.severity,
    aid_categories: ds.aidCategories,
    is_active: ds.isActive,
    admin_note: ds.adminNote,
    is_demo: true
  }))

  // 13. Institutional Users
  await seedTable('institutional_users', DEMO_INSTITUTIONAL_USERS, u => ({
    id: u.id,
    email: u.email,
    first_name: u.firstName,
    last_name: u.lastName,
    phone: u.phone,
    role: u.role,
    status: u.status,
    wilaya_code: u.wilayaCode,
    commune: u.commune,
    service_department: u.serviceDepartment,
    is_demo: true
  }))

  // 14. Presence Records
  await seedTable('presence_records', DEMO_PRESENCE_RECORDS, p => ({
    id: p.id,
    volunteer_id: p.volunteerId,
    volunteer_name: p.volunteerName,
    volunteer_code: p.volunteerCode,
    target_type: p.targetType,
    target_id: p.targetId,
    target_title: p.targetTitle,
    wilaya_code: p.wilayaCode,
    commune: p.commune,
    check_in_at: p.checkInAt,
    hours_calculated: p.hoursCalculated,
    points_awarded: p.pointsAwarded,
    status: p.status,
    validated_by_name: p.validatedByName,
    validation_mode: p.validationMode,
    is_demo: true
  }))

  // 15. Mission Reports
  await seedTable('mission_reports', DEMO_MISSION_REPORTS, (r: any) => ({
    id: r.id,
    mission_id: r.missionId,
    mission_title: r.title || r.missionTitle || 'Rapport de mission',
    mission_type: r.missionType || 'event',
    author_id: r.authorId,
    author_name: r.authorName,
    author_role: r.authorRole || 'mission_lead',
    wilaya_code: r.wilayaCode,
    commune: r.commune,
    date: r.missionDate || r.date || '2026-10-18',
    summary: r.summary,
    achievements: Array.isArray(r.achievements) ? r.achievements.join(' ; ') : String(r.achievements || ''),
    difficulties: r.challengesFaced || r.difficulties || '',
    participants_count: r.attendeesCount || r.participantsCount || 0,
    hours_spent: r.hoursCompleted || r.hoursSpent || 0,
    status: r.status || 'pending_audit',
    auditor_id: r.reviewedById || r.auditorId || null,
    auditor_name: r.reviewedByName || r.auditorName || null,
    audited_at: r.reviewedAt || r.auditedAt || null,
    audit_notes: r.reviewNote || r.auditNotes || null,
    reward_points_granted: r.rewardPointsGranted || 0,
    is_demo: true
  }))

  // 16. Notifications
  await seedTable('notifications', DEMO_NOTIFICATIONS, notif => ({
    id: notif.id,
    volunteer_id: notif.volunteerId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    points: notif.points,
    badge_id: notif.badgeId,
    tier_id: notif.tierId,
    read: notif.read,
    link: notif.link,
    is_demo: true
  }))

  console.log("\n🎉 ALL TABLES POPULATED WITH REAL DEMO DATA DIRECTLY ON SUPABASE!")
}

run()
