import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { DataProvider } from "./context/DataProvider"
import { I18nProvider } from "./context/I18nProvider"
import { LocationFilterProvider } from "./context/LocationFilterProvider"
import AppLayout from "./components/layout/AppLayout"
import Home from "./pages/Home"
import News from "./pages/News"
import NewsDetails from "./pages/NewsDetails"
import Activities from "./pages/Activities"
import Institutions from "./pages/Institutions"
import Inscription from "./pages/Inscription"
import Cagnottes from "./pages/Cagnottes"
import Sos from "./pages/Sos"
import EventDetails from "./pages/EventDetails"
import ActivityDetails from "./pages/ActivityDetails"
import Admin from "./pages/Admin"

function App() {
  return (
    <I18nProvider>
      <DataProvider>
        <LocationFilterProvider>
          <Router>
            <Routes>
              <Route path="/admin" element={<Admin />} />
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Home />} />
                <Route path="institutions" element={<Institutions />} />
                <Route path="news" element={<News />} />
                <Route path="news/:id" element={<NewsDetails />} />
                <Route path="activities" element={<Activities />} />
                <Route path="activities/:id" element={<ActivityDetails />} />
                <Route path="events/:id" element={<EventDetails />} />
                <Route path="inscription" element={<Inscription />} />
                <Route path="cagnottes" element={<Cagnottes />} />
                <Route path="sos" element={<Sos />} />
              </Route>
            </Routes>
          </Router>
        </LocationFilterProvider>
      </DataProvider>
    </I18nProvider>
  )
}

export default App
