import { getData } from "../src/lib/storage"

// Mock localStorage for node environment
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
}

const data = getData()

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL'
  return "'" + str.replace(/'/g, "''") + "'"
}

const sql: string[] = []

// Events
data.events.forEach(e => {
  sql.push(`INSERT INTO public.events (id, title, description, date, location, institution, image_data_url, requires_registration, published) VALUES ('${e.id}', ${escapeSql(e.title)}, ${escapeSql(e.description)}, ${escapeSql(e.date)}, ${escapeSql(e.location)}, ${escapeSql(e.institution)}, ${escapeSql(e.imageDataUrl)}, ${e.requiresRegistration}, ${e.published});`)
})

// Announcements
data.announcements.forEach(e => {
  sql.push(`INSERT INTO public.announcements (id, title, description, open_from, open_until, max_slots, active) VALUES ('${e.id}', ${escapeSql(e.title)}, ${escapeSql(e.description)}, ${escapeSql(e.openFrom)}, ${escapeSql(e.openUntil)}, ${e.maxSlots}, ${e.active});`)
})

// Activities
data.activities.forEach(e => {
  sql.push(`INSERT INTO public.activities (id, title, description, date, day, month, location, institution, image_data_url, published) VALUES ('${e.id}', ${escapeSql(e.title)}, ${escapeSql(e.description)}, ${escapeSql(e.date)}, ${escapeSql(e.day)}, ${escapeSql(e.month)}, ${escapeSql(e.location)}, ${escapeSql(e.institution)}, ${escapeSql(e.imageDataUrl)}, ${e.published});`)
})

// Institutions
data.institutions.forEach(e => {
  sql.push(`INSERT INTO public.institutions (id, name, type, location, phone, image_data_url, published, wilaya_code, lat, lng, structure_kind, authority) VALUES ('${e.id}', ${escapeSql(e.name)}, ${escapeSql(e.type)}, ${escapeSql(e.location)}, ${escapeSql(e.phone)}, ${escapeSql(e.imageDataUrl)}, ${e.published}, ${e.wilayaCode ?? 'NULL'}, ${e.lat ?? 'NULL'}, ${e.lng ?? 'NULL'}, ${escapeSql(e.structureKind)}, ${escapeSql(e.authority)});`)
})

// News
data.news.forEach(e => {
  sql.push(`INSERT INTO public.news (id, title, description, category, date, image_data_url, featured, published) VALUES ('${e.id}', ${escapeSql(e.title)}, ${escapeSql(e.description)}, ${escapeSql(e.category)}, ${escapeSql(e.date)}, ${escapeSql(e.imageDataUrl)}, ${e.featured}, ${e.published});`)
})

// Associations
data.associations.forEach(e => {
  sql.push(`INSERT INTO public.associations (id, name, logo_data_url, sector_id, ccp_account, published) VALUES (${escapeSql(e.id)}, ${escapeSql(e.name)}, ${escapeSql(e.logoDataUrl)}, ${escapeSql(e.sectorId)}, ${escapeSql(e.ccpAccount)}, ${e.published});`)
})

import fs from "fs";
fs.writeFileSync("seed.sql", sql.join('\n'), "utf-8");
