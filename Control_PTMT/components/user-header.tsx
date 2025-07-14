"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Printer, User, LogOut, Shield, Eye } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function UserHeader() {
  const { user, logout, isAdmin, isGuest } = useAuth()

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Printer className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Impresora 3D</h1>
          <p className="text-gray-600">Panel de control y monitoreo</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* User Info */}
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.username}</p>
            <div className="flex items-center space-x-1">
              {isAdmin ? (
                <>
                  <Shield className="h-3 w-3 text-blue-600" />
                  <Badge variant="default" className="text-xs">
                    Administrador
                  </Badge>
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 text-gray-600" />
                  <Badge variant="secondary" className="text-xs">
                    Invitado
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              {user?.username}
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              {isAdmin ? (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Administrador
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Invitado
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
