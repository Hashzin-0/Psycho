import { motion } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { TRAINING_TEXTS } from "../lib/voiceProfile"

export interface Settings {
  userName: string
  voice: string
  temperature: number
  volume: number
  userLang: string
  noiseCancellation: boolean
  echoCancellation: boolean
  autoGainControl: boolean
  wakeWordEnabled: boolean
  publicMode: boolean
  publicModeSensitivity: number
  voiceFilterEnabled: boolean
  voiceFilterThreshold: number
}

export interface TrainingProgress {
  textIndex: number
  totalTexts: number
  phase: "recording" | "processing" | "done"
}

interface Props {
  open: boolean
  settings: Settings
  onClose: () => void
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  voiceProfileEnrolled: boolean
  isTraining: boolean
  trainingProgress: TrainingProgress | null
  onTrainVoice: () => void
  onResetVoice: () => void
}

const voices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"]

const toneOptions = [
  { value: 0.3, label: { pt: "Profissional", en: "Professional", es: "Profesional" }, desc: { pt: "Mais objetivo e direto", en: "More objective and direct", es: "Más objetivo y directo" } },
  { value: 0.7, label: { pt: "Equilibrado", en: "Balanced", es: "Equilibrado" }, desc: { pt: "Tom natural e acolhedor", en: "Natural and welcoming", es: "Tono natural y acogedor" } },
  { value: 1.2, label: { pt: "Criativo", en: "Creative", es: "Creativo" }, desc: { pt: "Mais expressivo e fluido", en: "More expressive and fluid", es: "Más expresivo y fluido" } },
]

const langOptions = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
]

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-10 h-5 rounded-full bg-slate-200 peer-checked:bg-psycho-500 transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm peer-checked:translate-x-5 transition-transform" />
      </div>
      <div>
        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
        {desc && <span className="block text-xs text-slate-400 mt-0.5">{desc}</span>}
      </div>
    </label>
  )
}

