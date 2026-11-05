import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { supabase } from "@/lib/supabase"
import { useAppData } from "@/context/DataProvider"
import type { VolunteerAccount, VolunteerSkill } from "@/lib/types"

const VOLUNTEER_AUTH_KEY = "yfy-volunteer-session-v1"

export type SignupData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  wilayaCode: number
  commune: string
  birthDate?: string
  skills?: VolunteerSkill[]
  interests?: string[]
}

type VolunteerAuthContextType = {
  currentVolunteer: VolunteerAccount | null
  loading: boolean
  isAuthenticated: boolean
  signup: (data: SignupData) => Promise<{ ok: boolean; error?: string }>
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  updateProfile: (
    updates: Partial<Pick<VolunteerAccount, "firstName" | "lastName" | "phone" | "wilayaCode" | "commune" | "birthDate" | "skills" | "interests" | "publicProfileConsent" | "showWilayaInLeaderboard">>
  ) => { ok: boolean; error?: string }
  changePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>
  deleteAccount: () => Promise<{ ok: boolean }>
}

const VolunteerAuthContext = createContext<VolunteerAuthContextType | undefined>(undefined)

export function VolunteerAuthProvider({ children }: { children: ReactNode }) {
  const {
    data,
    addVolunteerAccount,
    updateVolunteerAccount,
    deleteVolunteerAccount,
  } = useAppData()

  const [currentVolunteer, setCurrentVolunteer] = useState<VolunteerAccount | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize session from localStorage or Supabase Auth session
  useEffect(() => {
    let cancelled = false

    async function initSession() {
      try {
        // 1. Check local session storage
        const savedId = localStorage.getItem(VOLUNTEER_AUTH_KEY)
        if (savedId && data?.volunteerAccounts) {
          const match = data.volunteerAccounts.find((v) => v.id === savedId)
          if (match && match.status === "active") {
            if (!cancelled) setCurrentVolunteer(match)
          }
        }

        // 2. Try Supabase Auth getSession if available
        if (supabase) {
          const { data: supaData } = await supabase.auth.getSession()
          if (supaData?.session?.user) {
            const userEmail = supaData.session.user.email
            if (userEmail && data?.volunteerAccounts) {
              const match = data.volunteerAccounts.find(
                (v) => v.email.toLowerCase() === userEmail.toLowerCase()
              )
              if (match && match.status === "active" && !cancelled) {
                setCurrentVolunteer(match)
                localStorage.setItem(VOLUNTEER_AUTH_KEY, match.id)
              }
            }
          }
        }
      } catch (err) {
        console.warn("Volunteer auth session initialization fallback:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    initSession()

    return () => {
      cancelled = true
    }
  }, [data?.volunteerAccounts])

  // Synchronize state when data.volunteerAccounts changes (e.g. points awarded)
  useEffect(() => {
    if (currentVolunteer && data?.volunteerAccounts) {
      const updated = data.volunteerAccounts.find((v) => v.id === currentVolunteer.id)
      if (updated && (updated.points !== currentVolunteer.points || updated.status !== currentVolunteer.status)) {
        setCurrentVolunteer(updated)
      }
    }
  }, [data?.volunteerAccounts, currentVolunteer])

  // Signup
  const signup = useCallback(
    async (formData: SignupData): Promise<{ ok: boolean; error?: string }> => {
      const email = formData.email.trim().toLowerCase()
      if (!email || !email.includes("@")) {
        return { ok: false, error: "Veuillez saisir une adresse e-mail valide." }
      }
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        return { ok: false, error: "Le nom et le prénom sont obligatoires." }
      }
      if (!formData.password || formData.password.length < 6) {
        return { ok: false, error: "Le mot de passe doit contenir au moins 6 caractères." }
      }

      // Check if email already exists in local volunteer accounts
      const existing = (data?.volunteerAccounts || []).find(
        (v) => v.email.toLowerCase() === email
      )
      if (existing) {
        return { ok: false, error: "Cette adresse e-mail est déjà inscrite au programme." }
      }

      let supabaseUserId: string | undefined

      // Attempt Supabase Auth signup if available
      try {
        if (supabase) {
          const { data: supaAuth, error: supaErr } = await supabase.auth.signUp({
            email,
            password: formData.password,
            options: {
              data: {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                phone: formData.phone.trim(),
              },
            },
          })
          if (supaAuth?.user?.id) {
            supabaseUserId = supaAuth.user.id
          }
          if (supaErr && !supaErr.message.includes("fetch")) {
            console.warn("Supabase auth warning:", supaErr.message)
          }
        }
      } catch (e) {
        console.warn("Supabase auth signup fallback:", e)
      }

      const res = addVolunteerAccount({
        id: supabaseUserId,
        email,
        passwordHash: formData.password, // Local fallback hash
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        wilayaCode: formData.wilayaCode,
        commune: formData.commune.trim(),
        birthDate: formData.birthDate?.trim() || undefined,
        skills: formData.skills || [],
        interests: formData.interests || [],
        acceptedTermsAt: new Date().toISOString(),
        isVerified: true,
      })

      if (!res.ok) {
        return { ok: false, error: res.error }
      }

      setCurrentVolunteer(res.account)
      localStorage.setItem(VOLUNTEER_AUTH_KEY, res.account.id)
      return { ok: true }
    },
    [addVolunteerAccount, data?.volunteerAccounts]
  )

  // Login
  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const cleanEmail = email.trim().toLowerCase()
      if (!cleanEmail || !password) {
        return { ok: false, error: "Veuillez renseigner votre email et mot de passe." }
      }

      // 1. Try Supabase Auth
      try {
        if (supabase) {
          const { data: supaAuth, error: supaErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          })
          if (supaAuth?.user) {
            const match = (data?.volunteerAccounts || []).find(
              (v) => v.email.toLowerCase() === cleanEmail
            )
            if (match) {
              if (match.status === "suspended") {
                return { ok: false, error: "Ce compte bénévole est actuellement suspendu. Contactez la coordination." }
              }
              setCurrentVolunteer(match)
              localStorage.setItem(VOLUNTEER_AUTH_KEY, match.id)
              return { ok: true }
            }
          }
          if (supaErr && !supaErr.message.includes("fetch")) {
            console.warn("Supabase auth login check:", supaErr.message)
          }
        }
      } catch (e) {
        console.warn("Supabase auth login fallback:", e)
      }

      // 2. Check local accounts fallback
      const match = (data?.volunteerAccounts || []).find(
        (v) => v.email.toLowerCase() === cleanEmail
      )
      if (!match) {
        return { ok: false, error: "Identifiants invalides ou compte inexistant." }
      }

      if (match.status === "suspended") {
        return { ok: false, error: "Ce compte bénévole est actuellement suspendu." }
      }

      if (match.passwordHash && match.passwordHash !== password) {
        return { ok: false, error: "Mot de passe incorrect." }
      }

      setCurrentVolunteer(match)
      localStorage.setItem(VOLUNTEER_AUTH_KEY, match.id)
      return { ok: true }
    },
    [data?.volunteerAccounts]
  )

  // Logout
  const logout = useCallback(async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut()
      }
    } catch (e) {
      console.warn("Supabase signout fallback:", e)
    }
    setCurrentVolunteer(null)
    localStorage.removeItem(VOLUNTEER_AUTH_KEY)
  }, [])

  // Update Profile
  const updateProfile = useCallback(
    (
      updates: Partial<Pick<VolunteerAccount, "firstName" | "lastName" | "phone" | "wilayaCode" | "commune" | "birthDate" | "skills" | "interests" | "publicProfileConsent" | "showWilayaInLeaderboard">>
    ) => {
      if (!currentVolunteer) return { ok: false, error: "Non connecté." }

      const res = updateVolunteerAccount(currentVolunteer.id, updates)
      if (!res.ok) return { ok: false, error: res.error }

      setCurrentVolunteer(res.account)
      return { ok: true }
    },
    [currentVolunteer, updateVolunteerAccount]
  )

  // Change Password
  const changePassword = useCallback(
    async (newPassword: string): Promise<{ ok: boolean; error?: string }> => {
      if (!currentVolunteer) return { ok: false, error: "Non connecté." }
      if (!newPassword || newPassword.length < 6) {
        return { ok: false, error: "Le mot de passe doit comporter au moins 6 caractères." }
      }

      try {
        if (supabase) {
          await supabase.auth.updateUser({ password: newPassword })
        }
      } catch (e) {
        console.warn("Supabase auth password update fallback:", e)
      }

      const res = updateVolunteerAccount(currentVolunteer.id, {
        passwordHash: newPassword,
      })
      if (!res.ok) return { ok: false, error: res.error }

      setCurrentVolunteer(res.account)
      return { ok: true }
    },
    [currentVolunteer, updateVolunteerAccount]
  )

  // Delete Account
  const deleteAccount = useCallback(async (): Promise<{ ok: boolean }> => {
    if (!currentVolunteer) return { ok: false }

    deleteVolunteerAccount(currentVolunteer.id)
    await logout()
    return { ok: true }
  }, [currentVolunteer, deleteVolunteerAccount, logout])

  return (
    <VolunteerAuthContext.Provider
      value={{
        currentVolunteer,
        loading,
        isAuthenticated: !!currentVolunteer,
        signup,
        login,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </VolunteerAuthContext.Provider>
  )
}

export function useVolunteerAuth() {
  const ctx = useContext(VolunteerAuthContext)
  if (!ctx) {
    throw new Error("useVolunteerAuth must be used within a VolunteerAuthProvider")
  }
  return ctx
}

