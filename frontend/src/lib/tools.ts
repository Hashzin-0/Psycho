export class FunctionCallTool {
  name: string
  description: string
  parameters: Record<string, any>
  requiredParameters?: string[]

  constructor(name: string, description: string, parameters: Record<string, any>, requiredParameters?: string[]) {
    this.name = name
    this.description = description
    this.parameters = parameters
    this.requiredParameters = requiredParameters
  }

  functionToCall(_parameters: Record<string, any>): any {
    console.log("Default function call")
  }

  getDefinition() {
    return {
      name: this.name,
      description: this.description,
      parameters: { required: this.requiredParameters, ...this.parameters },
    }
  }

  runFunction(parameters: Record<string, any>) {
    return this.functionToCall(parameters)
  }
}

type VolumeCallback = (level: number) => void
type AudioToggleCallback = () => void
type CameraToggleCallback = () => void
type ScreenToggleCallback = () => void
type VoiceCallback = (voice: string) => void
type SettingsOpenCallback = () => void
type ClearChatCallback = () => void
type CommandCallback = (command: string) => void
type LanguageCallback = (lang: string) => void
type ToneCallback = (tone: string) => void
type NotificationCallback = (message: string, emoji?: string) => void

export class SetVolumeTool extends FunctionCallTool {
  private onVolumeChange: VolumeCallback | null = null

  constructor(onVolumeChange?: VolumeCallback) {
    super(
      "set_volume",
      "Adjusts the AI voice output volume. ONLY use when the user explicitly asks for a volume change (e.g., \"agente, volume 30\", \"fale baixo\", \"fale sussurrando\"). Never call this proactively on your own — wait for the user to request it.",
      {
        type: "object",
        properties: {
          level: {
            type: "number",
            description: "Volume level from 1 to 100. 25 = very quiet, 50 = moderate, 75 = conversational, 100 = full volume.",
          },
          reason: {
            type: "string",
            description: "Optional reason for the volume change (e.g., 'user requested lower volume').",
          },
        },
      },
      ["level"]
    )
    if (onVolumeChange) {
      this.onVolumeChange = onVolumeChange
    }
  }

  functionToCall(parameters: Record<string, any>) {
    const level = Math.max(1, Math.min(100, parameters.level || 100))
    this.onVolumeChange?.(level)
    return `Volume set to ${level}${parameters.reason ? ` (${parameters.reason})` : ""}`
  }
}

export class SetVoiceToneTool extends FunctionCallTool {
  private onToneChange: ToneCallback | null = null

  constructor(onToneChange?: ToneCallback) {
    super(
      "set_voice_tone",
      "Adjusts voice delivery tone based on the emotional context of the conversation. Call this proactively when you detect a shift in the user's emotional state. Options: gentle (sad/crying user), calm (anxious/stressed), soothing (angry/frustrated), warm (happy/joyful), natural (default/neutral).",
      {
        type: "object",
        properties: {
          tone: {
            type: "string",
            enum: ["gentle", "calm", "soothing", "warm", "natural"],
            description: "The voice tone to adopt: gentle for sadness, calm for anxiety, soothing for anger, warm for happiness, natural for neutral.",
          },
          reason: {
            type: "string",
            description: "Why this tone is being selected, e.g. 'user sounds anxious' or 'user is sharing something joyful'.",
          },
        },
      },
      ["tone"]
    )
    if (onToneChange) {
      this.onToneChange = onToneChange
    }
  }

  functionToCall(parameters: Record<string, any>) {
    this.onToneChange?.(parameters.tone)
    return `Voice tone set to ${parameters.tone}${parameters.reason ? ` (${parameters.reason})` : ""}`
  }
}

export class ToggleMicrophoneTool extends FunctionCallTool {
  private onToggle: AudioToggleCallback | null = null

  constructor(onToggle?: AudioToggleCallback) {
    super(
      "toggle_microphone",
      "Toggles the microphone on or off. Use this when the user asks to turn the mic on/off, or when you need to stop listening temporarily.",
      {
        type: "object",
        properties: {
          enabled: {
            type: "boolean",
            description: "true to enable microphone, false to disable it.",
          },
        },
      },
      ["enabled"]
    )
    if (onToggle) {
      this.onToggle = onToggle
    }
  }

  functionToCall(parameters: Record<string, any>) {
    this.onToggle?.()
    return parameters.enabled ? "Microphone activated" : "Microphone deactivated"
  }
}

export class SetVoiceTool extends FunctionCallTool {
  private onVoiceChange: VoiceCallback | null = null

  constructor(onVoiceChange?: VoiceCallback) {
    super(
      "set_voice",
      "Changes the AI voice to one of the available options. Puck (balanced, default), Charon (deep, warm), Kore (bright, clear), Fenrir (strong, assertive), Aoede (soft, melodic).",
      {
        type: "object",
        properties: {
          voice: {
            type: "string",
            enum: ["Puck", "Charon", "Kore", "Fenrir", "Aoede"],
            description: "Voice name: Puck (balanced), Charon (deep), Kore (bright), Fenrir (assertive), Aoede (soft).",
          },
        },
      },
      ["voice"]
    )
    if (onVoiceChange) {
      this.onVoiceChange = onVoiceChange
    }
  }

  functionToCall(parameters: Record<string, any>) {
    this.onVoiceChange?.(parameters.voice)
    return `Voice changed to ${parameters.voice}`
  }
}

