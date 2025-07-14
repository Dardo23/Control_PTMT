"use client"

export interface KlipperStatus {
  state: string
  state_message: string
}

export interface PrinterObjects {
  toolhead?: {
    position: [number, number, number, number]
    homed_axes: string
    max_velocity: number
    max_accel: number
  }
  extruder?: {
    temperature: number
    target: number
    power: number
    pressure_advance: number
  }
  heater_bed?: {
    temperature: number
    target: number
    power: number
  }
  print_stats?: {
    state: string
    filename: string
    total_duration: number
    print_duration: number
    filament_used: number
  }
  display_status?: {
    progress: number
    message: string
  }
  fan?: {
    speed: number
  }
  "heater_fan extruder_fan"?: {
    speed: number
  }
  "controller_fan controller_fan"?: {
    speed: number
  }
  gcode_move?: {
    speed_factor: number
    extrude_factor: number
    absolute_coordinates: boolean
    absolute_extrude: boolean
  }
  idle_timeout?: {
    state: string
    printing_time: number
  }
  probe?: {
    last_query: boolean
    last_z_result: number
  }
  bed_mesh?: {
    profile_name: string
    mesh_min: [number, number]
    mesh_max: [number, number]
  }
  "temperature_sensor raspberry_pi"?: {
    temperature: number
  }
  "temperature_sensor mcu_temp"?: {
    temperature: number
  }
  input_shaper?: {
    shaper_freq_x: number
    shaper_type_x: string
    shaper_freq_y: number
    shaper_type_y: string
  }
}

export interface FileInfo {
  filename: string
  size: number
  modified: number
  estimated_time?: number
  thumbnails?: Array<{
    width: number
    height: number
    size: number
    relative_path: string
  }>
}

// Configuración específica basada en tu printer.cfg REAL
export const KOBRA_NEO2_CONFIG = {
  // Límites de temperatura (de tu printer.cfg)
  hotend: {
    min: 0,
    max: 280, // max_temp: 280
    min_extrude_temp: 170, // min_extrude_temp: 170
    presets: [0, 170, 200, 210, 220, 240, 260, 280],
  },
  bed: {
    min: 0,
    max: 120, // max_temp: 120
    presets: [0, 50, 60, 70, 80, 100, 120],
  },
  // Límites de movimiento (de tu printer.cfg)
  axes: {
    x: { min: -14, max: 235 }, // position_min: -14, position_max: 235
    y: { min: -3, max: 240 }, // position_min: -3, position_max: 240
    z: { min: -4, max: 250 }, // position_min: -4, position_max: 250
  },
  // Velocidades (de tu printer.cfg)
  speeds: {
    max_velocity: 300, // max_velocity: 300
    max_accel: 10000, // max_accel: 10000
    max_z_velocity: 8, // max_z_velocity: 8
    max_z_accel: 800, // max_z_accel: 800
    homing_speed: 100, // homing_speed: 100 (X/Y)
    z_homing_speed: 15, // homing_speed: 15 (Z)
    second_homing_speed: 1, // second_homing_speed: 1
  },
  // Configuración del extrusor (de tu printer.cfg)
  extruder: {
    max_extrude_only_distance: 200, // max_extrude_only_distance: 200
    max_extrude_only_velocity: 80, // max_extrude_only_velocity: 80
    max_extrude_only_accel: 5000, // max_extrude_only_accel: 5000
    rotation_distance: 7.084, // rotation_distance: 7.084
    nozzle_diameter: 0.4, // nozzle_diameter: 0.400
    filament_diameter: 1.75, // filament_diameter: 1.750
    pressure_advance: 0.04, // pressure_advance: 0.0400
    max_extrude_cross_section: 5.0, // max_extrude_cross_section: 5.0
  },
  // Configuración del probe (de tu printer.cfg)
  probe: {
    x_offset: 24.0, // x_offset: 24.0
    y_offset: 13.35, // y_offset: 13.35
    z_offset: 3.815, // z_offset = 3.815 (del SAVE_CONFIG)
    samples: 3, // samples: 3
    speed: 15, // speed: 15
    lift_speed: 8, // lift_speed: 8
    sample_retract_dist: 2, // sample_retract_dist: 2
    samples_tolerance: 0.1, // samples_tolerance: 0.1
    samples_tolerance_retries: 3, // samples_tolerance_retries: 3
  },
  // Configuración del bed mesh (de tu printer.cfg)
  bed_mesh: {
    mesh_min: [14, 11], // mesh_min: 14, 11
    mesh_max: [210, 215], // mesh_max: 210, 215
    probe_count: [4, 4], // probe_count: 4,4
    speed: 200, // speed: 200
    horizontal_move_z: 5, // horizontal_move_z: 5
    mesh_pps: [4, 4], // mesh_pps: 4,4
    algorithm: "bicubic", // algorithm: bicubic
    bicubic_tension: 0.2, // bicubic_tension: 0.2
  },
  // Safe Z Home (de tu printer.cfg)
  safe_z_home: {
    home_xy_position: [110, 110], // home_xy_position: 110, 110
    speed: 100, // speed: 100
    z_hop: 5, // z_hop: 5
    z_hop_speed: 15, // z_hop_speed: 15
  },
  // Input Shaper (de tu printer.cfg)
  input_shaper: {
    shaper_freq_x: 54.8, // shaper_freq_x: 54.8
    shaper_type_x: "ei", // shaper_type_x: ei
    shaper_freq_y: 34.0, // shaper_freq_y: 34.0
    shaper_type_y: "mzv", // shaper_type_y: mzv
  },
  // PID values (de tu printer.cfg)
  pid: {
    extruder: {
      kp: 14.42, // pid_kp: 14.42
      ki: 0.88, // pid_ki: 0.88
      kd: 59.12, // pid_kd: 59.12
    },
    heater_bed: {
      kp: 97.1, // pid_kp: 97.1
      ki: 1.41, // pid_ki: 1.41
      kd: 1675.16, // pid_kd: 1675.16
    },
  },
  // Información del MCU
  mcu: {
    serial: "/dev/serial/by-id/usb-1a86_USB_Serial-if00-port0",
  },
  // Ventiladores
  fans: {
    part_cooling: "PB5", // pin: PB5
    extruder_fan: "PB13", // pin: PB13
    controller_fan: "PB12", // pin: PB12
  },
}

