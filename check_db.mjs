import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tvriygglikfmqewntzao.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cml5Z2dsaWtmbXFld250emFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDIzODcsImV4cCI6MjEwNTMxODM4N30.cfqDMWPYw3EG7tS3UzBoOpTuAGTSV_pHbkQ922C06hc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase.from('cagnottes').select('type_id')
  if (error) console.error(error)
  else {
    const types = new Set(data.map(d => d.type_id))
    console.log("Cagnottes in DB:", Array.from(types))
  }
}
test()
