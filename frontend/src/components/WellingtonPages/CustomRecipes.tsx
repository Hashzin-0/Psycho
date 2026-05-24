import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { listCustomRecipes, deleteCustomRecipe, type CustomRecipe } from "../../lib/knowledge"

interface Props {
  lang?: string
}

export default function CustomRecipes({ lang = "pt" }: Props) {
  const [recipes, setRecipes] = useState<CustomRecipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<CustomRecipe | null>(null)

  const load = () => listCustomRecipes().then(setRecipes)

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    await deleteCustomRecipe(id)
    load()
    if (selectedRecipe?.id === id) setSelectedRecipe(null)
  }

  const t = {
    title: lang === "pt" ? "Receitas Customizadas" : lang === "es" ? "Recetas Personalizadas" : "Custom Recipes",
    empty: lang === "pt" ? "Nenhuma receita customizada ainda" : lang === "es" ? "Ninguna receta personalizada aún" : "No custom recipes yet",
    hint: lang === "pt" ? "Peça ao Wellington para salvar uma receita modificada!" : lang === "es" ? "¡Pide a Wellington que guarde una receta modificada!" : "Ask Wellington to save a modified recipe!",
    back: lang === "pt" ? "Voltar" : lang === "es" ? "Volver" : "Back",
    delete: lang === "pt" ? "Excluir" : lang === "es" ? "Eliminar" : "Delete",
    ingredients: lang === "pt" ? "Ingredientes" : lang === "es" ? "Ingredientes" : "Ingredients",
    instructions: lang === "pt" ? "Instruções" : lang === "es" ? "Instrucciones" : "Instructions",
    notes: lang === "pt" ? "Observações" : lang === "es" ? "Notas" : "Notes",
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-700 px-5 py-4 text-white">
        <h3 className="text-lg font-bold">📝 {t.title}</h3>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {selectedRecipe ? (
          <div>
            <button
              onClick={() => setSelectedRecipe(null)}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium mb-3"
            >
              ← {t.back}
            </button>
            <h4 className="text-lg font-bold text-slate-800 mb-3">{selectedRecipe.title}</h4>

            <div className="space-y-3">
              <div>
                <h5 className="text-xs font-semibold text-slate-500 uppercase mb-1">{t.ingredients}</h5>
                <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-xl p-3">{selectedRecipe.ingredients}</p>
              </div>
              <div>
                <h5 className="text-xs font-semibold text-slate-500 uppercase mb-1">{t.instructions}</h5>
                <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-xl p-3">{selectedRecipe.instructions}</p>
              </div>
              {selectedRecipe.notes && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-500 uppercase mb-1">{t.notes}</h5>
                  <p className="text-sm text-slate-600 italic bg-amber-50 rounded-xl p-3">{selectedRecipe.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => handleDelete(selectedRecipe.id)}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
            >
              🗑️ {t.delete}
            </button>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">{t.empty}</p>
            <p className="text-xs text-slate-400 mt-2">{t.hint}</p>
          </div>
        ) : (
          <AnimatePresence>
            {recipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                className="p-3 mb-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 cursor-pointer"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <h4 className="text-sm font-semibold text-slate-800">{recipe.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{recipe.ingredients?.slice(0, 120)}...</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {recipe.updated_at ? new Date(recipe.updated_at).toLocaleDateString() : ""}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}
