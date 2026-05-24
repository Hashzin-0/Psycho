import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GeminiLiveAPI, MultimodalLiveResponseType, type ResponseMessage } from "./lib/geminilive"
import { AudioStreamer, VideoStreamer, ScreenCapture, AudioPlayer } from "./lib/mediaUtils"
import { SetVolumeTool, SetWhisperModeTool, ShowNotificationTool } from "./lib/tools"
import { SYSTEM_PROMPT, GREETING_MESSAGES } from "./lib/systemPrompt"
import { detectCommand, COMMANDS, getHelpText } from "./lib/commands"
import SettingsModal from "./components/SettingsModal"
import type { Settings } from "./components/SettingsModal"
import FloatingButtons from "./components/FloatingButtons"
import Chat from "./components/Chat"
import MediaControls from "./components/MediaControls"

const defaultSettings: Settings = {
  model: "gemini-3.1-flash-live-preview",
  systemInstructions: SYSTEM_PROMPT,
  voice: "Puck",
  temperature: 0.9,
  enableGrounding: false,
  enableWhisper: false,
  enableThinking: false,
  enableAlertTool: false,
  enableCssStyleTool: false,
  enableInputTranscription: true,
  enableOutputTranscription: true,
  disableActivityDetection: false,
  silenceDuration: 500,
  prefixPadding: 500,
  endSpeechSensitivity: "END_SENSITIVITY_UNSPECIFIED",
  startSpeechSensitivity: "START_SENSITIVITY_UNSPECIFIED",
  activityHandling: "ACTIVITY_HANDLING_UNSPECIFIED",
  volume: 80,
}

function detectUserLanguage(): string {
  const nav = navigator.language || navigator.languages?.[0] || "pt-BR"
  if (nav.startsWith("pt")) return "pt"
  if (nav.startsWith("es")) return "es"
  return "en"
}

