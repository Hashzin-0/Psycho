import { motion } from "framer-motion"
import type { AgentId } from "../lib/agentSystem"

interface Props {
  onSelectAgent: (agent: AgentId) => void
}

const agents = [
  {
    id: "psycho" as AgentId,
    name: "Psycho",
    emoji: "💜",
    subtitle: "Seu Assistente Psicológico Pessoal",
    description: "Suporte emocional, bem-estar mental, técnicas terapêuticas, acompanhamento de humor e metas pessoais.",
    gradient: "from-psycho-600 to-indigo-600",
    badge: "psicologia",
    features: ["Sessões terapêuticas", "Diário de humor", "Metas de bem-estar", "Técnicas CBT/DBT/ACT"],
  },
  {
    id: "wellington" as AgentId,
    name: "Wellington",
    emoji: "🍳",
    subtitle: "Seu Assistente Gastronômico Pessoal",
    description: "Receitas, técnicas culinárias, planejamento de refeições, substituições e conhecimento gastronômico.",
    gradient: "from-orange-600 via-amber-600 to-yellow-700",
    badge: "gastronomia",
    features: ["Enciclopédia de receitas", "Timers de cozinha", "Conversão de medidas", "Substituições inteligentes"],
  },
]

function AgentCard({ agent, onSelect }: { agent: typeof agents[0]; onSelect: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden cursor-pointer group"
      onClick={onSelect}
    >
      <div className={`bg-gradient-to-r ${agent.gradient} px-6 py-8 text-white relative overflow-hidden`}>
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner"
          >
            {agent.emoji}
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold">{agent.name}</h2>
            <p className="text-sm text-white/70">{agent.subtitle}</p>
          </div>
        </div>
        <div className="mt-3">
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm capitalize">
            {agent.badge}
          </span>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">{agent.description}</p>
        <div className="space-y-2">
          {agent.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400">
                {i + 1}
              </span>
              {f}
            </div>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r ${agent.gradient} shadow-md hover:shadow-lg transition-shadow`}
        >
          Ativar {agent.name}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function AgentHub({ onSelectAgent }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-psycho-700 via-psycho-600 to-amber-700 text-white px-6 py-6 shadow-lg relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-lg shadow-inner">
              🤖
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Agentes</h1>
              <p className="text-sm text-white/70">Escolha um assistente para começar</p>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onSelect={() => onSelectAgent(agent.id)} />
          ))}
        </div>
      </main>
    </div>
  )
}
