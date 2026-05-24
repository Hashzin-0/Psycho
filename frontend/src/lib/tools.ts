class FunctionCallDefinition {
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
type WhisperCallback = (enabled: boolean) => void

export class SetVolumeTool extends FunctionCallDefinition {
  private onVolumeChange: VolumeCallback | null = null

  constructor(onVolumeChange?: VolumeCallback) {
    super(
      "set_volume",
      "Adjusts the AI voice output volume. Use 25 for whisper/quiet mode, 100 for normal volume. The AI can proactively lower volume when appropriate (sensitive topics, late night, user in public place).",
      {
        type: "object",
        properties: {
          level: {
            type: "number",
            description: "Volume level from 1 to 100. 25 = whisper mode (quiet, gentle), 50 = moderate, 75 = conversational, 100 = full volume.",
          },
          reason: {
            type: "string",
            description: "Optional reason for the volume change (e.g., 'whisper mode', 'sensitive topic', 'user requested').",
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

export class SetWhisperModeTool extends FunctionCallDefinition {
  private onWhisperChange: WhisperCallback | null = null

  constructor(onWhisperChange?: WhisperCallback) {
    super(
      "set_whisper_mode",
      "Toggles whisper mode on or off. When whisper mode is on, the volume is reduced to 25% and the AI speaks softly. Use when the user requests quiet speech, or when context calls for a gentle tone.",
      {
        type: "object",
        properties: {
          enabled: {
            type: "boolean",
            description: "Whether to enable whisper mode (true) or disable it (false).",
          },
        },
      },
      ["enabled"]
    )
    if (onWhisperChange) {
      this.onWhisperChange = onWhisperChange
    }
  }

  functionToCall(parameters: Record<string, any>) {
    this.onWhisperChange?.(!!parameters.enabled)
    return parameters.enabled ? "Whisper mode activated, volume set to 25%" : "Whisper mode deactivated, volume restored to normal"
  }
}

export class ShowNotificationTool extends FunctionCallDefinition {
  constructor() {
    super(
      "show_notification",
      "Shows a notification/toast message to the user with an optional emoji icon.",
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
  }

  functionToCall(parameters: Record<string, any>) {
    const emoji = parameters.emoji || "💜"
    const event = new CustomEvent("psycho-notification", {
      detail: { message: parameters.message, emoji },
    })
    window.dispatchEvent(event)
    return "Notification displayed"
  }
}

export class ShowAlertTool extends FunctionCallDefinition {
  constructor() {
    super(
      "show_alert",
      "Displays an alert dialog to the user with a custom message.",
      {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The message to display in the alert dialog.",
          },
        },
      },
      ["message"]
    )
  }

  functionToCall(parameters: Record<string, any>) {
    alert(parameters.message)
    return "Alert displayed"
  }
}

export class AddCSSStyleTool extends FunctionCallDefinition {
  constructor() {
    super(
      "add_css_style",
      "Injects a CSS style rule into the page.",
      {
        type: "object",
        properties: {
          css: {
            type: "string",
            description: "The CSS rule to inject, e.g. 'body { background: red; }'",
          },
        },
      },
      ["css"]
    )
  }

  functionToCall(parameters: Record<string, any>) {
    const style = document.createElement("style")
    style.textContent = parameters.css
    document.head.appendChild(style)
    return "Style applied: " + parameters.css
  }
}
