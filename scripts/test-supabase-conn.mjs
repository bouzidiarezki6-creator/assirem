import { createClient } from "@supabase/supabase-js"

const url = "https://rmlmovunysnwotwynpsj.supabase.co"
const key = "sb_publishable_U5R_FpGxH2Zj15W3KxiKJg_M0xKeEL3"

console.log("Initializing Supabase client...")
const supabase = createClient(url, key)

async function test() {
  try {
    const { data, error, status } = await supabase.from("events").select("count")
    console.log("Connection response:", { status, error: error?.message || null, hasData: !!data })
  } catch (err) {
    console.error("Connection exception:", err.message)
  }
}

test()

