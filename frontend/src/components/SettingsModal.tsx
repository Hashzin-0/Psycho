import { motion } from "framer-motion"

export interface Settings {
  userName: string
  voice: string
  temperature: number
  volume: number
  userLang: string
}

interface Props {
  open: boolean
  settings: Settings
  onClose: () => void
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const voices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"]

const toneOptions = [
  { value: 0.3, label: { pt: "Profissional", en: "Professional", es: "Profesional" }, desc: { pt: "Mais objetivo e direto", en: "More objective and direct", es: "Más objetivo y directo" } },
  { value: 0.7, label: { pt: "Equilibrado", en: "Balanced", es: "Equilibrado" }, desc: { pt: "Tom natural e acolhedor", en: "Natural and welcoming", es: "Tono natural y acogedor" } },
  { value: 1.2, label: { pt: "Criativo", en: "Creative", es: "Creativo" }, desc: { pt: "Mais expressivo e fluido", en: "More expressive and fluid", es: "Más expresivo y fluido" } },
]

const langOptions = [
  { value: "pt", label: "Português" },
  { value: "en", "label": "English" },
  { value: "es", "label": "Español" },
]

export default function SettingsModal({ open, settings, onClose, onChange }: Props) {
  if (!open) return null

  const t = langOptions.find(l => l.value === settings.userLang)
  const lang = settings.userLang as "pt" | "en" | "es"

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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-psycho-600 to-indigo-600 px-6 py-5 text-white">
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
        <div className="p-6 space-y-5">
          {/* Nome / Como chamar */}
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
                    <span className={`block text-sm font-semibold ${
                      isActive ? "text-psycho-700" : "text-slate-600"
                    }`}>
                      {opt.label[lang] || opt.label["pt"]}
                    </span>
                    <span className={`block text-[10px] mt-0.5 ${
                      isActive ? "text-psycho-500" : "text-slate-400"
                    }`}>
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
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end">
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
