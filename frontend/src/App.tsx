import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GeminiLiveAPI, MultimodalLiveResponseType, type ResponseMessage } from "./lib/geminilive"
import { AudioStreamer, AudioPlayer } from "./lib/mediaUtils"
import { SetVolumeTool, ShowNotificationTool } from "./lib/tools"
import { SYSTEM_PROMPT, GREETING_MESSAGES } from "./lib/systemPrompt"
import { detectCommand, COMMANDS, getHelpText } from "./lib/commands"
import SettingsModal from "./components/SettingsModal"
import type { Settings } from "./components/SettingsModal"
import Chat from "./components/Chat"

const defaultSettings: Settings = {
  userName: "",
  voice: "Puck",
  temperature: 0.7,
  volume: 80,
  userLang: "pt",
  noiseCancellation: true,
  echoCancellation: true,
  autoGainControl: true,
}

function detectUserLanguage(): string {
  const nav = navigator.language || navigator.languages?.[0] || "pt-BR"
  if (nav.startsWith("pt")) return "pt"
  if (nav.startsWith("es")) return "es"
  return "en"
}

function getGreeting(lang: string, name: string): string {
  const base = GREETING_MESSAGES[lang] || GREETING_MESSAGES["pt"]
  if (name.trim()) {
    const greeting = lang === "pt" ? `Olá, ${name}!` : lang === "es" ? `¡Hola, ${name}!` : `Hello, ${name}!`
    return `${greeting}\n\n${base.split("\n\n").slice(1).join("\n\n")}`
  }
  return base
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => ({
    ...defaultSettings,
    userLang: detectUserLanguage(),
  }))
  const [connectionStatus, setConnectionStatus] = useState("Desconectado")
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<{ text: string; type: string }[]>([])
  const [debugInfo, setDebugInfo] = useState("Pronto...")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isAudioStreaming, setIsAudioStreaming] = useState(false)
  const [greetingShown, setGreetingShown] = useState(false)

  const clientRef = useRef<GeminiLiveAPI | null>(null)
  const audioStreamerRef = useRef<AudioStreamer | null>(null)
  const audioPlayerRef = useRef<AudioPlayer | null>(null)
  const lastOutputRef = useRef("")
  const prefsChangedRef = useRef(false)

  const addMessage = useCallback((text: string, type: string) => {
    setMessages((prev) => [...prev, { text, type }])
  }, [])

  const updateDebug = useCallback((text: string) => {
    setDebugInfo(text)
  }, [])

  const handleVolumeChange = useCallback((level: number) => {
    const clamped = Math.max(1, Math.min(100, level))
    audioPlayerRef.current?.setVolume(clamped / 100)
    setSettings((s) => ({ ...s, volume: clamped }))
    addMessage(`[Volume ajustado para ${clamped}% pelo Psycho]`, "system")
  }, [addMessage])

  const processCommand = useCallback((cmdName: string, args: string) => {
    const cmd = COMMANDS.find((c) => c.name === cmdName || c.aliases.includes(cmdName))
    if (!cmd) return

    addMessage(`/${cmd.name} ${args}`.trim(), "user")

    switch (cmd.name) {
      case "help":
        addMessage(getHelpText(settings.userLang), "assistant")
        break
      case "clear":
        setMessages([])
        addMessage("[Conversa limpa]", "system")
        break
      case "volume":
        const vol = parseInt(args)
        if (!isNaN(vol) && vol >= 1 && vol <= 100) {
          handleVolumeChange(vol)
        } else {
          addMessage("💡 Use `/volume 50` para definir o volume (1-100).", "assistant")
        }
        break
      default:
        addMessage(`Comando **/${cmd.name}** reconhecido!`, "assistant")
        break
    }
  }, [addMessage, handleVolumeChange, settings.userLang])

  const handleMessage = useCallback(
    (message: ResponseMessage) => {
      updateDebug(`Mensagem: ${message.type}`)

      switch (message.type) {
        case MultimodalLiveResponseType.TEXT:
          addMessage(message.data, "assistant")
          break

        case MultimodalLiveResponseType.AUDIO:
          audioPlayerRef.current?.play(message.data)
          break

        case MultimodalLiveResponseType.INPUT_TRANSCRIPTION:
          break

        case MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION:
          if (message.data.finished && message.data.text) {
            addMessage(message.data.text, "assistant")
          }
          break

        case MultimodalLiveResponseType.SETUP_COMPLETE:
          addMessage("Psycho conectado! 💜", "system")
          break

        case MultimodalLiveResponseType.TOOL_CALL: {
          const functionCalls = message.data.functionCalls
          const responses: { id?: string; name: string; response: Record<string, any> }[] = []
          for (const fc of functionCalls) {
            try {
              const result = clientRef.current?.callFunction(fc.name, fc.args)
              responses.push({ id: fc.id, name: fc.name, response: { result: result ?? "ok" } })
            } catch (err: any) {
              responses.push({ id: fc.id, name: fc.name, response: { error: err.message } })
            }
          }
          clientRef.current?.sendToolResponse(responses)
          break
        }

        case MultimodalLiveResponseType.TURN_COMPLETE:
          updateDebug("Turno completo")
          break

        case MultimodalLiveResponseType.INTERRUPTED:
          audioPlayerRef.current?.interrupt()
          break
      }
    },
    [addMessage, updateDebug]
  )

  const connect = useCallback(async () => {
    if (clientRef.current) return
    try {
      setConnectionStatus("Obtendo token...")
      const response = await fetch("/api/token", { method: "POST" })
      if (!response.ok) throw new Error(`Falha ao obter token: ${response.statusText}`)
      const { token } = await response.json()

      setConnectionStatus("Conectando ao Psycho...")
      const client = new GeminiLiveAPI(token, "gemini-3.1-flash-live-preview")

      client.baseSystemInstructions = SYSTEM_PROMPT
      client.systemInstructions = SYSTEM_PROMPT
      client.inputAudioTranscription = true
      client.outputAudioTranscription = true
      client.responseModalities = ["AUDIO"]
      client.voiceName = settings.voice
      client.temperature = settings.temperature

      client.addFunction(new SetVolumeTool(handleVolumeChange))
      client.addFunction(new ShowNotificationTool())

      client.onReceiveResponse = handleMessage
      client.onError = (err) => {
        setConnectionStatus("Erro: " + err)
        updateDebug("Erro: " + err)
      }
      client.onClose = () => {
        setConnectionStatus("Desconectado")
        setIsConnected(false)
        setIsAudioStreaming(false)
        audioStreamerRef.current = null
        clientRef.current = null
      }
      client.onOpen = () => {
        setConnectionStatus("Conectado")
        setIsConnected(true)
        if (!greetingShown) {
          addMessage(getGreeting(settings.userLang, settings.userName), "assistant")
          setGreetingShown(true)
        }
        startAudioStreaming()
      }

      clientRef.current = client
      client.connect()

      audioPlayerRef.current = new AudioPlayer()
      await audioPlayerRef.current.init()

      updateDebug("Psycho conectado")
    } catch (error: any) {
      setConnectionStatus("Falha: " + error.message)
      updateDebug("Erro: " + error.message)
    }
  }, [settings, handleMessage, updateDebug, handleVolumeChange, greetingShown, addMessage])

  const disconnect = useCallback(() => {
    clientRef.current?.webSocket?.close()
    clientRef.current = null
    audioStreamerRef.current?.stop()
    audioStreamerRef.current = null
    audioPlayerRef.current?.destroy()
    setIsAudioStreaming(false)
    setConnectionStatus("Desconectado")
    setIsConnected(false)
  }, [])

  const startAudioStreaming = useCallback(async () => {
    try {
      if (!audioStreamerRef.current && clientRef.current) {
        audioStreamerRef.current = new AudioStreamer(clientRef.current)
      }
      if (audioStreamerRef.current) {
        await audioStreamerRef.current.start({
          constraints: {
            noiseSuppression: settings.noiseCancellation,
            echoCancellation: settings.echoCancellation,
            autoGainControl: settings.autoGainControl,
          },
        })
        setIsAudioStreaming(true)
        addMessage("[Microfone ativado automaticamente]", "system")
      }
    } catch (err: any) {
      addMessage("[Erro ao ativar microfone: " + err.message + "]", "system")
    }
  }, [addMessage, settings])

  const toggleAudio = useCallback(async () => {
    if (!isAudioStreaming) {
      try {
        if (!audioStreamerRef.current && clientRef.current) {
          audioStreamerRef.current = new AudioStreamer(clientRef.current)
        }
        if (audioStreamerRef.current) {
          await audioStreamerRef.current.start({
            constraints: {
              noiseSuppression: settings.noiseCancellation,
              echoCancellation: settings.echoCancellation,
              autoGainControl: settings.autoGainControl,
            },
          })
          setIsAudioStreaming(true)
          addMessage("[Microfone ativado]", "system")
        }
      } catch (err: any) {
        addMessage("[Erro de áudio: " + err.message + "]", "system")
      }
    } else {
      audioStreamerRef.current?.stop()
      setIsAudioStreaming(false)
      addMessage("[Microfone desativado]", "system")
    }
  }, [isAudioStreaming, addMessage, settings])

  const sendMessage = useCallback(
    (text: string) => {
      if (!clientRef.current) {
        addMessage("[Conecte-se ao Psycho primeiro]", "system")
        return
      }

      const cmd = detectCommand(text)
      if (cmd) {
        processCommand(cmd.command.name, cmd.args)
        return
      }

      addMessage(text, "user")
      clientRef.current.sendTextMessage(text)
    },
    [addMessage, processCommand]
  )

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }))

      if (key === "voice") {
        const c = clientRef.current
        if (c?.connected) c.setVoice(value as string)
      }
      if (["noiseCancellation", "echoCancellation", "autoGainControl"].includes(key as string)) {
        prefsChangedRef.current = true
      }
    },
    []
  )

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      addMessage(`${e.detail.emoji || "💜"} ${e.detail.message}`, "assistant")
    }
    window.addEventListener("psycho-notification", handler as EventListener)
    return () => window.removeEventListener("psycho-notification", handler as EventListener)
  }, [addMessage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-psycho-700 via-psycho-600 to-indigo-600 text-white px-6 py-4 shadow-lg relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-lg shadow-inner"
            >
              💜
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Psycho</h1>
              <p className="text-sm text-violet-200 font-light">Seu Assistente Psicológico Pessoal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isConnected ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={connect}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white text-psycho-700 hover:bg-violet-50 shadow-sm transition-colors"
              >
                Conectar
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={disconnect}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/90 text-white hover:bg-red-600 transition-colors backdrop-blur-sm"
              >
                Desconectar
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Chat */}
        <Chat messages={messages} onSend={sendMessage} />

        {/* Status + Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-violet-100 p-4"
        >
          <div className="flex items-center gap-3">
            <span className={`inline-block w-2 h-2 rounded-full ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-300"
            }`} />
            <span className="text-xs font-medium text-slate-500">{connectionStatus}</span>
            {settings.userName && (
              <span className="text-xs text-slate-400 border-l border-slate-200 pl-2">
                {settings.userName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleAudio}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isAudioStreaming
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-violet-50"
                }`}
              >
                {isAudioStreaming ? "🎤 Mic ON" : "🎤 Mic OFF"}
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSettingsOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-violet-50 transition-all"
            >
              ⚙️
            </motion.button>
          </div>
        </motion.div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal
            open={settingsOpen}
            settings={settings}
            onClose={() => setSettingsOpen(false)}
            onChange={updateSetting}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
