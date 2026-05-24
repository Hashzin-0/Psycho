import type { Command } from "./commands"
import type { FunctionCallTool } from "./tools"
import { COMMANDS } from "./commands"
import { COMMANDS_WELLINGTON } from "./commandsWellington"
import { SYSTEM_PROMPT, GREETING_MESSAGES } from "./systemPrompt"
import { SYSTEM_PROMPT_WELLINGTON, GREETING_MESSAGES_WELLINGTON } from "./systemPromptWellington"
import {
  SetVolumeTool, SetVoiceToneTool,
  ToggleMicrophoneTool, SetVoiceTool,
  ToggleCameraTool, ToggleScreenShareTool,
  OpenSettingsTool, ClearChatTool, RunCommandTool,
  SetLanguageTool, ShowNotificationTool,
} from "./tools"
import {
  SetTimerTool, CancelTimerTool, ListTimersTool,
  ConvertMeasurementTool, ScaleRecipeTool,
  SearchRecipesTool, LogCookedRecipeTool,
  SuggestSubstituteTool,
} from "./toolsWellington"

export type AgentId = "psycho" | "wellington"

export interface AgentConfig {
  id: AgentId
  name: string
  emoji: string
  wakeWords: string[]
  systemPrompt: string
  greetingMessages: Record<string, string>
  commands: Command[]
  subtitle: Record<string, string>
  primaryColor: string
  primaryGradient: string
  defaultVoice: string
  chatLabel: string
  systemLabel: string
}

export interface AgentPages {
  id: string
  label: Record<string, string>
  component: string
}

export function createAgentTools(agentId: AgentId, callbacks: Record<string, Function>): FunctionCallTool[] {
  const shared = [
    new SetVolumeTool(callbacks.onVolumeChange as any),
    new SetVoiceToneTool(callbacks.onToneChange as any),
    new ToggleMicrophoneTool(callbacks.onToggleAudio as any),
    new SetVoiceTool(callbacks.onVoiceChange as any),
    new ToggleCameraTool(callbacks.onToggleVideo as any),
    new ToggleScreenShareTool(callbacks.onToggleScreen as any),
    new OpenSettingsTool(callbacks.onOpenSettings as any),
    new ClearChatTool(callbacks.onClearChat as any),
    new RunCommandTool(callbacks.onCommand as any),
    new SetLanguageTool(callbacks.onLanguageChange as any),
    new ShowNotificationTool(callbacks.onNotification as any),
  ]

  if (agentId === "wellington") {
    return [
      ...shared,
      new SetTimerTool(callbacks.onSetTimer as any),
      new CancelTimerTool(callbacks.onCancelTimer as any),
      new ListTimersTool(),
      new ConvertMeasurementTool(),
      new ScaleRecipeTool(),
      new SearchRecipesTool(),
      new LogCookedRecipeTool(callbacks.onLogCooked as any),
      new SuggestSubstituteTool(),
    ]
  }

  return shared
}

export function getAgentCommands(agentId: AgentId): Command[] {
  if (agentId === "wellington") return COMMANDS_WELLINGTON
  return COMMANDS
}

export const AGENTS: Record<AgentId, AgentConfig> = {
  psycho: {
    id: "psycho",
    name: "Psycho",
    emoji: "💜",
    wakeWords: ["psycho", "psico", "psyco"],
    systemPrompt: SYSTEM_PROMPT,
    greetingMessages: GREETING_MESSAGES,
    commands: COMMANDS,
    subtitle: {
      pt: "Seu Assistente Psicológico Pessoal",
      en: "Your Personal Psychological Assistant",
      es: "Tu Asistente Psicológico Personal",
    },
    primaryColor: "psycho",
    primaryGradient: "from-psycho-700 via-psycho-600 to-indigo-600",
    defaultVoice: "Puck",
    chatLabel: "PSYCHO",
    systemLabel: "SISTEMA",
  },
  wellington: {
    id: "wellington",
    name: "Wellington",
    emoji: "🍳",
    wakeWords: ["wellington", "wellingthon", "welington"],
    systemPrompt: SYSTEM_PROMPT_WELLINGTON,
    greetingMessages: GREETING_MESSAGES_WELLINGTON,
    commands: COMMANDS_WELLINGTON,
    subtitle: {
      pt: "Seu Assistente Gastronômico Pessoal",
      en: "Your Personal Gastronomic Assistant",
      es: "Tu Asistente Gastronómico Personal",
    },
    primaryColor: "orange",
    primaryGradient: "from-orange-600 via-amber-600 to-yellow-700",
    defaultVoice: "Charon",
    chatLabel: "WELLINGTON",
    systemLabel: "SISTEMA",
  },
}

export const PSYCHO_PAGES: AgentPages[] = [
  { id: "sessions", label: { pt: "Sessões", en: "Sessions", es: "Sesiones" }, component: "SessionReview" },
  { id: "mood", label: { pt: "Humor", en: "Mood", es: "Humor" }, component: "MoodChart" },
  { id: "goals", label: { pt: "Metas", en: "Goals", es: "Metas" }, component: "GoalsTracker" },
  { id: "techniques", label: { pt: "Técnicas", en: "Techniques", es: "Técnicas" }, component: "TechniqueLib" },
]

export const WELLINGTON_PAGES: AgentPages[] = [
  { id: "encyclopedia", label: { pt: "Enciclopédia", en: "Encyclopedia", es: "Enciclopedia" }, component: "RecipeEncyclopedia" },
  { id: "cooked", label: { pt: "Receitas Feitas", en: "Cooked", es: "Recetas Hechas" }, component: "CookedRecipes" },
  { id: "custom", label: { pt: "Customizadas", en: "Custom", es: "Personalizadas" }, component: "CustomRecipes" },
  { id: "timers", label: { pt: "Timers", en: "Timers", es: "Temporizadores" }, component: "TimerPanel" },
]

export function getAgentPages(agentId: AgentId): AgentPages[] {
  if (agentId === "wellington") return WELLINGTON_PAGES
  return PSYCHO_PAGES
}
