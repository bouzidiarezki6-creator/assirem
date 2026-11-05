import { createClient } from "@supabase/supabase-js"

const url = "https://rmlmovunysnwotwynpsj.supabase.co"
const key = "sb_publishable_U5R_FpGxH2Zj15W3KxiKJg_M0xKeEL3"

const supabase = createClient(url, key)

async function testInsert() {
  const volunteer = {
    id: 'demo-vol-walid',
    email: 'walid.boudiaf.demo@yedfelyed.dz',
    first_name: 'Walid',
    last_name: 'Boudiaf',
    phone: '0773456789',
    wilaya_code: 19,
    commune: 'El Eulma',
    birth_date: '2001-11-05',
    skills: ['distribution', 'transport', 'logistics'],
    interests: ['Logistique humanitaire', "Distribution d'aide", "Convois d'hiver"],
    volunteer_code: 'YFY-VOL-20261105-19WB',
    points: 250,
    status: 'active',
    is_verified: true,
    public_profile_consent: true,
    show_wilaya_in_leaderboard: true,
    earned_badges: [],
    bio: "Jeune commerçant à El Eulma disposant d'un utilitaire, mobilisé pour acheminer l'aide dans les zones enclavées.",
    is_demo: true
  }

  const { data, error } = await supabase.from('volunteer_accounts').upsert(volunteer).select()
  if (error) {
    console.error("Test error:", error.message)
  } else {
    console.log("SUCCESS! Upserted:", data[0]?.id, data[0]?.first_name)
  }
}

testInsert()

