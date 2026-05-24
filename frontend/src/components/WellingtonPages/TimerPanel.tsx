import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Timer } from "../../lib/timerManager"

interface Props {
  lang?: string
  timers?: Timer[]
  onRemoveTimer?: (id: string) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export default function TimerPanel({ lang = "pt", timers = [], onRemoveTimer }: Props) {
  const activeTimers = timers.filter((t) => t.active && !t.completed)
  const completedTimers = timers.filter((t) => t.completed)

  const t = {
    title: lang === "pt" ? "Timers da Cozinha" : lang === "es" ? "Temporizadores de Cocina" : "Kitchen Timers",
    active: lang === "pt" ? "Ativos" : lang === "es" ? "Activos" : "Active",
    completed: lang === "pt" ? "Concluídos" : lang === "es" ? "Completados" : "Completed",
    empty: lang === "pt" ? "Nenhum timer ativo" : lang === "es" ? "Sin temporizadores activos" : "No active timers",
    cancel: lang === "pt" ? "Cancelar" : lang === "es" ? "Cancelar" : "Cancel",
    hint: lang === "pt" ? "Peça ao Wellington: 'timer de 10 minutos para o arroz'" : lang === "es" ? "Pide a Wellington: 'temporizador de 10 minutos para el arroz'" : 'Ask Wellington: "set a 10 minute timer for the rice"',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-700 px-5 py-4 text-white">
        <h3 className="text-lg font-bold">⏱️ {t.title}</h3>
      </div>

      <div className="p-4 max-h-80 overflow-y-auto">
        {activeTimers.length === 0 && completedTimers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">{t.empty}</p>
            <p className="text-xs text-slate-400 mt-2">{t.hint}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTimers.map((timer) => (
              <motion.div
                key={timer.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-800">{timer.label}</span>
                  {onRemoveTimer && (
                    <button
                      onClick={() => onRemoveTimer(timer.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      {t.cancel}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-mono font-bold text-orange-600 tabular-nums">
                    {formatTime(timer.remainingSeconds)}
                  </div>
                  <div className="flex-1 bg-orange-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                      initial={{ width: "100%" }}
                      animate={{
                        width: `${(timer.remainingSeconds / (timer.minutes * 60)) * 100}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            {completedTimers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">{t.completed}</p>
                {completedTimers.slice(0, 5).map((timer) => (
                  <div
                    key={timer.id}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 mb-1 flex items-center justify-between"
                  >
                    <span className="text-xs text-slate-500 line-through">{timer.label}</span>
                    <span className="text-[10px] text-slate-400">✅ {timer.minutes}min</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
