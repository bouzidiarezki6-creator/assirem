import { Link } from "react-router-dom"
import { useI18n } from "@/context/I18nProvider"

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="bg-footer text-white">
      <div className="content-width py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center sm:text-start">
          <div className="space-y-4 sm:col-span-2 lg:col-span-2 flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-[10px] font-extrabold">
                YFY
              </div>
              <h3 className="font-extrabold text-lg">{t("brand")}</h3>
            </div>
            <p className="text-sm text-white/75 max-w-md leading-relaxed">{t("footer.about")}</p>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <h4 className="font-bold mb-4 text-white/95">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>
                <Link className="hover:text-white transition-colors" to="/">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/news">
                  {t("nav.news")}
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/activities">
                  {t("nav.activities")}
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/cagnottes">
                  {t("nav.cagnottes")}
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/sos">
                  {t("nav.sos")}
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <h4 className="font-bold mb-4 text-white/95">{t("footer.contact")}</h4>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>{t("footer.address")}</li>
              <li>contact@yedfelyed.dz</li>
              <li dir="ltr">+213 34 21 45 00</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-white/60 px-5">
        <p>{t("footer.rights")}</p>
      </div>
    </footer>
  )
}
