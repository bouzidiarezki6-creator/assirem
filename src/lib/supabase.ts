import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://tvriygglikfmqewntzao.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cml5Z2dsaWtmbXFld250emFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDIzODcsImV4cCI6MjEwNTMxODM4N30.cfqDMWPYw3EG7tS3UzBoOpTuAGTSV_pHbkQ922C06hc"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase credentials in environment variables.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
