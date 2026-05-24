export type CommandHandler = (args: string) => void

export interface Command {
  name: string
  aliases: string[]
  description: Record<string, string>
  handler?: CommandHandler
}

export const COMMANDS: Command[] = [
  {
    name: "help",
    aliases: ["ajuda", "ayuda"],
    description: {
      pt: "Mostra todos os comandos disponíveis",
      en: "Show all available commands",
      es: "Muestra todos los comandos disponibles",
    },
  },
  {
    name: "clear",
    aliases: ["limpar", "limpiar"],
    description: {
      pt: "Limpa a conversa atual",
      en: "Clear the current conversation",
      es: "Limpiar la conversación actual",
    },
  },
  {
    name: "mood",
    aliases: ["humor", "emocao", "emotion", "sentimento", "feeling", "sentimiento"],
    description: {
      pt: "Abre o diário de emoções para registrar como você está se sentindo",
      en: "Open mood diary to track how you're feeling",
      es: "Abre el diario de emociones para registrar cómo te sientes",
    },
  },
  {
    name: "history",
    aliases: ["historico", "histórico", "sessoes", "sessions", "sesiones"],
    description: {
      pt: "Mostra o histórico de sessões anteriores",
      en: "Show session history",
      es: "Muestra el historial de sesiones anteriores",
    },
  },
  {
    name: "breathing",
    aliases: ["respirar", "respiracion", "respiracao", "respiração", "breath"],
    description: {
      pt: "Inicia exercício guiado de respiração",
      en: "Start guided breathing exercise",
      es: "Inicia ejercicio guiado de respiración",
    },
  },
  {
    name: "mindfulness",
    aliases: ["atencao", "atencion", "atenção", "meditacao", "meditação", "meditacion"],
    description: {
      pt: "Inicia uma sessão guiada de mindfulness",
      en: "Start a guided mindfulness session",
      es: "Inicia una sesión guiada de mindfulness",
    },
  },
  {
    name: "cbt",
    aliases: ["tcc", "terapia", "cognitive", "cognitivo"],
    description: {
      pt: "Inicia um registro de pensamentos (TCC)",
      en: "Start a CBT thought record worksheet",
      es: "Inicia un registro de pensamientos (TCC)",
    },
  },
  {
    name: "grounding",
    aliases: ["aterramento", "anclaje", "ancoragem", "5-4-3-2-1"],
    description: {
      pt: "Inicia exercício de aterramento 5-4-3-2-1",
      en: "Start grounding exercise (5-4-3-2-1)",
      es: "Inicia ejercicio de anclaje 5-4-3-2-1",
    },
  },
  {
    name: "crisis",
    aliases: ["crise", "emergencia", "urgência", "emergency", "urgencia", "ajuda"],
    description: {
      pt: "Abre o modo de crise com técnicas de emergência e contatos de apoio",
      en: "Open crisis support mode with emergency techniques and contacts",
      es: "Abre el modo de crisis con técnicas de emergencia y contactos de apoyo",
    },
  },
  {
    name: "volume",
    aliases: ["vol", "som", "sound", "audio"],
    description: {
      pt: "Ajusta o volume da voz (1-100)",
      en: "Adjust voice volume (1-100)",
      es: "Ajusta el volumen de la voz (1-100)",
    },
  },
  {
    name: "goals",
    aliases: ["metas", "objetivos", "bem-estar", "wellness", "bienestar"],
    description: {
      pt: "Abre o acompanhador de metas de bem-estar",
      en: "Open well-being goal tracker",
      es: "Abre el seguimiento de metas de bienestar",
    },
  },
  {
    name: "assessment",
    aliases: ["avaliacao", "avaliação", "evaluacion", "evaluación", "questionario", "questionário", "cuestionario"],
    description: {
      pt: "Abre um questionário psicológico (ansiedade, depressão, estresse)",
      en: "Open a psychological assessment questionnaire (anxiety, depression, stress)",
      es: "Abre un cuestionario psicológico (ansiedad, depresión, estrés)",
    },
  },
  {
    name: "references",
    aliases: ["referencias", "referências", "biblioteca", "artigos", "estudos", "studies"],
    description: {
      pt: "Mostra a biblioteca de referências científicas",
      en: "Show the scientific reference library",
      es: "Muestra la biblioteca de referencias científicas",
    },
  },
  {
    name: "technique",
    aliases: ["tecnica", "técnica", "tecnica", "exercicio", "exercício", "ejercicio"],
    description: {
      pt: "Navega pelas técnicas terapêuticas disponíveis",
      en: "Browse all available therapeutic techniques",
      es: "Navega por las técnicas terapéuticas disponibles",
    },
  },
  {
    name: "journal",
    aliases: ["diario", "escrever", "refletir", "reflexão", "reflexion", "write"],
    description: {
      pt: "Faz uma entrada rápida no diário pessoal",
      en: "Quick journal entry",
      es: "Escribe una entrada rápida en el diario personal",
    },
  },
]

export function detectCommand(text: string): { command: Command; args: string } | null {
  const trimmed = text.trim().toLowerCase()

  for (const cmd of COMMANDS) {
    const allNames = [cmd.name, ...cmd.aliases]
    for (const name of allNames) {
      const pattern = new RegExp(`^/(${name})(\\s+(.*))?$`, "i")
      const match = trimmed.match(pattern)
      if (match) {
        return { command: cmd, args: match[3] || "" }
      }
    }
  }

  return null
}

export function getHelpText(lang: string = "pt"): string {
  const langKey = lang in COMMANDS[0].description ? lang : "pt"
  const lines = COMMANDS.map((cmd) => {
    const desc = cmd.description[langKey as keyof typeof cmd.description] || cmd.description["pt"]
    const aliases = cmd.aliases.slice(0, 3).map((a) => `/${a}`).join(", ")
    return `  **/${cmd.name}**${aliases ? ` (${aliases})` : ""} — ${desc}`
  })
  return lines.join("\n")
}
