import { Link } from "react-router-dom"
import { useI18n } from "@/context/I18nProvider"

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="bg-footer text-white border-t border-emerald-500/20">
      <div className="content-width py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center sm:text-start">
          <div className="space-y-4 sm:col-span-2 lg:col-span-2 flex flex-col items-center sm:items-start">
            <Link to="/" className="inline-flex items-center gap-2.5 bg-[#031d13] border border-emerald-500/30 px-3.5 py-2 rounded-2xl shadow-soft hover:bg-[#052d1d] hover:border-emerald-400/50 transition-all group">
              <img
                src="/LOGO.png"
                alt="Logo"
                className="h-10 w-auto object-contain shrink-0 transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]"
              />
              <img
                src="/logo-text.png"
                alt="Yed Fi Yed"
                className="h-8 w-auto object-contain shrink-0 transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_8px_rgba(0,255,136,0.2)]"
              />
            </Link>
            <p className="text-sm text-emerald-300/75 max-w-md leading-relaxed">{t("footer.about")}</p>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <h4 className="font-bold mb-4 text-emerald-300">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>
                <Link className="hover:text-primary transition-colors" to="/">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/a-propos">
                  {t("nav.about") || "Présentation"}
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/institutions">
                  {t("nav.institutions")}
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/news">
                  {t("nav.news")}
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/activities">
                  {t("nav.activities")}
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/sos">
                  {t("nav.sos")}
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <h4 className="font-bold mb-4 text-emerald-300">{t("footer.contact")}</h4>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>{t("footer.address")}</li>
              <li>contact@yedfelyed.dz</li>
              <li dir="ltr">+213 34 21 45 00</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-emerald-500/15 py-5 text-center text-sm text-white/50 px-5">
        <p>{t("footer.rights")}</p>
      </div>
    </footer>
  )
}
