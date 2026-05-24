import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { listCookedRecipes, type CookedEntry } from "../../lib/knowledge"

interface Props {
  lang?: string
}

export default function CookedRecipes({ lang = "pt" }: Props) {
  const [entries, setEntries] = useState<CookedEntry[]>([])

  useEffect(() => {
    listCookedRecipes().then(setEntries)
  }, [])

  const t = {
    title: lang === "pt" ? "Receitas Feitas" : lang === "es" ? "Recetas Hechas" : "Cooked Recipes",
    empty: lang === "pt" ? "Nenhuma receita registrada ainda" : lang === "es" ? "Ninguna receta registrada aún" : "No recipes logged yet",
    rating: lang === "pt" ? "Nota" : lang === "es" ? "Puntuación" : "Rating",
    difficulty: lang === "pt" ? "Dificuldade" : lang === "es" ? "Dificultad" : "Difficulty",
    time: lang === "pt" ? "Tempo" : lang === "es" ? "Tiempo" : "Time",
    hint: lang === "pt" ? "Peça ao Wellington para registrar uma receita que você fez!" : lang === "es" ? "¡Pide a Wellington que registre una receta que hiciste!" : "Ask Wellington to log a recipe you cooked!",
  }

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-700 px-5 py-4 text-white">
        <h3 className="text-lg font-bold">🍽️ {t.title}</h3>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">{t.empty}</p>
            <p className="text-xs text-slate-400 mt-2">{t.hint}</p>
          </div>
        ) : (
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 mb-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">{entry.recipe_title}</h4>
                  {entry.rating > 0 && (
                    <span className="text-xs text-amber-500">{stars(entry.rating)}</span>
                  )}
                </div>
                <div className="flex gap-3 mt-1.5 text-[11px] text-slate-500">
                  {entry.difficulty && (
                    <span>📊 {t.difficulty}: {entry.difficulty}</span>
                  )}
                  {entry.cooking_time_minutes > 0 && (
                    <span>⏱️ {t.time}: {entry.cooking_time_minutes}min</span>
                  )}
                </div>
                {entry.notes && (
                  <p className="text-xs text-slate-600 mt-1.5 italic">{entry.notes}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(entry.created_at).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}
