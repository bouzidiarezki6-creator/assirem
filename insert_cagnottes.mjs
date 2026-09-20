import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tvriygglikfmqewntzao.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cml5Z2dsaWtmbXFld250emFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDIzODcsImV4cCI6MjEwNTMxODM4N30.cfqDMWPYw3EG7tS3UzBoOpTuAGTSV_pHbkQ922C06hc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const originalTypes = [
  { id: "aid_adha", defaultGoal: 500000 },
  { id: "aid_fitr", defaultGoal: 300000 },
  { id: "ramadan", defaultGoal: 400000 },
  { id: "rentree", defaultGoal: 350000 },
  { id: "associations", defaultGoal: 250000 }
]

async function insertCagnottes() {
  const toInsert = []
  
  for (let code = 1; code <= 69; code++) {
    for (const type of originalTypes) {
      const variance = ((code * 17 + type.id.length * 31) % 40) / 100
      const goal = Math.round(type.defaultGoal * (0.85 + variance))
      const raised = Math.round(goal * (((code * 13 + type.id.charCodeAt(0)) % 55) / 100))
      
      toInsert.push({
        id: `cag-${String(code).padStart(2, "0")}-${type.id}`,
        type_id: type.id,
        wilaya_code: code,
        goal_amount: goal,
        raised_amount: raised,
        published: true
      })
    }
  }

  // Insert in batches of 100
  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100)
    const { data, error } = await supabase.from('cagnottes').insert(batch).select('id')
    if (error) {
      if (error.code === '23505') { // unique violation
        console.log("Batch already exists")
      } else {
        console.error("Error inserting batch:", error)
      }
    } else {
      console.log(`Inserted ${data.length} cagnottes`)
    }
  }
}

insertCagnottes()
