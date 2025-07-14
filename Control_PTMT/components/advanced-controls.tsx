"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Target, Layers, Zap, Save, RotateCcw, AlertTriangle, Lock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface AdvancedControlsProps {
  onBedMeshCalibrate: () => Promise<void>
  onProbeAccuracy: () => Promise<void>
  onPidTuneHotend: (temp: number) => Promise<void>
  onPidTuneBed: (temp: number) => Promise<void>
  onInputShaperCalibrate: () => Promise<void>
  onSaveConfig: () => Promise<void>
  onQueryProbe: () => Promise<void>
  isConnected: boolean
}

export default function AdvancedControls({
  onBedMeshCalibrate,
  onProbeAccuracy,
  onPidTuneHotend,
  onPidTuneBed,
  onInputShaperCalibrate,
  onSaveConfig,
  onQueryProbe,
  isConnected,
}: AdvancedControlsProps) {
  const { isAdmin, isGuest } = useAuth()
  const [pidHotendTemp, setPidHotendTemp] = useState(200)
  const [pidBedTemp, setPidBedTemp] = useState(60)
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleAdvancedFunction = async (functionName: string, fn: () => Promise<void>) => {
    if (!isAdmin || !isConnected) return

    setIsLoading(functionName)
    try {
      await fn()
    } catch (error) {
      console.error(`Error in ${functionName}:`, error)
    } finally {
      setIsLoading(null)
    }
  }

  const RestrictedButton = ({ children, onClick, functionName, ...props }: any) => {
    if (isGuest) {
      return (
        <Button {...props} disabled className="relative">
          {children}
          <Lock className="h-3 w-3 ml-1" />
        </Button>
      )
    }
    return (
      <Button
        {...props}
        onClick={() => handleAdvancedFunction(functionName, onClick)}
        disabled={!isConnected || isLoading === functionName}
      >
        {isLoading === functionName ? "Ejecutando..." : children}
      </Button>
    )
  }

  if (!isConnected) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Conecta a Klipper para acceder a las funciones avanzadas</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Calibración de Cama */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="h-5 w-5" />
            <span>Calibración de Cama</span>
            {isGuest && <Lock className="h-4 w-4 text-gray-400" />}
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "Funciones de calibración y nivelación de la cama caliente"
              : "Vista de solo lectura - Funciones de calibración"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <RestrictedButton
              functionName="bed_mesh"
              onClick={onBedMeshCalibrate}
              className="flex items-center justify-center"
            >
              <Target className="h-4 w-4 mr-2" />
              Bed Mesh
            </RestrictedButton>
            <RestrictedButton
              functionName="probe_accuracy"
              onClick={onProbeAccuracy}
              variant="outline"
              className="flex items-center justify-center"
            >
              <Target className="h-4 w-4 mr-2" />
              Precisión Probe
            </RestrictedButton>
            <RestrictedButton
              functionName="query_probe"
              onClick={onQueryProbe}
              variant="outline"
              className="flex items-center justify-center"
            >
              <Target className="h-4 w-4 mr-2" />
              Estado Probe
            </RestrictedButton>
          </div>

          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Bed Mesh:</strong> Calibra la malla de nivelación (4x4 puntos).
              <br />
              <strong>Precisión Probe:</strong> Verifica la precisión del sensor de nivelación.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Calibración PID */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Calibración PID</span>
            {isGuest && <Lock className="h-4 w-4 text-gray-400" />}
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "Calibra los controladores PID para temperaturas estables"
              : "Vista de solo lectura - Calibración PID"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PID Hotend */}
            <div className="space-y-3">
              <Label>PID Hotend</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={pidHotendTemp}
                  onChange={(e) => setPidHotendTemp(Number(e.target.value))}
                  min="170"
                  max="280"
                  disabled={isGuest}
                  className={isGuest ? "bg-gray-50" : ""}
                />
                <RestrictedButton
                  functionName="pid_hotend"
                  onClick={() => onPidTuneHotend(pidHotendTemp)}
                  variant="outline"
                >
                  Calibrar
                </RestrictedButton>
              </div>
              <p className="text-xs text-muted-foreground">Temperatura objetivo: 170-280°C</p>
            </div>

            {/* PID Cama */}
            <div className="space-y-3">
              <Label>PID Cama Caliente</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={pidBedTemp}
                  onChange={(e) => setPidBedTemp(Number(e.target.value))}
                  min="40"
                  max="120"
                  disabled={isGuest}
                  className={isGuest ? "bg-gray-50" : ""}
                />
                <RestrictedButton functionName="pid_bed" onClick={() => onPidTuneBed(pidBedTemp)} variant="outline">
                  Calibrar
                </RestrictedButton>
              </div>
              <p className="text-xs text-muted-foreground">Temperatura objetivo: 40-120°C</p>
            </div>
          </div>

          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> La calibración PID puede tomar varios minutos. No interrumpas el proceso.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Input Shaper y Configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración Avanzada</span>
            {isGuest && <Lock className="h-4 w-4 text-gray-400" />}
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "Funciones de configuración y mantenimiento del sistema"
              : "Vista de solo lectura - Configuración del sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <RestrictedButton
              functionName="input_shaper"
              onClick={onInputShaperCalibrate}
              className="flex items-center justify-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Input Shaper
            </RestrictedButton>
            <RestrictedButton
              functionName="save_config"
              onClick={onSaveConfig}
              variant="outline"
              className="flex items-center justify-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Config
            </RestrictedButton>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📊 Configuración Actual (Input Shaper):</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <strong>Eje X:</strong> 54.8 Hz (ei)
              </div>
              <div>
                <strong>Eje Y:</strong> 34.0 Hz (mzv)
              </div>
            </div>
          </div>

          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>Input Shaper:</strong> Recalibra la compensación de vibraciones.
              <br />
              <strong>Guardar Config:</strong> Guarda los cambios permanentemente en printer.cfg.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
