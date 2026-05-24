import type { Command } from "./commands"

export const COMMANDS_WELLINGTON: Command[] = [
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
    name: "recipe",
    aliases: ["receita", "receta", "receitas", "recipes"],
    description: {
      pt: "Busca receitas na enciclopédia gastronômica",
      en: "Search recipes in the gastronomy encyclopedia",
      es: "Busca recetas en la enciclopedia gastronómica",
    },
  },
  {
    name: "encyclopedia",
    aliases: ["enciclopedia", "conhecimento", "conocimiento", "saber"],
    description: {
      pt: "Navega pela enciclopédia culinária",
      en: "Browse the culinary encyclopedia",
      es: "Navega por la enciclopedia culinaria",
    },
  },
  {
    name: "convert",
    aliases: ["converter", "conversao", "conversão", "conversion", "conversor"],
    description: {
      pt: "Converte medidas culinárias (xícaras para ml, °F para °C, etc.)",
      en: "Convert cooking measurements (cups to ml, °F to °C, etc.)",
      es: "Convierte medidas culinarias (tazas a ml, °F a °C, etc.)",
    },
  },
  {
    name: "timer",
    aliases: ["temporizador", "cronometro", "cronómetro", "alarme", "alarma"],
    description: {
      pt: "Define um timer para cozinhar",
      en: "Set a cooking timer",
      es: "Configura un temporizador para cocinar",
    },
  },
  {
    name: "custom",
    aliases: ["customizada", "personalizada", "customizado", "minhas"],
    description: {
      pt: "Mostra ou salva receitas customizadas",
      en: "View or save custom recipes",
      es: "Muestra o guarda recetas personalizadas",
    },
  },
  {
    name: "history",
    aliases: ["historico", "histórico", "pratos", "platos", "cozinhados"],
    description: {
      pt: "Mostra o histórico de receitas preparadas",
      en: "Show cooking history",
      es: "Muestra el historial de recetas preparadas",
    },
  },
  {
    name: "substitute",
    aliases: ["substituir", "substituicao", "substituição", "subs", "alternativa"],
    description: {
      pt: "Sugere substituições para ingredientes",
      en: "Suggest ingredient substitutions",
      es: "Sugiere sustituciones de ingredientes",
    },
  },
  {
    name: "scale",
    aliases: ["escala", "porcoes", "porções", "porciones", "proporcao"],
    description: {
      pt: "Escala uma receita para o número de porções desejado",
      en: "Scale a recipe to desired servings",
      es: "Escala una receta al número de porciones deseado",
    },
  },
  {
    name: "menu",
    aliases: ["cardapio", "cardápio", "planejamento", "plan", "semana"],
    description: {
      pt: "Ajuda com planejamento de refeições",
      en: "Help with meal planning",
      es: "Ayuda con la planificación de comidas",
    },
  },
]

export function getHelpTextWellington(lang: string = "pt"): string {
  const langKey = lang in COMMANDS_WELLINGTON[0].description ? lang : "pt"
  const lines = COMMANDS_WELLINGTON.map((cmd) => {
    const desc = cmd.description[langKey as keyof typeof cmd.description] || cmd.description["pt"]
    const aliases = cmd.aliases.slice(0, 3).map((a) => `/${a}`).join(", ")
    return `  **/${cmd.name}**${aliases ? ` (${aliases})` : ""} — ${desc}`
  })
  return lines.join("\n")
}