export interface ConnectionDiagnostics {
  host: string
  port: number
  reachable: boolean
  moonrakerRunning: boolean
  corsEnabled: boolean
  networkError: boolean
  timeoutError: boolean
  corsConfigured: boolean
  error?: string
  suggestions: string[]
  detailedError?: string
  currentIP?: string
}

export enum ConnectionErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  CORS_ERROR = "CORS_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

class KlipperAPI {
  private baseUrl: string
  private wsUrl: string
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectDelay = 2000
  private connectionTimeout = 5000 // Timeout un poco más largo

  constructor(host: string, port = 7125) {
    // Validar que no sea puerto SSH (22) por error común
    if (port === 22) {
      console.warn("Puerto 22 detectado (SSH), cambiando a 7125 (Moonraker)")
      port = 7125
    }

    // Validar que sea un puerto válido para Moonraker
    if (port < 1024 || port > 65535) {
      console.warn(`Puerto ${port} inválido, usando 7125 por defecto`)
      port = 7125
    }

    this.baseUrl = `http://${host}:${port}`
    this.wsUrl = `ws://${host}:${port}/websocket`
  }

  // Detectar IP actual del cliente
  private async getCurrentClientIP(): Promise<string | null> {
    try {
      // Intentar obtener IP local del cliente
      const response = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(2000),
      })
      const data = await response.json()
      return data.ip
    } catch {
      // Si falla, intentar detectar IP local
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        })
        pc.createDataChannel("")
        await pc.createOffer().then((offer) => pc.setLocalDescription(offer))

        return new Promise((resolve) => {
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              const candidate = event.candidate.candidate
              const match = candidate.match(/(\d+\.\d+\.\d+\.\d+)/)
              if (match && match[1].startsWith("192.168.")) {
                resolve(match[1])
                pc.close()
              }
            }
          }
          setTimeout(() => resolve(null), 3000)
        })
      } catch {
        return null
      }
    }
  }

  // Detectar tipo de error de conexión
  private categorizeError(error: any): ConnectionErrorType {
    const errorMessage = error.message?.toLowerCase() || ""

    if (error.name === "AbortError" || errorMessage.includes("timeout")) {
      return ConnectionErrorType.TIMEOUT_ERROR
    }

    if (errorMessage.includes("cors") || errorMessage.includes("cross-origin")) {
      return ConnectionErrorType.CORS_ERROR
    }

    if (
      errorMessage.includes("failed to fetch") ||
      errorMessage.includes("network") ||
      errorMessage.includes("connection")
    ) {
      return ConnectionErrorType.NETWORK_ERROR
    }

    if (errorMessage.includes("500") || errorMessage.includes("502") || errorMessage.includes("503")) {
      return ConnectionErrorType.SERVER_ERROR
    }

    return ConnectionErrorType.UNKNOWN_ERROR
  }

  // Diagnóstico de conexión mejorado con detección de CORS
  async diagnoseConnection(): Promise<ConnectionDiagnostics> {
    const [host, portStr] = this.baseUrl.split("://")[1].split(":")
    const port = Number.parseInt(portStr) || 7125

    const diagnostics: ConnectionDiagnostics = {
      host,
      port,
      reachable: false,
      moonrakerRunning: false,
      corsEnabled: false,
      corsConfigured: false,
      networkError: false,
      timeoutError: false,
      suggestions: [],
    }

    // Detectar IP actual del cliente
    try {
      diagnostics.currentIP = await this.getCurrentClientIP()
    } catch (error) {
      console.log("No se pudo detectar IP del cliente")
    }

    // Validar configuración antes de intentar conexión
    if (port === 22) {
      diagnostics.error = "Puerto SSH (22) detectado - debe ser 7125 para Moonraker"
      diagnostics.suggestions.push("🔧 Puerto incorrecto: Cambia del puerto 22 al 7125")
      diagnostics.suggestions.push("📝 Puerto 22 es para SSH, puerto 7125 es para Moonraker")
      diagnostics.suggestions.push("⚙️ Verifica la configuración en la interfaz")
      return diagnostics
    }

    try {
      // Intentar conexión con timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.connectionTimeout)

      console.log(`Intentando conectar a: ${this.baseUrl}/server/info`)

      const response = await fetch(`${this.baseUrl}/server/info`, {
        method: "GET",
        signal: controller.signal,
        mode: "cors",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        diagnostics.reachable = true
        diagnostics.moonrakerRunning = true
        diagnostics.corsEnabled = true
        diagnostics.corsConfigured = true
        return diagnostics
      } else {
        diagnostics.reachable = true
        diagnostics.moonrakerRunning = true
        diagnostics.error = `HTTP ${response.status}: ${response.statusText}`
        diagnostics.detailedError = `El servidor respondió con código ${response.status}`

        if (response.status >= 500) {
          diagnostics.suggestions.push("🔧 Error del servidor - Moonraker puede estar fallando")
          diagnostics.suggestions.push("🔄 Reinicia Moonraker: sudo systemctl restart moonraker")
        } else if (response.status === 404) {
          diagnostics.suggestions.push("❓ Endpoint no encontrado - Verifica la versión de Moonraker")
          diagnostics.suggestions.push("🔍 ¿Está Moonraker ejecutándose en el puerto 7125?")
        } else if (response.status === 403) {
          diagnostics.suggestions.push("🔒 Acceso denegado - Problema de CORS o autenticación")
          diagnostics.corsConfigured = false
        } else {
          diagnostics.suggestions.push(`❌ Error HTTP ${response.status} - Verifica la configuración`)
        }
      }
    } catch (error: any) {
      const errorType = this.categorizeError(error)
      diagnostics.error = error.message
      diagnostics.detailedError = `Tipo de error: ${errorType} | URL: ${this.baseUrl}`

      switch (errorType) {
        case ConnectionErrorType.TIMEOUT_ERROR:
          diagnostics.timeoutError = true
          diagnostics.suggestions.push("⏱️ Timeout de conexión - El servidor no responde a tiempo")
          diagnostics.suggestions.push(`🔍 Verifica que la IP sea correcta: ${host}`)
          diagnostics.suggestions.push(`🔌 Verifica que el puerto sea correcto: ${port}`)
          diagnostics.suggestions.push("🖥️ ¿Está encendido el Raspberry Pi?")
          diagnostics.suggestions.push("📡 ¿Estás en la misma red WiFi?")
          break

        case ConnectionErrorType.NETWORK_ERROR:
          diagnostics.networkError = true
          diagnostics.suggestions.push("🌐 Error de red - No se puede alcanzar el servidor")
          diagnostics.suggestions.push(`🏠 Verifica que estés en la misma red que ${host}`)
          diagnostics.suggestions.push(`🏓 Prueba hacer ping: ping ${host}`)
          diagnostics.suggestions.push("📱 ¿Cambió la IP del Raspberry Pi?")
          diagnostics.suggestions.push("🔍 Busca la IP actual: nmap -sn 192.168.1.0/24")
          break

        case ConnectionErrorType.CORS_ERROR:
          diagnostics.corsEnabled = false
          diagnostics.corsConfigured = false
          diagnostics.suggestions.push("🔒 Error de CORS - Configuración de seguridad")
          diagnostics.suggestions.push("📝 Tu moonraker.conf tiene CORS muy restrictivo")
          diagnostics.suggestions.push("🔧 Necesitas actualizar cors_domains en moonraker.conf")
          break

        case ConnectionErrorType.SERVER_ERROR:
          diagnostics.suggestions.push("🔧 Error del servidor - Moonraker tiene problemas")
          diagnostics.suggestions.push("📋 Revisa los logs: tail -f ~/printer_data/logs/moonraker.log")
          diagnostics.suggestions.push("🔄 Reinicia el servicio: sudo systemctl restart moonraker")
          break

        default:
          diagnostics.suggestions.push("❓ Error desconocido")
          diagnostics.suggestions.push("🔍 Revisa la consola del navegador para más detalles")
          break
      }
    }

    // Sugerencias específicas para CORS basadas en tu configuración actual
    if (!diagnostics.corsConfigured) {
      diagnostics.suggestions.push("")
      diagnostics.suggestions.push("🔧 PROBLEMA DETECTADO: Configuración CORS restrictiva")
      diagnostics.suggestions.push("📝 Tu moonraker.conf solo permite IP 192.168.1.3")

      if (diagnostics.currentIP) {
        diagnostics.suggestions.push(`🌐 Tu IP actual parece ser: ${diagnostics.currentIP}`)
        if (diagnostics.currentIP !== "192.168.1.3") {
          diagnostics.suggestions.push("❌ Tu IP no coincide con la configurada en CORS")
        }
      }

      diagnostics.suggestions.push("🔄 Solución: Actualiza moonraker.conf con configuración más permisiva")
    }

    // Sugerencias adicionales basadas en el estado
    if (!diagnostics.reachable) {
      diagnostics.suggestions.push("")
      diagnostics.suggestions.push("🔍 Pasos de verificación básicos:")
      diagnostics.suggestions.push(`1. 🌐 Accede a Mainsail: http://${host}`)
      diagnostics.suggestions.push(`2. 🔧 Verifica Moonraker: sudo systemctl status moonraker`)
      diagnostics.suggestions.push(`3. 📡 Verifica la red: ping ${host}`)
      diagnostics.suggestions.push("4. 🎮 Usa el modo demo mientras resuelves el problema")
    }

    return diagnostics
  }

  // Método HTTP mejorado con mejor manejo de errores
  async get(endpoint: string): Promise<any> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.connectionTimeout)

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        signal: controller.signal,
        mode: "cors",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.result || data
    } catch (error: any) {
      clearTimeout(timeoutId)

      const errorType = this.categorizeError(error)
      let enhancedError: Error

      switch (errorType) {
        case ConnectionErrorType.TIMEOUT_ERROR:
          enhancedError = new Error(`Timeout: El servidor no responde en ${this.connectionTimeout}ms`)
          break
        case ConnectionErrorType.NETWORK_ERROR:
          enhancedError = new Error(`Error de red: No se puede conectar a ${this.baseUrl}`)
          break
        case ConnectionErrorType.CORS_ERROR:
          enhancedError = new Error(`Error CORS: Configura cors_domains en moonraker.conf`)
          break
        default:
          enhancedError = new Error(error.message || "Error de conexión desconocido")
      }

      console.error(`Error fetching ${endpoint}:`, enhancedError.message)
      throw enhancedError
    }
  }

  async post(endpoint: string, data?: any): Promise<any> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.connectionTimeout * 2) // Más tiempo para POST

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        signal: controller.signal,
        mode: "cors",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: data ? JSON.stringify(data) : undefined,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.result || result
    } catch (error: any) {
      clearTimeout(timeoutId)

      const errorType = this.categorizeError(error)
      let enhancedError: Error

      switch (errorType) {
        case ConnectionErrorType.TIMEOUT_ERROR:
          enhancedError = new Error(`Timeout: Comando no ejecutado en ${this.connectionTimeout * 2}ms`)
          break
        case ConnectionErrorType.NETWORK_ERROR:
          enhancedError = new Error(`Error de red: No se puede enviar comando a ${this.baseUrl}`)
          break
        default:
          enhancedError = new Error(error.message || "Error al enviar comando")
      }

      console.error(`Error posting to ${endpoint}:`, enhancedError.message)
      throw enhancedError
    }
  }

  // Información del servidor y impresora
  async getServerInfo() {
    return this.get("/server/info")
  }

  async getPrinterInfo() {
    return this.get("/printer/info")
  }

  async getPrinterStatus(): Promise<KlipperStatus> {
    return this.get("/printer/info")
  }

  // Objetos de la impresora (temperaturas, posición, etc.)
  async getPrinterObjects(objects?: string[]): Promise<PrinterObjects> {
    const objectsQuery = objects ? `?${objects.map((obj) => `${obj}`).join("&")}` : ""
    return this.get(`/printer/objects/query${objectsQuery}`)
  }

  // Control de temperatura con límites específicos de tu configuración
  async setHotendTemperature(temp: number) {
    if (temp < KOBRA_NEO2_CONFIG.hotend.min || temp > KOBRA_NEO2_CONFIG.hotend.max) {
      throw new Error(
        `Temperatura del hotend debe estar entre ${KOBRA_NEO2_CONFIG.hotend.min}°C y ${KOBRA_NEO2_CONFIG.hotend.max}°C`,
      )
    }
    if (temp > 0 && temp < KOBRA_NEO2_CONFIG.hotend.min_extrude_temp) {
      throw new Error(`Temperatura mínima para extruir: ${KOBRA_NEO2_CONFIG.hotend.min_extrude_temp}°C`)
    }
    return this.post("/printer/gcode/script", {
      script: `M104 S${temp}`,
    })
  }

  async setBedTemperature(temp: number) {
    if (temp < KOBRA_NEO2_CONFIG.bed.min || temp > KOBRA_NEO2_CONFIG.bed.max) {
      throw new Error(
        `Temperatura de la cama debe estar entre ${KOBRA_NEO2_CONFIG.bed.min}°C y ${KOBRA_NEO2_CONFIG.bed.max}°C`,
      )
    }
    return this.post("/printer/gcode/script", {
      script: `M140 S${temp}`,
    })
  }

  // Control de movimiento con límites específicos de tu configuración
  async homeAxes(axes?: string[]) {
    const axesStr = axes ? axes.join("").toUpperCase() : ""
    return this.post("/printer/gcode/script", {
      script: `G28 ${axesStr}`,
    })
  }

  async moveAxis(axis: string, distance: number, feedrate?: number) {
    // Usar velocidades apropiadas según el eje basadas en tu configuración
    let defaultFeedrate = feedrate
    if (!defaultFeedrate) {
      if (axis.toLowerCase() === "z") {
        defaultFeedrate = KOBRA_NEO2_CONFIG.speeds.max_z_velocity * 60 // convertir a mm/min
      } else {
        defaultFeedrate = KOBRA_NEO2_CONFIG.speeds.max_velocity * 60 // convertir a mm/min
      }
    }

    return this.post("/printer/gcode/script", {
      script: `G91\nG1 ${axis.toUpperCase()}${distance} F${defaultFeedrate}\nG90`,
    })
  }

  // Control del extrusor con configuración específica de tu printer.cfg
  async extrudeFilament(amount: number, feedrate?: number) {
    if (Math.abs(amount) > KOBRA_NEO2_CONFIG.extruder.max_extrude_only_distance) {
      throw new Error(`Cantidad máxima de extrusión: ${KOBRA_NEO2_CONFIG.extruder.max_extrude_only_distance}mm`)
    }

    const extrudeFeedrate = feedrate || KOBRA_NEO2_CONFIG.extruder.max_extrude_only_velocity * 60
    return this.post("/printer/gcode/script", {
      script: `M83\nG1 E${amount} F${extrudeFeedrate}\nM82`,
    })
  }

  // Control del ventilador (0-100%)
  async setFanSpeed(speed: number) {
    const fanValue = Math.round((speed / 100) * 255)
    return this.post("/printer/gcode/script", {
      script: `M106 S${fanValue}`,
    })
  }

  // Macros específicas para tu configuración
  async bedMeshCalibrate() {
    return this.post("/printer/gcode/script", {
      script: `BED_MESH_CALIBRATE`,
    })
  }

  async loadBedMesh(profile = "default") {
    return this.post("/printer/gcode/script", {
      script: `BED_MESH_PROFILE LOAD=${profile}`,
    })
  }

  async saveBedMesh(profile = "default") {
    return this.post("/printer/gcode/script", {
      script: `BED_MESH_PROFILE SAVE=${profile}`,
    })
  }

  async probeAccuracy() {
    return this.post("/printer/gcode/script", {
      script: `PROBE_ACCURACY`,
    })
  }

  // Secuencia de inicio optimizada para tu configuración específica
  async startPrintSequence() {
    return this.post("/printer/gcode/script", {
      script: `
        G28 ; Home all axes
        BED_MESH_PROFILE LOAD=default ; Load bed mesh
        G1 Z15.0 F${KOBRA_NEO2_CONFIG.speeds.max_z_velocity * 60} ; Move platform down
        G92 E0 ; Reset Extruder
        G1 X10.1 Y20 Z0.3 F3000.0 ; Move to start position
        G1 X10.1 Y200.0 Z0.3 F1500.0 E15 ; Draw first line
        G1 X10.4 Y200.0 Z0.3 F3000.0 ; Move to side
        G1 X10.4 Y20 Z0.3 F1500.0 E30 ; Draw second line
        G92 E0 ; Reset Extruder
        G1 Z2.0 F3000 ; Move Z up
      `.trim(),
    })
  }

  async endPrintSequence() {
    return this.post("/printer/gcode/script", {
      script: `
        G91 ; Relative positioning
        G1 E-2 F2700 ; Retract
        G1 E-2 Z0.2 F2400 ; Retract and raise Z
        G1 X5 Y5 F3000 ; Wipe out
        G1 Z10 ; Raise Z more
        G90 ; Absolute positioning
        G1 X0 Y${KOBRA_NEO2_CONFIG.axes.y.max - 20} ; Present print
        M106 S0 ; Turn-off fan
        M104 S0 ; Turn-off hotend
        M140 S0 ; Turn-off bed
        M84 X Y E ; Disable steppers but Z
      `.trim(),
    })
  }

  // PID Tuning específico para tu configuración
  async pidTuneHotend(temp = 200) {
    return this.post("/printer/gcode/script", {
      script: `PID_CALIBRATE HEATER=extruder TARGET=${temp}`,
    })
  }

  async pidTuneBed(temp = 60) {
    return this.post("/printer/gcode/script", {
      script: `PID_CALIBRATE HEATER=heater_bed TARGET=${temp}`,
    })
  }

  // Input Shaper
  async inputShaperCalibrate() {
    return this.post("/printer/gcode/script", {
      script: `SHAPER_CALIBRATE`,
    })
  }

  // Comandos de mantenimiento
  async saveConfig() {
    return this.post("/printer/gcode/script", {
      script: `SAVE_CONFIG`,
    })
  }

  async queryProbe() {
    return this.post("/printer/gcode/script", {
      script: `QUERY_PROBE`,
    })
  }

  // Enviar comando G-code personalizado
  async sendGcode(command: string) {
    return this.post("/printer/gcode/script", {
      script: command,
    })
  }

  // Gestión de archivos
  async getFilesList(path = "gcodes"): Promise<FileInfo[]> {
    const response = await this.get(`/server/files/list?root=${path}`)
    return response.files || []
  }

  async uploadFile(file: File, path = "gcodes") {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("root", path)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos para upload

    try {
      const response = await fetch(`${this.baseUrl}/server/files/upload`, {
        method: "POST",
        signal: controller.signal,
        body: formData,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      return response.json()
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === "AbortError") {
        throw new Error("Timeout al subir archivo")
      }
      throw error
    }
  }

  // Control de impresión usando las macros de Mainsail
  async startPrint(filename: string) {
    return this.post("/printer/print/start", {
      filename: filename,
    })
  }

  async pausePrint() {
    // Usar la macro PAUSE de Mainsail
    return this.post("/printer/gcode/script", {
      script: `PAUSE`,
    })
  }

  async resumePrint() {
    // Usar la macro RESUME de Mainsail
    return this.post("/printer/gcode/script", {
      script: `RESUME`,
    })
  }

  async cancelPrint() {
    // Usar la macro CANCEL_PRINT de Mainsail
    return this.post("/printer/gcode/script", {
      script: `CANCEL_PRINT`,
    })
  }

  // Parada de emergencia
  async emergencyStop() {
    return this.post("/printer/emergency_stop")
  }

  // Restart firmware
  async restartFirmware() {
    return this.post("/printer/firmware_restart")
  }

  // WebSocket para actualizaciones en tiempo real
  connectWebSocket(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    try {
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        console.log("WebSocket connected to Klipper")
        this.reconnectAttempts = 0

        // Suscribirse a actualizaciones de objetos específicos para tu configuración
        this.ws?.send(
          JSON.stringify({
            jsonrpc: "2.0",
            method: "printer.objects.subscribe",
            params: {
              objects: {
                toolhead: ["position", "homed_axes", "max_velocity", "max_accel"],
                extruder: ["temperature", "target", "power", "pressure_advance"],
                heater_bed: ["temperature", "target", "power"],
                print_stats: ["state", "filename", "total_duration", "print_duration", "filament_used"],
                display_status: ["progress", "message"],
                fan: ["speed"],
                "heater_fan extruder_fan": ["speed"],
                "controller_fan controller_fan": ["speed"],
                gcode_move: ["speed_factor", "extrude_factor", "absolute_coordinates"],
                idle_timeout: ["state", "printing_time"],
                probe: ["last_query", "last_z_result"],
                bed_mesh: ["profile_name", "mesh_min", "mesh_max"],
                "temperature_sensor raspberry_pi": ["temperature"],
                "temperature_sensor mcu_temp": ["temperature"],
                input_shaper: ["shaper_freq_x", "shaper_type_x", "shaper_freq_y", "shaper_type_y"],
              },
            },
            id: 1,
          }),
        )
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage(data)
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      this.ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason)
        if (event.code !== 1000) {
          // No fue un cierre normal
          this.attemptReconnect(onMessage, onError)
        }
      }

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        if (onError) onError(error)
      }
    } catch (error) {
      console.error("Error creating WebSocket:", error)
      if (onError) onError(error as Event)
    }
  }

  private attemptReconnect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect WebSocket... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.connectWebSocket(onMessage, onError)
      }, this.reconnectDelay)
    } else {
      console.error("Max WebSocket reconnection attempts reached")
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close(1000, "Manual disconnect") // Cierre normal
      this.ws = null
    }
  }

  // Verificar conexión con diagnóstico mejorado
  async testConnection(): Promise<boolean> {
    try {
      await this.getServerInfo()
      return true
    } catch (error) {
      console.error("Connection test failed:", error)
      return false
    }
  }
}

export default KlipperAPI
