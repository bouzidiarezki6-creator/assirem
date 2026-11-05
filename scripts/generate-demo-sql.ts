import fs from 'node:fs'
import path from 'node:path'
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

function sqlVal(val: any): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return String(val)
  return `'${String(val).replace(/'/g, "''")}'`
}

function sqlArrayText(val: any[] | null | undefined): string {
  if (!val || val.length === 0) return 'ARRAY[]::text[]'
  const elements = val.map(e => `'${String(e).replace(/'/g, "''")}'`)
  return `ARRAY[${elements.join(', ')}]::text[]`
}

function sqlJsonb(val: any): string {
  if (val === null || val === undefined) return "'[]'::jsonb"
  return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
}

const lines: string[] = []
lines.push(`-- ============================================================================`)
lines.push(`-- YED FEL YED — SEED DATA INSERTS (BÉJAÏA, SÉTIF, EL EULMA)`)
lines.push(`-- Version : 2.0 (PostgreSQL Strict Escaping & Validated Syntax)`)
lines.push(`-- ============================================================================\n`)

// 1. Events
lines.push(`-- 1. Événements (${DEMO_EVENTS.length})`)
for (const e of DEMO_EVENTS) {
  lines.push(`INSERT INTO public.events (id, title, description, date, location, institution, image_data_url, category_id, requires_registration, published, status, hours, conditions, capacity, registered_count, wilaya_code, commune, is_demo) VALUES (${sqlVal(e.id)}, ${sqlVal(e.title)}, ${sqlVal(e.description)}, ${sqlVal(e.date)}, ${sqlVal(e.location)}, ${sqlVal(e.institution)}, ${sqlVal(e.imageDataUrl)}, ${sqlVal(e.categoryId)}, ${sqlVal(e.requiresRegistration)}, ${sqlVal(e.published)}, ${sqlVal(e.status)}, ${sqlVal(e.hours)}, ${sqlVal(e.conditions)}, ${sqlVal(e.capacity)}, ${sqlVal(e.registeredCount)}, ${sqlVal(e.wilayaCode)}, ${sqlVal(e.commune)}, TRUE) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, date = EXCLUDED.date, status = EXCLUDED.status;`)
}