export default function SettingsModal({ open, settings, onClose, onChange, voiceProfileEnrolled, isTraining, trainingProgress, onTrainVoice, onResetVoice }: Props) {
  const [testTranscript, setTestTranscript] = useState<string | null>(null)
  const [testConfidence, setTestConfidence] = useState<number | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const testRecognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    return () => {
      testRecognitionRef.current?.abort()
      testRecognitionRef.current = null
    }
  }, [])

  if (!open) return null

  const lang = settings.userLang as "pt" | "en" | "es"

  const handleVoiceTest = () => {
    if (isTesting) return
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setTestTranscript("❌ " + (lang === "pt" ? "Não suportado neste navegador" : lang === "es" ? "No compatible" : "Not supported in this browser"))
      return
    }
    setIsTesting(true)
    setTestTranscript(lang === "pt" ? "🎤 Ouvindo..." : lang === "es" ? "🎤 Escuchando..." : "🎤 Listening...")
    setTestConfidence(null)

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "pt-BR"
    recognition.maxAlternatives = 3

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1]
      const alt = last[0]
      setTestTranscript(alt.transcript)
      setTestConfidence(Math.round(alt.confidence * 100))
    }

    recognition.onerror = () => {
      setTestTranscript("❌ " + (lang === "pt" ? "Erro ao capturar áudio" : lang === "es" ? "Error de audio" : "Audio error"))
      setIsTesting(false)
    }

    recognition.onend = () => {
      setIsTesting(false)
    }

    recognition.start()
    testRecognitionRef.current = recognition
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-psycho-600 to-indigo-600 px-6 py-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💜</span>
              <h2 className="text-lg font-semibold">
                {lang === "pt" ? "Preferências" : lang === "es" ? "Preferencias" : "Preferences"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-white/70 mt-1 ml-9">
            {lang === "pt" ? "Personalize sua experiência" : lang === "es" ? "Personaliza tu experiencia" : "Customize your experience"}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Como chamar */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {lang === "pt" ? "Como devo te chamar?" : lang === "es" ? "¿Cómo debo llamarte?" : "What should I call you?"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">💬</span>
              <input
                type="text"
                value={settings.userName}
                onChange={(e) => onChange("userName", e.target.value)}
                placeholder={lang === "pt" ? "Seu nome..." : lang === "es" ? "Tu nombre..." : "Your name..."}
                className="w-full bg-violet-50 border border-violet-100 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-psycho-500/50 transition-shadow"
              />
            </div>
          </div>

          {/* Voz */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {lang === "pt" ? "Voz do Psycho" : lang === "es" ? "Voz de Psycho" : "Psycho's voice"}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {voices.map((v) => (
                <button
                  key={v}
                  onClick={() => onChange("voice", v)}
                  className={`px-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    settings.voice === v
                      ? "bg-psycho-100 text-psycho-700 border-2 border-psycho-300 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-violet-50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Tom */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {lang === "pt" ? "Tom da conversa" : lang === "es" ? "Tono de conversación" : "Conversation tone"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {toneOptions.map((opt) => {
                const isActive = settings.temperature === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => onChange("temperature", opt.value)}
                    className={`px-3 py-3 rounded-2xl text-center transition-all ${
                      isActive
                        ? "bg-psycho-100 border-2 border-psycho-300 shadow-sm"
                        : "bg-slate-50 border-2 border-transparent hover:bg-violet-50"
                    }`}
                  >
                    <span className={`block text-sm font-semibold ${isActive ? "text-psycho-700" : "text-slate-600"}`}>
                      {opt.label[lang] || opt.label["pt"]}
                    </span>
                    <span className={`block text-[10px] mt-0.5 ${isActive ? "text-psycho-500" : "text-slate-400"}`}>
                      {opt.desc[lang] || opt.desc["pt"]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Volume */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {lang === "pt" ? "Volume da voz" : lang === "es" ? "Volumen de la voz" : "Voice volume"}
              </label>
              <span className="text-sm font-medium text-psycho-600">{settings.volume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume}
              onChange={(e) => onChange("volume", parseInt(e.target.value))}
              className="w-full accent-psycho-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>🔇</span>
              <span>🔊</span>
            </div>
          </div>

          {/* Qualidade do Áudio */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              {lang === "pt" ? "Qualidade do Áudio" : lang === "es" ? "Calidad de Audio" : "Audio Quality"}
            </label>
            <div className="space-y-3 bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
              <Toggle
                checked={settings.noiseCancellation}
                onChange={(v) => onChange("noiseCancellation", v)}
                label={lang === "pt" ? "Cancelamento de Ruído" : lang === "es" ? "Cancelación de Ruido" : "Noise Cancellation"}
                desc={lang === "pt" ? "Remove ruídos de fundo (ventilador, trânsito)" : lang === "es" ? "Elimina ruidos de fondo" : "Removes background noise"}
              />
              <Toggle
                checked={settings.echoCancellation}
                onChange={(v) => onChange("echoCancellation", v)}
                label={lang === "pt" ? "Cancelamento de Eco" : lang === "es" ? "Cancelación de Eco" : "Echo Cancellation"}
                desc={lang === "pt" ? "Evita eco e reverberação do áudio" : lang === "es" ? "Evita eco y reverberación" : "Prevents audio echo and reverberation"}
              />
              <Toggle
                checked={settings.autoGainControl}
                onChange={(v) => onChange("autoGainControl", v)}
                label={lang === "pt" ? "Controle Automático de Ganho" : lang === "es" ? "Control Automático de Ganancia" : "Auto Gain Control"}
                desc={lang === "pt" ? "Ajusta automaticamente o volume do microfone" : lang === "es" ? "Ajusta automáticamente el volumen del micrófono" : "Automatically adjusts microphone volume"}
              />
            </div>
          </div>

          {/* Ativação por Voz */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              {lang === "pt" ? "Ativação por Voz" : lang === "es" ? "Activación por Voz" : "Voice Activation"}
            </label>
            <div className="space-y-3 bg-violet-50/70 rounded-2xl p-4 border border-violet-100">
              <Toggle
                checked={settings.wakeWordEnabled}
                onChange={(v) => onChange("wakeWordEnabled", v)}
                label={lang === "pt" ? "Wake Word (\"Psycho\")" : lang === "es" ? "Palabra de Activación" : "Wake Word"}
                desc={lang === "pt" ? "Diga \"Psycho\" seguido da sua mensagem para ativar o Psycho automaticamente" : lang === "es" ? "Di \"Psycho\" seguido de tu mensaje para activar Psycho" : "Say \"Psycho\" followed by your message to activate Psycho automatically"}
              />
              <Toggle
                checked={settings.publicMode}
                onChange={(v) => onChange("publicMode", v)}
                label={lang === "pt" ? "Cancelamento Público" : lang === "es" ? "Cancelación Pública" : "Public Mode"}
                desc={lang === "pt" ? "Apenas sua voz pode interromper o Psycho — vozes de fundo são ignoradas" : lang === "es" ? "Solo tu voz interrumpe a Psycho — las voces de fondo se ignoran" : "Only your voice can interrupt Psycho — background voices are ignored"}
              />
              {settings.publicMode && (
                <div className="pt-2 border-t border-violet-200/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-slate-500">
                      {lang === "pt" ? "Sensibilidade do Filtro" : lang === "es" ? "Sensibilidad del Filtro" : "Filter Sensitivity"}
                    </span>
                    <span className="text-sm font-semibold text-psycho-600">{settings.publicModeSensitivity}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={settings.publicModeSensitivity}
                    onChange={(e) => onChange("publicModeSensitivity", parseInt(e.target.value))}
                    className="w-full accent-psycho-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                    <span>{lang === "pt" ? "Menos rígido" : lang === "es" ? "Menos estricto" : "Lenient"}</span>
                    <span>{lang === "pt" ? "Máximo (só você)" : lang === "es" ? "Máximo (solo tú)" : "Maximum (only you)"}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Treinamento de Perfil de Voz */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {lang === "pt" ? "Perfil de Voz" : lang === "es" ? "Perfil de Voz" : "Voice Profile"}
            </label>
            <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-100 space-y-3">
              {voiceProfileEnrolled && !isTraining ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✅</span>
                    <span className="text-sm font-medium text-emerald-700">
                      {lang === "pt" ? "Voz treinada!" : lang === "es" ? "¡Voz entrenada!" : "Voice trained!"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {lang === "pt"
                      ? "Seu perfil vocal está salvo. O filtro avançado pode reconhecer sua voz por timbre."
                      : lang === "es"
                      ? "Tu perfil vocal está guardado. El filtro avanzado puede reconocer tu voz por timbre."
                      : "Your voice profile is saved. The advanced filter can recognize your voice by timbre."}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={onTrainVoice}
                      className="px-3 py-2 rounded-xl text-xs font-medium bg-psycho-100 text-psycho-700 hover:bg-psycho-200 border border-psycho-200 transition-all"
                    >
                      {lang === "pt" ? "🎤 Retreinar" : lang === "es" ? "🎤 Volver a entrenar" : "🎤 Retrain"}
                    </button>
                    <button
                      onClick={onResetVoice}
                      className="px-3 py-2 rounded-xl text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all"
                    >
                      {lang === "pt" ? "🗑️ Remover" : lang === "es" ? "🗑️ Eliminar" : "🗑️ Remove"}
                    </button>
                  </div>
                </>
              ) : isTraining ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-psycho-500 border-t-transparent animate-spin" />
                    <span className="text-sm font-medium text-psycho-700">
                      {lang === "pt" ? "Treinando..." : lang === "es" ? "Entrenando..." : "Training..."}
                    </span>
                  </div>
                  {trainingProgress && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {lang === "pt" ? "Texto" : lang === "es" ? "Texto" : "Text"} {trainingProgress.textIndex + 1}/{trainingProgress.totalTexts}
                        </span>
                        <span>
                          {trainingProgress.phase === "recording"
                            ? (lang === "pt" ? "🎤 Gravando..." : lang === "es" ? "🎤 Grabando..." : "🎤 Recording...")
                            : trainingProgress.phase === "processing"
                            ? (lang === "pt" ? "⚙️ Processando..." : lang === "es" ? "⚙️ Procesando..." : "⚙️ Processing...")
                            : (lang === "pt" ? "✅ Pronto" : lang === "es" ? "✅ Listo" : "✅ Done")}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-psycho-500 to-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${((trainingProgress.textIndex + (trainingProgress.phase === "done" ? 1 : 0)) / trainingProgress.totalTexts) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 italic leading-relaxed px-2 py-2 bg-white/60 rounded-xl">
                        "{TRAINING_TEXTS[trainingProgress.textIndex] || "Psycho, me ajude a refletir sobre o meu dia."}"
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {lang === "pt"
                      ? "Treine o Psycho para reconhecer SOMENTE a sua voz. Você vai ler 5 textos em voz alta (3s cada) + dizer \"Psycho\" para criar seu perfil vocal único. Após o treino, ative o Filtro por Voz para bloquear outras pessoas."
                      : lang === "es"
                      ? "Entrena a Psycho para reconocer SOLO tu voz. Leerás 5 textos en voz alta (3s c/u) + dirás \"Psycho\" para crear tu perfil vocal único."
                      : "Train Psycho to recognize ONLY your voice. You'll read 5 texts aloud (3s each) + say \"Psycho\" to create your unique voice profile."}
                  </p>
                  <button
                    onClick={onTrainVoice}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-psycho-600 to-indigo-600 text-white hover:shadow-md transition-all"
                  >
                    🎤 {lang === "pt" ? "Iniciar Treinamento de Voz" : lang === "es" ? "Iniciar Entrenamiento de Voz" : "Start Voice Training"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filtro Avançado por Voz */}
          {voiceProfileEnrolled && settings.publicMode && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                {lang === "pt" ? "Filtro Avançado por Voz" : lang === "es" ? "Filtro Avanzado por Voz" : "Advanced Voice Filter"}
              </label>
              <div className="space-y-3 bg-indigo-50/70 rounded-2xl p-4 border border-indigo-100">
                <Toggle
                  checked={settings.voiceFilterEnabled}
                  onChange={(v) => onChange("voiceFilterEnabled", v)}
                  label={lang === "pt" ? "Filtrar por Timbre" : lang === "es" ? "Filtrar por Timbre" : "Filter by Voice Timbre"}
                  desc={lang === "pt" ? "Bloqueia vozes que não correspondem ao seu timbre treinado" : lang === "es" ? "Bloquea voces que no coinciden con tu timbre entrenado" : "Blocks voices that don't match your trained timbre"}
                />
                {settings.voiceFilterEnabled && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-slate-500">
                        {lang === "pt" ? "Rigor do Filtro" : lang === "es" ? "Rigor del Filtro" : "Filter Strictness"}
                      </span>
                      <span className="text-sm font-semibold text-psycho-600">{Math.round(settings.voiceFilterThreshold * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={95}
                      value={Math.round(settings.voiceFilterThreshold * 100)}
                      onChange={(e) => onChange("voiceFilterThreshold", parseInt(e.target.value) / 100)}
                      className="w-full accent-psycho-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                      <span>{lang === "pt" ? "Menos rigor" : lang === "es" ? "Menos rigor" : "Less strict"}</span>
                      <span>{lang === "pt" ? "Máximo (só você)" : lang === "es" ? "Máximo (solo tú)" : "Maximum (only you)"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Idioma */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {lang === "pt" ? "Idioma" : lang === "es" ? "Idioma" : "Language"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {langOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange("userLang", opt.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    settings.userLang === opt.value
                      ? "bg-psycho-100 text-psycho-700 border-2 border-psycho-300 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-violet-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-psycho-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-sm transition-all hover:shadow-md"
          >
            {lang === "pt" ? "Pronto" : lang === "es" ? "Listo" : "Done"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
