"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, CheckCircle, XCircle, Wifi, RefreshCw, Terminal, Network, Settings, Copy } from "lucide-react"
import KlipperAPI, { type ConnectionDiagnostics } from "@/services/klipper-api"

interface ConnectionDiagnosticsProps {
  host: string
  port: number
}

export default function ConnectionDiagnosticsComponent({ host, port }: ConnectionDiagnosticsProps) {
  const [diagnostics, setDiagnostics] = useState<ConnectionDiagnostics | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    try {
      const api = new KlipperAPI(host, port)
      const result = await api.diagnoseConnection()
      setDiagnostics(result)
    } catch (error) {
      console.error("Error running diagnostics:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (status: boolean, trueText: string, falseText: string) => {
    return <Badge variant={status ? "default" : "destructive"}>{status ? trueText : falseText}</Badge>
  }

  // Configuración CORS universal que funciona con cualquier IP
  const getUniversalCorsConfig = () => {
    return `[server]
host: 0.0.0.0
port: 7125
max_upload_size: 1024
klippy_uds_address: ~/printer_data/comms/klippy.sock

[authorization]
trusted_clients:
    192.168.0.0/16
    10.0.0.0/8
    127.0.0.1
    169.254.0.0/16
    172.16.0.0/12
    FE80::/10
    ::1/128
cors_domains:
    *.lan
    *.local
    *://localhost
    *://localhost:*
    *://127.0.0.1:*
    *://192.168.*.*
    *://192.168.*.*:*
    *://10.*.*.*
    *://10.*.*.*:*
    *://172.16.*.*
    *://172.16.*.*:*
    http://*:3000
    https://*:3000
    http://*:5173
    https://*:5173
    http://*:8080
    https://*:8080

[file_manager]
enable_object_processing: False

[octoprint_compat]

[history]

[announcements]
subscriptions:
    mainsail

[update_manager]
refresh_interval: 168
enable_auto_refresh: True

[update_manager mainsail]
type: web
channel: stable
repo: mainsail-crew/mainsail
path: ~/mainsail

[update_manager mainsail-config]
type: git_repo
primary_branch: master
path: ~/mainsail-config
origin: https://github.com/mainsail-crew/mainsail-config.git
managed_services: klipper

[update_manager crowsnest]
type: git_repo
path: ~/crowsnest
origin: https://github.com/mainsail-crew/crowsnest.git
managed_services: crowsnest`
  }

  const copyConfigToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getUniversalCorsConfig())
      setCopiedConfig(true)
      setTimeout(() => setCopiedConfig(false), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Network className="h-5 w-5" />
          <span>Diagnóstico de Conexión</span>
        </CardTitle>
        <CardDescription>Diagnostica problemas de conectividad con tu Raspberry Pi</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Objetivo:{" "}
            <span className="font-medium">
              {host}:{port}
            </span>
          </div>
          <Button onClick={runDiagnostics} disabled={isRunning} size="sm">
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Diagnosticando...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Ejecutar Diagnóstico
              </>
            )}
          </Button>
        </div>

        {diagnostics && (
          <div className="space-y-4">
            <Separator />

            {/* Estado de la conexión */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Estado de la Conexión
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Servidor Alcanzable</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(diagnostics.reachable)}
                    {getStatusBadge(diagnostics.reachable, "Sí", "No")}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Moonraker Activo</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(diagnostics.moonrakerRunning)}
                    {getStatusBadge(diagnostics.moonrakerRunning, "Sí", "No")}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">CORS Configurado</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(diagnostics.corsConfigured)}
                    {getStatusBadge(diagnostics.corsConfigured, "Sí", "No")}
                  </div>
                </div>
              </div>
            </div>

            {/* Información de IP */}
            {diagnostics.currentIP && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">🌐 Información de Red</h4>
                <div className="text-sm text-blue-800">
                  <p>
                    <strong>Tu IP actual:</strong> {diagnostics.currentIP}
                  </p>
                  <p>
                    <strong>IP de Raspberry Pi:</strong> {host}
                  </p>
                  <p>
                    <strong>Puerto:</strong> {port}
                  </p>
                </div>
              </div>
            )}

            {/* Error específico */}
            {diagnostics.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {diagnostics.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Sugerencias */}
            {diagnostics.suggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Terminal className="h-4 w-4 mr-2" />
                  Sugerencias para Resolver
                </h4>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="space-y-2">
                    {diagnostics.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-blue-800 flex items-start">
                        {suggestion && (
                          <>
                            <span className="font-medium mr-2">{index + 1}.</span>
                            <span>{suggestion}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Configuración CORS universal */}
            <div className="space-y-3">
              <h4 className="font-medium">🔧 Configuración CORS Universal</h4>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-green-800 font-medium">
                    Esta configuración funciona con cualquier IP de Raspberry Pi:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyConfigToClipboard}
                    className="text-green-700 border-green-300 bg-transparent"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedConfig ? "¡Copiado!" : "Copiar"}
                  </Button>
                </div>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  <pre>{getUniversalCorsConfig()}</pre>
                </div>
              </div>
            </div>

            {/* Comandos útiles */}
            <div className="space-y-3">
              <h4 className="font-medium">Comandos para Encontrar la Nueva IP</h4>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm space-y-2">
                <div># Desde la Raspberry Pi (SSH o terminal directo)</div>
                <div className="text-green-400">hostname -I</div>
                <div className="text-green-400">ip addr show wlan0 | grep inet</div>
                <div className="text-green-400">ifconfig wlan0</div>
                <div className="mt-2"># Desde tu computadora (escanear red)</div>
                <div className="text-green-400">nmap -sn 192.168.1.0/24</div>
                <div className="text-green-400">nmap -sn 192.168.0.0/24</div>
                <div className="mt-2"># Verificar puerto Moonraker</div>
                <div className="text-green-400">sudo netstat -tlnp | grep 7125</div>
              </div>
            </div>

            {/* Pasos específicos para cambio de IP */}
            <div className="space-y-3">
              <h4 className="font-medium">📋 Pasos para Cambio de IP</h4>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Encuentra la nueva IP:</strong> Usa los comandos de arriba o el escáner automático
                  </li>
                  <li>
                    <strong>Actualiza la configuración:</strong> Usa el botón "Configurar" arriba
                  </li>
                  <li>
                    <strong>Si hay problemas de CORS:</strong> Copia la configuración universal de arriba
                  </li>
                  <li>
                    <strong>Conecta por SSH:</strong> <code>ssh pi@[NUEVA_IP]</code>
                  </li>
                  <li>
                    <strong>Edita moonraker.conf:</strong> <code>nano ~/printer_data/config/moonraker.conf</code>
                  </li>
                  <li>
                    <strong>Pega la configuración universal</strong>
                  </li>
                  <li>
                    <strong>Reinicia Moonraker:</strong> <code>sudo systemctl restart moonraker</code>
                  </li>
                  <li>
                    <strong>Prueba la conexión desde esta página</strong>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
