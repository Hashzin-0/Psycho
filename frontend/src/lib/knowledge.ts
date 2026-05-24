export interface KnowledgeEntry {
  id: string
  category: string
  title: string
  content: string
  references: string
  score: number
}

export interface SessionData {
  session_id: string
  title: string
  created_at?: string
  updated_at?: string
  message_count?: number
}

export interface MoodEntry {
  mood: string
  intensity: number
  note: string
  created_at: string
}

export interface GoalData {
  id: number
  title: string
  description: string
  category: string
  target_days: number
  current_streak: number
  created_at: string
  completed_at: string | null
}

export async function searchKnowledge(query: string, limit = 3): Promise<KnowledgeEntry[]> {
  try {
    const res = await fetch("/api/rag/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
    })
    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

export async function getKnowledgeEntry(id: string): Promise<KnowledgeEntry | null> {
  try {
    const res = await fetch(`/api/rag/entry/${id}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const res = await fetch("/api/rag/categories")
    const data = await res.json()
    return data.categories || []
  } catch {
    return []
  }
}

export async function createSession(title = "Nova Sessão", agentId?: string): Promise<string> {
  try {
    const body: Record<string, any> = { title }
    if (agentId) body.agent_id = agentId
    const res = await fetch("/api/session/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return data.session_id
  } catch {
    return crypto.randomUUID()
  }
}

export async function saveMessage(sessionId: string, role: string, content: string) {
  try {
    await fetch("/api/session/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, role, content }),
    })
  } catch {
    // silent fail
  }
}

export async function getSessionHistory(sessionId: string): Promise<{ role: string; content: string }[]> {
  try {
    const res = await fetch(`/api/session/${sessionId}`)
    const data = await res.json()
    return data.messages || []
  } catch {
    return []
  }
}

export async function listSessions(agentId?: string): Promise<SessionData[]> {
  try {
    const params = agentId ? `?agent_id=${encodeURIComponent(agentId)}` : ""
    const res = await fetch(`/api/sessions${params}`)
    const data = await res.json()
    return data.sessions || []
  } catch {
    return []
  }
}

export async function saveMood(sessionId: string, mood: string, intensity: number, note = "") {
  try {
    await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, mood, intensity, note }),
    })
  } catch {
    // silent fail
  }
}

export async function getMoodHistory(days = 30): Promise<MoodEntry[]> {
  try {
    const res = await fetch(`/api/mood/history?days=${days}`)
    const data = await res.json()
    return data.entries || []
  } catch {
    return []
  }
}

export async function createGoal(title: string, description = "", category = "wellness", targetDays = 21) {
  try {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, target_days: targetDays }),
    })
    return await res.json()
  } catch {
    return null
  }
}

export async function listGoals(activeOnly: boolean = false, agentId: string = "psycho"): Promise<GoalData[]> {
  try {
    const params = new URLSearchParams({ agent_id: agentId, active_only: String(activeOnly) })
    const res = await fetch(`/api/goals?${params}`)
    const data = await res.json()
    return data.goals || []
  } catch {
    return []
  }
}

export async function getSessionContext(agentId: string = "psycho"): Promise<{
  recent_sessions: any[]
  mood_trend: any[]
  active_goals: any[]
}> {
  try {
    const res = await fetch("/api/session/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    })
    return await res.json()
  } catch {
    return { recent_sessions: [], mood_trend: [], active_goals: [] }
  }
}

export async function saveProfile(profileData: any): Promise<any> {
  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "default", name: "Minha Voz", profile_data: profileData }),
    })
    return await res.json()
  } catch {
    return null
  }
}

export async function getProfile(): Promise<any | null> {
  try {
    const res = await fetch("/api/profile/default")
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function deleteProfile(): Promise<boolean> {
  try {
    const res = await fetch("/api/profile/default", { method: "DELETE" })
    return res.ok
  } catch {
    return false
  }
}

export async function saveSettings(settings: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function getSettings(): Promise<Record<string, any>> {
  try {
    const res = await fetch("/api/settings")
    const data = await res.json()
    return data.settings || {}
  } catch {
    return {}
  }
}

export async function saveSessionSummary(sessionId: string, summary: string) {
  try {
    await fetch(`/api/session/${sessionId}/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, summary }),
    })
  } catch {
    // silent fail
  }
}

// ─── Wellington / Gastronomy API ──────────────────────────

export interface EncyclopediaEntry {
  id: string
  category: string
  title: string
  content: string
  references: string
  score?: number
}

export interface CustomRecipe {
  id: string
  title: string
  original_recipe_id?: string
  ingredients: string
  instructions: string
  notes: string
  created_at?: string
  updated_at?: string
}

export interface CookedEntry {
  id: number
  session_id: string
  recipe_id: string
  recipe_title: string
  notes: string
  rating: number
  difficulty: string
  cooking_time_minutes: number
  created_at: string
}

export interface CookingHistoryEntry {
  id: number
  session_id: string
  event_type: string
  description: string
  details: string
  created_at: string
}

export async function searchEncyclopedia(query: string, limit = 5): Promise<EncyclopediaEntry[]> {
  try {
    const res = await fetch("/api/wellington/recipes/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
    })
    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

export async function getEncyclopediaEntry(id: string): Promise<EncyclopediaEntry | null> {
  try {
    const res = await fetch(`/api/wellington/recipes/entry/${id}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function getEncyclopediaCategories(): Promise<string[]> {
  try {
    const res = await fetch("/api/wellington/recipes/categories")
    const data = await res.json()
    return data.categories || []
  } catch {
    return []
  }
}

export async function listEncyclopedia(): Promise<EncyclopediaEntry[]> {
  try {
    const res = await fetch("/api/wellington/encyclopedia")
    const data = await res.json()
    return data.entries || []
  } catch {
    return []
  }
}

export async function saveCustomRecipe(recipe: {
  id?: string
  title: string
  original_recipe_id?: string
  ingredients: string
  instructions: string
  notes?: string
}): Promise<any> {
  try {
    const res = await fetch("/api/wellington/recipes/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipe),
    })
    return await res.json()
  } catch {
    return null
  }
}

export async function listCustomRecipes(): Promise<CustomRecipe[]> {
  try {
    const res = await fetch("/api/wellington/recipes/custom")
    const data = await res.json()
    return data.recipes || []
  } catch {
    return []
  }
}

export async function getCustomRecipe(id: string): Promise<CustomRecipe | null> {
  try {
    const res = await fetch(`/api/wellington/recipes/custom/${id}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function deleteCustomRecipe(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/wellington/recipes/custom/${id}`, { method: "DELETE" })
    return res.ok
  } catch {
    return false
  }
}

export async function logCookedRecipe(data: {
  session_id?: string
  recipe_id?: string
  recipe_title: string
  notes?: string
  rating?: number
  difficulty?: string
  cooking_time_minutes?: number
}): Promise<any> {
  try {
    const res = await fetch("/api/wellington/cooked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return await res.json()
  } catch {
    return null
  }
}

export async function listCookedRecipes(): Promise<CookedEntry[]> {
  try {
    const res = await fetch("/api/wellington/cooked")
    const data = await res.json()
    return data.entries || []
  } catch {
    return []
  }
}

export async function getAgents(): Promise<{ id: string; name: string; emoji: string; subtitle_pt: string }[]> {
  try {
    const res = await fetch("/api/agents")
    const data = await res.json()
    return data.agents || []
  } catch {
    return []
  }
}
