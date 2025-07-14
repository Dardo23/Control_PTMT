"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Cpu, Activity, Gauge } from "lucide-react"
import type { PrinterObjects } from "@/services/klipper-api"

interface PrinterInfoProps {
  objects: PrinterObjects
  isConnected: boolean
}

export default function PrinterInfo({ objects, isConnected }: PrinterInfoProps) {
  if (!isConnected) {
    return null
  }

  const rpiTemp = objects["temperature_sensor raspberry_pi"]?.temperature || 0
  const mcuTemp = objects["temperature_sensor mcu_temp"]?.temperature || 0
  const extruderFanSpeed = (objects["heater_fan extruder_fan"]?.speed || 0) * 100
  const controllerFanSpeed = (objects["controller_fan controller_fan"]?.speed || 0) * 100
  const pressureAdvance = objects.extruder?.pressure_advance || 0
  const speedFactor = (objects.gcode_move?.speed_factor || 1) * 100
  const extrudeFactor = (objects.gcode_move?.extrude_factor || 1) * 100

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Temperaturas del Sistema */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Cpu className="h-4 w-4 mr-2" />
            Temperaturas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Raspberry Pi</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{rpiTemp.toFixed(1)}°C</span>
              <Badge
                variant={rpiTemp > 70 ? "destructive" : rpiTemp > 60 ? "secondary" : "default"}
                className="text-xs"
              >
                {rpiTemp > 70 ? "Alto" : rpiTemp > 60 ? "Medio" : "OK"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">MCU</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{mcuTemp.toFixed(1)}°C</span>
              <Badge
                variant={mcuTemp > 60 ? "destructive" : mcuTemp > 50 ? "secondary" : "default"}
                className="text-xs"
              >
                {mcuTemp > 60 ? "Alto" : mcuTemp > 50 ? "Medio" : "OK"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ventiladores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Estado de Ventiladores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Extrusor</span>
              <span className="text-sm font-medium">{extruderFanSpeed.toFixed(0)}%</span>
            </div>
            <Progress value={extruderFanSpeed} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Controlador</span>
              <span className="text-sm font-medium">{controllerFanSpeed.toFixed(0)}%</span>
            </div>
            <Progress value={controllerFanSpeed} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Configuración Avanzada */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Gauge className="h-4 w-4 mr-2" />
            Configuración Avanzada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pressure Advance</span>
            <span className="text-sm font-medium">{pressureAdvance.toFixed(4)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Factor Velocidad</span>
            <span className="text-sm font-medium">{speedFactor.toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Factor Extrusión</span>
            <span className="text-sm font-medium">{extrudeFactor.toFixed(0)}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
