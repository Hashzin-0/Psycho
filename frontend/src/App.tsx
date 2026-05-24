import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GeminiLiveAPI, MultimodalLiveResponseType, type ResponseMessage } from "./lib/geminilive"
import { AudioStreamer, AudioPlayer, VideoStreamer, ScreenCapture } from "./lib/mediaUtils"
import { detectCommand, getHelpText } from "./lib/commands"
import { getHelpTextWellington } from "./lib/commandsWellington"
import { AmbientListener, type AmbientEvent } from "./lib/ambientListener"
import { getSessionContext, saveSessionSummary, createSession, saveMessage, getProfile, saveProfile, deleteProfile } from "./lib/knowledge"
import { VoiceProfile, type VoiceProfileData } from "./lib/voiceProfile"
import { TimerManager, type Timer } from "./lib/timerManager"
import { AGENTS, type AgentId, createAgentTools, getAgentCommands, getAgentPages } from "./lib/agentSystem"
import SettingsModal from "./components/SettingsModal"
import type { Settings } from "./components/SettingsModal"
import MediaControls from "./components/MediaControls"
import Chat from "./components/Chat"
import AgentHub from "./components/AgentHub"
import RecipeEncyclopedia from "./components/WellingtonPages/RecipeEncyclopedia"
import CookedRecipes from "./components/WellingtonPages/CookedRecipes"
import CustomRecipes from "./components/WellingtonPages/CustomRecipes"
import TimerPanel from "./components/WellingtonPages/TimerPanel"
import SessionReview from "./components/PsychoPages/SessionReview"
import MoodChart from "./components/PsychoPages/MoodChart"
import GoalsTracker from "./components/PsychoPages/GoalsTracker"
import TechniqueLib from "./components/PsychoPages/TechniqueLib"

const defaultSettings: Settings = {
  userName: "",
  voice: "Puck",
  temperature: 0.7,
  volume: 80,
  userLang: "pt",
  noiseCancellation: true,
  echoCancellation: true,
  autoGainControl: true,
  wakeWordEnabled: false,
  publicMode: false,
  publicModeSensitivity: 5,
  voiceFilterEnabled: false,
  voiceFilterThreshold: 0.78,
}

