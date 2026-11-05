import { useMemo, useState } from "react"
import {
  BarChart3,
  FileSpreadsheet,
  MapPin,
  Printer,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGovernance } from "@/context/GovernanceContext"
import { padWilayaCode } from "@/lib/wilayas"

export default function InstitutionalReportingPanel() {
  const { kpis } = useGovernance()

  const [wilayaSearch, setWilayaSearch] = useState("")

  // Filtered wilaya list for territory reporting table
  const wilayaList = useMemo(() => {
    const list = Object.values(kpis.wilayaBreakdown)
    const q = wilayaSearch.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (w) =>
        w.wilayaName.toLowerCase().includes(q) ||
        String(w.wilayaCode).includes(q)
    )
  }, [kpis.wilayaBreakdown, wilayaSearch])

  // Export CSV function
  const handleExportCSV = () => {
    const headers = [
      "Code Wilaya",
      "Nom Wilaya",
      "Total Opérations",
      "Opérations Actives",
      "Bénévoles Mobilisés",
    ]
    const rows = wilayaList.map((w) => [
      padWilayaCode(w.wilayaCode),
      `"${w.wilayaName}"`,
      w.totalOps,
      w.activeOps,
      w.volunteersCount,
    ])
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `rapport_gouvernance_wilayas_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-emerald-700" />
            Rapports & Supervision Nationale
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Tableau de bord institutionnel distinguant les données déclarées, vérifiées, validées et consolidées.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCSV}
            className="rounded-2xl h-10 px-3.5 text-xs font-bold gap-2 border-emerald-300 text-emerald-900 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span>Exporter CSV / Excel</span>
          </Button>

          <Button
            type="button"
            onClick={handlePrint}
            className="rounded-2xl h-10 px-4 text-xs font-bold gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer le Rapport</span>
          </Button>
        </div>
      </div>

      {/* 4 STAGES OF VERIFICATION (Section 9 obligatoire) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stage 1: Déclarées */}
        <div className="rounded-3xl border border-slate-300 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Données Déclarées
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 border border-slate-300">
              Auto-déclaré
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {kpis.byStage.declared}
          </p>
          <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
            Dépôts initiaux des associations et bénévoles en attente de vérification locale.
          </p>
        </div>

        {/* Stage 2: Vérifiées */}
        <div className="rounded-3xl border border-indigo-300 bg-indigo-50/70 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
              2. Données Vérifiées
            </span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-950 border border-indigo-300">
              Terrain / Local
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-indigo-950">
            {kpis.byStage.verified}
          </p>
          <p className="text-xs text-indigo-950 font-medium mt-1 leading-relaxed">
            Contrôlées sur pièce et sur le terrain par le coordinateur local ou de daïra.
          </p>
        </div>

        {/* Stage 3: Validées */}
        <div className="rounded-3xl border border-emerald-300 bg-emerald-50/80 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
              3. Données Validées
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-950 border border-emerald-300">
              Attesté DJS
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-950">
            {kpis.byStage.validated}
          </p>
          <p className="text-xs text-emerald-950 font-medium mt-1 leading-relaxed">
            Approuvées par décision administrative avec émission d'attestation scellée.
          </p>
        </div>

        {/* Stage 4: Consolidées */}
        <div className="rounded-3xl border border-purple-300 bg-purple-50/70 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-950">
              4. Données Consolidées
            </span>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-950 border border-purple-300">
              Bilan MJS
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-purple-950">
            {kpis.byStage.consolidated}
          </p>
          <p className="text-xs text-purple-950 font-medium mt-1 leading-relaxed">
            Opérations clôturées avec quitus final, intégrées aux statistiques nationales.
          </p>
        </div>
      </div>

      {/* National Totals Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="py-2 sm:py-0">
            <p className="text-xs text-slate-600 font-bold">Total Opérations</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.totalOperations}</p>
          </div>
          <div className="py-2 sm:py-0">
            <p className="text-xs text-slate-600 font-bold">En cours d'exécution</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{kpis.byStatus.in_progress}</p>
          </div>
          <div className="py-2 sm:py-0">
            <p className="text-xs text-slate-600 font-bold">Bénévoles mobilisés</p>
            <p className="text-2xl font-black text-emerald-800 mt-1">{kpis.totalVolunteersMobilized}</p>
          </div>
          <div className="py-2 sm:py-0">
            <p className="text-xs text-slate-600 font-bold">Bénéficiaires touchés</p>
            <p className="text-2xl font-black text-purple-800 mt-1">{kpis.totalBeneficiariesReached}</p>
          </div>
        </div>
      </div>

      {/* Territorial Distribution Table (69 Wilayas) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-700" />
              Répartition Territoriale — Les 69 Wilayas d'Algérie
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Ventilation des opérations déclarées, vérifiées et actives par direction de wilaya
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute start-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={wilayaSearch}
              onChange={(e) => setWilayaSearch(e.target.value)}
              placeholder="Filtrer une wilaya..."
              className="ps-9 rounded-2xl h-9 text-xs border-slate-300 bg-white text-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 text-start w-16">Code</th>
                  <th className="py-2.5 px-3 text-start">Wilaya</th>
                  <th className="py-2.5 px-3 text-center">Total Opérations</th>
                  <th className="py-2.5 px-3 text-center">Opérations Actives</th>
                  <th className="py-2.5 px-3 text-end">Bénévoles Mobilisés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {wilayaList.map((w) => (
                  <tr key={w.wilayaCode} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                      {padWilayaCode(w.wilayaCode)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {w.wilayaName}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-900">
                      {w.totalOps}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${
                        w.activeOps > 0 ? "bg-emerald-100 text-emerald-950 border border-emerald-300" : "text-slate-400 font-medium"
                      }`}>
                        {w.activeOps}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-end font-mono font-black text-emerald-800">
                      {w.volunteersCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
