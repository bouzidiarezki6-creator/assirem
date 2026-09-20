import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tvriygglikfmqewntzao.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cml5Z2dsaWtmbXFld250emFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDIzODcsImV4cCI6MjEwNTMxODM4N30.cfqDMWPYw3EG7tS3UzBoOpTuAGTSV_pHbkQ922C06hc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  try {
    const id = crypto.randomUUID()
    console.log("Testing insert with UUID:", id)
    
    // Test Insert
    const { data, error } = await supabase.from('events').insert({
      id: id,
      title: "Test Event",
      description: "Testing API",
      date: "2026-09-20",
      location: "Bejaia",
      institution: "Yed fel yed",
      image_data_url: null,
      requires_registration: false,
      published: true
    }).select()

    if (error) {
      console.error("Insert Error:", error)
    } else {
      console.log("Insert Success:", data)
      
      // Clean up
      await supabase.from('events').delete().eq('id', id)
      console.log("Cleanup Success")
    }
  } catch (err) {
    console.error("Exception:", err)
  }
}

test()
