import Navbar from "./Navbar"
import Footer from "./Footer"
import MobileBottomNav from "./MobileBottomNav"
import PageTransition from "./PageTransition"
import SiteChatBubble from "@/components/chat/SiteChatBubble"
import { useI18n } from "@/context/I18nProvider"

export default function AppLayout() {
  const { dir } = useI18n()

  return (
    <div className="min-h-screen flex flex-col font-sans" dir={dir}>
      <Navbar />
      <main className="flex-1 bg-surface pb-20 lg:pb-0">
        <PageTransition />
      </main>
      <Footer />
      <MobileBottomNav />
      <SiteChatBubble />
    </div>
  )
}
