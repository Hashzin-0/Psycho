import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { listSessions, type SessionData } from "../../lib/knowledge"

interface Props {
  lang?: string
}

export default function SessionReview({ lang = "pt" }: Props) {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null)

  useEffect(() => {
    listSessions("psycho").then(setSessions)
  }, [])

  const t = {
    title: lang === "pt" ? "Revisão de Sessões" : lang === "es" ? "Revisión de Sesiones" : "Session Review",
    empty: lang === "pt" ? "Nenhuma sessão encontrada" : lang === "es" ? "Ninguna sesión encontrada" : "No sessions found",
    messages: lang === "pt" ? "mensagens" : lang === "es" ? "mensajes" : "messages",
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-psycho-600 to-indigo-600 px-5 py-4 text-white">
        <h3 className="text-lg font-bold">📋 {t.title}</h3>
      </div>
      <div className="p-4 max-h-80 overflow-y-auto space-y-2">
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t.empty}</p>
        ) : (
          sessions.slice(0, 10).map((s) => (
            <motion.div
              key={s.session_id}
              whileHover={{ scale: 1.01 }}
              className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 cursor-pointer"
              onClick={() => setSelectedSession(s)}
            >
              <h4 className="text-sm font-semibold text-slate-800">{s.title}</h4>
              <p className="text-[10px] text-slate-400">
                {new Date(s.created_at || "").toLocaleDateString()} · {s.message_count || 0} {t.messages}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
