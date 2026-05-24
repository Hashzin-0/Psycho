import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ChatMessage {
  text: string
  type: string
}

interface Props {
  messages: ChatMessage[]
  onSend: (text: string) => void
  agentEmoji?: string
  agentName?: string
  agentColor?: string
}

const typeColors: Record<string, string> = {
  user: "border-l-emerald-500 bg-emerald-50/70",
  "user-transcript": "border-l-amber-500 bg-amber-50/70",
  assistantPsycho: "border-l-violet-500 bg-violet-50/70",
  assistantWellington: "border-l-orange-500 bg-orange-50/70",
  assistant: "border-l-violet-500 bg-violet-50/70",
  system: "border-l-rose-400 bg-rose-50/70",
}

function getAssistantColor(agentColor?: string): string {
  return agentColor === "warm" ? "border-l-orange-500 bg-orange-50/70" : "border-l-violet-500 bg-violet-50/70"
}

function getAssistantLabel(agentName?: string): string {
  return agentName?.toUpperCase() || "ASSISTANT"
}

export default function Chat({ messages, onSend, agentEmoji, agentName, agentColor }: Props) {
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input.trim())
    setInput("")
  }

  const assistantColor = getAssistantColor(agentColor)
  const assistantLabel = getAssistantLabel(agentName)
  const placeholderText = agentName
    ? `Digite sua mensagem... (/ajuda para comandos)`
    : "Digite sua mensagem... (/ajuda para comandos)"

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center pt-12">
            {agentEmoji} Conecte-se ao {agentName || "assistente"} para começar
          </p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isAssistant = msg.type === "assistant"
            const borderColor = isAssistant ? assistantColor : typeColors[msg.type] || "border-l-slate-300 bg-slate-50"
            const label = isAssistant ? assistantLabel : msg.type === "user" ? "VOCÊ" : msg.type === "system" ? "SISTEMA" : msg.type.toUpperCase()

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`text-sm px-3 py-2 rounded-lg border-l-2 ${borderColor}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block mb-0.5">
                  {label}
                </span>
                {msg.text}
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-slate-100 bg-slate-50/50">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholderText}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-shadow"
        />
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-psycho-600 to-indigo-600 text-white hover:from-psycho-700 hover:to-indigo-700 shadow-sm shadow-violet-200 transition-colors"
        >
          Enviar
        </motion.button>
      </form>
    </div>
  )
}
