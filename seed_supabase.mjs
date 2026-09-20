import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tvriygglikfmqewntzao.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cml5Z2dsaWtmbXFld250emFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDIzODcsImV4cCI6MjEwNTMxODM4N30.cfqDMWPYw3EG7tS3UzBoOpTuAGTSV_pHbkQ922C06hc'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=800&q=80",
  "https://images.unsplash.com/photo-1593113565214-80afcb4a4771?w=800&q=80",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80",
  "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&q=80",
  "https://images.unsplash.com/photo-1526951521990-620dc14c214b?w=800&q=80",
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
  "https://images.unsplash.com/photo-1594708767771-a7502209ff51?w=800&q=80"
]

function randomImg() {
  return MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)]
}

function randId() {
  return crypto.randomUUID()
}

const DUMMY_NEWS = [
  { title: "Inauguration de la nouvelle maison de jeunes", description: "Une nouvelle maison de jeunes a été inaugurée avec des espaces de jeu et d'apprentissage modernes.", category: "youth", date: "2026-09-15" },
  { title: "Campagne de don de sang réussie", description: "Plus de 500 donneurs ont participé à notre campagne régionale de solidarité.", category: "solidarity", date: "2026-09-10" },
  { title: "Tournoi sportif inter-quartiers", description: "Le grand tournoi sportif s'est clôturé par une finale exceptionnelle réunissant des centaines de spectateurs.", category: "sports", date: "2026-09-18" },
  { title: "Ateliers de lecture pour enfants", description: "Lancement de la deuxième édition des ateliers éducatifs pour enfants dans toutes les wilayas.", category: "culture", date: "2026-09-22" },
  { title: "Lancement du programme vert", description: "Un programme de plantation de 10 000 arbres a été lancé dans les forêts locales.", category: "culture", date: "2026-09-05" },
  { title: "Formation en secourisme", description: "Des sessions de formation en secourisme pour 200 jeunes bénévoles.", category: "solidarity", date: "2026-09-19" },
].map(n => ({ id: randId(), ...n, image_data_url: randomImg(), published: true }))

const DUMMY_EVENTS = [
  { title: "Festival de la Jeunesse", description: "Trois jours de célébration avec musique, théâtre et expositions.", date: "2026-10-01", location: "Stade Municipal", institution: "ODEJ Centrale" },
  { title: "Conférence sur l'Entrepreneuriat", description: "Rencontre avec des jeunes entrepreneurs et experts pour partager leurs expériences.", date: "2026-10-15", location: "Salle des Fêtes", institution: "Maison de jeunes El-Amal" },
  { title: "Journée de Nettoyage", description: "Une initiative communautaire pour nettoyer les plages et les forêts.", date: "2026-10-20", location: "Plage Centre", institution: "Association Verte" },
  { title: "Soirée Astronomie", description: "Observation des étoiles avec des télescopes professionnels.", date: "2026-11-05", location: "Montagne d'Akfadou", institution: "Club Scientifique" },
  { title: "Foire de l'Artisanat", description: "Exposition des créations artisanales locales par les jeunes de la région.", date: "2026-11-12", location: "Place du Marché", institution: "ODEJ" }
].map(e => ({ id: randId(), ...e, image_data_url: randomImg(), requires_registration: true, published: true }))

const DUMMY_ACTIVITIES = [
  { title: "Plantation d'arbres (Akbou)", description: "Reboisement de la forêt touchée par les récents incendies.", date: "2026-10-10", category: "Écologie", institution: "ODEJ Béjaia", wilaya_code: 6 },
  { title: "Distribution de repas chauds", description: "Distribution de repas pour les personnes sans-abri.", date: "2026-10-12", category: "Solidarité", institution: "Croissant Rouge", wilaya_code: 16 },
  { title: "Soutien Scolaire", description: "Accompagnement des enfants en difficulté scolaire.", date: "2026-10-14", category: "Éducation", institution: "Association Espoir", wilaya_code: 19 },
  { title: "Nettoyage des quartiers", description: "Grand nettoyage collectif des rues principales.", date: "2026-10-16", category: "Environnement", institution: "APC", wilaya_code: 31 },
  { title: "Don de Sang", description: "Journée de don de sang au profit des hôpitaux locaux.", date: "2026-10-18", category: "Santé", institution: "Hôpital Central", wilaya_code: 6 }
].map(a => ({ 
  id: randId(), ...a, image_data_url: randomImg(), 
  current_participants: Math.floor(Math.random() * 20),
  max_participants: 50,
  is_completed: false,
  published: true
}))

const DUMMY_SOS = [
  { title: "Fuite d'eau majeure", description: "Canalisation principale cassée provoquant une inondation dans le quartier nord.", location: "Quartier Nord, Rue 5", reported_by: "Ahmed", status: "pending" },
  { title: "Poteau électrique dangereux", description: "Poteau penché menaçant de tomber sur la route.", location: "Route Nationale 12", reported_by: "Samir", status: "resolved" },
  { title: "Fossé dangereux non couvert", description: "Un grand trou laissé par des travaux récents au milieu du trottoir.", location: "Cité 500 logements", reported_by: "Kader", status: "pending" },
].map(s => ({ id: randId(), ...s, image_data_url: randomImg(), published: true }))

async function seed() {
  console.log("Seeding News...")
  await supabase.from('news').insert(DUMMY_NEWS)
  
  console.log("Seeding Events...")
  await supabase.from('events').insert(DUMMY_EVENTS)
  
  console.log("Seeding Activities...")
  await supabase.from('activities').insert(DUMMY_ACTIVITIES)
  
  console.log("Seeding SOS...")
  await supabase.from('sos_damaged_sites').insert(DUMMY_SOS)
  
  console.log("Seed complete!")
}

seed().catch(console.error)