function detectUserLanguage(): string {
  const nav = navigator.language || navigator.languages?.[0] || "pt-BR"
  if (nav.startsWith("pt")) return "pt"
  if (nav.startsWith("es")) return "es"
  return "en"
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => ({
    ...defaultSettings,
    userLang: detectUserLanguage(),
  }))
  const [currentAgent, setCurrentAgent] = useState<AgentId | "hub">("hub")
  const [currentPage, setCurrentPage] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState("Desconectado")
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<{ text: string; type: string }[]>([])
  const [debugInfo, setDebugInfo] = useState("Pronto...")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isAudioStreaming, setIsAudioStreaming] = useState(false)
  const [greetingShown, setGreetingShown] = useState(false)
  const [isWakeListening, setIsWakeListening] = useState(false)
  const [isVideoStreaming, setIsVideoStreaming] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isAmbientListening, setIsAmbientListening] = useState(false)
  const [voiceProfileEnrolled, setVoiceProfileEnrolled] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState<{ textIndex: number; totalTexts: number; phase: "recording" | "processing" | "done" } | null>(null)
  const [isTestingTimbre, setIsTestingTimbre] = useState(false)
  const [testTimbreScore, setTestTimbreScore] = useState<number | null>(null)
  const [testTimbreMatch, setTestTimbreMatch] = useState<boolean | null>(null)
  const [timers, setTimers] = useState<Timer[]>([])

  const agent = currentAgent !== "hub" ? AGENTS[currentAgent] : null
  const agentPages = currentAgent !== "hub" ? getAgentPages(currentAgent) : []
  const agentCommands = currentAgent !== "hub" ? getAgentCommands(currentAgent) : []

  const voiceProfileRef = useRef<VoiceProfile>(new VoiceProfile())
  const clientRef = useRef<GeminiLiveAPI | null>(null)
  const audioStreamerRef = useRef<AudioStreamer | null>(null)
  const audioPlayerRef = useRef<AudioPlayer | null>(null)
  const videoStreamerRef = useRef<VideoStreamer | null>(null)
  const screenCaptureRef = useRef<ScreenCapture | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
  const ambientListenerRef = useRef<AmbientListener | null>(null)
  const lastOutputRef = useRef("")
  const prefsChangedRef = useRef(false)
  const wakeRecognitionRef = useRef<SpeechRecognition | null>(null)
  const wakePendingTextRef = useRef("")
  const isConnectingRef = useRef(false)
  const connectRef = useRef<() => Promise<void> | undefined>(undefined)
  const timerManagerRef = useRef<TimerManager>(new TimerManager())

  const lang = settings.userLang as "pt" | "en" | "es"

  const addMessage = useCallback((text: string, type: string) => {
    setMessages((prev) => [...prev, { text, type }])
  }, [])

  const updateDebug = useCallback((text: string) => {
    setDebugInfo(text)
  }, [])

  // Timer management
  useEffect(() => {
    const tm = timerManagerRef.current
    tm.setOnTick((t) => {
      setTimers((prev) => {
        const existing = prev.findIndex((x) => x.id === t.id)
        if (existing >= 0) {
          const copy = [...prev]
          copy[existing] = t
          return copy
        }
        return [...prev, t]
      })
    })
    tm.setOnComplete((t) => {
      setTimers((prev) => prev.map((x) => (x.id === t.id ? t : x)))
    })

    const handler = (e: CustomEvent) => {
      addMessage(`⏰ **${e.detail.label}** — ${e.detail.minutes} minutos acabaram!`, "assistant")
    }
    window.addEventListener("timer-complete", handler as EventListener)
    return () => {
      window.removeEventListener("timer-complete", handler as EventListener)
      tm.clearAll()
    }
  }, [addMessage])

  const handleSetTimer = useCallback((minutes: number, label: string): string => {
    const id = timerManagerRef.current.setTimer(minutes, label)
    const timeStr = minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 > 0 ? ` ${minutes % 60}min` : ""}` : `${minutes}min`
    addMessage(`⏱️ Timer de **${timeStr}** definido para **${label}** (id: ${id})`, "system")
    return id
  }, [addMessage])

  const handleCancelTimer = useCallback((id: string): boolean => {
    const ok = timerManagerRef.current.cancelTimer(id)
    if (ok) {
      addMessage(`⏱️ Timer **${id}** cancelado`, "system")
      setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, active: false } : t)))
    }
    return ok
  }, [addMessage])

  const handleLogCooked = useCallback((title: string, notes: string, rating: number) => {
    import("./lib/knowledge").then(({ logCookedRecipe }) => {
      logCookedRecipe({
        recipe_title: title,
        notes,
        rating,
        session_id: sessionId || undefined,
      })
    })
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating)
    addMessage(`🍽️ Receita registrada: **${title}** ${rating > 0 ? stars : ""}${notes ? ` — ${notes}` : ""}`, "system")
  }, [addMessage, sessionId])

  // Volume controls
  const handleVolumeChange = useCallback((level: number) => {
    const clamped = Math.max(1, Math.min(100, level))
    audioPlayerRef.current?.setVolume(clamped / 100)
    setSettings((s) => ({ ...s, volume: clamped }))
    addMessage(`[Volume ajustado para ${clamped}%]`, "system")
  }, [addMessage])

  const handleToneChange = useCallback((tone: string) => {
    const volumes: Record<string, number> = { gentle: 25, calm: 40, soothing: 25, warm: 60, natural: 80 }
    const vol = volumes[tone] || 80
    audioPlayerRef.current?.setVolume(vol / 100)
    setSettings((s) => ({ ...s, volume: vol }))
    const labels: Record<string, string> = { gentle: "suave", calm: "calmo", soothing: "sereno", warm: "caloroso", natural: "natural" }
    addMessage(`[Tom ajustado para ${labels[tone] || tone}, volume ${vol}%]`, "system")
  }, [addMessage])

  const handleVoiceChange = useCallback((voice: string) => {
    setSettings((s) => ({ ...s, voice }))
    clientRef.current?.setVoice(voice)
    addMessage(`[Voz alterada para ${voice}]`, "system")
  }, [addMessage])

  const handleLanguageChange = useCallback((lang: string) => {
    setSettings((s) => ({ ...s, userLang: lang }))
    addMessage(`[Idioma alterado para ${lang === "pt" ? "Português" : lang === "en" ? "English" : "Español"}]`, "system")
  }, [addMessage])

  const handleNotification = useCallback((message: string, emoji?: string) => {
    window.dispatchEvent(new CustomEvent("psycho-notification", { detail: { message, emoji: emoji || "💜" } }))
  }, [])

  const toggleVideo = useCallback(async () => {
    if (!isVideoStreaming) {
      try {
        if (!videoStreamerRef.current && clientRef.current) {
          videoStreamerRef.current = new VideoStreamer(clientRef.current)
        }
        if (videoStreamerRef.current) {
          const videoEl = await videoStreamerRef.current.start({ fps: 2, quality: 0.6 })
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = videoEl?.srcObject || null
            videoPreviewRef.current.hidden = false
          }
          setIsVideoStreaming(true)
          addMessage(`[Câmera ativada — ${agent?.name || "Assistente"} pode ver você]`, "system")
        }
      } catch (err: any) {
        addMessage("[Erro ao ativar câmera: " + err.message + "]", "system")
      }
    } else {
      videoStreamerRef.current?.stop()
      videoStreamerRef.current = null
      if (videoPreviewRef.current) videoPreviewRef.current.hidden = true
      setIsVideoStreaming(false)
      addMessage("[Câmera desativada]", "system")
    }
  }, [isVideoStreaming, addMessage, agent])

  const toggleScreen = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        if (!screenCaptureRef.current && clientRef.current) {
          screenCaptureRef.current = new ScreenCapture(clientRef.current)
        }
        if (screenCaptureRef.current) {
          const videoEl = await screenCaptureRef.current.start({ fps: 1, quality: 0.6 })
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = videoEl?.srcObject || null
            videoPreviewRef.current.hidden = false
          }
          setIsScreenSharing(true)
          addMessage(`[Tela compartilhada — ${agent?.name || "Assistente"} pode ver sua tela]`, "system")
        }
      } catch (err: any) {
        addMessage("[Erro ao compartilhar tela: " + err.message + "]", "system")
      }
    } else {
      screenCaptureRef.current?.stop()
      screenCaptureRef.current = null
      if (videoPreviewRef.current) videoPreviewRef.current.hidden = true
      setIsScreenSharing(false)
      addMessage("[Compartilhamento de tela encerrado]", "system")
    }
  }, [isScreenSharing, addMessage, agent])

  const processCommand = useCallback((cmdName: string, args: string) => {
    const cmd = agentCommands.find((c) => c.name === cmdName || c.aliases.includes(cmdName))
    if (!cmd) return

    addMessage(`/${cmd.name} ${args}`.trim(), "user")

    switch (cmd.name) {
      case "help":
        const helpText = currentAgent === "wellington" ? getHelpTextWellington(settings.userLang) : getHelpText(settings.userLang)
        addMessage(helpText, "assistant")
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
      case "timer":
        const parts = args.split(" ")
        const mins = parseInt(parts[0])
        if (!isNaN(mins) && mins > 0) {
          const label = parts.slice(1).join(" ") || "Timer"
          handleSetTimer(mins, label)
        } else {
          addMessage("💡 Use `/timer 15 batata` para 15 minutos de batata.", "assistant")
        }
        break
      default:
        addMessage(`Comando **/${cmd.name}** reconhecido!`, "assistant")
        break
    }
  }, [agentCommands, addMessage, handleVolumeChange, handleSetTimer, settings.userLang, currentAgent])

  const handleCommand = useCallback((cmdName: string) => {
    processCommand(cmdName, "")
  }, [processCommand])

  // Ambient
  const handleAmbientTrigger = useCallback((event: AmbientEvent) => {
    if (!clientRef.current?.connected || currentAgent !== "psycho") return
    addMessage(`[Ambiente: ${event.label}]`, "system")
    clientRef.current.sendTextMessage(
      `[Contexto ambiental detectado: ${event.label} (confiança: ${Math.round(event.confidence * 100)}%)] ` +
      `Inicie a conversa de forma natural e acolhedora.`
    )
  }, [addMessage, currentAgent])

  const toggleAmbientListening = useCallback(() => {
    if (!isAmbientListening) {
      if (!ambientListenerRef.current) {
        ambientListenerRef.current = new AmbientListener(handleAmbientTrigger)
      }
      ambientListenerRef.current.start()
      setIsAmbientListening(true)
      addMessage("[Modo ambiente ativado]", "system")
    } else {
      ambientListenerRef.current?.stop()
      setIsAmbientListening(false)
      addMessage("[Modo ambiente desativado]", "system")
    }
  }, [isAmbientListening, handleAmbientTrigger, addMessage])

  // Message handler
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
        case MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION:
          if (message.data.finished && message.data.text) {
            addMessage(message.data.text, "assistant")
          }
          break
        case MultimodalLiveResponseType.SETUP_COMPLETE:
          addMessage(`${agent?.emoji || "💜"} ${agent?.name || "Assistente"} conectado!`, "system")
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
        case MultimodalLiveResponseType.INTERRUPTED:
          audioPlayerRef.current?.interrupt()
          break
        case MultimodalLiveResponseType.SESSION_RESUMPTION_UPDATE:
          if (message.data?.newHandle) {
            console.debug("Session resumption handle:", message.data.newHandle)
          }
          break
      }
    },
    [addMessage, updateDebug, agent]
  )

  // Wake word detection (multi-agent)
  const stopWakeListening = useCallback(() => {
    const rec = wakeRecognitionRef.current
    if (rec) {
      rec.onresult = null
      rec.onerror = null
      rec.onend = null
      try { rec.abort() } catch {}
      wakeRecognitionRef.current = null
    }
    setIsWakeListening(false)
  }, [])

  const startWakeListening = useCallback(() => {
    stopWakeListening()
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "pt-BR"
    recognition.maxAlternatives = 3

    recognition.onresult = (event) => {
      const fullText = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .toLowerCase()

      // Check each agent's wake words
      for (const [agentId, agentCfg] of Object.entries(AGENTS)) {
        const found = agentCfg.wakeWords.find((w) => fullText.includes(w))
        if (!found) continue

        const allText = Array.from(event.results).map((r) => r[0].transcript).join(" ")
        const idx = allText.toLowerCase().indexOf(found)
        const after = allText.slice(idx + found.length).replace(/^[,:\s]+/, "").trim()
        wakePendingTextRef.current = after

        stopWakeListening()
        setCurrentAgent(agentId as AgentId)
        connectRef.current?.()
        return
      }
    }

    recognition.onerror = () => stopWakeListening()
    recognition.onend = () => {
      if (wakeRecognitionRef.current && settings.wakeWordEnabled && !isConnected) {
        try { recognition.start() } catch {}
      }
    }

    recognition.start()
    wakeRecognitionRef.current = recognition
    setIsWakeListening(true)
  }, [stopWakeListening, settings.wakeWordEnabled, isConnected])

  // Audio streaming
  const startAudioStreaming = useCallback(async () => {
    try {
      if (!audioStreamerRef.current && clientRef.current) {
        audioStreamerRef.current = new AudioStreamer(clientRef.current)
      }
      if (audioStreamerRef.current) {
        await audioStreamerRef.current.start({
          publicMode: settings.publicMode,
          publicModeSensitivity: settings.publicModeSensitivity,
          constraints: {
            noiseSuppression: settings.noiseCancellation,
            echoCancellation: settings.echoCancellation,
            autoGainControl: settings.autoGainControl,
          },
        })
        if (voiceProfileRef.current.isEnrolled) {
          audioStreamerRef.current?.setVoiceProfile(voiceProfileRef.current)
          audioStreamerRef.current?.setVoiceFilter(settings.voiceFilterEnabled, settings.voiceFilterThreshold)
        }
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
            publicMode: settings.publicMode,
            publicModeSensitivity: settings.publicModeSensitivity,
            constraints: {
              noiseSuppression: settings.noiseCancellation,
              echoCancellation: settings.echoCancellation,
              autoGainControl: settings.autoGainControl,
            },
          })
          if (voiceProfileRef.current.isEnrolled) {
            audioStreamerRef.current?.setVoiceProfile(voiceProfileRef.current)
            audioStreamerRef.current?.setVoiceFilter(settings.voiceFilterEnabled, settings.voiceFilterThreshold)
          }
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

  // Connect to Gemini
  const connect = useCallback(async () => {
    if (clientRef.current || isConnectingRef.current || !agent) return
    isConnectingRef.current = true
    stopWakeListening()
    try {
      setConnectionStatus("Obtendo token...")
      const response = await fetch("/api/token", { method: "POST" })
      if (!response.ok) throw new Error(`Falha ao obter token: ${response.statusText}`)
      const { token } = await response.json()

      setConnectionStatus(`Conectando ao ${agent.name}...`)
      const client = new GeminiLiveAPI(token, "gemini-3.1-flash-live-preview")

      setConnectionStatus("Carregando memória...")
      const nameContext = settings.userName.trim()
        ? `\n\nThe user's name is "${settings.userName.trim()}". Always address them by this name naturally.`
        : ""

      let memoryContext = ""
      try {
        const ctx = await getSessionContext(currentAgent === "hub" ? "psycho" : currentAgent)
        if (ctx.recent_sessions?.length || ctx.mood_trend?.length || ctx.active_goals?.length) {
          memoryContext = "\n\n## MEMORY CONTEXT\n"
          if (ctx.recent_sessions?.length) {
            memoryContext += "\nRecent sessions:\n" + ctx.recent_sessions
              .slice(0, 3)
              .map((s: any) => `- ${s.title}: ${s.summary || "No summary"}`)
              .join("\n")
          }
          if (ctx.mood_trend?.length && currentAgent === "psycho") {
            memoryContext += "\n\nRecent mood entries:\n" + ctx.mood_trend
              .slice(0, 5)
              .map((m: any) => `- ${m.mood} (intensity: ${m.intensity}/10)`)
              .join("\n")
          }
          if (ctx.active_goals?.length && currentAgent === "psycho") {
            memoryContext += "\n\nActive goals:\n" + ctx.active_goals
              .map((g: any) => `- "${g.title}" (streak: ${g.current_streak}/${g.target_days} days)`)
              .join("\n")
          }
          memoryContext += "\n\nUse this context for continuity."
        }
      } catch {}

      client.baseSystemInstructions = agent.systemPrompt
      client.systemInstructions = agent.systemPrompt + nameContext + memoryContext
      client.inputAudioTranscription = true
      client.outputAudioTranscription = true
      client.responseModalities = ["AUDIO"]
      client.voiceName = settings.voice
      client.temperature = settings.temperature

      if (settings.publicMode) client.setPublicMode(true)

      // Register agent-specific tools
      const toolCallbacks = {
        onVolumeChange: handleVolumeChange,
        onToneChange: handleToneChange,
        onToggleAudio: toggleAudio,
        onVoiceChange: handleVoiceChange,
        onToggleVideo: toggleVideo,
        onToggleScreen: toggleScreen,
        onOpenSettings: () => setSettingsOpen(true),
        onClearChat: () => { setMessages([]); addMessage("[Conversa limpa]", "system") },
        onCommand: handleCommand,
        onLanguageChange: handleLanguageChange,
        onNotification: handleNotification,
        onSetTimer: handleSetTimer,
        onCancelTimer: handleCancelTimer,
        onLogCooked: handleLogCooked,
      }
      const tools = createAgentTools(currentAgent as AgentId, toolCallbacks)
      tools.forEach((t) => client.addFunction(t))

      client.onReceiveResponse = handleMessage
      client.onError = (err) => {
        setConnectionStatus("Erro: " + err)
        updateDebug("Erro: " + err)
        isConnectingRef.current = false
      }
      client.onClose = () => {
        setConnectionStatus("Desconectado")
        setIsConnected(false)
        setIsAudioStreaming(false)
        audioStreamerRef.current = null
        clientRef.current = null
        isConnectingRef.current = false
      }
      client.onOpen = async () => {
        setConnectionStatus("Conectado")
        setIsConnected(true)
        isConnectingRef.current = false

        const sessId = crypto.randomUUID()
        setSessionId(sessId)
        try { await createSession("Sessão " + new Date().toLocaleDateString(), currentAgent) } catch {}

        const pending = wakePendingTextRef.current
        wakePendingTextRef.current = ""
        if (pending) {
          addMessage(pending, "user")
          client.sendTextMessage(pending)
        }

        if (!greetingShown) {
          const greet = agent.greetingMessages[lang] || agent.greetingMessages["pt"]
          addMessage(greet, "assistant")
          setGreetingShown(true)
        }
      }

      client.onSetupComplete = () => {
        startAudioStreaming()
      }

      clientRef.current = client
      client.connect()

      audioPlayerRef.current = new AudioPlayer()
      await audioPlayerRef.current.init()

      updateDebug(`${agent.name} conectado`)
    } catch (error: any) {
      setConnectionStatus("Falha: " + error.message)
      updateDebug("Erro: " + error.message)
      isConnectingRef.current = false
    }
  }, [settings, agent, currentAgent, handleMessage, updateDebug, handleVolumeChange, handleToneChange, handleVoiceChange, handleCommand, handleLanguageChange, handleNotification, handleSetTimer, handleCancelTimer, handleLogCooked, greetingShown, addMessage, stopWakeListening, toggleAudio, toggleVideo, toggleScreen, lang])

  connectRef.current = connect

  const disconnect = useCallback(() => {
    const currentSessionId = sessionId
    if (currentSessionId && messages.length > 2) {
      const summaryText = messages
        .filter((m) => m.type === "user" || m.type === "assistant")
        .slice(-10)
        .map((m) => `${m.type === "user" ? "User" : agent?.name || "Assistant"}: ${m.text.slice(0, 200)}`)
        .join("\n")
      saveSessionSummary(currentSessionId, summaryText)
    }

    clientRef.current?.webSocket?.close()
    clientRef.current = null
    audioStreamerRef.current?.stop()
    audioStreamerRef.current = null
    videoStreamerRef.current?.stop()
    videoStreamerRef.current = null
    screenCaptureRef.current?.stop()
    screenCaptureRef.current = null
    audioPlayerRef.current?.destroy()
    setIsAudioStreaming(false)
    setIsVideoStreaming(false)
    setIsScreenSharing(false)
    setConnectionStatus("Desconectado")
    setIsConnected(false)
    setSessionId(null)
  }, [sessionId, messages, agent])

  const sendMessage = useCallback(
    (text: string) => {
      if (!clientRef.current) {
        addMessage(`[Conecte-se ao ${agent?.name || "assistente"} primeiro]`, "system")
        return
      }

      const cmd = detectCommand(text)
      if (cmd) {
        processCommand(cmd.command.name, cmd.args)
        return
      }

      addMessage(text, "user")
      audioPlayerRef.current?.interrupt()
      clientRef.current.sendTextMessage(text)
    },
    [addMessage, processCommand, agent]
  )

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
      if (key === "voice") {
        const c = clientRef.current
        if (c?.connected) c.setVoice(value as string)
      }
      if (key === "publicMode") {
        const c = clientRef.current
        if (c?.connected) c.setPublicMode(value as boolean)
        audioStreamerRef.current?.setPublicMode(value as boolean, settings.publicModeSensitivity)
      }
      if (key === "publicModeSensitivity" && settings.publicMode) {
        audioStreamerRef.current?.setPublicMode(true, value as number)
      }
      if (key === "voiceFilterEnabled" && voiceProfileEnrolled) {
        audioStreamerRef.current?.setVoiceFilter(value as boolean, settings.voiceFilterThreshold)
      }
      if (key === "voiceFilterThreshold" && voiceProfileEnrolled) {
        audioStreamerRef.current?.setVoiceFilter(settings.voiceFilterEnabled, value as number)
      }
      if (["noiseCancellation", "echoCancellation", "autoGainControl"].includes(key as string)) {
        prefsChangedRef.current = true
      }
    },
    [settings.publicMode, voiceProfileEnrolled]
  )

  // Notifications
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      addMessage(`${e.detail.emoji || "💜"} ${e.detail.message}`, "assistant")
    }
    window.addEventListener("psycho-notification", handler as EventListener)
    return () => window.removeEventListener("psycho-notification", handler as EventListener)
  }, [addMessage])

  // Voice profile
  useEffect(() => {
    getProfile().then((data) => {
      if (data?.profile_data) {
        voiceProfileRef.current.load(data.profile_data as VoiceProfileData)
        setVoiceProfileEnrolled(true)
      }
    })
  }, [])

  // Wake word effect
  useEffect(() => {
    if (settings.wakeWordEnabled && !isConnected) {
      startWakeListening()
    } else {
      stopWakeListening()
    }
    return () => stopWakeListening()
  }, [settings.wakeWordEnabled, isConnected, startWakeListening, stopWakeListening])

  // Voice training
  const handleTrainVoice = useCallback(async () => {
    if (isTraining) return
    setIsTraining(true)
    setTrainingProgress({ textIndex: 0, totalTexts: 5, phase: "recording" })
    try {
      await voiceProfileRef.current.enroll((textIndex: number, phase: "recording" | "processing" | "done") => {
        setTrainingProgress({ textIndex, totalTexts: 5, phase })
      })
      setVoiceProfileEnrolled(true)
      const profileData = voiceProfileRef.current.data
      if (profileData) await saveProfile(profileData)
      addMessage("[Perfil de voz treinado e salvo!]", "system")
      if (settings.publicMode) {
        audioStreamerRef.current?.setVoiceProfile(voiceProfileRef.current)
        audioStreamerRef.current?.setVoiceFilter(true, settings.voiceFilterThreshold)
      }
    } catch (err: any) {
      addMessage("[Erro ao treinar voz: " + err.message + "]", "system")
    }
    setIsTraining(false)
    setTrainingProgress(null)
  }, [isTraining, settings.publicMode, settings.voiceFilterThreshold, addMessage])

  const handleResetVoice = useCallback(async () => {
    voiceProfileRef.current.reset()
    setVoiceProfileEnrolled(false)
    await deleteProfile()
    audioStreamerRef.current?.setVoiceProfile(null)
    audioStreamerRef.current?.setVoiceFilter(false)
    addMessage("[Perfil de voz removido]", "system")
  }, [addMessage])

  const handleTestTimbre = useCallback(async () => {
    if (isTestingTimbre || !voiceProfileRef.current.isEnrolled) return
    setIsTestingTimbre(true)
    setTestTimbreScore(null)
    setTestTimbreMatch(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      const audioContext = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      const bufferLength = analyser.frequencyBinCount
      const freqData = new Float32Array(bufferLength) as Float32Array<ArrayBuffer>
      let totalScore = 0
      let count = 0
      const steps = 5000 / 200
      for (let i = 0; i < steps; i++) {
        await new Promise((r) => setTimeout(r, 200))
        analyser.getFloatFrequencyData(freqData)
        const score = voiceProfileRef.current.getSimilarity(freqData)
        totalScore += score
        count++
        setTestTimbreScore(score)
        setTestTimbreMatch(score >= settings.voiceFilterThreshold)
      }
      stream.getTracks().forEach((t) => t.stop())
      audioContext.close()
    } catch (err: any) {
      addMessage("[Erro ao testar timbre: " + err.message + "]", "system")
    }
    setIsTestingTimbre(false)
  }, [isTestingTimbre, settings.voiceFilterThreshold, addMessage])

  // Render hub
  if (currentAgent === "hub") {
    return (
      <AgentHub
        onSelectAgent={(id) => {
          setCurrentAgent(id)
          setGreetingShown(false)
          setMessages([])
        }}
      />
    )
  }

  if (!agent) return null

  // Sidebar page component resolver
  const renderSidebarPage = (pageId: string) => {
    const props = { lang: settings.userLang, timers, onRemoveTimer: handleCancelTimer }
    switch (pageId) {
      case "encyclopedia": return <RecipeEncyclopedia lang={settings.userLang} />
      case "cooked": return <CookedRecipes lang={settings.userLang} />
      case "custom": return <CustomRecipes lang={settings.userLang} />
      case "timers": return <TimerPanel {...props} />
      case "sessions": return <SessionReview lang={settings.userLang} />
      case "mood": return <MoodChart lang={settings.userLang} />
      case "goals": return <GoalsTracker lang={settings.userLang} />
      case "techniques": return <TechniqueLib lang={settings.userLang} />
      default: return null
    }
  }

  const isPsycho = currentAgent === "psycho"
  const bgGradient = isPsycho ? "from-violet-50 via-white to-indigo-50" : "from-amber-50 via-white to-orange-50"
  const headerGradient = agent.primaryGradient
  const agentColor = isPsycho ? "psycho" : "warm"
  const accentRing = isPsycho ? "focus:ring-psycho-500/50" : "focus:ring-orange-500/50"

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient}`}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${headerGradient} text-white px-6 py-4 shadow-lg relative overflow-hidden`}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        <div className="relative z-10 flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-lg shadow-inner"
            >
              {agent.emoji}
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
                <button
                  onClick={() => { disconnect(); setCurrentAgent("hub") }}
                  className="text-xs px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white/70 transition-colors"
                  title="Voltar ao hub"
                >
                  📋
                </button>
              </div>
              <p className={`text-sm ${isPsycho ? "text-violet-200" : "text-amber-200"} font-light`}>
                {agent.subtitle[lang] || agent.subtitle["pt"]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSettingsOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors text-sm"
            >
              ⚙️
            </motion.button>
            {!isConnected ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={connect}
                className={`px-4 py-2 rounded-xl text-sm font-medium bg-white ${isPsycho ? "text-psycho-700 hover:bg-violet-50" : "text-orange-700 hover:bg-orange-50"} shadow-sm transition-colors`}
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
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-4">
          {/* Chat + Controls */}
          <div className="flex-1 space-y-4 min-w-0">
            <Chat
              messages={messages}
              onSend={sendMessage}
              agentEmoji={agent.emoji}
              agentName={agent.name}
              agentColor={agentColor}
            />
            <MediaControls
              isAudioStreaming={isAudioStreaming}
              isVideoStreaming={isVideoStreaming}
              isScreenSharing={isScreenSharing}
              volume={settings.volume}
              connectionStatus={isWakeListening ? `🎤 Aguardando '${agent.name}'...` : connectionStatus}
              isConnected={isConnected}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onToggleScreen={toggleScreen}
              onVolumeChange={handleVolumeChange}
              videoPreviewRef={videoPreviewRef}
              agentColor={agentColor}
            />
          </div>

          {/* Sidebar pages */}
          {agentPages.length > 0 && (
            <div className="w-80 flex-shrink-0 hidden lg:block space-y-4">
              <div className="flex gap-1.5 flex-wrap">
                {agentPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPage(currentPage === page.id ? null : page.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                      currentPage === page.id
                        ? isPsycho
                          ? "bg-psycho-100 text-psycho-700 border-psycho-300"
                          : "bg-orange-100 text-orange-700 border-orange-300"
                        : "bg-white/70 text-slate-500 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {page.label[lang] || page.label["pt"]}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {currentPage && (
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                  >
                    {renderSidebarPage(currentPage)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal
            open={settingsOpen}
            settings={settings}
            onClose={() => setSettingsOpen(false)}
            onChange={updateSetting}
            voiceProfileEnrolled={voiceProfileEnrolled}
            isTraining={isTraining}
            trainingProgress={trainingProgress}
            onTrainVoice={handleTrainVoice}
            onResetVoice={handleResetVoice}
            onTestTimbre={handleTestTimbre}
            isTestingTimbre={isTestingTimbre}
            testTimbreScore={testTimbreScore}
            testTimbreMatch={testTimbreMatch}
            agentName={agent.name}
            agentEmoji={agent.emoji}
            agentColor={agentColor}
          />
        )}
      </AnimatePresence>
    </div>
  )
}


