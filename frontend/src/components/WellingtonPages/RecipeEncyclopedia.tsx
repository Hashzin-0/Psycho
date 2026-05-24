import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { searchEncyclopedia, listEncyclopedia, getEncyclopediaCategories, type EncyclopediaEntry } from "../../lib/knowledge"

interface Props {
  lang?: string
}

export default function RecipeEncyclopedia({ lang = "pt" }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<EncyclopediaEntry[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedEntry, setSelectedEntry] = useState<EncyclopediaEntry | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    getEncyclopediaCategories().then(setCategories)
    listEncyclopedia().then((entries) => setResults(entries.slice(0, 20)))
  }, [])

  const handleSearch = async () => {
    if (!query.trim()) {
      const entries = await listEncyclopedia()
      setResults(entries.slice(0, 20))
      return
    }
    setIsSearching(true)
    const res = await searchEncyclopedia(query)
    setResults(res)
    setIsSearching(false)
  }

  const handleCategoryFilter = async (category: string) => {
    const res = await searchEncyclopedia(category, 20)
    setResults(res)
    setQuery(category)
  }

  const t = {
    title: lang === "pt" ? "Enciclopédia Gastronômica" : lang === "es" ? "Enciclopedia Gastronómica" : "Gastronomy Encyclopedia",
    search: lang === "pt" ? "Buscar..." : lang === "es" ? "Buscar..." : "Search...",
    categories: lang === "pt" ? "Categorias" : lang === "es" ? "Categorías" : "Categories",
    back: lang === "pt" ? "Voltar" : lang === "es" ? "Volver" : "Back",
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-700 px-5 py-4 text-white">
        <h3 className="text-lg font-bold">📚 {t.title}</h3>
      </div>

      {selectedEntry ? (
        <div className="p-5">
          <button
            onClick={() => setSelectedEntry(null)}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium mb-3"
          >
            ← {t.back}
          </button>
          <h4 className="text-lg font-bold text-slate-800 mb-2">{selectedEntry.title}</h4>
          <span className="inline-block px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-medium mb-3">
            {selectedEntry.category}
          </span>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{selectedEntry.content}</p>
          {selectedEntry.references && (
            <p className="text-xs text-slate-400 mt-4 italic">📖 {selectedEntry.references}</p>
          )}
        </div>
      ) : (
        <>
          <div className="p-4 border-b border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={t.search}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {isSearching ? "..." : "🔍"}
              </motion.button>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 overflow-x-auto">
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryFilter(cat)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 whitespace-nowrap border border-orange-200"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto space-y-2">
            {results.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                {lang === "pt" ? "Nenhum resultado encontrado" : lang === "es" ? "Ningún resultado encontrado" : "No results found"}
              </p>
            ) : (
              <AnimatePresence>
                {results.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-sm font-semibold text-slate-800">{entry.title}</h5>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 whitespace-nowrap">
                        {entry.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{entry.content?.slice(0, 150)}...</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
