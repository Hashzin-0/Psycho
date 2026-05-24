import { motion } from "framer-motion"

interface Props {
  lang?: string
}

const techniques = [
  { name: "4-7-8", desc: "Inspire 4s, segure 7s, expire 8s — acalma o sistema nervoso" },
  { name: "5-4-3-2-1", desc: "5 coisas que vê, 4 que toca, 3 que ouve, 2 que cheira, 1 que prova" },
  { name: "Respiração Diafragmática", desc: "Mão na barriga, respiração profunda — reduz cortisol" },
  { name: "Body Scan", desc: "Atenção progressiva do topo da cabeça aos pés" },
  { name: "Registro de Pensamentos", desc: "Situação → Pensamento → Emoção → Evidências → Novo pensamento" },
  { name: "STOP", desc: "Pare → Respire → Observe → Proceda" },
  { name: "RAIN", desc: "Reconheça → Permita → Investigue → Nutra" },
  { name: "Ativação Comportamental", desc: "Agende atividades prazerosas para combater a inércia" },
]

export default function TechniqueLib({ lang = "pt" }: Props) {
  const t = {
    title: lang === "pt" ? "Técnicas Terapêuticas" : lang === "es" ? "Técnicas Terapéuticas" : "Therapeutic Techniques",
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-psycho-600 to-indigo-600 px-5 py-4 text-white">
        <h3 className="text-lg font-bold">🧘 {t.title}</h3>
      </div>
      <div className="p-4 max-h-80 overflow-y-auto space-y-2">
        {techniques.map((tech, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100"
          >
            <h4 className="text-sm font-semibold text-slate-800">{tech.name}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{tech.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
