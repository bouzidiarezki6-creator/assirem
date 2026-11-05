import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rmlmovunysnwotwynpsj.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_U5R_FpGxH2Zj15W3KxiKJg_M0xKeEL3"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase credentials in environment variables.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
