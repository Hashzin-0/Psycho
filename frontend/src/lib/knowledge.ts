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

export async function createSession(title = "Nova Sessão"): Promise<string> {
  try {
    const res = await fetch("/api/session/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
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

export async function listSessions(): Promise<SessionData[]> {
  try {
    const res = await fetch("/api/sessions")
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

export async function listGoals(): Promise<GoalData[]> {
  try {
    const res = await fetch("/api/goals")
    const data = await res.json()
    return data.goals || []
  } catch {
    return []
  }
}
