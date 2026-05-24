import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GeminiLiveAPI, MultimodalLiveResponseType, type ResponseMessage } from "./lib/geminilive"
import { AudioStreamer, AudioPlayer, VideoStreamer, ScreenCapture } from "./lib/mediaUtils"
import {
  SetVolumeTool, SetWhisperModeTool, SetVoiceToneTool,
  ToggleMicrophoneTool, SetVoiceTool,
  ToggleCameraTool, ToggleScreenShareTool,
  OpenSettingsTool, ClearChatTool, RunCommandTool,
  SetLanguageTool, ShowNotificationTool,
} from "./lib/tools"
import { SYSTEM_PROMPT, GREETING_MESSAGES } from "./lib/systemPrompt"
import { detectCommand, COMMANDS, getHelpText } from "./lib/commands"
import { AmbientListener, type AmbientEvent } from "./lib/ambientListener"
import { getSessionContext, saveSessionSummary, createSession, saveMessage, getProfile, saveProfile, deleteProfile } from "./lib/knowledge"
import { VoiceProfile, type VoiceProfileData } from "./lib/voiceProfile"
import SettingsModal from "./components/SettingsModal"
import type { Settings } from "./components/SettingsModal"
import MediaControls from "./components/MediaControls"
import Chat from "./components/Chat"

