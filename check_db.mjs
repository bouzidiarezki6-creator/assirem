import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tvriygglikfmqewntzao.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cml5Z2dsaWtmbXFld250emFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDIzODcsImV4cCI6MjEwNTMxODM4N30.cfqDMWPYw3EG7tS3UzBoOpTuAGTSV_pHbkQ922C06hc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const tables = ['events', 'news', 'activities', 'institutions']
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('id')
    if (error) console.error(t, error)
    else console.log(`${t} count:`, data.length)
  }
}

test()
