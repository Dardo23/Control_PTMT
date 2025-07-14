"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Thermometer,
  Move,
  Play,
  Pause,
  Square,
  Upload,
  Activity,
  Home,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Lock,
  Eye,
} from "lucide-react"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import LoginPage from "@/components/login-page"
import UserHeader from "@/components/user-header"
import { useKlipper } from "@/hooks/use-klipper"
import KlipperConfig from "@/components/klipper-config"

interface PrinterStatus {
  connected: boolean
  printing: boolean
  hotendTemp: number
  bedTemp: number
  hotendTarget: number
  bedTarget: number
  progress: number
  currentFile: string
  estimatedTime: string
  position: { x: number; y: number; z: number }
}

function PrinterControlContent() {
  const { isAuthenticated, isAdmin, isGuest } = useAuth()
  const [klipperConfig, setKlipperConfig] = useState<{ host: string; port: number; autoConnect: boolean } | null>(null)

  // Limpiar configuración incorrecta al cargar
  useEffect(() => {
    const savedConfig = localStorage.getItem("klipper-config")
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        // Corregir puerto SSH si está guardado incorrectamente
        if (config.port === 22) {
          console.warn("Configuración incorrecta detectada: puerto SSH (22), corrigiendo a 7125")
          const correctedConfig = { ...config, port: 7125 }
          localStorage.setItem("klipper-config", JSON.stringify(correctedConfig))
          setKlipperConfig(correctedConfig)
        } else {
          setKlipperConfig(config)
        }
      } catch (error) {
        console.error("Error al cargar configuración:", error)
        // Usar configuración por defecto
        const defaultConfig = { host: "192.168.1.15", port: 7125, autoConnect: true }
        localStorage.setItem("klipper-config", JSON.stringify(defaultConfig))
        setKlipperConfig(defaultConfig)
      }
    }
  }, [])

  const klipper = useKlipper({
    host: klipperConfig?.host || "",
    port: klipperConfig?.port || 7125,
    autoConnect: klipperConfig?.autoConnect || false,
  })
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>({
    connected: false,
    printing: false,
    hotendTemp: 0,
    bedTemp: 0,
    hotendTarget: 0,
    bedTarget: 0,
    progress: 0,
    currentFile: "",
    estimatedTime: "Calculando...",
    position: { x: 0, y: 0, z: 0 },
  })

  // Usar datos reales de Klipper o simulados en modo demo
  const printerStatusFromKlipper = {
    connected: klipper.connected || klipper.demoMode,
    printing: klipper.objects.print_stats?.state === "printing",
    hotendTemp: klipper.objects.extruder?.temperature || 0,
    bedTemp: klipper.objects.heater_bed?.temperature || 0,
    hotendTarget: klipper.objects.extruder?.target || 0,
    bedTarget: klipper.objects.heater_bed?.target || 0,
    progress: klipper.objects.display_status?.progress || 0,
    currentFile: klipper.objects.print_stats?.filename || "",
    estimatedTime: "Calculando...",
    position: {
      x: klipper.objects.toolhead?.position?.[0] || 0,
      y: klipper.objects.toolhead?.position?.[1] || 0,
      z: klipper.objects.toolhead?.position?.[2] || 0,
    },
  }

  // Actualizar el estado local con datos de Klipper
  useEffect(() => {
    setPrinterStatus(printerStatusFromKlipper)
  }, [klipper.objects, klipper.connected, klipper.demoMode])

  const [moveDistance, setMoveDistance] = useState(10)
  const [extrudeAmount, setExtrudeAmount] = useState(10)
  const [fanSpeed, setFanSpeed] = useState([Math.round((klipper.objects.fan?.speed || 0) * 100)])

  // Reemplazar las funciones simuladas con las reales de Klipper
  const handleSetTemperature = async (type: "hotend" | "bed", temp: number) => {
    if (!isAdmin) return
    try {
      await klipper.setTemperature(type, temp)
    } catch (error) {
      console.error("Error setting temperature:", error)
    }
  }

  const handleMove = async (axis: "x" | "y" | "z", direction: 1 | -1) => {
    if (!isAdmin) return
    try {
      const distance = moveDistance * direction
      await klipper.moveAxis(axis, distance)
    } catch (error) {
      console.error("Error moving axis:", error)
    }
  }

  const handleHome = async (axis?: "x" | "y" | "z") => {
    if (!isAdmin) return
    try {
      if (axis) {
        await klipper.homeAxes([axis])
      } else {
        await klipper.homeAxes()
      }
    } catch (error) {
      console.error("Error homing:", error)
    }
  }

  const handleExtrude = async (amount: number) => {
    if (!isAdmin) return
    try {
      await klipper.extrudeFilament(amount)
    } catch (error) {
      console.error("Error extruding:", error)
    }
  }

  const handlePrintControl = async (action: "start" | "pause" | "stop") => {
    if (!isAdmin) return
    try {
      switch (action) {
        case "start":
          if (printerStatus.currentFile) {
            await klipper.startPrint(printerStatus.currentFile)
          }
          break
        case "pause":
          await klipper.pausePrint()
          break
        case "stop":
          await klipper.cancelPrint()
          break
      }
    } catch (error) {
      console.error("Error controlling print:", error)
    }
  }

  // Usar archivos reales de Klipper
  const gCodeFiles = klipper.files.map((file) => ({
    name: file.filename,
    size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    time: file.estimated_time ? `${Math.round(file.estimated_time / 60)}m` : "N/A",
    status: file.filename === printerStatus.currentFile && printerStatus.printing ? "printing" : "ready",
  }))

  const [logs, setLogs] = useState<string[]>([
    "Printer connected successfully",
    "Home position set",
    "Print started: benchy.gcode",
    "Layer 45/120 completed",
    "Ready for commands",
  ])

  // Simular actualización de temperaturas
  useEffect(() => {
    const interval = setInterval(() => {
      setPrinterStatus((prev) => ({
        ...prev,
        hotendTemp:
          prev.hotendTarget > 0
            ? Math.min(prev.hotendTarget, prev.hotendTemp + Math.random() * 2)
            : Math.max(25, prev.hotendTemp - Math.random() * 0.5),
        bedTemp:
          prev.bedTarget > 0
            ? Math.min(prev.bedTarget, prev.bedTemp + Math.random() * 1.5)
            : Math.max(23, prev.bedTemp - Math.random() * 0.3),
        progress: prev.printing ? Math.min(100, prev.progress + Math.random() * 0.1) : prev.progress,
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)])
  }

  const RestrictedButton = ({ children, onClick, ...props }: any) => {
    if (isGuest) {
      return (
        <Button {...props} disabled className="relative">
          {children}
          <Lock className="h-3 w-3 ml-1" />
        </Button>
      )
    }
    return (
      <Button {...props} onClick={onClick}>
        {children}
      </Button>
    )
  }

  const RestrictedInput = ({ onChange, ...props }: any) => {
    if (isGuest) {
      return <Input {...props} disabled className="bg-gray-50" />
    }
    return <Input {...props} onChange={onChange} />
  }

  const RestrictedSlider = ({ onValueChange, ...props }: any) => {
    if (isGuest) {
      return <Slider {...props} disabled className="opacity-50" />
    }
    return <Slider {...props} onValueChange={onValueChange} />
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <UserHeader />

        {/* Klipper Configuration */}
        <KlipperConfig
          onConfigSave={setKlipperConfig}
          isConnected={klipper.connected}
          isConnecting={klipper.connecting}
          error={klipper.error}
          demoMode={klipper.demoMode}
          onStartDemo={klipper.startDemoMode}
        />

        {/* Guest Warning */}
        {isGuest && (
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              Estás en modo <strong>Invitado</strong>. Puedes ver toda la información pero no realizar cambios en la
              impresora.
            </AlertDescription>
          </Alert>
        )}

        {/* Demo Mode Info */}
        {klipper.demoMode && (
          <Alert>
            <Play className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo Demostración:</strong> Usando datos simulados de Anycubic Kobra Neo 2. Todos los controles
              funcionan pero no afectan una impresora real.
            </AlertDescription>
          </Alert>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hotend</CardTitle>
              <Thermometer className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{printerStatus.hotendTemp.toFixed(1)}°C</div>
              <p className="text-xs text-muted-foreground">Target: {printerStatus.hotendTarget}°C</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cama Caliente</CardTitle>
              <Thermometer className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{printerStatus.bedTemp.toFixed(1)}°C</div>
              <p className="text-xs text-muted-foreground">Target: {printerStatus.bedTarget}°C</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progreso</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{printerStatus.progress.toFixed(1)}%</div>
              <Progress value={printerStatus.progress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posición</CardTitle>
              <Move className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div>X: {printerStatus.position.x.toFixed(1)}mm</div>
                <div>Y: {printerStatus.position.y.toFixed(1)}mm</div>
                <div>Z: {printerStatus.position.z.toFixed(1)}mm</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Control Tabs */}
        <Tabs defaultValue="control" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="control">Control</TabsTrigger>
            <TabsTrigger value="temperature">Temperatura</TabsTrigger>
            <TabsTrigger value="files">Archivos</TabsTrigger>
            <TabsTrigger value="console">Consola</TabsTrigger>
          </TabsList>

          <TabsContent value="control" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Movement Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Control de Movimiento</span>
                    {isGuest && <Lock className="h-4 w-4 text-gray-400" />}
                  </CardTitle>
                  <CardDescription>
                    {isAdmin
                      ? "Controla el movimiento de los ejes de la impresora"
                      : "Vista de solo lectura - Posición actual de los ejes"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Label>Distancia:</Label>
                    <div className="flex space-x-2">
                      {[0.1, 1, 10, 100].map((dist) => (
                        <Button
                          key={dist}
                          variant={moveDistance === dist ? "default" : "outline"}
                          size="sm"
                          disabled={isGuest}
                          onClick={() => isAdmin && setMoveDistance(dist)}
                        >
                          {dist}mm
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* XY Movement */}
                  <div className="space-y-2">
                    <Label>Movimiento XY</Label>
                    <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
                      <div></div>
                      <RestrictedButton variant="outline" size="sm" onClick={() => handleMove("y", 1)}>
                        <ArrowUp className="h-4 w-4" />
                      </RestrictedButton>
                      <div></div>
                      <RestrictedButton variant="outline" size="sm" onClick={() => handleMove("x", -1)}>
                        <ArrowLeft className="h-4 w-4" />
                      </RestrictedButton>
                      <RestrictedButton variant="outline" size="sm" onClick={() => handleHome()}>
                        <Home className="h-4 w-4" />
                      </RestrictedButton>
                      <RestrictedButton variant="outline" size="sm" onClick={() => handleMove("x", 1)}>
                        <ArrowRight className="h-4 w-4" />
                      </RestrictedButton>
                      <div></div>
                      <RestrictedButton variant="outline" size="sm" onClick={() => handleMove("y", -1)}>
                        <ArrowDown className="h-4 w-4" />
                      </RestrictedButton>
                      <div></div>
                    </div>
                  </div>

                  {/* Z Movement */}
                  <div className="space-y-2">
                    <Label>Movimiento Z</Label>
                    <div className="flex justify-center space-x-2">
                      <RestrictedButton variant="outline" onClick={() => handleMove("z", 1)}>
                        Z+
                      </RestrictedButton>
                      <RestrictedButton variant="outline" onClick={() => handleMove("z", -1)}>
                        Z-
                      </RestrictedButton>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Extruder Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Control del Extrusor</span>
                    {isGuest && <Lock className="h-4 w-4 text-gray-400" />}
                  </CardTitle>
                  <CardDescription>
                    {isAdmin
                      ? "Controla la extrusión y retracción del filamento"
                      : "Vista de solo lectura - Estado del extrusor"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="extrude-amount">Cantidad (mm)</Label>
                    <RestrictedInput
                      id="extrude-amount"
                      type="number"
                      value={extrudeAmount}
                      onChange={(e: any) => setExtrudeAmount(Number(e.target.value))}
                      min="0.1"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <RestrictedButton onClick={() => handleExtrude(extrudeAmount)} className="flex-1">
                      Extruir
                    </RestrictedButton>
                    <RestrictedButton
                      variant="outline"
                      onClick={() => handleExtrude(-extrudeAmount)}
                      className="flex-1"
                    >
                      Retraer
                    </RestrictedButton>
                  </div>

                  <div className="space-y-2">
                    <Label>Velocidad del Ventilador: {fanSpeed[0]}%</Label>
                    <RestrictedSlider
                      value={fanSpeed}
                      onValueChange={setFanSpeed}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Print Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Control de Impresión</span>
                  {isGuest && <Lock className="h-4 w-4 text-gray-400" />}
                </CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "Controla el estado de la impresión actual"
                    : "Vista de solo lectura - Estado de la impresión"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{printerStatus.currentFile || "Ningún archivo seleccionado"}</p>
                    <p className="text-sm text-muted-foreground">Tiempo estimado: {printerStatus.estimatedTime}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={printerStatus.printing ? "default" : "secondary"}>
                        {printerStatus.printing ? "Imprimiendo" : "Detenida"}
                      </Badge>
                      {printerStatus.printing && <span className="text-sm text-muted-foreground">Capa 45/120</span>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <RestrictedButton onClick={() => handlePrintControl("start")} disabled={!printerStatus.currentFile}>
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar
                    </RestrictedButton>
                    <RestrictedButton
                      variant="outline"
                      onClick={() => handlePrintControl("pause")}
                      disabled={!printerStatus.printing}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </RestrictedButton>
                    <RestrictedButton
                      variant="destructive"
                      onClick={() => handlePrintControl("stop")}
                      disabled={!printerStatus.printing}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Detener
                    </RestrictedButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="temperature" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Control de Temperatura del Hotend</span>
                    {isGuest && <Lock className="h-4 w-4 text-gray-400" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Temperatura Objetivo</Label>
                    <div className="flex space-x-2">
                      <RestrictedInput
                        type="number"
                        placeholder="°C"
                        min="0"
                        max="300"
                        className="flex-1"
                        onKeyPress={(e: any) => {
                          if (e.key === "Enter" && isAdmin) {
                            const temp = Number(e.target.value)
                            handleSetTemperature("hotend", temp)
                          }
                        }}
                      />
                      <RestrictedButton
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="°C"]') as HTMLInputElement
                          handleSetTemperature("hotend", Number(input.value))
                        }}
                      >
                        Establecer
                      </RestrictedButton>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {[0, 180, 200, 220, 250].map((temp) => (
                      <RestrictedButton
                        key={temp}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetTemperature("hotend", temp)}
                      >
                        {temp}°C
                      </RestrictedButton>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Control de Temperatura de la Cama</span>
                    {isGuest && <Lock className="h-4 w-4 text-gray-400" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Temperatura Objetivo</Label>
                    <div className="flex space-x-2">
                      <RestrictedInput
                        type="number"
                        placeholder="°C"
                        min="0"
                        max="120"
                        className="flex-1"
                        onKeyPress={(e: any) => {
                          if (e.key === "Enter" && isAdmin) {
                            const temp = Number(e.target.value)
                            handleSetTemperature("bed", temp)
                          }
                        }}
                      />
                      <RestrictedButton
                        onClick={() => {
                          const inputs = document.querySelectorAll('input[placeholder="°C"]')
                          const bedInput = inputs[1] as HTMLInputElement
                          handleSetTemperature("bed", Number(bedInput.value))
                        }}
                      >
                        Establecer
                      </RestrictedButton>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {[0, 50, 60, 70, 80].map((temp) => (
                      <RestrictedButton
                        key={temp}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetTemperature("bed", temp)}
                      >
                        {temp}°C
                      </RestrictedButton>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Archivos G-Code</span>
                  {isGuest && <Lock className="h-4 w-4 text-gray-400" />}
                </CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "Gestiona y selecciona archivos para imprimir"
                    : "Vista de solo lectura - Lista de archivos disponibles"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <RestrictedButton className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Archivo G-Code
                  </RestrictedButton>

                  <div className="space-y-2">
                    {gCodeFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {file.size} • {file.time}
                            </p>
                          </div>
                          {file.status === "printing" && <Badge variant="default">Imprimiendo</Badge>}
                        </div>
                        <div className="flex space-x-2">
                          <RestrictedButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPrinterStatus((prev) => ({
                                ...prev,
                                currentFile: file.name,
                                estimatedTime: file.time,
                              }))
                              addLog(`Selected file: ${file.name}`)
                            }}
                          >
                            Seleccionar
                          </RestrictedButton>
                          <RestrictedButton variant="outline" size="sm">
                            <Play className="h-4 w-4" />
                          </RestrictedButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="console" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Consola de Comandos</span>
                  {isGuest && <Lock className="h-4 w-4 text-gray-400" />}
                </CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "Envía comandos G-Code directamente a la impresora"
                    : "Vista de solo lectura - Log de actividad"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAdmin && (
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Ingresa comando G-Code (ej: G28, M104 S200)"
                      className="flex-1"
                      onKeyPress={async (e) => {
                        if (e.key === "Enter" && isAdmin) {
                          const command = (e.target as HTMLInputElement).value
                          try {
                            await klipper.sendGcode(command)
                            ;(e.target as HTMLInputElement).value = ""
                          } catch (error) {
                            console.error("Error sending G-code:", error)
                          }
                        }
                      }}
                    />
                    <Button>Enviar</Button>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Log de Actividad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 w-full">
                      <div className="space-y-1">
                        {klipper.logs.map((log, index) => (
                          <p key={index} className="text-sm font-mono text-muted-foreground">
                            {log}
                          </p>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function PrinterControlPage() {
  return (
    <AuthProvider>
      <PrinterControlContent />
    </AuthProvider>
  )
}
