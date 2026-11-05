import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { DataProvider } from "./context/DataProvider"
import { I18nProvider } from "./context/I18nProvider"
import { LocationFilterProvider } from "./context/LocationFilterProvider"
import { VolunteerAuthProvider } from "./context/VolunteerAuthContext"
import AppLayout from "./components/layout/AppLayout"
import Home from "./pages/Home"
import About from "./pages/About"
import News from "./pages/News"
import NewsDetails from "./pages/NewsDetails"
import Activities from "./pages/Activities"
import Institutions from "./pages/Institutions"
import Inscription from "./pages/Inscription"
import Sos from "./pages/Sos"
import EventDetails from "./pages/EventDetails"
import ActivityDetails from "./pages/ActivityDetails"
import Admin from "./pages/Admin"
import Rejoindre from "./pages/Rejoindre"
import MonEspace from "./pages/MonEspace"

function App() {
  return (
    <I18nProvider>
      <DataProvider>
        <LocationFilterProvider>
          <VolunteerAuthProvider>
            <Router>
              <Routes>
                {/* Admin Dashboard */}
                <Route path="/admin" element={<Admin />} />

                {/* Public Frontend Layout */}
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Home />} />
                  <Route path="a-propos" element={<About />} />
                  <Route path="presentation" element={<About />} />
                  <Route path="institutions" element={<Institutions />} />
                  <Route path="news" element={<News />} />
                  <Route path="news/:id" element={<NewsDetails />} />
                  <Route path="activities" element={<Activities />} />
                  <Route path="activities/:id" element={<ActivityDetails />} />
                  <Route path="events/:id" element={<EventDetails />} />
                  <Route path="inscription" element={<Inscription />} />
                  <Route path="sos" element={<Sos />} />

                  {/* Volunteer Space & Authentication */}
                  <Route path="rejoindre" element={<Rejoindre />} />
                  <Route path="connexion" element={<Rejoindre />} />
                  <Route path="inscription-benevole" element={<Rejoindre />} />
                  <Route path="mon-espace" element={<MonEspace />} />

                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Router>
          </VolunteerAuthProvider>
        </LocationFilterProvider>
      </DataProvider>
    </I18nProvider>
  )
}

export default App