function getGreeting(lang: string): string {
  return GREETING_MESSAGES[lang] || GREETING_MESSAGES["pt"]
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [connectionStatus, setConnectionStatus] = useState("Desconectado")
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<{ text: string; type: string }[]>([])
  const [debugInfo, setDebugInfo] = useState("Pronto para conectar...")
  const [setupJson, setSetupJson] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isAudioStreaming, setIsAudioStreaming] = useState(false)
  const [isVideoStreaming, setIsVideoStreaming] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [userLang] = useState(detectUserLanguage)
  const [greetingShown, setGreetingShown] = useState(false)

  const clientRef = useRef<GeminiLiveAPI | null>(null)
  const audioStreamerRef = useRef<AudioStreamer | null>(null)
  const audioPlayerRef = useRef<AudioPlayer | null>(null)
  const videoStreamerRef = useRef<VideoStreamer | null>(null)
  const screenCaptureRef = useRef<ScreenCapture | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
  const preWhisperVolumeRef = useRef(80)

  useEffect(() => {
    if (settings.enableWhisper) {
      preWhisperVolumeRef.current = settings.volume > 25 ? settings.volume : 80
      updateVolume(25)
    } else if (settings.volume === 25 && !settings.enableWhisper) {
      updateVolume(preWhisperVolumeRef.current)
    }
  }, [settings.enableWhisper])

  const addMessage = useCallback((text: string, type: string) => {
    setMessages((prev) => [...prev, { text, type }])
  }, [])

  const updateDebug = useCallback((text: string) => {
    setDebugInfo(text)
  }, [])

  const handleVolumeChange = useCallback((level: number) => {
    const clamped = Math.max(1, Math.min(100, level))
    updateVolume(clamped)
    if (clamped <= 30) {
      clientRef.current?.setWhisperMode(true)
      setSettings((s) => ({ ...s, enableWhisper: true }))
    } else if (clamped > 30 && settings.enableWhisper) {
      clientRef.current?.setWhisperMode(false)
      setSettings((s) => ({ ...s, enableWhisper: false }))
    }
    addMessage(`[Volume ajustado para ${clamped}% pelo Psycho]`, "system")
  }, [addMessage, settings.enableWhisper])

  const handleWhisperToggle = useCallback((enabled: boolean) => {
    clientRef.current?.setWhisperMode(enabled)
    setSettings((s) => ({ ...s, enableWhisper: enabled }))
    if (enabled) {
      preWhisperVolumeRef.current = settings.volume
      updateVolume(25)
      addMessage("[Psycho ativou o modo sussurro 💜]", "system")
    } else {
      updateVolume(preWhisperVolumeRef.current)
      addMessage("[Psycho voltou ao volume normal]", "system")
    }
  }, [addMessage, settings.volume])

  const processCommand = useCallback((cmdName: string, args: string) => {
    const cmd = COMMANDS.find((c) => c.name === cmdName || c.aliases.includes(cmdName))
    if (!cmd) return

    addMessage(`/${cmd.name} ${args}`.trim(), "user")

    switch (cmd.name) {
      case "help":
        addMessage(getHelpText(userLang), "assistant")
        break
      case "clear":
        setMessages([])
        addMessage("[Conversa limpa]", "system")
        break
      case "whisper":
      case "volume":
        if (args.toLowerCase().includes("whisper") || args.toLowerCase().includes("sussurro") || args.toLowerCase().includes("susurro") || args.toLowerCase().includes("baixo")) {
          handleWhisperToggle(true)
        } else {
          const vol = parseInt(args)
          if (!isNaN(vol) && vol >= 1 && vol <= 100) {
            handleVolumeChange(vol)
          } else {
            addMessage("💡 Use `/volume whisper` para modo sussurro (25%) ou `/volume 50` para definir um valor específico (1-100).", "assistant")
          }
        }
        break
      default:
        addMessage(`Comando **/${cmd.name}** reconhecido!`, "assistant")
        break
    }
  }, [addMessage, userLang, handleWhisperToggle, handleVolumeChange])

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
          if (!message.data.finished) addMessage(message.data.text, "user-transcript")
          break

        case MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION:
          if (!message.data.finished) addMessage(message.data.text, "assistant")
          break

        case MultimodalLiveResponseType.SETUP_COMPLETE:
          addMessage("Psycho conectado! 💜", "system")
          if (clientRef.current?.lastSetupMessage) {
            setSetupJson(JSON.stringify(clientRef.current.lastSetupMessage, null, 2))
          }
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
          addMessage("[Interrompido]", "system")
          audioPlayerRef.current?.interrupt()
          break
      }
    },
    [addMessage, updateDebug]
  )

  const connect = useCallback(async () => {
    try {
      setConnectionStatus("Obtendo token...")
      const response = await fetch("/api/token", { method: "POST" })
      if (!response.ok) throw new Error(`Falha ao obter token: ${response.statusText}`)
      const { token } = await response.json()

      setConnectionStatus("Conectando ao Psycho...")
      const client = new GeminiLiveAPI(token, settings.model)

      client.baseSystemInstructions = settings.systemInstructions
      client.systemInstructions = settings.systemInstructions
      client.inputAudioTranscription = settings.enableInputTranscription
      client.outputAudioTranscription = settings.enableOutputTranscription
      client.googleGrounding = settings.enableGrounding
      client.responseModalities = ["AUDIO"]
      client.voiceName = settings.voice
      client.temperature = settings.temperature

      client.automaticActivityDetection = {
        disabled: settings.disableActivityDetection,
        silence_duration_ms: settings.silenceDuration,
        prefix_padding_ms: settings.prefixPadding,
        end_of_speech_sensitivity: settings.endSpeechSensitivity,
        start_of_speech_sensitivity: settings.startSpeechSensitivity,
      }
      client.activityHandling = settings.activityHandling

      client.addFunction(new SetVolumeTool(handleVolumeChange))
      client.addFunction(new SetWhisperModeTool(handleWhisperToggle))
      client.addFunction(new ShowNotificationTool())

      client.onReceiveResponse = handleMessage
      client.onError = (err) => {
        setConnectionStatus("Erro: " + err)
        updateDebug("Erro: " + err)
      }
      client.onClose = () => {
        setConnectionStatus("Desconectado")
        setIsConnected(false)
        disconnect()
      }
      client.onOpen = () => {
        setConnectionStatus("Conectado")
        setIsConnected(true)
        if (settings.enableWhisper) client.setWhisperMode(true)
        if (settings.enableThinking) client.setThinkingMode(true)
        if (!greetingShown) {
          addMessage(getGreeting(userLang), "assistant")
          setGreetingShown(true)
        }
      }

      clientRef.current = client
      client.connect()

      audioStreamerRef.current = new AudioStreamer(client)
      videoStreamerRef.current = new VideoStreamer(client)
      screenCaptureRef.current = new ScreenCapture(client)
      audioPlayerRef.current = new AudioPlayer()
      await audioPlayerRef.current.init()

      updateDebug("Psycho conectado com sucesso")
    } catch (error: any) {
      setConnectionStatus("Falha na conexão: " + error.message)
      updateDebug("Erro: " + error.message)
    }
  }, [settings, handleMessage, updateDebug, handleVolumeChange, handleWhisperToggle, greetingShown, userLang, addMessage])

  const disconnect = useCallback(() => {
    clientRef.current?.webSocket?.close()
    clientRef.current = null
    audioStreamerRef.current?.stop()
    videoStreamerRef.current?.stop()
    screenCaptureRef.current?.stop()
    audioPlayerRef.current?.destroy()
    setIsAudioStreaming(false)
    setIsVideoStreaming(false)
    setIsScreenSharing(false)
    setConnectionStatus("Desconectado")
    setIsConnected(false)
  }, [])

  const toggleAudio = useCallback(async () => {
    if (!isAudioStreaming) {
      try {
        if (audioStreamerRef.current) {
          await audioStreamerRef.current.start()
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
  }, [isAudioStreaming, addMessage])

  const toggleVideo = useCallback(async () => {
    if (!isVideoStreaming) {
      try {
        if (videoStreamerRef.current) {
          const video = await videoStreamerRef.current.start()
          if (videoPreviewRef.current && video) {
            videoPreviewRef.current.srcObject = video.srcObject
            videoPreviewRef.current.hidden = false
          }
          setIsVideoStreaming(true)
          addMessage("[Câmera ativada]", "system")
        }
      } catch (err: any) {
        addMessage("[Erro de vídeo: " + err.message + "]", "system")
      }
    } else {
      videoStreamerRef.current?.stop()
      setIsVideoStreaming(false)
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null
        videoPreviewRef.current.hidden = true
      }
      addMessage("[Câmera desativada]", "system")
    }
  }, [isVideoStreaming, addMessage])

  const toggleScreen = useCallback(async () => {
    if (!isScreenSharing) {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        addMessage("[Compartilhamento de tela não disponível: requer HTTPS ou localhost]", "system")
        return
      }
      try {
        if (screenCaptureRef.current) {
          const video = await screenCaptureRef.current.start()
          if (videoPreviewRef.current && video) {
            videoPreviewRef.current.srcObject = video.srcObject
            videoPreviewRef.current.hidden = false
          }
          setIsScreenSharing(true)
          addMessage("[Compartilhamento de tela ativado]", "system")
        }
      } catch (err: any) {
        addMessage("[Erro ao compartilhar tela: " + err.message + "]", "system")
      }
    } else {
      screenCaptureRef.current?.stop()
      setIsScreenSharing(false)
      if (!isVideoStreaming && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null
        videoPreviewRef.current.hidden = true
      }
      addMessage("[Compartilhamento de tela desativado]", "system")
    }
  }, [isScreenSharing, isVideoStreaming, addMessage])

  const updateVolume = useCallback((vol: number) => {
    audioPlayerRef.current?.setVolume(vol / 100)
    setSettings((s) => ({ ...s, volume: vol }))
  }, [])

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

      const c = clientRef.current
      if (!c?.connected) return

      switch (key) {
        case "enableWhisper":
          c.setWhisperMode(value as boolean)
          if (value as boolean) {
            handleWhisperToggle(true)
          } else {
            handleWhisperToggle(false)
          }
          break
        case "enableThinking":
          c.setThinkingMode(value as boolean)
          break
        case "voice":
          c.setVoice(value as string)
          break
      }
    },
    [handleWhisperToggle]
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
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={connect}
              disabled={isConnected}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-white text-psycho-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              {isConnected ? "Conectado" : "Conectar"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={disconnect}
              disabled={!isConnected}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-red-500/90 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors backdrop-blur-sm"
            >
              Desconectar
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Setup JSON (collapsible) */}
        <AnimatePresence>
          {setupJson && (
            <motion.details
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-violet-100 p-4"
            >
              <summary className="text-xs font-semibold uppercase tracking-wider text-violet-500 cursor-pointer select-none">
                Configuração da Sessão (JSON)
              </summary>
              <pre className="mt-2 text-xs text-violet-400 overflow-x-auto whitespace-pre-wrap">
                {setupJson}
              </pre>
            </motion.details>
          )}
        </AnimatePresence>

        {/* Chat */}
        <Chat messages={messages} onSend={sendMessage} />

        {/* Media Controls */}
        <MediaControls
          isAudioStreaming={isAudioStreaming}
          isVideoStreaming={isVideoStreaming}
          isScreenSharing={isScreenSharing}
          volume={settings.volume}
          connectionStatus={connectionStatus}
          isConnected={isConnected}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreen={toggleScreen}
          onVolumeChange={updateVolume}
          videoPreviewRef={videoPreviewRef}
        />

        {/* Debug */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-violet-100 p-4"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-500 mb-2">
            Diagnóstico
          </h3>
          <pre className="text-xs text-violet-400 font-mono">{debugInfo}</pre>
        </motion.div>
      </main>

      {/* Floating Buttons */}
      <FloatingButtons
        isAudioStreaming={isAudioStreaming}
        isConnected={isConnected}
        onToggleAudio={toggleAudio}
        onOpenSettings={() => setSettingsOpen(true)}
      />

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