const WAKE_WORDS = ["psycho", "psico", "psyco"]

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

  const handleToneChange = useCallback((tone: string) => {
    const volumes: Record<string, number> = { gentle: 25, calm: 40, soothing: 25, warm: 60, natural: 80 }
    const vol = volumes[tone] || 80
    audioPlayerRef.current?.setVolume(vol / 100)
    setSettings((s) => ({ ...s, volume: vol }))
    const labels: Record<string, string> = { gentle: "suave", calm: "calmo", soothing: "sereno", warm: "caloroso", natural: "natural" }
    addMessage(`[Psycho ajustou o tom para ${labels[tone] || tone} e volume para ${vol}%]`, "system")
  }, [addMessage])

  const handleWhisperChange = useCallback((enabled: boolean) => {
    const vol = enabled ? 25 : settings.volume
    audioPlayerRef.current?.setVolume(vol / 100)
    clientRef.current?.setWhisperMode(enabled)
    setSettings((s) => ({ ...s, volume: vol }))
    addMessage(enabled ? "[Modo sussurro ativado]" : "[Modo sussurro desativado]", "system")
  }, [addMessage, settings.volume])

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
          addMessage("[Câmera ativada — Psycho pode ver você]", "system")
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
  }, [isVideoStreaming, addMessage])

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
          addMessage("[Tela compartilhada — Psycho pode ver sua tela]", "system")
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
  }, [isScreenSharing, addMessage])

  const handleVoiceChange = useCallback((voice: string) => {
    setSettings((s) => ({ ...s, voice }))
    clientRef.current?.setVoice(voice)
    addMessage(`[Voz alterada para ${voice}]`, "system")
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

  const handleCommand = useCallback((cmdName: string) => {
    processCommand(cmdName, "")
  }, [processCommand])

  const handleLanguageChange = useCallback((lang: string) => {
    setSettings((s) => ({ ...s, userLang: lang }))
    addMessage(`[Idioma alterado para ${lang === "pt" ? "Português" : lang === "en" ? "English" : "Español"}]`, "system")
  }, [addMessage])

  const handleNotification = useCallback((message: string, emoji?: string) => {
    window.dispatchEvent(new CustomEvent("psycho-notification", { detail: { message, emoji: emoji || "💜" } }))
  }, [])

  const handleAmbientTrigger = useCallback((event: AmbientEvent) => {
    if (!clientRef.current?.connected) return
    addMessage(`[Ambiente: ${event.label}]`, "system")
    clientRef.current.sendTextMessage(
      `[Contexto ambiental detectado: ${event.label} (confiança: ${Math.round(event.confidence * 100)}%)] ` +
      `Inicie a conversa de forma natural e acolhedora, como se você tivesse percebido algo no ambiente. ` +
      `Não mencione explicitamente que foi uma detecção automática — apenas reaja com empatia ao contexto percebido.`
    )
  }, [addMessage])

  const toggleAmbientListening = useCallback(() => {
    if (!isAmbientListening) {
      if (!ambientListenerRef.current) {
        ambientListenerRef.current = new AmbientListener(handleAmbientTrigger)
      }
      ambientListenerRef.current.start()
      setIsAmbientListening(true)
      addMessage("[Modo ambiente ativado — Psycho pode perceber suspiros, silêncio e emoções]", "system")
    } else {
      ambientListenerRef.current?.stop()
      setIsAmbientListening(false)
      addMessage("[Modo ambiente desativado]", "system")
    }
  }, [isAmbientListening, handleAmbientTrigger, addMessage])

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

      const found = WAKE_WORDS.find((w) => fullText.includes(w))
      if (!found) return

      const allText = Array.from(event.results).map((r) => r[0].transcript).join(" ")
      const idx = allText.toLowerCase().indexOf(found)
      const after = allText.slice(idx + found.length).replace(/^[,:\s]+/, "").trim()
      wakePendingTextRef.current = after
      stopWakeListening()
      connectRef.current?.()
    }

    recognition.onerror = () => {
      stopWakeListening()
    }

    recognition.onend = () => {
      if (wakeRecognitionRef.current && settings.wakeWordEnabled && !isConnected) {
        try { recognition.start() } catch {}
      }
    }

    recognition.start()
    wakeRecognitionRef.current = recognition
    setIsWakeListening(true)
  }, [stopWakeListening, settings.wakeWordEnabled, isConnected])

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

  const connect = useCallback(async () => {
    if (clientRef.current || isConnectingRef.current) return
    isConnectingRef.current = true
    stopWakeListening()
    try {
      setConnectionStatus("Obtendo token...")
      const response = await fetch("/api/token", { method: "POST" })
      if (!response.ok) throw new Error(`Falha ao obter token: ${response.statusText}`)
      const { token } = await response.json()

      setConnectionStatus("Conectando ao Psycho...")
      const client = new GeminiLiveAPI(token, "gemini-3.1-flash-live-preview")

      setConnectionStatus("Carregando memória...")
      const nameContext = settings.userName.trim()
        ? `\n\nThe user's name is "${settings.userName.trim()}". Always address them by this name naturally — use it in greetings, questions, and throughout the conversation. Respond as if you know them personally.`
        : ""

      let memoryContext = ""
      try {
        const ctx = await getSessionContext()
        if (ctx.recent_sessions?.length || ctx.mood_trend?.length || ctx.active_goals?.length) {
          memoryContext = "\n\n## MEMORY CONTEXT (from previous sessions)\n"
          if (ctx.recent_sessions?.length) {
            memoryContext += "\nRecent sessions:\n" + ctx.recent_sessions
              .slice(0, 3)
              .map((s: any) => `- ${s.title}: ${s.summary || "No summary"}`)
              .join("\n")
          }
          if (ctx.mood_trend?.length) {
            memoryContext += "\n\nRecent mood entries (last 5):\n" + ctx.mood_trend
              .slice(0, 5)
              .map((m: any) => `- ${m.mood} (intensity: ${m.intensity}/10)`)
              .join("\n")
          }
          if (ctx.active_goals?.length) {
            memoryContext += "\n\nActive goals:\n" + ctx.active_goals
              .map((g: any) => `- "${g.title}" (streak: ${g.current_streak}/${g.target_days} days)`)
              .join("\n")
          }
          memoryContext += "\n\nUse this context to provide continuity. Reference previous conversations naturally without explicitly saying 'based on your history'."
        }
      } catch {}

      client.baseSystemInstructions = SYSTEM_PROMPT
      client.systemInstructions = SYSTEM_PROMPT + nameContext + memoryContext
      client.inputAudioTranscription = true
      client.outputAudioTranscription = true
      client.responseModalities = ["AUDIO"]
      client.voiceName = settings.voice
      client.temperature = settings.temperature

      if (settings.publicMode) {
        client.setPublicMode(true)
      }

      client.addFunction(new SetVolumeTool(handleVolumeChange))
      client.addFunction(new SetWhisperModeTool(handleWhisperChange))
      client.addFunction(new SetVoiceToneTool(handleToneChange))
      client.addFunction(new ToggleMicrophoneTool(toggleAudio))
      client.addFunction(new SetVoiceTool(handleVoiceChange))
      client.addFunction(new ToggleCameraTool(toggleVideo))
      client.addFunction(new ToggleScreenShareTool(toggleScreen))
      client.addFunction(new OpenSettingsTool(() => setSettingsOpen(true)))
      client.addFunction(new ClearChatTool(() => { setMessages([]); addMessage("[Conversa limpa]", "system") }))
      client.addFunction(new RunCommandTool(handleCommand))
      client.addFunction(new SetLanguageTool(handleLanguageChange))
      client.addFunction(new ShowNotificationTool(handleNotification))

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
        try { await createSession("Sessão " + new Date().toLocaleDateString()) } catch {}

        const pending = wakePendingTextRef.current
        wakePendingTextRef.current = ""
        if (pending) {
          addMessage(pending, "user")
          client.sendTextMessage(pending)
        }

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
      isConnectingRef.current = false
    }
  }, [settings, handleMessage, updateDebug, handleVolumeChange, handleWhisperChange, handleToneChange, handleVoiceChange, handleCommand, handleLanguageChange, handleNotification, greetingShown, addMessage, stopWakeListening, toggleAudio, toggleVideo, toggleScreen])

  connectRef.current = connect

  const disconnect = useCallback(() => {
    const currentSessionId = sessionId
    if (currentSessionId && messages.length > 2) {
      const summaryText = messages
        .filter((m) => m.type === "user" || m.type === "assistant")
        .slice(-10)
        .map((m) => `${m.type === "user" ? "User" : "Psycho"}: ${m.text.slice(0, 200)}`)
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
  }, [sessionId, messages])

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
      audioPlayerRef.current?.interrupt()
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

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      addMessage(`${e.detail.emoji || "💜"} ${e.detail.message}`, "assistant")
    }
    window.addEventListener("psycho-notification", handler as EventListener)
    return () => window.removeEventListener("psycho-notification", handler as EventListener)
  }, [addMessage])

  useEffect(() => {
    getProfile().then((data) => {
      if (data?.profile_data) {
        voiceProfileRef.current.load(data.profile_data as VoiceProfileData)
        setVoiceProfileEnrolled(true)
      }
    })
  }, [])

  useEffect(() => {
    if (settings.wakeWordEnabled && !isConnected) {
      startWakeListening()
    } else {
      stopWakeListening()
    }
    return () => stopWakeListening()
  }, [settings.wakeWordEnabled, isConnected, startWakeListening, stopWakeListening])

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
      if (profileData) {
        await saveProfile(profileData)
      }
      addMessage("[Perfil de voz treinado e salvo! Filtro avançado ativado.]", "system")
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
      const duration = 5000
      const interval = 200
      const steps = duration / interval

      for (let i = 0; i < steps; i++) {
        await new Promise((r) => setTimeout(r, interval))
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
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSettingsOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors text-sm"
              title="Configurações"
            >
              ⚙️
            </motion.button>
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
        <MediaControls
          isAudioStreaming={isAudioStreaming}
          isVideoStreaming={isVideoStreaming}
          isScreenSharing={isScreenSharing}
          volume={settings.volume}
          connectionStatus={isWakeListening ? "🎤 Aguardando 'Psycho'..." : connectionStatus}
          isConnected={isConnected}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreen={toggleScreen}
          onVolumeChange={handleVolumeChange}
          videoPreviewRef={videoPreviewRef}
        />
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
          />
        )}
      </AnimatePresence>
    </div>
  )
}
