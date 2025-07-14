"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import KlipperAPI, { type PrinterObjects, type FileInfo, KOBRA_NEO2_CONFIG } from "@/services/klipper-api"

interface KlipperConfig {
  host: string
  port?: number
  autoConnect?: boolean
}

interface KlipperState {
  connected: boolean
  connecting: boolean
  error: string | null
  printerState: string
  objects: PrinterObjects
  files: FileInfo[]
  logs: string[]
  demoMode: boolean
}

// Datos simulados para modo demo (actualizados con tu configuración real)
const DEMO_OBJECTS: PrinterObjects = {
  toolhead: {
    position: [120.5, 110.2, 15.8, 0],
    homed_axes: "xyz",
    max_velocity: 300,
    max_accel: 10000,
  },
  extruder: {
    temperature: 25.3,
    target: 0,
    power: 0,
    pressure_advance: 0.04, // Tu valor real: 0.0400
  },
  heater_bed: {
    temperature: 23.8,
    target: 0,
    power: 0,
  },
  print_stats: {
    state: "standby",
    filename: "",
    total_duration: 0,
    print_duration: 0,
    filament_used: 0,
  },
  display_status: {
    progress: 0,
    message: "Printer ready",
  },
  fan: {
    speed: 0,
  },
  "heater_fan extruder_fan": {
    speed: 0,
  },
  "controller_fan controller_fan": {
    speed: 0,
  },
  gcode_move: {
    speed_factor: 1.0,
    extrude_factor: 1.0,
    absolute_coordinates: true,
    absolute_extrude: true,
  },
  idle_timeout: {
    state: "Idle",
    printing_time: 0,
  },
  probe: {
    last_query: false,
    last_z_result: 3.815, // Tu valor real del SAVE_CONFIG
  },
  bed_mesh: {
    profile_name: "default",
    mesh_min: [14, 11], // Tus valores reales
    mesh_max: [210, 215], // Tus valores reales
  },
  "temperature_sensor raspberry_pi": {
    temperature: 45.2,
  },
  "temperature_sensor mcu_temp": {
    temperature: 38.7,
  },
  input_shaper: {
    shaper_freq_x: 54.8, // Tu valor real
    shaper_type_x: "ei", // Tu valor real
    shaper_freq_y: 34.0, // Tu valor real
    shaper_type_y: "mzv", // Tu valor real
  },
}

const DEMO_FILES: FileInfo[] = [
  {
    filename: "benchy.gcode",
    size: 2456789,
    modified: Date.now() - 86400000,
    estimated_time: 3600,
  },
  {
    filename: "calibration_cube.gcode",
    size: 1234567,
    modified: Date.now() - 172800000,
    estimated_time: 1800,
  },
  {
    filename: "test_print.gcode",
    size: 987654,
    modified: Date.now() - 259200000,
    estimated_time: 2400,
  },
  {
    filename: "temperature_tower.gcode",
    size: 3456789,
    modified: Date.now() - 345600000,
    estimated_time: 4200,
  },
]

