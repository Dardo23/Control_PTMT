"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Stethoscope,
  Play,
  Info,
  Search,
  Network,
  ExternalLink,
} from "lucide-react"
import ConnectionDiagnosticsComponent from "@/components/connection-diagnostics"

interface KlipperConfigProps {
  onConfigSave: (config: { host: string; port: number; autoConnect: boolean }) => void
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  demoMode: boolean
  onStartDemo: () => void
}

// IPs comunes para Raspberry Pi en redes domésticas (con la nueva IP del usuario como primera opción)
const COMMON_RASPBERRY_PI_IPS = [
  "192.168.1.8", // Nueva IP del usuario
  "192.168.1.15", // IP anterior del usuario
  "192.168.1.100",
  "192.168.1.101",
  "192.168.1.102",
  "192.168.1.200",
  "192.168.0.8",
  "192.168.0.15",
  "192.168.0.100",
  "192.168.0.101",
  "10.0.0.8",
  "10.0.0.15",
]

export default function KlipperConfig({
  onConfigSave,
  isConnected,
  isConnecting,
  error,
  demoMode,
  onStartDemo,
}: KlipperConfigProps) {
  const [host, setHost] = useState("192.168.1.8") // Nueva IP por defecto
  const [port, setPort] = useState(7125)
  const [autoConnect, setAutoConnect] = useState(true)
  const [showConfig, setShowConfig] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [foundIPs, setFoundIPs] = useState<string[]>([])

  // Cargar configuración guardada
  useEffect(() => {
    const savedConfig = localStorage.getItem("klipper-config")
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        setHost(config.host || "192.168.1.8") // Nueva IP por defecto
        setPort(config.port || 7125)
        setAutoConnect(config.autoConnect !== false)

        if (config.host && config.autoConnect !== false) {
          const correctedConfig = {
            ...config,
            port: config.port || 7125,
          }
          onConfigSave(correctedConfig)
        }
      } catch (error) {
        console.error("Error loading saved config:", error)
        const defaultConfig = { host: "192.168.1.8", port: 7125, autoConnect: true }
        setHost(defaultConfig.host)
        setPort(defaultConfig.port)
        setAutoConnect(defaultConfig.autoConnect)
        onConfigSave(defaultConfig)
      }
    } else {
      // Usar la nueva IP por defecto
      const defaultConfig = { host: "192.168.1.8", port: 7125, autoConnect: true }
      setHost(defaultConfig.host)
      setPort(defaultConfig.port)
      setAutoConnect(defaultConfig.autoConnect)
      onConfigSave(defaultConfig)
    }
  }, [onConfigSave])

  const handleSave = () => {
    const validatedPort = port === 22 ? 7125 : port
    if (validatedPort !== port) {
      setPort(validatedPort)
    }

    const config = { host, port: validatedPort, autoConnect }
    localStorage.setItem("klipper-config", JSON.stringify(config))
    onConfigSave(config)
    setShowConfig(false)
  }

  // Función para escanear IPs comunes
  const scanForRaspberryPi = async () => {
    setIsScanning(true)
    setFoundIPs([])

    const found: string[] = []

    // Probar IPs comunes en paralelo (pero limitado para no sobrecargar)
    const batchSize = 5
    for (let i = 0; i < COMMON_RASPBERRY_PI_IPS.length; i += batchSize) {
      const batch = COMMON_RASPBERRY_PI_IPS.slice(i, i + batchSize)

      const promises = batch.map(async (ip) => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)

          const response = await fetch(`http://${ip}:7125/server/info`, {
            method: "GET",
            signal: controller.signal,
            mode: "cors",
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            return ip
          }
        } catch (error) {
          // IP no responde o error de conexión
        }
        return null
      })

      const results = await Promise.all(promises)
      const validIPs = results.filter((ip): ip is string => ip !== null)
      found.push(...validIPs)
      setFoundIPs([...found])

      // Pequeña pausa entre lotes
      if (i + batchSize < COMMON_RASPBERRY_PI_IPS.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    setIsScanning(false)
  }

  const getConnectionStatus = () => {
    if (demoMode) {
      return { icon: <Play className="h-4 w-4" />, text: "Modo Demo", variant: "secondary" as const }
    }
    if (isConnecting) {
      return { icon: <Wifi className="h-4 w-4 animate-pulse" />, text: "Conectando...", variant: "secondary" as const }
    }
    if (isConnected) {
      return { icon: <CheckCircle className="h-4 w-4" />, text: "Conectado", variant: "default" as const }
    }
    if (error) {
      return { icon: <AlertTriangle className="h-4 w-4" />, text: "Error", variant: "destructive" as const }
    }
    return { icon: <WifiOff className="h-4 w-4" />, text: "Desconectado", variant: "secondary" as const }
  }

  const status = getConnectionStatus()

  // Mostrar diagnósticos si hay error
  useEffect(() => {
    if (error && !isConnected && !demoMode) {
      setShowDiagnostics(true)
    }
  }, [error, isConnected, demoMode])

  if (!showConfig && host && !showDiagnostics) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {status.icon}
                <Badge variant={status.variant}>{status.text}</Badge>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">
                  {demoMode ? "Anycubic Kobra Neo 2 (Simulada)" : `Klipper: ${host}:${port}`}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              {/* Enlace directo a Mainsail */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`http://${host}`, "_blank")}
                className="text-blue-600 border-blue-300"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Mainsail
              </Button>
              {!demoMode && !isConnected && (
                <Button variant="outline" size="sm" onClick={onStartDemo}>
                  <Play className="h-4 w-4 mr-2" />
                  Modo Demo
                </Button>
              )}
              {error && !demoMode && (
                <Button variant="outline" size="sm" onClick={() => setShowDiagnostics(true)}>
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Diagnosticar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </div>
          </div>

          {/* Información de Mainsail */}
          {!demoMode && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Mainsail disponible:</strong> Tu interfaz Mainsail está en{" "}
                <a
                  href={`http://${host}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  http://{host}
                </a>
                . Esta página usa la misma API de Moonraker para funcionar junto con Mainsail.
              </AlertDescription>
            </Alert>
          )}

          {/* Modo Demo Info */}
          {demoMode && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Modo Demostración:</strong> Usando datos simulados de Anycubic Kobra Neo 2. Conecta tu Raspberry
                Pi para usar datos reales.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Info */}
          {error && !demoMode && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Diagnósticos */}
      {showDiagnostics && <ConnectionDiagnosticsComponent host={host} port={port} />}

      {/* Configuración */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración de Klipper</span>
          </CardTitle>
          <CardDescription>Configura la conexión con tu impresora 3D que ejecuta Klipper</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información sobre Mainsail */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-blue-900">🌐 Mainsail Detectado</h4>
                <p className="text-sm text-blue-800">
                  Tu Mainsail está funcionando en{" "}
                  <a
                    href={`http://${host}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    http://{host}
                  </a>
                </p>
              </div>
              <Button
                onClick={() => window.open(`http://${host}`, "_blank")}
                variant="outline"
                className="border-blue-300 text-blue-700 bg-transparent"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Mainsail
              </Button>
            </div>
            <p className="text-sm text-blue-800">
              Esta página usa la misma API de Moonraker, por lo que puede funcionar junto con Mainsail sin problemas.
            </p>
          </div>

          {/* Escáner de IP */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-green-900">🔍 Verificar Otras Raspberry Pi</h4>
                <p className="text-sm text-green-800">Escanea la red para encontrar otras impresoras 3D</p>
              </div>
              <Button
                onClick={scanForRaspberryPi}
                disabled={isScanning}
                variant="outline"
                className="border-green-300 text-green-700 bg-transparent"
              >
                {isScanning ? (
                  <>
                    <Search className="h-4 w-4 mr-2 animate-spin" />
                    Escaneando...
                  </>
                ) : (
                  <>
                    <Network className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>

            {isScanning && (
              <div className="text-sm text-green-800">
                Probando IPs comunes: {COMMON_RASPBERRY_PI_IPS.join(", ")}...
              </div>
            )}

            {foundIPs.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-900">🎉 Raspberry Pi encontradas:</p>
                <div className="flex flex-wrap gap-2">
                  {foundIPs.map((ip) => (
                    <Button
                      key={ip}
                      variant="outline"
                      size="sm"
                      onClick={() => setHost(ip)}
                      className={`border-green-300 text-green-700 ${host === ip ? "bg-green-100" : ""}`}
                    >
                      {ip} {host === ip && "✓"}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Configuración manual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Dirección IP</Label>
              <Input id="host" placeholder="192.168.1.8" value={host} onChange={(e) => setHost(e.target.value)} />
              <p className="text-xs text-muted-foreground">IP de tu Raspberry Pi (actualmente: 192.168.1.8)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Puerto</Label>
              <Input
                id="port"
                type="number"
                placeholder="7125"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Puerto de Moonraker (por defecto 7125)</p>
            </div>
          </div>

          {/* IPs comunes para selección rápida */}
          <div className="space-y-2">
            <Label>IPs Comunes para Raspberry Pi:</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_RASPBERRY_PI_IPS.slice(0, 8).map((ip) => (
                <Button
                  key={ip}
                  variant="outline"
                  size="sm"
                  onClick={() => setHost(ip)}
                  className={`${host === ip ? "bg-blue-100 border-blue-500" : ""} ${
                    ip === "192.168.1.8" ? "border-green-500 text-green-700" : ""
                  }`}
                >
                  {ip} {ip === "192.168.1.8" && "🎯"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="auto-connect" checked={autoConnect} onCheckedChange={setAutoConnect} />
            <Label htmlFor="auto-connect">Conectar automáticamente al iniciar</Label>
          </div>

          {error && !demoMode && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Modo Demo disponible */}
          {!isConnected && !demoMode && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">🎮 Modo Demostración Disponible</h4>
              <p className="text-sm text-green-800 mb-3">
                Prueba la interfaz con datos simulados de tu Anycubic Kobra Neo 2 mientras resuelves problemas de
                conexión.
              </p>
              <Button onClick={onStartDemo} size="sm" className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Activar Modo Demo
              </Button>
            </div>
          )}

          <div className="flex space-x-2">
            <Button onClick={handleSave} disabled={!host} className="flex-1">
              {isConnected ? "Actualizar Configuración" : "Conectar a Klipper"}
            </Button>
            {showDiagnostics && (
              <Button variant="outline" onClick={() => setShowDiagnostics(false)}>
                Ocultar Diagnóstico
              </Button>
            )}
            {(showConfig || showDiagnostics) && (
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfig(false)
                  setShowDiagnostics(false)
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
