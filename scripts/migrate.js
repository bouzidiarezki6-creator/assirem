import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY // Actually we need service_role for bypassing RLS to seed data, or we just insert it, since RLS on some tables might block us if we use anon key?