export function useKlipper(config: KlipperConfig) {
  const [state, setState] = useState<KlipperState>({
    connected: false,
    connecting: false,
    error: null,
    printerState: "disconnected",
    objects: {},
    files: [],
    logs: [],
    demoMode: false,
  })

  const apiRef = useRef<KlipperAPI | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const connectionAttempts = useRef(0)
  const maxConnectionAttempts = 2

  // Inicializar API
  useEffect(() => {
    if (config.host) {
      // Validar y corregir puerto si es necesario
      let correctedPort = config.port || 7125
      if (correctedPort === 22) {
        console.warn("Puerto SSH (22) detectado, corrigiendo a 7125")
        correctedPort = 7125
      }

      apiRef.current = new KlipperAPI(config.host, correctedPort)

      if (config.autoConnect) {
        connect()
      }
    }

    return () => {
      disconnect()
      stopDemoMode()
    }
  }, [config.host, config.port])

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setState((prev) => ({
      ...prev,
      logs: [`[${timestamp}] ${message}`, ...prev.logs.slice(0, 49)],
    }))
  }, [])

  const startDemoMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      connected: false,
      connecting: false,
      demoMode: true,
      objects: DEMO_OBJECTS,
      files: DEMO_FILES,
      printerState: "ready",
      error: null,
    }))

    addLog("🎮 Modo demostración activado")
    addLog("📊 Simulando Anycubic Kobra Neo 2 (IP: 192.168.1.8)")
    addLog("🔧 Todos los controles funcionan en modo simulado")
    addLog("🌐 Conecta tu Raspberry Pi para usar datos reales")
    addLog("🖥️ Mainsail disponible en: http://192.168.1.8")

    // Simular cambios de temperatura y otros datos
    demoIntervalRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.demoMode) return prev

        const newObjects = { ...prev.objects }

        // Simular fluctuaciones de temperatura ambiente
        if (newObjects.extruder) {
          const targetTemp = newObjects.extruder.target
          let currentTemp = newObjects.extruder.temperature

          if (targetTemp > 0) {
            // Simular calentamiento
            const diff = targetTemp - currentTemp
            if (Math.abs(diff) > 1) {
              currentTemp += diff * 0.1 + (Math.random() - 0.5) * 2
            } else {
              currentTemp = targetTemp + (Math.random() - 0.5) * 2
            }
          } else {
            // Simular enfriamiento
            currentTemp = Math.max(25, currentTemp - 0.5 + (Math.random() - 0.5) * 1)
          }

          newObjects.extruder = {
            ...newObjects.extruder,
            temperature: Math.max(20, Math.min(300, currentTemp)),
          }
        }

        if (newObjects.heater_bed) {
          const targetTemp = newObjects.heater_bed.target
          let currentTemp = newObjects.heater_bed.temperature

          if (targetTemp > 0) {
            // Simular calentamiento de la cama
            const diff = targetTemp - currentTemp
            if (Math.abs(diff) > 1) {
              currentTemp += diff * 0.05 + (Math.random() - 0.5) * 1
            } else {
              currentTemp = targetTemp + (Math.random() - 0.5) * 1
            }
          } else {
            // Simular enfriamiento
            currentTemp = Math.max(23, currentTemp - 0.3 + (Math.random() - 0.5) * 0.5)
          }

          newObjects.heater_bed = {
            ...newObjects.heater_bed,
            temperature: Math.max(20, Math.min(120, currentTemp)),
          }
        }

        // Simular temperaturas del sistema con variaciones realistas
        if (newObjects["temperature_sensor raspberry_pi"]) {
          newObjects["temperature_sensor raspberry_pi"] = {
            temperature: 45 + Math.sin(Date.now() / 60000) * 3 + (Math.random() - 0.5) * 2,
          }
        }

        if (newObjects["temperature_sensor mcu_temp"]) {
          newObjects["temperature_sensor mcu_temp"] = {
            temperature: 38 + Math.sin(Date.now() / 45000) * 2 + (Math.random() - 0.5) * 1,
          }
        }

        // Simular progreso de impresión si está imprimiendo
        if (newObjects.print_stats?.state === "printing" && newObjects.display_status) {
          const currentProgress = newObjects.display_status.progress || 0
          if (currentProgress < 100) {
            newObjects.display_status = {
              ...newObjects.display_status,
              progress: Math.min(100, currentProgress + Math.random() * 0.5),
            }
          }
        }

        return {
          ...prev,
          objects: newObjects,
        }
      })
    }, 3000) // Actualizar cada 3 segundos
  }, [addLog])

  const stopDemoMode = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current)
      demoIntervalRef.current = null
    }

    setState((prev) => ({
      ...prev,
      demoMode: false,
    }))
  }, [])

  const connect = useCallback(async () => {
    if (!apiRef.current || state.connecting) return

    connectionAttempts.current++
    setState((prev) => ({ ...prev, connecting: true, error: null, demoMode: false }))
    stopDemoMode()

    addLog(`🔄 Intento de conexión ${connectionAttempts.current}/${maxConnectionAttempts}`)
    addLog(`🔍 Conectando a ${config.host}:${config.port || 7125}`)
    addLog("🖨️ Buscando Anycubic Kobra Neo 2...")
    addLog(`🌐 Mainsail debería estar en: http://${config.host}`)

    try {
      // Probar conexión con timeout
      const isConnected = await apiRef.current.testConnection()

      if (!isConnected) {
        throw new Error("No se puede conectar a Klipper")
      }

      // Obtener información inicial
      addLog("✅ Conexión establecida, obteniendo datos...")

      const [serverInfo, printerInfo, objects, files] = await Promise.all([
        apiRef.current.getServerInfo(),
        apiRef.current.getPrinterInfo(),
        apiRef.current.getPrinterObjects(),
        apiRef.current.getFilesList().catch(() => []),
      ])

      setState((prev) => ({
        ...prev,
        connected: true,
        connecting: false,
        printerState: printerInfo.state || "ready",
        objects,
        files,
        demoMode: false,
        error: null,
      }))

      connectionAttempts.current = 0 // Reset counter on success
      addLog(`🎉 Conectado a Klipper v${serverInfo.klippy_version || "desconocida"}`)
      addLog("🖨️ Anycubic Kobra Neo 2 lista para usar")
      addLog(`🌐 Mainsail disponible en: http://${config.host}`)

      // Conectar WebSocket para actualizaciones en tiempo real
      apiRef.current.connectWebSocket(
        (data) => {
          if (data.method === "notify_status_update" && data.params) {
            setState((prev) => ({
              ...prev,
              objects: { ...prev.objects, ...data.params[0] },
            }))
          }
        },
        (error) => {
          addLog("⚠️ Error en WebSocket - Reintentando conexión...")
        },
      )

      // Iniciar polling para datos que no vienen por WebSocket
      startPolling()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error de conexión desconocido"

      setState((prev) => ({
        ...prev,
        connected: false,
        connecting: false,
        error: errorMessage,
        demoMode: false,
      }))

      addLog(`❌ Error de conexión: ${errorMessage}`)

      // Detectar errores específicos y dar sugerencias
      if (errorMessage.includes("puerto 22") || errorMessage.includes(":22")) {
        addLog("🔧 PROBLEMA DETECTADO: Puerto SSH (22) en lugar de Moonraker (7125)")
        addLog("⚙️ Ve a Configuración y cambia el puerto a 7125")
      }

      if (errorMessage.includes("CORS") || errorMessage.includes("cross-origin")) {
        addLog("🔒 PROBLEMA DETECTADO: Error de CORS")
        addLog("📝 Necesitas actualizar moonraker.conf")
        addLog("🔧 Ve a Diagnóstico para obtener la configuración correcta")
      }

      // Si hemos agotado los intentos, activar modo demo automáticamente
      if (connectionAttempts.current >= maxConnectionAttempts) {
        addLog("🔄 Máximo de intentos alcanzado")
        addLog("🎮 Activando modo demostración automáticamente...")
        setTimeout(() => {
          startDemoMode()
        }, 2000)
      } else {
        addLog(`🔄 Reintentando en 3 segundos... (${connectionAttempts.current}/${maxConnectionAttempts})`)
        setTimeout(() => {
          connect()
        }, 3000)
      }
    }
  }, [state.connecting, addLog, startDemoMode, stopDemoMode, config.host, config.port])

  const disconnect = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.disconnectWebSocket()
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    stopDemoMode()
    connectionAttempts.current = 0

    setState((prev) => ({
      ...prev,
      connected: false,
      connecting: false,
      error: null,
      demoMode: false,
    }))

    addLog("🔌 Desconectado de Klipper")
  }, [addLog, stopDemoMode])

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    pollIntervalRef.current = setInterval(async () => {
      if (!apiRef.current || !state.connected || state.demoMode) return

      try {
        // Actualizar archivos cada 30 segundos
        const files = await apiRef.current.getFilesList()
        setState((prev) => ({ ...prev, files }))
      } catch (error) {
        console.error("Error en polling:", error)
      }
    }, 30000)
  }, [state.connected, state.demoMode])

  // Métodos de control que funcionan en modo demo y real
  const sendGcode = useCallback(
    async (command: string) => {
      if (state.demoMode) {
        addLog(`> ${command} (DEMO)`)
        addLog(`✅ Comando simulado: ${command}`)
        return
      }

      if (!apiRef.current || !state.connected) {
        throw new Error("No conectado a Klipper")
      }

      addLog(`> ${command}`)
      await apiRef.current.sendGcode(command)
      addLog(`✅ Comando enviado: ${command}`)
    },
    [state.connected, state.demoMode, addLog],
  )

  const setTemperature = useCallback(
    async (type: "hotend" | "bed", temp: number) => {
      if (state.demoMode) {
        setState((prev) => {
          const newObjects = { ...prev.objects }
          if (type === "hotend" && newObjects.extruder) {
            newObjects.extruder = { ...newObjects.extruder, target: temp }
          } else if (type === "bed" && newObjects.heater_bed) {
            newObjects.heater_bed = { ...newObjects.heater_bed, target: temp }
          }
          return { ...prev, objects: newObjects }
        })
        addLog(`🌡️ Temperatura del ${type === "hotend" ? "hotend" : "cama"} establecida a ${temp}°C (DEMO)`)
        return
      }

      if (!apiRef.current) return

      try {
        if (type === "hotend") {
          await apiRef.current.setHotendTemperature(temp)
        } else {
          await apiRef.current.setBedTemperature(temp)
        }

        addLog(`🌡️ Temperatura del ${type === "hotend" ? "hotend" : "cama"} establecida a ${temp}°C`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error al establecer temperatura"
        addLog(`❌ Error: ${errorMessage}`)
        throw error
      }
    },
    [state.connected, state.demoMode, addLog],
  )

  const moveAxis = useCallback(
    async (axis: "x" | "y" | "z", distance: number) => {
      if (state.demoMode) {
        setState((prev) => {
          const newObjects = { ...prev.objects }
          if (newObjects.toolhead) {
            const newPosition = [...newObjects.toolhead.position] as [number, number, number, number]
            const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2

            // Usar los límites reales de tu configuración
            const limits = {
              x: { min: -14, max: 235 },
              y: { min: -3, max: 240 },
              z: { min: -4, max: 250 },
            }

            newPosition[axisIndex] = Math.max(
              limits[axis].min,
              Math.min(limits[axis].max, newPosition[axisIndex] + distance),
            )
            newObjects.toolhead = { ...newObjects.toolhead, position: newPosition }
          }
          return { ...prev, objects: newObjects }
        })
        addLog(`🔄 Movido eje ${axis.toUpperCase()} ${distance > 0 ? "+" : ""}${distance}mm (DEMO)`)
        return
      }

      if (!apiRef.current) return

      try {
        await apiRef.current.moveAxis(axis, distance)
        addLog(`🔄 Movido eje ${axis.toUpperCase()} ${distance > 0 ? "+" : ""}${distance}mm`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error al mover eje"
        addLog(`❌ Error: ${errorMessage}`)
        throw error
      }
    },
    [state.connected, state.demoMode, addLog],
  )

  const homeAxes = useCallback(
    async (axes?: string[]) => {
      if (state.demoMode) {
        setState((prev) => {
          const newObjects = { ...prev.objects }
          if (newObjects.toolhead) {
            // Usar la posición de home real de tu configuración
            const homePositions: [number, number, number, number] = [110, 110, 0, 0] // safe_z_home: 110, 110
            newObjects.toolhead = {
              ...newObjects.toolhead,
              position: homePositions,
              homed_axes: "xyz",
            }
          }
          return { ...prev, objects: newObjects }
        })
        const axesStr = axes ? axes.join("").toUpperCase() : "todos los ejes"
        addLog(`🏠 Calibrado: ${axesStr} (DEMO)`)
        return
      }

      if (!apiRef.current) return

      try {
        await apiRef.current.homeAxes(axes)
        const axesStr = axes ? axes.join("").toUpperCase() : "todos los ejes"
        addLog(`🏠 Calibrado: ${axesStr}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error al calibrar"
        addLog(`❌ Error: ${errorMessage}`)
        throw error
      }
    },
    [state.connected, state.demoMode, addLog],
  )

  const extrudeFilament = useCallback(
    async (amount: number) => {
      if (state.demoMode) {
        addLog(`🔧 ${amount > 0 ? "Extruido" : "Retraído"} ${Math.abs(amount)}mm de filamento (DEMO)`)
        return
      }

      if (!apiRef.current) return

      try {
        await apiRef.current.extrudeFilament(amount)
        addLog(`🔧 ${amount > 0 ? "Extruido" : "Retraído"} ${Math.abs(amount)}mm de filamento`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error en extrusión"
        addLog(`❌ Error: ${errorMessage}`)
        throw error
      }
    },
    [state.connected, state.demoMode, addLog],
  )

  const setFanSpeed = useCallback(
    async (speed: number) => {
      if (state.demoMode) {
        setState((prev) => {
          const newObjects = { ...prev.objects }
          if (newObjects.fan) {
            newObjects.fan = { speed: speed / 100 }
          }
          return { ...prev, objects: newObjects }
        })
        addLog(`💨 Velocidad del ventilador establecida a ${speed}% (DEMO)`)
        return
      }

      if (!apiRef.current) return

      try {
        await apiRef.current.setFanSpeed(speed)
        addLog(`💨 Velocidad del ventilador establecida a ${speed}%`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error al controlar ventilador"
        addLog(`❌ Error: ${errorMessage}`)
        throw error
      }
    },
    [state.connected, state.demoMode, addLog],
  )

  const startPrint = useCallback(
    async (filename: string) => {
      if (state.demoMode) {
        setState((prev) => {
          const newObjects = { ...prev.objects }
          if (newObjects.print_stats) {
            newObjects.print_stats = {
              ...newObjects.print_stats,
              state: "printing",
              filename: filename,
            }
          }
          if (newObjects.display_status) {
            newObjects.display_status = {
              ...newObjects.display_status,
              progress: 0,
            }
          }
          return { ...prev, objects: newObjects }
        })
        addLog(`🖨️ Iniciando impresión: ${filename} (DEMO)`)
        return
      }

      if (!apiRef.current) return

      try {
        await apiRef.current.startPrint(filename)
        addLog(`🖨️ Iniciando impresión: ${filename}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error al iniciar impresión"
        addLog(`❌ Error: ${errorMessage}`)
        throw error
      }
    },
    [state.connected, state.demoMode, addLog],
  )

  const pausePrint = useCallback(async () => {
    if (state.demoMode) {
      setState((prev) => {
        const newObjects = { ...prev.objects }
        if (newObjects.print_stats) {
          newObjects.print_stats = { ...newObjects.print_stats, state: "paused" }
        }
        return { ...prev, objects: newObjects }
      })
      addLog("⏸️ Impresión pausada (DEMO)")
      return
    }

    if (!apiRef.current) return

    try {
      await apiRef.current.pausePrint()
      addLog("⏸️ Impresión pausada")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al pausar"
      addLog(`❌ Error: ${errorMessage}`)
      throw error
    }
  }, [state.connected, state.demoMode, addLog])

  const resumePrint = useCallback(async () => {
    if (state.demoMode) {
      setState((prev) => {
        const newObjects = { ...prev.objects }
        if (newObjects.print_stats) {
          newObjects.print_stats = { ...newObjects.print_stats, state: "printing" }
        }
        return { ...prev, objects: newObjects }
      })
      addLog("▶️ Impresión reanudada (DEMO)")
      return
    }

    if (!apiRef.current) return

    try {
      await apiRef.current.resumePrint()
      addLog("▶️ Impresión reanudada")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al reanudar"
      addLog(`❌ Error: ${errorMessage}`)
      throw error
    }
  }, [state.connected, state.demoMode, addLog])

  const cancelPrint = useCallback(async () => {
    if (state.demoMode) {
      setState((prev) => {
        const newObjects = { ...prev.objects }
        if (newObjects.print_stats) {
          newObjects.print_stats = {
            ...newObjects.print_stats,
            state: "standby",
            filename: "",
          }
        }
        if (newObjects.display_status) {
          newObjects.display_status = {
            ...newObjects.display_status,
            progress: 0,
          }
        }
        return { ...prev, objects: newObjects }
      })
      addLog("⏹️ Impresión cancelada (DEMO)")
      return
    }

    if (!apiRef.current) return

    try {
      await apiRef.current.cancelPrint()
      addLog("⏹️ Impresión cancelada")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al cancelar"
      addLog(`❌ Error: ${errorMessage}`)
      throw error
    }
  }, [state.connected, state.demoMode, addLog])

  const uploadFile = useCallback(
    async (file: File) => {
      if (state.demoMode) {
        const newFile: FileInfo = {
          filename: file.name,
          size: file.size,
          modified: Date.now(),
          estimated_time: Math.floor(file.size / 1000), // Estimación simple
        }
        setState((prev) => ({
          ...prev,
          files: [newFile, ...prev.files],
        }))
        addLog(`📁 Archivo subido: ${file.name} (DEMO)`)
        return
      }

      if (!apiRef.current) return

      try {
        await apiRef.current.uploadFile(file)
        addLog(`📁 Archivo subido: ${file.name}`)

        // Actualizar lista de archivos
        const files = await apiRef.current.getFilesList()
        setState((prev) => ({ ...prev, files }))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error al subir archivo"
        addLog(`❌ Error: ${errorMessage}`)
        throw error
      }
    },
    [state.connected, state.demoMode, addLog],
  )

  const emergencyStop = useCallback(async () => {
    if (state.demoMode) {
      setState((prev) => {
        const newObjects = { ...prev.objects }
        if (newObjects.print_stats) {
          newObjects.print_stats = { ...newObjects.print_stats, state: "error" }
        }
        return { ...prev, objects: newObjects }
      })
      addLog("🚨 PARADA DE EMERGENCIA ACTIVADA (DEMO)")
      return
    }

    if (!apiRef.current) return

    try {
      await apiRef.current.emergencyStop()
      addLog("🚨 PARADA DE EMERGENCIA ACTIVADA")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error en parada de emergencia"
      addLog(`❌ Error: ${errorMessage}`)
      throw error
    }
  }, [state.connected, state.demoMode, addLog])

  // Funciones específicas para Kobra Neo 2 (solo modo real)
  const startPrintSequence = useCallback(async () => {
    if (state.demoMode) {
      addLog("🚀 Secuencia de inicio de impresión ejecutada (DEMO)")
      return
    }

    if (!apiRef.current) return

    try {
      await apiRef.current.startPrintSequence()
      addLog("🚀 Secuencia de inicio de impresión ejecutada")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error en secuencia de inicio"
      addLog(`❌ Error: ${errorMessage}`)
      throw error
    }
  }, [state.connected, state.demoMode, addLog])

  const endPrintSequence = useCallback(async () => {
    if (state.demoMode) {
      addLog("🏁 Secuencia de finalización ejecutada (DEMO)")
      return
    }

    if (!apiRef.current) return

    try {
      await apiRef.current.endPrintSequence()
      addLog("🏁 Secuencia de finalización ejecutada")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error en secuencia de finalización"
      addLog(`❌ Error: ${errorMessage}`)
      throw error
    }
  }, [state.connected, state.demoMode, addLog])

  const pidTuneHotend = useCallback(
    async (temp = 200) => {
      if (state.demoMode) {
        addLog(`🔧 Iniciando calibración PID del hotend a ${temp}°C (DEMO)`)
        return
      }

      if (!apiRef.current) return

      try {
        await apiRef.current.pidTuneHotend(temp)
        addLog(`🔧 Iniciando calibración PID del hotend a ${temp}°C`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error en calibración PID"
        addLog(`❌ Error: ${errorMessage}`)
        throw error
      }
    },
    [state.connected, state.demoMode, addLog],
  )

  const pidTuneBed = useCallback(
    async (temp = 60) => {
      if (state.demoMode) {
        addLog(`🔧 Iniciando calibración PID de la cama a ${temp}°C (DEMO)`)
        return
      }

      if (!apiRef.current) return

      try {
        await apiRef.current.pidTuneBed(temp)
        addLog(`🔧 Iniciando calibración PID de la cama a ${temp}°C`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error en calibración PID"
        addLog(`❌ Error: ${errorMessage}`)
        throw error
      }
    },
    [state.connected, state.demoMode, addLog],
  )

  return {
    // Estado
    ...state,

    // Configuración de la impresora
    config: KOBRA_NEO2_CONFIG,

    // Métodos de conexión
    connect,
    disconnect,
    startDemoMode,
    stopDemoMode,

    // Métodos de control básicos
    sendGcode,
    setTemperature,
    moveAxis,
    homeAxes,
    extrudeFilament,
    setFanSpeed,
    startPrint,
    pausePrint,
    resumePrint,
    cancelPrint,
    uploadFile,
    emergencyStop,

    // Métodos específicos para Kobra Neo 2
    startPrintSequence,
    endPrintSequence,
    pidTuneHotend,
    pidTuneBed,
  }
}
