import { FunctionCallTool } from "./tools"

// ─── Timer Tools ─────────────────────────────────────────

type SetTimerCallback = (minutes: number, label: string) => string
type CancelTimerCallback = (timerId: string) => boolean

export class SetTimerTool extends FunctionCallTool {
  private onSetTimer: SetTimerCallback | null = null

  constructor(onSetTimer?: SetTimerCallback) {
    super(
      "set_timer",
      "Sets a countdown timer for cooking. Use when the user needs to time boiling, roasting, baking, or any cooking process. The timer will notify the user when time is up.",
      {
        type: "object",
        properties: {
          minutes: {
            type: "number",
            description: "Duration in minutes for the timer (1-480).",
          },
          label: {
            type: "string",
            description: "Label for what is being timed (e.g., 'pasta', 'rice', 'roast chicken').",
          },
        },
      },
      ["minutes"]
    )
    if (onSetTimer) {
      this.onSetTimer = onSetTimer
    }
  }

  functionToCall(parameters: Record<string, any>) {
    const minutes = Math.max(1, Math.min(480, parameters.minutes || 1))
    const label = parameters.label || "Timer"
    return this.onSetTimer?.(minutes, label) || `Timer set for ${minutes} minutes: ${label}`
  }
}

export class CancelTimerTool extends FunctionCallTool {
  private onCancel: CancelTimerCallback | null = null

  constructor(onCancel?: CancelTimerCallback) {
    super(
      "cancel_timer",
      "Cancels a previously set cooking timer by its ID.",
      {
        type: "object",
        properties: {
          timer_id: {
            type: "string",
            description: "The ID of the timer to cancel.",
          },
        },
      },
      ["timer_id"]
    )
    if (onCancel) {
      this.onCancel = onCancel
    }
  }

  functionToCall(parameters: Record<string, any>) {
    const ok = this.onCancel?.(parameters.timer_id)
    return ok ? `Timer ${parameters.timer_id} cancelled` : `Timer ${parameters.timer_id} not found`
  }
}

export class ListTimersTool extends FunctionCallTool {
  constructor() {
    super(
      "list_timers",
      "Lists all currently active cooking timers with their remaining time and labels.",
      {
        type: "object",
        properties: {},
      }
    )
  }

  functionToCall() {
    // The frontend handles this — return instruction
    return "Active timers are displayed on the timer panel"
  }
}

// ─── Measurement Tools ────────────────────────────────────

export class ConvertMeasurementTool extends FunctionCallTool {
  constructor() {
    super(
      "convert_measurement",
      "Converts cooking measurements between different units. Supports volume (cups, ml, tbsp, tsp, liters), weight (g, kg, oz, lb), and temperature (C, F).",
      {
        type: "object",
        properties: {
          value: {
            type: "number",
            description: "The numeric value to convert.",
          },
          from_unit: {
            type: "string",
            description: "Source unit: cups, ml, tbsp, tsp, l, g, kg, oz, lb, C, F.",
          },
          to_unit: {
            type: "string",
            description: "Target unit: cups, ml, tbsp, tsp, l, g, kg, oz, lb, C, F.",
          },
        },
      },
      ["value", "from_unit", "to_unit"]
    )
  }

  functionToCall(parameters: Record<string, any>) {
    const value = parameters.value
    const from = parameters.from_unit.toLowerCase()
    const to = parameters.to_unit.toLowerCase()

    const conversions: Record<string, any> = {
      cups: { ml: 240, l: 0.24, tbsp: 16, tsp: 48, oz: 8.115 },
      ml: { cups: 1 / 240, l: 0.001, tbsp: 0.0676, tsp: 0.2029, oz: 0.0338 },
      l: { cups: 4.227, ml: 1000, tbsp: 67.628, tsp: 202.884, oz: 33.814 },
      tbsp: { cups: 1 / 16, ml: 14.787, tsp: 3, oz: 0.5 },
      tsp: { cups: 1 / 48, ml: 4.929, tbsp: 1 / 3, oz: 0.1667 },
      g: { kg: 0.001, oz: 0.0353, lb: 0.0022 },
      kg: { g: 1000, oz: 35.274, lb: 2.205 },
      oz: { g: 28.35, kg: 0.0283, lb: 0.0625, cups: 0.125, ml: 29.574, tbsp: 2, tsp: 6 },
      lb: { g: 453.592, kg: 0.454, oz: 16 },
      c: { f: (v: number) => v * 9 / 5 + 32 },
      f: { c: (v: number) => (v - 32) * 5 / 9 },
    }

    const fromConv = conversions[from]
    if (!fromConv) return `Unknown unit: ${from}`

    const toConv = fromConv[to]
    if (toConv === undefined) return `Cannot convert from ${from} to ${to}`

    if (typeof toConv === "function") {
      const result = toConv(value)
      return `${value}°${from.toUpperCase()} = ${Math.round(result * 10) / 10}°${to.toUpperCase()}`
    }

    const result = value * toConv
    return `${value} ${from} = ${Math.round(result * 100) / 100} ${to}`
  }
}