// 2. Announcements
lines.push(`\n-- 2. Annonces (${DEMO_ANNOUNCEMENTS.length})`)
for (const a of DEMO_ANNOUNCEMENTS) {
  lines.push(`INSERT INTO public.announcements (id, title, description, open_from, open_until, max_slots, active, is_demo) VALUES (${sqlVal(a.id)}, ${sqlVal(a.title)}, ${sqlVal(a.description)}, ${sqlVal(a.openFrom)}, ${sqlVal(a.openUntil)}, ${sqlVal(a.maxSlots)}, ${sqlVal(a.active)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 3. Activities
lines.push(`\n-- 3. Activités (${DEMO_ACTIVITIES.length})`)
for (const a of DEMO_ACTIVITIES) {
  lines.push(`INSERT INTO public.activities (id, title, description, date, day, month, location, institution, image_data_url, category_id, published, status, hours, conditions, capacity, registered_count, wilaya_code, commune, is_demo) VALUES (${sqlVal(a.id)}, ${sqlVal(a.title)}, ${sqlVal(a.description)}, ${sqlVal(a.date)}, ${sqlVal(a.day)}, ${sqlVal(a.month)}, ${sqlVal(a.location)}, ${sqlVal(a.institution)}, ${sqlVal(a.imageDataUrl)}, ${sqlVal(a.categoryId)}, ${sqlVal(a.published)}, ${sqlVal(a.status)}, ${sqlVal(a.hours)}, ${sqlVal(a.conditions)}, ${sqlVal(a.capacity)}, ${sqlVal(a.registeredCount)}, ${sqlVal(a.wilayaCode)}, ${sqlVal(a.commune)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 4. Institutions
lines.push(`\n-- 4. Institutions (${DEMO_INSTITUTIONS.length})`)
for (const i of DEMO_INSTITUTIONS) {
  lines.push(`INSERT INTO public.institutions (id, name, type, location, phone, image_data_url, published, wilaya_code, commune, lat, lng, structure_kind, authority, is_verified, email, hours, is_demo) VALUES (${sqlVal(i.id)}, ${sqlVal(i.name)}, ${sqlVal(i.type)}, ${sqlVal(i.location)}, ${sqlVal(i.phone)}, ${sqlVal(i.imageDataUrl)}, ${sqlVal(i.published)}, ${sqlVal(i.wilayaCode)}, ${sqlVal(i.commune)}, ${sqlVal(i.lat)}, ${sqlVal(i.lng)}, ${sqlVal(i.structureKind)}, ${sqlVal(i.authority)}, ${sqlVal(i.isVerified)}, ${sqlVal(i.email)}, ${sqlVal(i.hours)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 5. News
lines.push(`\n-- 5. Actualités (${DEMO_NEWS.length})`)
for (const n of DEMO_NEWS) {
  lines.push(`INSERT INTO public.news (id, title, description, content, category, category_id, date, image_data_url, featured, published, wilaya_code, commune, is_demo) VALUES (${sqlVal(n.id)}, ${sqlVal(n.title)}, ${sqlVal(n.description)}, ${sqlVal(n.content)}, ${sqlVal(n.category)}, ${sqlVal(n.categoryId)}, ${sqlVal(n.date)}, ${sqlVal(n.imageDataUrl)}, ${sqlVal(n.featured)}, ${sqlVal(n.published)}, ${sqlVal(n.wilayaCode)}, ${sqlVal(n.commune)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 6. Associations
lines.push(`\n-- 6. Associations (${DEMO_ASSOCIATIONS.length})`)
for (const ass of DEMO_ASSOCIATIONS) {
  lines.push(`INSERT INTO public.associations (id, name, logo_data_url, sector_id, ccp_account, published, is_demo) VALUES (${sqlVal(ass.id)}, ${sqlVal(ass.name)}, ${sqlVal(ass.logoDataUrl)}, ${sqlVal(ass.sectorId)}, ${sqlVal(ass.ccpAccount)}, ${sqlVal(ass.published)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 7. Volunteer Accounts
lines.push(`\n-- 7. Comptes Bénévoles (${DEMO_VOLUNTEERS.length})`)
for (const v of DEMO_VOLUNTEERS) {
  lines.push(`INSERT INTO public.volunteer_accounts (id, email, first_name, last_name, phone, wilaya_code, commune, birth_date, skills, interests, volunteer_code, points, status, is_verified, public_profile_consent, show_wilaya_in_leaderboard, earned_badges, bio, is_demo) VALUES (${sqlVal(v.id)}, ${sqlVal(v.email)}, ${sqlVal(v.firstName)}, ${sqlVal(v.lastName)}, ${sqlVal(v.phone)}, ${sqlVal(v.wilayaCode)}, ${sqlVal(v.commune)}, ${sqlVal(v.birthDate)}, ${sqlArrayText(v.skills)}, ${sqlArrayText(v.interests)}, ${sqlVal(v.volunteerCode)}, ${sqlVal(v.points)}, ${sqlVal(v.status)}, ${sqlVal(v.isVerified)}, ${sqlVal(v.publicProfileConsent)}, ${sqlVal(v.showWilayaInLeaderboard)}, ${sqlJsonb(v.earnedBadges || [])}, ${sqlVal(v.bio)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 8. Volunteer Point Transactions
lines.push(`\n-- 8. Transactions de points (${DEMO_POINT_TRANSACTIONS.length})`)
for (const tx of DEMO_POINT_TRANSACTIONS) {
  lines.push(`INSERT INTO public.volunteer_point_transactions (id, volunteer_id, amount, balance_after, reason, source, mission_title, reference_id, admin_note, author_name, author_role, status, is_demo) VALUES (${sqlVal(tx.id)}, ${sqlVal(tx.volunteerId)}, ${sqlVal(tx.amount)}, ${sqlVal(tx.balanceAfter)}, ${sqlVal(tx.reason)}, 'sos_mission', ${sqlVal(tx.missionTitle)}, ${sqlVal(tx.id)}, ${sqlVal(tx.adminNote)}, ${sqlVal(tx.authorName)}, ${sqlVal(tx.authorRole)}, 'validated', TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 9. SOS Calls
lines.push(`\n-- 9. Appels SOS (${DEMO_SOS_CALLS.length})`)
for (const c of DEMO_SOS_CALLS) {
  lines.push(`INSERT INTO public.sos_calls (id, reference, title, description, mission_type, wilaya_code, commune, address, lat, lng, volunteers_needed, volunteers_registered, volunteers_present, start_date, end_date, start_time, end_time, required_skills, urgency, status, supervising_authority, admin_note, is_demo) VALUES (${sqlVal(c.id)}, ${sqlVal(c.reference)}, ${sqlVal(c.title)}, ${sqlVal(c.description)}, ${sqlVal(c.missionType)}, ${sqlVal(c.wilayaCode)}, ${sqlVal(c.commune)}, ${sqlVal(c.address)}, ${sqlVal(c.lat)}, ${sqlVal(c.lng)}, ${sqlVal(c.volunteersNeeded)}, ${sqlVal(c.volunteersRegistered)}, ${sqlVal(c.volunteersPresent)}, ${sqlVal(c.startDate)}, ${sqlVal(c.endDate)}, ${sqlVal(c.startTime)}, ${sqlVal(c.endTime)}, ${sqlArrayText(c.requiredSkills)}, ${sqlVal(c.urgency)}, ${sqlVal(c.status)}, ${sqlVal(c.supervisingAuthority)}, ${sqlVal(c.adminNote)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 10. SOS Material Needs
lines.push(`\n-- 10. Besoins matériels (${DEMO_SOS_MATERIAL_NEEDS.length})`)
for (const m of DEMO_SOS_MATERIAL_NEEDS) {
  lines.push(`INSERT INTO public.sos_material_needs (id, reference, title, description, category, wilaya_code, commune, address, lat, lng, required_quantity, unit, received_quantity, priority, deadline, status, admin_note, is_demo) VALUES (${sqlVal(m.id)}, ${sqlVal(m.reference)}, ${sqlVal(m.title)}, ${sqlVal(m.description)}, ${sqlVal(m.category)}, ${sqlVal(m.wilayaCode)}, ${sqlVal(m.commune)}, ${sqlVal(m.address)}, ${sqlVal(m.lat)}, ${sqlVal(m.lng)}, ${sqlVal(m.requiredQuantity)}, ${sqlVal(m.unit)}, ${sqlVal(m.receivedQuantity)}, ${sqlVal(m.priority)}, ${sqlVal(m.deadline)}, ${sqlVal(m.status)}, ${sqlVal(m.adminNote)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 11. SOS Collection Sites
lines.push(`\n-- 11. Sites de collecte SOS (${DEMO_SOS_COLLECTION_SITES.length})`)
for (const cs of DEMO_SOS_COLLECTION_SITES) {
  lines.push(`INSERT INTO public.sos_collection_sites (id, name, location, wilaya_code, commune, address, lat, lng, phone, responsible_name, aid_categories, is_active, admin_note, is_demo) VALUES (${sqlVal(cs.id)}, ${sqlVal(cs.name)}, ${sqlVal(cs.location)}, ${sqlVal(cs.wilayaCode)}, ${sqlVal(cs.commune)}, ${sqlVal(cs.address)}, ${sqlVal(cs.lat)}, ${sqlVal(cs.lng)}, ${sqlVal(cs.phone)}, ${sqlVal(cs.responsibleName)}, ${sqlArrayText(cs.aidCategories)}, ${sqlVal(cs.isActive)}, ${sqlVal(cs.adminNote)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 12. SOS Damaged Sites
lines.push(`\n-- 12. Sites sinistrés SOS (${DEMO_SOS_DAMAGED_SITES.length})`)
for (const ds of DEMO_SOS_DAMAGED_SITES) {
  lines.push(`INSERT INTO public.sos_damaged_sites (id, name, location, wilaya_code, commune, address, lat, lng, damage_type, severity, aid_categories, is_active, admin_note, is_demo) VALUES (${sqlVal(ds.id)}, ${sqlVal(ds.name)}, ${sqlVal(ds.location)}, ${sqlVal(ds.wilayaCode)}, ${sqlVal(ds.commune)}, ${sqlVal(ds.address)}, ${sqlVal(ds.lat)}, ${sqlVal(ds.lng)}, ${sqlVal(ds.damageType)}, ${sqlVal(ds.severity)}, ${sqlArrayText(ds.aidCategories)}, ${sqlVal(ds.isActive)}, ${sqlVal(ds.adminNote)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 13. Institutional Users
lines.push(`\n-- 13. Utilisateurs Institutionnels (${DEMO_INSTITUTIONAL_USERS.length})`)
for (const u of DEMO_INSTITUTIONAL_USERS) {
  lines.push(`INSERT INTO public.institutional_users (id, email, first_name, last_name, phone, role, status, wilaya_code, commune, service_department, is_demo) VALUES (${sqlVal(u.id)}, ${sqlVal(u.email)}, ${sqlVal(u.firstName)}, ${sqlVal(u.lastName)}, ${sqlVal(u.phone)}, ${sqlVal(u.role)}::institutional_role, ${sqlVal(u.status)}::institutional_user_status, ${sqlVal(u.wilayaCode)}, ${sqlVal(u.commune)}, ${sqlVal(u.serviceDepartment)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 14. Presence Records
lines.push(`\n-- 14. Pointages Présence QR (${DEMO_PRESENCE_RECORDS.length})`)
for (const p of DEMO_PRESENCE_RECORDS) {
  lines.push(`INSERT INTO public.presence_records (id, volunteer_id, volunteer_name, volunteer_code, target_type, target_id, target_title, wilaya_code, commune, check_in_at, hours_calculated, points_awarded, status, validated_by_name, validation_mode, is_demo) VALUES (${sqlVal(p.id)}, ${sqlVal(p.volunteerId)}, ${sqlVal(p.volunteerName)}, ${sqlVal(p.volunteerCode)}, ${sqlVal(p.targetType)}, ${sqlVal(p.targetId)}, ${sqlVal(p.targetTitle)}, ${sqlVal(p.wilayaCode)}, ${sqlVal(p.commune)}, ${sqlVal(p.checkInAt)}, ${sqlVal(p.hoursCalculated)}, ${sqlVal(p.pointsAwarded)}, ${sqlVal(p.status)}, ${sqlVal(p.validatedByName)}, ${sqlVal(p.validationMode)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 15. Mission Reports
lines.push(`\n-- 15. Rapports de Mission (${DEMO_MISSION_REPORTS.length})`)
for (const r of DEMO_MISSION_REPORTS as any[]) {
  const mTitle = r.title || r.missionTitle || 'Rapport de mission'
  const mDate = r.missionDate || r.date || '2026-10-18'
  const mAch = Array.isArray(r.achievements) ? r.achievements.join(' ; ') : String(r.achievements || '')
  const mDiff = r.challengesFaced || r.difficulties || ''
  const mParts = r.attendeesCount || r.participantsCount || 0
  const mHours = r.hoursCompleted || r.hoursSpent || 0
  const mAudId = r.reviewedById || r.auditorId || null
  const mAudName = r.reviewedByName || r.auditorName || null
  const mAudNotes = r.reviewNote || r.auditNotes || null

  lines.push(`INSERT INTO public.mission_reports (id, mission_id, mission_title, mission_type, author_id, author_name, author_role, wilaya_code, commune, date, summary, achievements, difficulties, participants_count, hours_spent, status, auditor_id, auditor_name, audit_notes, reward_points_granted, is_demo) VALUES (${sqlVal(r.id)}, ${sqlVal(r.missionId)}, ${sqlVal(mTitle)}, ${sqlVal(r.missionType || 'event')}, ${sqlVal(r.authorId)}, ${sqlVal(r.authorName)}, ${sqlVal(r.authorRole || 'mission_lead')}, ${sqlVal(r.wilayaCode)}, ${sqlVal(r.commune)}, ${sqlVal(mDate)}, ${sqlVal(r.summary)}, ${sqlVal(mAch)}, ${sqlVal(mDiff)}, ${sqlVal(mParts)}, ${sqlVal(mHours)}, ${sqlVal(r.status)}, ${sqlVal(mAudId)}, ${sqlVal(mAudName)}, ${sqlVal(mAudNotes)}, ${sqlVal(r.rewardPointsGranted || 0)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

// 16. Notifications
lines.push(`\n-- 16. Notifications (${DEMO_NOTIFICATIONS.length})`)
for (const notif of DEMO_NOTIFICATIONS) {
  lines.push(`INSERT INTO public.notifications (id, volunteer_id, type, title, message, points, badge_id, tier_id, read, link, is_demo) VALUES (${sqlVal(notif.id)}, ${sqlVal(notif.volunteerId)}, ${sqlVal(notif.type)}, ${sqlVal(notif.title)}, ${sqlVal(notif.message)}, ${sqlVal(notif.points)}, ${sqlVal(notif.badgeId)}, ${sqlVal(notif.tierId)}, ${sqlVal(notif.read)}, ${sqlVal(notif.link)}, TRUE) ON CONFLICT (id) DO NOTHING;`)
}

const outPath = path.resolve(process.cwd(), 'supabase_demo_data_insert.sql')
fs.writeFileSync(outPath, lines.join('\n'), 'utf-8')
console.log(`Generated ${lines.length} lines into ${outPath}`)
