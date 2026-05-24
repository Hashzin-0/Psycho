import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getMoodHistory, type MoodEntry } from "../../lib/knowledge"

interface Props {
  lang?: string
}

const moodColors: Record<string, string> = {
  feliz: "bg-emerald-400",
  alegre: "bg-emerald-400",
  happy: "bg-emerald-400",
  calmo: "bg-blue-400",
  calm: "bg-blue-400",
  neutro: "bg-slate-400",
  neutral: "bg-slate-400",
  triste: "bg-indigo-400",
  sad: "bg-indigo-400",
  ansioso: "bg-amber-400",
  anxious: "bg-amber-400",
  estressado: "bg-orange-400",
  stressed: "bg-orange-400",
  irritado: "bg-red-400",
  angry: "bg-red-400",
  depressed: "bg-purple-400",
  deprimido: "bg-purple-400",
}

function getMoodColor(mood: string): string {
  return moodColors[mood.toLowerCase()] || "bg-slate-300"
}

export default function MoodChart({ lang = "pt" }: Props) {
  const [entries, setEntries] = useState<MoodEntry[]>([])

  useEffect(() => {
    getMoodHistory(14).then(setEntries)
  }, [])

  const t = {
    title: lang === "pt" ? "Gráfico de Humor" : lang === "es" ? "Gráfico de Humor" : "Mood Chart",
    empty: lang === "pt" ? "Nenhum registro de humor ainda" : lang === "es" ? "Sin registros de humor aún" : "No mood entries yet",
    intensity: lang === "pt" ? "Intensidade" : lang === "es" ? "Intensidad" : "Intensity",
  }

  const recent = entries.slice(0, 10).reverse()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-psycho-600 to-indigo-600 px-5 py-4 text-white">
        <h3 className="text-lg font-bold">📊 {t.title}</h3>
      </div>
      <div className="p-4 max-h-80 overflow-y-auto">
        {recent.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t.empty}</p>
        ) : (
          <div className="space-y-3">
            {recent.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 capitalize">{entry.mood}</span>
                  <span className="text-slate-400">{new Date(entry.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(entry.intensity / 10) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className={`h-full rounded-full ${getMoodColor(entry.mood)}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 w-4 text-right">{entry.intensity}</span>
                </div>
                {entry.note && (
                  <p className="text-[10px] text-slate-400 italic">{entry.note}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
