"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "admin" | "guest"

export interface User {
  username: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
  isGuest: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Usuarios predefinidos para la demo
const DEMO_USERS = {
  admin: { username: "admin", password: "admin123", role: "admin" as UserRole },
  guest: { username: "guest", password: "guest123", role: "guest" as UserRole },
  invitado: { username: "invitado", password: "invitado", role: "guest" as UserRole },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedUser = localStorage.getItem("printer-user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        localStorage.removeItem("printer-user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simular delay de autenticación
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const userKey = username.toLowerCase()
    const demoUser = DEMO_USERS[userKey as keyof typeof DEMO_USERS]

    if (demoUser && demoUser.password === password) {
      const userData = { username: demoUser.username, role: demoUser.role }
      setUser(userData)
      localStorage.setItem("printer-user", JSON.stringify(userData))
      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("printer-user")
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isGuest: user?.role === "guest",
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