export class ScaleRecipeTool extends FunctionCallTool {
  constructor() {
    super(
      "scale_recipe",
      "Scales ingredient quantities from one serving size to another. Provide the ingredients as a JSON list and the original/target servings.",
      {
        type: "object",
        properties: {
          ingredients_json: {
            type: "string",
            description: "JSON array of ingredients with amounts, e.g., [{'name':'flour','amount':2,'unit':'cups'},{'name':'sugar','amount':1,'unit':'cups'}]",
          },
          from_servings: {
            type: "number",
            description: "Original number of servings the recipe makes.",
          },
          to_servings: {
            type: "number",
            description: "Desired number of servings.",
          },
        },
      },
      ["ingredients_json", "from_servings", "to_servings"]
    )
  }

  functionToCall(parameters: Record<string, any>) {
    try {
      const ingredients = JSON.parse(parameters.ingredients_json)
      const ratio = parameters.to_servings / parameters.from_servings
      const scaled = ingredients.map((i: any) => ({
        ...i,
        amount: Math.round(i.amount * ratio * 100) / 100,
      }))
      return JSON.stringify(scaled)
    } catch {
      return "Error scaling recipe: invalid ingredients JSON"
    }
  }
}

// ─── Recipe Search Tool ──────────────────────────────────

export class SearchRecipesTool extends FunctionCallTool {
  constructor() {
    super(
      "search_recipes",
      "Searches the gastronomy encyclopedia for recipes, techniques, ingredient knowledge, and cooking references.",
      {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query for what the user wants to know (e.g., 'how to make risotto', 'italian cuisine', 'sous vide steak').",
          },
          cuisine: {
            type: "string",
            description: "Optional cuisine filter (italian, japanese, brazilian, french, mexican, indian).",
          },
          limit: {
            type: "number",
            description: "Maximum number of results (1-10, default 5).",
          },
        },
      },
      ["query"]
    )
  }
}

// ─── Log Cooked Recipe Tool ──────────────────────────────

type LogCookedCallback = (title: string, notes: string, rating: number) => void

export class LogCookedRecipeTool extends FunctionCallTool {
  private onLog: LogCookedCallback | null = null

  constructor(onLog?: LogCookedCallback) {
    super(
      "log_cooked_recipe",
      "Logs a recipe that the user has cooked, with optional notes and rating. Use this when the user says they made a recipe and wants to save it.",
      {
        type: "object",
        properties: {
          recipe_title: {
            type: "string",
            description: "Name of the recipe that was cooked.",
          },
          notes: {
            type: "string",
            description: "Optional notes about how it turned out, modifications made, etc.",
          },
          rating: {
            type: "number",
            description: "Optional rating from 1 to 5 stars.",
          },
        },
      },
      ["recipe_title"]
    )
    if (onLog) {
      this.onLog = onLog
    }
  }

  functionToCall(parameters: Record<string, any>) {
    this.onLog?.(parameters.recipe_title, parameters.notes || "", parameters.rating || 0)
    return `Recipe logged: ${parameters.recipe_title}${parameters.rating ? ` (${parameters.rating}/5 stars)` : ""}`
  }
}

// ─── Substitute Tool ─────────────────────────────────────

