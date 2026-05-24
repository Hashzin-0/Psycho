import { motion } from "framer-motion"

export interface Settings {
  model: string
  systemInstructions: string
  voice: string
  temperature: number
  enableGrounding: boolean
  enableWhisper: boolean
  enableThinking: boolean
  enableAlertTool: boolean
  enableCssStyleTool: boolean
  enableInputTranscription: boolean
  enableOutputTranscription: boolean
  disableActivityDetection: boolean
  silenceDuration: number
  prefixPadding: number
  endSpeechSensitivity: string
  startSpeechSensitivity: string
  activityHandling: string
  volume: number
}

const langLabels: Record<string, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
}

interface Props {
  open: boolean
  settings: Settings
  onClose: () => void
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const voices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"]

function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 rounded-full bg-slate-200 peer-checked:bg-indigo-600 transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm peer-checked:translate-x-5 transition-transform" />
      </div>
      <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
        {label}
      </span>
    </label>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function SettingsModal({ open, settings, onClose, onChange }: Props) {
  if (!open) return null

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
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">💜</span>
            <h2 className="text-lg font-semibold text-slate-800">Configurações</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Voz & Comportamento */}
            <div className="p-4 border border-violet-100 rounded-2xl bg-white shadow-sm space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                Voz & Comportamento
              </h3>
              <Select
                label="Voz"
                value={settings.voice}
                onChange={(v) => onChange("voice", v)}
                options={voices.map((v) => ({ value: v, label: v }))}
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Temperatura:{" "}
                  <span className="text-psycho-600">{settings.temperature.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  value={settings.temperature}
                  onChange={(e) => onChange("temperature", parseFloat(e.target.value))}
                  className="w-full accent-psycho-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0.1 (Preciso)</span>
                  <span>2.0 (Criativo)</span>
                </div>
              </div>
              <Toggle
                id="whisper"
                checked={settings.enableWhisper}
                onChange={(v) => onChange("enableWhisper", v)}
                label="Modo Sussurro (volume 25%)"
              />
              <Toggle
                id="thinking"
                checked={settings.enableThinking}
                onChange={(v) => onChange("enableThinking", v)}
                label="Modo Raciocínio (~1024 tokens)"
              />
            </div>

            {/* Configuração da API */}
            <div className="p-4 border border-violet-100 rounded-2xl bg-white shadow-sm space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                Configuração da API
              </h3>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Modelo
                </label>
                <input
                  type="text"
                  value={settings.model}
                  onChange={(e) => onChange("model", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Instruções do Sistema
                </label>
                <textarea
                  value={settings.systemInstructions}
                  onChange={(e) => onChange("systemInstructions", e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                />
              </div>
              <Toggle
                id="grounding"
                checked={settings.enableGrounding}
                onChange={(v) => onChange("enableGrounding", v)}
                label="Google Search (desativa ferramentas customizadas)"
              />
            </div>

            {/* Transcrição */}
            <div className="p-4 border border-violet-100 rounded-2xl bg-white shadow-sm space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                Transcrição
              </h3>
              <Toggle
                id="inputTrans"
                checked={settings.enableInputTranscription}
                onChange={(v) => onChange("enableInputTranscription", v)}
                label="Transcrição de entrada (sua fala)"
              />
              <Toggle
                id="outputTrans"
                checked={settings.enableOutputTranscription}
                onChange={(v) => onChange("enableOutputTranscription", v)}
                label="Transcrição de saída (respostas do Psycho)"
              />
            </div>

            {/* Detecção de Atividade */}
            <div className="p-4 border border-violet-100 rounded-2xl bg-white shadow-sm space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                Detecção de Atividade
              </h3>
              <Toggle
                id="disableAD"
                checked={settings.disableActivityDetection}
                onChange={(v) => onChange("disableActivityDetection", v)}
                label="Desabilitar detecção de atividade"
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Duração do silêncio (ms)
                </label>
                <input
                  type="number"
                  value={settings.silenceDuration}
                  onChange={(e) => onChange("silenceDuration", parseInt(e.target.value))}
                  min={500}
                  max={10000}
                  step={100}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Preenchimento inicial (ms)
                </label>
                <input
                  type="number"
                  value={settings.prefixPadding}
                  onChange={(e) => onChange("prefixPadding", parseInt(e.target.value))}
                  min={0}
                  max={2000}
                  step={100}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
              <Select
                label="Sensibilidade de fim de fala"
                value={settings.endSpeechSensitivity}
                onChange={(v) => onChange("endSpeechSensitivity", v)}
                options={[
                  { value: "END_SENSITIVITY_UNSPECIFIED", label: "Padrão" },
                  { value: "END_SENSITIVITY_HIGH", label: "Alta (corte mais rápido)" },
                  { value: "END_SENSITIVITY_LOW", label: "Baixa (espera mais)" },
                ]}
              />
              <Select
                label="Sensibilidade de início de fala"
                value={settings.startSpeechSensitivity}
                onChange={(v) => onChange("startSpeechSensitivity", v)}
                options={[
                  { value: "START_SENSITIVITY_UNSPECIFIED", label: "Padrão" },
                  { value: "START_SENSITIVITY_HIGH", label: "Alta (detecção rápida)" },
                  { value: "START_SENSITIVITY_LOW", label: "Baixa (mais filtro)" },
                ]}
              />
              <Select
                label="Manipulação de atividade"
                value={settings.activityHandling}
                onChange={(v) => onChange("activityHandling", v)}
                options={[
                  { value: "ACTIVITY_HANDLING_UNSPECIFIED", label: "Padrão (Interrompe)" },
                  { value: "START_OF_ACTIVITY_INTERRUPTS", label: "Interromper (Barge-in)" },
                  { value: "NO_INTERRUPTION", label: "Sem interrupção" },
                ]}
              />
            </div>

            {/* Ferramentas Customizadas */}
            <div className="p-4 border border-violet-100 rounded-2xl bg-white shadow-sm space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                Ferramentas
              </h3>
              <Toggle
                id="alertTool"
                checked={settings.enableAlertTool}
                onChange={(v) => onChange("enableAlertTool", v)}
                label="Notificações do Psycho"
              />
              <Toggle
                id="cssTool"
                checked={settings.enableCssStyleTool}
                onChange={(v) => onChange("enableCssStyleTool", v)}
                label="Injetar CSS"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 px-6 py-4 flex justify-end flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium shadow-sm transition-colors hover:bg-slate-800"
          >
            Done
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
