import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { WilayaMeta } from "@/lib/wilayas"

const STORAGE_KEY = "yfy-selected-wilaya"

type LocationFilterContextValue = {
  wilayas: WilayaMeta[]
  selectedCode: number | null
  selected: WilayaMeta | null
  setSelectedCode: (code: number | null) => void
  ready: boolean
}

const LocationFilterContext = createContext<LocationFilterContextValue | null>(null)

function readStoredCode(): number | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem("odej-selected-wilaya")
    if (raw === null || raw === "") return null
    const n = Number(raw)
    return Number.isFinite(n) && n >= 1 && n <= 69 ? n : null
  } catch {
    return null
  }
}

export function LocationFilterProvider({ children }: { children: ReactNode }) {
  const [wilayas, setWilayas] = useState<WilayaMeta[]>([])
  const [selectedCode, setSelectedCodeState] = useState<number | null>(() => readStoredCode())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/geo/wilayas-meta.json")
      .then((r) => r.json())
      .then((list: WilayaMeta[]) => {
        if (cancelled) return
        setWilayas(Array.isArray(list) ? list : [])
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setSelectedCode = useCallback((code: number | null) => {
    setSelectedCodeState(code)
    try {
      if (code === null) sessionStorage.removeItem(STORAGE_KEY)
      else sessionStorage.setItem(STORAGE_KEY, String(code))
    } catch {
      /* ignore */
    }
  }, [])

  const selected = useMemo(
    () => (selectedCode === null ? null : wilayas.find((w) => w.code === selectedCode) ?? null),
    [selectedCode, wilayas]
  )

  const value = useMemo(
    () => ({ wilayas, selectedCode, selected, setSelectedCode, ready }),
    [wilayas, selectedCode, selected, setSelectedCode, ready]
  )

  return (
    <LocationFilterContext.Provider value={value}>{children}</LocationFilterContext.Provider>
  )
}

export function useLocationFilter() {
  const ctx = useContext(LocationFilterContext)
  if (!ctx) throw new Error("useLocationFilter must be used within LocationFilterProvider")
  return ctx
}
