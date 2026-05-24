import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { listGoals, type GoalData } from "../../lib/knowledge"

interface Props {
  lang?: string
}

export default function GoalsTracker({ lang = "pt" }: Props) {
  const [goals, setGoals] = useState<GoalData[]>([])

  useEffect(() => {
    listGoals(true, "psycho").then(setGoals)
  }, [])

  const t = {
    title: lang === "pt" ? "Metas de Bem-Estar" : lang === "es" ? "Metas de Bienestar" : "Wellness Goals",
    empty: lang === "pt" ? "Nenhuma meta ativa" : lang === "es" ? "Sin metas activas" : "No active goals",
    streak: lang === "pt" ? "sequência" : lang === "es" ? "racha" : "streak",
    days: lang === "pt" ? "dias" : lang === "es" ? "días" : "days",
    target: lang === "pt" ? "meta" : lang === "es" ? "objetivo" : "target",
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-psycho-600 to-indigo-600 px-5 py-4 text-white">
        <h3 className="text-lg font-bold">🎯 {t.title}</h3>
      </div>
      <div className="p-4 max-h-80 overflow-y-auto space-y-2">
        {goals.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t.empty}</p>
        ) : (
          goals.slice(0, 5).map((goal) => {
            const progress = Math.min(100, Math.round((goal.current_streak / goal.target_days) * 100))
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100"
              >
                <h4 className="text-sm font-semibold text-slate-800">{goal.title}</h4>
                {goal.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{goal.description}</p>
                )}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>🔥 {t.streak}: {goal.current_streak}/{goal.target_days} {t.days}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-psycho-500 to-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}