export class ToggleCameraTool extends FunctionCallTool {
  private onToggle: CameraToggleCallback | null = null

  constructor(onToggle?: CameraToggleCallback) {
    super(
      "toggle_camera",
      "Turns the camera on or off. When on, the AI can see the user's video feed. Use for emotional state analysis via facial expressions, or when the user wants to show something visually.",
      {
        type: "object",
        properties: {
          enabled: {
            type: "boolean",
            description: "true to enable camera, false to disable it.",
          },
        },
      },
      ["enabled"]
    )
    if (onToggle) {
      this.onToggle = onToggle
    }
  }

  functionToCall(parameters: Record<string, any>) {
    this.onToggle?.()
    return parameters.enabled ? "Camera activated, I can now see you" : "Camera deactivated"
  }
}

export class ToggleScreenShareTool extends FunctionCallTool {
  private onToggle: ScreenToggleCallback | null = null

  constructor(onToggle?: ScreenToggleCallback) {
    super(
      "toggle_screen_share",
      "Starts or stops screen sharing. When active, the AI can see the user's screen. Use when the user wants to show something, or when screen context would help the conversation (e.g., showing a document, website, or app).",
      {
        type: "object",
        properties: {
          enabled: {
            type: "boolean",
            description: "true to start screen sharing, false to stop.",
          },
        },
      },
      ["enabled"]
    )
    if (onToggle) {
      this.onToggle = onToggle
    }
  }

  functionToCall(parameters: Record<string, any>) {
    this.onToggle?.()
    return parameters.enabled ? "Screen sharing activated, I can now see your screen" : "Screen sharing deactivated"
  }
}

export class OpenSettingsTool extends FunctionCallTool {
  private onOpen: SettingsOpenCallback | null = null

  constructor(onOpen?: SettingsOpenCallback) {
    super(
      "open_settings",
      "Opens the settings/preferences dialog so the user can adjust their preferences like voice, volume, language, and audio quality.",
      {
        type: "object",
        properties: {},
      }
    )
    if (onOpen) {
      this.onOpen = onOpen
    }
  }

  functionToCall() {
    this.onOpen?.()
    return "Settings dialog opened"
  }
}

export class ClearChatTool extends FunctionCallTool {
  private onClear: ClearChatCallback | null = null

  constructor(onClear?: ClearChatCallback) {
    super(
      "clear_chat",
      "Clears the current conversation history from the chat display. Use when the user asks to clear/start fresh, or after a '/clear' command.",
      {
        type: "object",
        properties: {},
      }
    )
    if (onClear) {
      this.onClear = onClear
    }
  }

  functionToCall() {
    this.onClear?.()
    return "Chat cleared"
  }
}

export class RunCommandTool extends FunctionCallTool {
  private onCommand: CommandCallback | null = null

  constructor(onCommand?: CommandCallback) {
    super(
      "run_command",
      "Executes a built-in command or opens a therapeutic tool. Use this when the user asks for a specific technique or tool. Available commands include: help, mood, history, breathing, mindfulness, cbt, grounding, crisis, goals, assessment, references, technique, journal.",
      {
        type: "object",
        properties: {
          command: {
            type: "string",
            enum: ["mood", "breathing", "mindfulness", "cbt", "grounding", "crisis", "goals", "assessment", "journal", "references", "technique"],
            description: "The command/tool to execute. mood=emotion check-in, breathing=guided breathing, mindfulness=meditation, cbt=thought record, grounding=5-4-3-2-1, crisis=emergency support, goals=goal tracker, assessment=questionnaire, journal=diary entry, references=scientific refs, technique=browse techniques.",
          },
        },
      },
      ["command"]
    )
    if (onCommand) {
      this.onCommand = onCommand
    }
  }

  functionToCall(parameters: Record<string, any>) {
    this.onCommand?.(parameters.command)
    return `Command /${parameters.command} executed`
  }
}

export class SetLanguageTool extends FunctionCallTool {
  private onLanguageChange: LanguageCallback | null = null

  constructor(onLanguageChange?: LanguageCallback) {
    super(
      "set_language",
      "Changes the conversation language. Use when the user asks to switch languages. Supports Portuguese (pt), English (en), and Spanish (es).",
      {
        type: "object",
        properties: {
          language: {
            type: "string",
            enum: ["pt", "en", "es"],
            description: "Language code: pt=Português, en=English, es=Español.",
          },
        },
      },
      ["language"]
    )
    if (onLanguageChange) {
      this.onLanguageChange = onLanguageChange
    }
  }

  functionToCall(parameters: Record<string, any>) {
    this.onLanguageChange?.(parameters.language)
    return `Language changed to ${parameters.language}`
  }
}

export class ShowNotificationTool extends FunctionCallTool {
  private onNotify: NotificationCallback | null = null

  constructor(onNotify?: NotificationCallback) {
    super(
      "show_notification",
      "Shows a notification/toast message to the user with an optional emoji icon. Use for reminders, gentle nudges, or non-intrusive updates.",
      {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The notification message to display.",
          },
          emoji: {
            type: "string",
            description: "Optional emoji icon for the notification (e.g., '💜', '🧘', '📋').",
          },
        },
      },
      ["message"]
    )
    if (onNotify) {
      this.onNotify = onNotify
    }
  }

  functionToCall(parameters: Record<string, any>) {
    this.onNotify?.(parameters.message, parameters.emoji)
    return "Notification displayed"
  }
}
