import { createClient } from "@supabase/supabase-js"

const url = "https://rmlmovunysnwotwynpsj.supabase.co"
const key = "sb_publishable_U5R_FpGxH2Zj15W3KxiKJg_M0xKeEL3"

const supabase = createClient(url, key)

async function audit() {
  console.log("=== AUDITING SUPABASE PROJECT: YED FEL YED (AKBOU) ===")
  console.log("URL:", url)

  const tables = [
    'events', 'announcements', 'activities', 'institutions', 'news',
    'registrants', 'associations', 'participations', 'volunteer_accounts',
    'volunteer_point_transactions', 'sos_material_needs', 'sos_calls',
    'sos_applications', 'sos_interventions', 'institutional_users',
    'institutional_operations', 'digital_attestations', 'audit_registry',
    'presence_records', 'mission_reports', 'notifications'
  ]

  console.log("\n--- 1. TABLE DATA & ROW COUNTS ---")
  for (const table of tables) {
    try {
      const { data, error, status } = await supabase.from(table).select("*").limit(5)
      if (error) {
        console.log(`❌ [${table}] Error (${status}): ${error.message}`)
      } else {
        console.log(`✅ [${table}]: Accessible! Rows returned: ${data.length}`)
      }
    } catch (e) {
      console.log(`⚠️ [${table}] Exception: ${e.message}`)
    }
  }

  console.log("\n--- 2. STORAGE BUCKETS ---")
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    if (error) {
      console.log("Storage buckets error:", error.message)
    } else {
      console.log("Storage buckets found:", buckets.map(b => b.name))
    }
  } catch (e) {
    console.log("Storage exception:", e.message)
  }

  console.log("\n--- 3. TEST WRITE / INSERT / DELETE OPERATION (RLS CHECK) ---")
  try {
    const testEventId = "test-rls-probe-" + Date.now()
    const { data: insData, error: insErr } = await supabase.from("events").insert({
      id: testEventId,
      title: "Test RLS Probe Event",
      description: "Testing RLS insertion policy",
      date: "2026-11-05",
      location: "Béjaïa Test",
      institution: "Test DJS",
      requires_registration: true,
      published: false
    }).select()

    if (insErr) {
      console.log("❌ Insert test failed:", insErr.message)
    } else {
      console.log("✅ Insert test succeeded! Inserted record:", insData[0]?.id)
      
      // Cleanup probe
      const { error: delErr } = await supabase.from("events").delete().eq("id", testEventId)
      if (delErr) {
        console.log("⚠️ Delete test probe failed:", delErr.message)
      } else {
        console.log("✅ Delete test probe cleaned up successfully!")
      }
    }
  } catch (e) {
    console.log("Write test exception:", e.message)
  }
}

audit()