export class SuggestSubstituteTool extends FunctionCallTool {
  constructor() {
    super(
      "suggest_substitute",
      "Suggests ingredient substitutions based on dietary restrictions or missing ingredients. Covers common swaps for eggs, dairy, flour, sugar, and more.",
      {
        type: "object",
        properties: {
          ingredient: {
            type: "string",
            description: "The ingredient to substitute (e.g., 'egg', 'butter', 'milk', 'flour').",
          },
          dietary_restriction: {
            type: "string",
            description: "Optional dietary restriction: 'vegan', 'vegetarian', 'gluten-free', 'lactose-free', 'low-carb', 'nut-free'.",
          },
        },
      },
      ["ingredient"]
    )
  }

  functionToCall(parameters: Record<string, any>) {
    const ingredient = parameters.ingredient.toLowerCase()
    const restriction = (parameters.dietary_restriction || "").toLowerCase()

    const subs: Record<string, Record<string, string[]>> = {
      egg: {
        general: ["1/4 cup unsweetened applesauce + 1 tsp baking powder per egg", "1 tbsp ground flaxseed + 3 tbsp water (let sit 5 min)", "1/4 cup silken tofu blended"],
        vegan: ["1 tbsp ground flaxseed + 3 tbsp water", "1/4 cup mashed banana", "1/4 cup pumpkin puree"],
        "gluten-free": ["Same as general — eggs are naturally gluten-free"],
      },
      butter: {
        general: ["3/4 cup vegetable oil per cup of butter", "1 cup coconut oil per cup of butter", "1 cup applesauce (for baking, lower fat)"],
        vegan: ["1 cup coconut oil or vegan butter", "1/2 cup avocado + 1/2 cup oil"],
        "lactose-free": ["1 cup coconut oil", "1 cup vegetable shortening", "1 cup olive oil (savory dishes)"],
      },
      milk: {
        general: ["1 cup plant milk (soy, oat, almond)", "1 cup water + 1 tbsp coconut cream (for richness)"],
        vegan: ["1 cup oat milk (best for coffee)", "1 cup soy milk (best for baking)", "1 cup almond milk (low calorie)"],
        "lactose-free": ["1 cup lactose-free milk", "1 cup oat milk", "1 cup rice milk"],
      },
      flour: {
        general: ["1 cup almond flour + 1/4 cup coconut flour (low carb)", "1 cup oat flour (blended oats)"],
        "gluten-free": ["1 cup GF all-purpose blend + 1 tsp xanthan gum", "1/2 cup almond flour + 1/2 cup oat flour", "1 cup chickpea flour (socca, savory)"],
      },
      sugar: {
        general: ["3/4 cup honey per cup sugar (reduce liquid by 1/4)", "3/4 cup maple syrup per cup sugar", "1 cup coconut sugar (1:1)"],
        vegan: ["3/4 cup maple syrup", "3/4 cup agave nectar", "1 cup coconut sugar"],
        "low-carb": ["1/2 cup stevia/erythritol blend (adjust to taste)", "1/4 cup monk fruit sweetener"],
      },
      cream: {
        general: ["1 cup coconut cream (canned, chilled)", "1 cup cashew cream (soaked cashews blended)", "1 cup silken tofu blended"],
        vegan: ["1 cup coconut cream", "1 cup cashew cream"],
        "lactose-free": ["1 cup oat cream", "1 cup coconut cream"],
      },
      cheese: {
        general: ["1 cup nutritional yeast for cheesy flavor (sauces)", "1 cup soaked cashews blended (cheese sauce)", "1/2 cup tofu crumbled (ricotta substitute)"],
        vegan: ["1 cup cashew cheese", "1/2 cup tofu + 1 tbsp nutritional yeast", "1 cup potato + carrot + nutritional yeast (nacho cheese)"],
        "lactose-free": ["Lactose-free cheese brands available", "1 cup cashew cream cheese"],
      },
    }

    const matches = subs[ingredient]
    if (!matches) return `I don't have a specific substitution for '${ingredient}'. Could you describe what you're making?`

    const options = restriction && matches[restriction] ? matches[restriction] : matches["general"]
    return `Substitutes for **${ingredient}**${restriction ? ` (${restriction})` : ""}:\n${options.map((s, i) => `  ${i + 1}. ${s}`).join("\n")}`
  }
}
