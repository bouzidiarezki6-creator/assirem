import { createClient } from "@supabase/supabase-js"

async function inspectProject(name, url, key) {
  console.log(`\n=== Inspecting ${name} (${url}) ===`)
  const client = createClient(url, key)
  const tables = [
    'events', 'announcements', 'activities', 'institutions', 'news',
    'registrants', 'associations', 'participations', 'volunteer_accounts',
    'volunteer_point_transactions', 'sos_material_needs', 'sos_calls',
    'sos_applications', 'sos_interventions', 'institutional_users',
    'institutional_operations', 'digital_attestations', 'audit_registry',
    'presence_records', 'mission_reports', 'notifications'
  ]

  for (const table of tables) {
    try {
      const { data, count, error, status } = await client
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`  [${table}]: status ${status} - error: ${error.message} (code: ${error.code})`)
      } else {
        console.log(`  [${table}]: EXISTS! count = ${count}`)
      }
    } catch (err) {
      console.log(`  [${table}]: Exception ${err.message}`)
    }
  }
}

async function run() {
  // Project 1: User's provided project
  await inspectProject(
    "User Provided: rmlmovunysnwotwynpsj",
    "https://rmlmovunysnwotwynpsj.supabase.co",
    "sb_publishable_U5R_FpGxH2Zj15W3KxiKJg_M0xKeEL3"
  )

  // Project 2: Old project in seed_supabase.mjs
  await inspectProject(
    "Old Project: tvriygglikfmqewntzao",
    "https://tvriygglikfmqewntzao.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cml5Z2dsaWtmbXFld250emFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDIzODcsImV4cCI6MjEwNTMxODM4N30.cfqDMWPYw3EG7tS3UzBoOpTuAGTSV_pHbkQ922C06hc"
  )
}

run()

