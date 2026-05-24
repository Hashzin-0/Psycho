"""Motor de busca semântica para a base de conhecimento psicológico e gastronômico."""

import json
import os
import sqlite3
from typing import Any, Optional

from .knowledge_base import KNOWLEDGE_ENTRIES
from .gastronomy_base import GASTRONOMY_ENTRIES

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "psycho.db")


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Initialize database tables for knowledge base, sessions, and gastronomy."""
    conn = _get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_entries (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            refs TEXT,
            tags TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE NOT NULL,
            agent_id TEXT DEFAULT 'psycho',
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            summary TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(session_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mood_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            agent_id TEXT DEFAULT 'psycho',
            mood TEXT NOT NULL,
            intensity INTEGER NOT NULL,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(session_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            agent_id TEXT DEFAULT 'psycho',
            title TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'wellness',
            target_days INTEGER,
            current_streak INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS voice_profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            profile_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Wellington tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recipe_encyclopedia (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            refs TEXT,
            tags TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS custom_recipes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            original_recipe_id TEXT,
            ingredients TEXT NOT NULL,
            instructions TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cooked_recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            recipe_id TEXT,
            recipe_title TEXT NOT NULL,
            notes TEXT,
            rating INTEGER,
            difficulty TEXT,
            cooking_time_minutes INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cooking_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            agent_id TEXT DEFAULT 'wellington',
            event_type TEXT NOT NULL,
            description TEXT,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Add agent_id column to sessions if missing (migration for existing DB)
    try:
        cursor.execute("ALTER TABLE sessions ADD COLUMN agent_id TEXT DEFAULT 'psycho'")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE mood_entries ADD COLUMN agent_id TEXT DEFAULT 'psycho'")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE goals ADD COLUMN agent_id TEXT DEFAULT 'psycho'")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()


def seed_knowledge():
    """Populate the knowledge base with psychological entries."""
    conn = _get_db()
    cursor = conn.cursor()

    for entry in KNOWLEDGE_ENTRIES:
        cursor.execute(
            """INSERT OR REPLACE INTO knowledge_entries
               (id, category, title, content, refs, tags)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                entry["id"],
                entry["category"],
                entry["title"],
                entry["content"],
                entry.get("references", entry.get("refs", "")),
                ",".join(entry.get("tags", [])),
            ),
        )

    conn.commit()
    conn.close()


def seed_gastronomy():
    """Populate the recipe encyclopedia with gastronomy entries."""
    conn = _get_db()
    cursor = conn.cursor()

    for entry in GASTRONOMY_ENTRIES:
        cursor.execute(
            """INSERT OR REPLACE INTO recipe_encyclopedia
               (id, category, title, content, refs, tags)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                entry["id"],
                entry["category"],
                entry["title"],
                entry["content"],
                entry.get("references", entry.get("refs", "")),
                ",".join(entry.get("tags", [])),
            ),
        )

    conn.commit()
    conn.close()


def search_knowledge(query: str, limit: int = 3) -> list[dict[str, Any]]:
    """Search psychological knowledge base by keyword."""
    conn = _get_db()
    cursor = conn.cursor()

    terms = query.lower().split()
    results = []

    rows = cursor.execute("SELECT * FROM knowledge_entries").fetchall()

    for row in rows:
        score = 0
        entry_tags = (row["tags"] or "").lower()
        entry_content = (row["content"] or "").lower()
        entry_title = (row["title"] or "").lower()

        for term in terms:
            if len(term) < 3:
                continue
            if term in entry_tags:
                score += 5
            if term in entry_title:
                score += 3
            if term in entry_content:
                score += 1

        if score > 0:
            results.append({
                "id": row["id"],
                "category": row["category"],
                "title": row["title"],
                "content": row["content"][:500],
                "references": row["refs"],
                "score": score,
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    conn.close()
    return results[:limit]


def search_recipe_encyclopedia(query: str, limit: int = 5) -> list[dict[str, Any]]:
    """Search gastronomy encyclopedia by keyword."""
    conn = _get_db()
    cursor = conn.cursor()

    terms = query.lower().split()
    results = []

    rows = cursor.execute("SELECT * FROM recipe_encyclopedia").fetchall()

    for row in rows:
        score = 0
        entry_tags = (row["tags"] or "").lower()
        entry_content = (row["content"] or "").lower()
        entry_title = (row["title"] or "").lower()

        for term in terms:
            if len(term) < 3:
                continue
            if term in entry_tags:
                score += 5
            if term in entry_title:
                score += 3
            if term in entry_content:
                score += 1

        if score > 0:
            results.append({
                "id": row["id"],
                "category": row["category"],
                "title": row["title"],
                "content": row["content"][:500],
                "references": row["refs"],
                "score": score,
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    conn.close()
    return results[:limit]


def get_entry(entry_id: str) -> Optional[dict[str, Any]]:
    """Get a single psychology knowledge entry by ID."""
    conn = _get_db()
    cursor = conn.cursor()
    row = cursor.execute(
        "SELECT * FROM knowledge_entries WHERE id = ?", (entry_id,)
    ).fetchone()
    conn.close()

    if row:
        return {
            "id": row["id"],
            "category": row["category"],
            "title": row["title"],
            "content": row["content"],
            "references": row["refs"],
        }
    return None


def get_recipe_entry(entry_id: str) -> Optional[dict[str, Any]]:
    """Get a single gastronomy entry by ID."""
    conn = _get_db()
    cursor = conn.cursor()
    row = cursor.execute(
        "SELECT * FROM recipe_encyclopedia WHERE id = ?", (entry_id,)
    ).fetchone()
    conn.close()

    if row:
        return {
            "id": row["id"],
            "category": row["category"],
            "title": row["title"],
            "content": row["content"],
            "references": row["refs"],
        }
    return None


def get_all_categories() -> list[str]:
    """Get all unique categories from psychology knowledge base."""
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT DISTINCT category FROM knowledge_entries ORDER BY category"
    ).fetchall()
    conn.close()
    return [row["category"] for row in rows]


def get_recipe_categories() -> list[str]:
    """Get all unique categories from gastronomy encyclopedia."""
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT DISTINCT category FROM recipe_encyclopedia ORDER BY category"
    ).fetchall()
    conn.close()
    return [row["category"] for row in rows]


def list_encyclopedia() -> list[dict[str, Any]]:
    """List all gastronomy encyclopedia entries."""
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT id, category, title, refs FROM recipe_encyclopedia ORDER BY category, title"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# Session Management (agent-aware)


def create_session(session_id: str, title: str = "Nova Sessão", agent_id: str = "psycho") -> dict[str, Any]:
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO sessions (session_id, title, agent_id) VALUES (?, ?, ?)",
        (session_id, title, agent_id),
    )
    conn.commit()
    conn.close()
    return {"session_id": session_id, "title": title, "agent_id": agent_id}


def save_message(session_id: str, role: str, content: str):
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE session_id = ?",
        (session_id,),
    )
    cursor.execute(
        "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
        (session_id, role, content),
    )
    conn.commit()
    conn.close()


def get_session_history(session_id: str) -> list[dict[str, Any]]:
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at",
        (session_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def list_sessions(agent_id: Optional[str] = None, limit: int = 20) -> list[dict[str, Any]]:
    conn = _get_db()
    cursor = conn.cursor()
    if agent_id:
        rows = cursor.execute(
            """SELECT session_id, title, created_at, updated_at, agent_id,
                      (SELECT COUNT(*) FROM messages WHERE session_id = sessions.session_id) as message_count
               FROM sessions WHERE agent_id = ? ORDER BY updated_at DESC LIMIT ?""",
            (agent_id, limit),
        ).fetchall()
    else:
        rows = cursor.execute(
            """SELECT session_id, title, created_at, updated_at, agent_id,
                      (SELECT COUNT(*) FROM messages WHERE session_id = sessions.session_id) as message_count
               FROM sessions ORDER BY updated_at DESC LIMIT ?""",
            (limit,),
        ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# Mood Tracking (agent-aware)


def save_mood(session_id: str, mood: str, intensity: int, note: str = "", agent_id: str = "psycho"):
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO mood_entries (session_id, mood, intensity, note, agent_id) VALUES (?, ?, ?, ?, ?)",
        (session_id, mood, intensity, note, agent_id),
    )
    conn.commit()
    conn.close()


def get_mood_history(days: int = 30, agent_id: str = "psycho") -> list[dict[str, Any]]:
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        """SELECT mood, intensity, note, created_at
           FROM mood_entries
           WHERE agent_id = ? AND created_at >= datetime('now', '-' || ? || ' days')
           ORDER BY created_at DESC""",
        (agent_id, days),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# Goals (agent-aware)


def create_goal(title: str, description: str = "", category: str = "wellness", target_days: int = 21, agent_id: str = "psycho") -> dict[str, Any]:
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO goals (title, description, category, target_days, agent_id) VALUES (?, ?, ?, ?, ?)",
        (title, description, category, target_days, agent_id),
    )
    conn.commit()
    goal_id = cursor.lastrowid
    conn.close()
    return {"id": goal_id, "title": title}


def list_goals(active_only: bool = False, agent_id: str = "psycho") -> list[dict[str, Any]]:
    conn = _get_db()
    cursor = conn.cursor()
    if active_only:
        rows = cursor.execute(
            "SELECT * FROM goals WHERE agent_id = ? AND completed_at IS NULL ORDER BY created_at DESC",
            (agent_id,),
        ).fetchall()
    else:
        rows = cursor.execute(
            "SELECT * FROM goals WHERE agent_id = ? ORDER BY created_at DESC",
            (agent_id,),
        ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_session_context(agent_id: str = "psycho") -> dict[str, Any]:
    """Get context from recent sessions, mood entries, and active goals for a specific agent."""
    conn = _get_db()
    cursor = conn.cursor()

    recent_sessions = cursor.execute(
        """SELECT session_id, title, summary, created_at
           FROM sessions WHERE agent_id = ? AND summary IS NOT NULL AND summary != ''
           ORDER BY updated_at DESC LIMIT 5""",
        (agent_id,),
    ).fetchall()

    mood_trend = cursor.execute(
        """SELECT mood, intensity, note, created_at
           FROM mood_entries
           WHERE agent_id = ? AND created_at >= datetime('now', '-30 days')
           ORDER BY created_at DESC LIMIT 10""",
        (agent_id,),
    ).fetchall()

    active_goals = cursor.execute(
        "SELECT * FROM goals WHERE agent_id = ? AND completed_at IS NULL ORDER BY created_at DESC LIMIT 5",
        (agent_id,),
    ).fetchall()

    conn.close()

    return {
        "recent_sessions": [dict(s) for s in recent_sessions],
        "mood_trend": [dict(m) for m in mood_trend],
        "active_goals": [dict(g) for g in active_goals],
    }


def update_session_summary(session_id: str, summary: str):
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE sessions SET summary = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?",
        (summary, session_id),
    )
    conn.commit()
    conn.close()


# Custom Recipes


def save_custom_recipe(recipe_id: str, title: str, original_recipe_id: str, ingredients: str, instructions: str, notes: str = ""):
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT OR REPLACE INTO custom_recipes
           (id, title, original_recipe_id, ingredients, instructions, notes, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)""",
        (recipe_id, title, original_recipe_id, ingredients, instructions, notes),
    )
    conn.commit()
    conn.close()
    return {"id": recipe_id, "title": title}


def list_custom_recipes() -> list[dict[str, Any]]:
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT * FROM custom_recipes ORDER BY updated_at DESC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_custom_recipe(recipe_id: str) -> Optional[dict[str, Any]]:
    conn = _get_db()
    cursor = conn.cursor()
    row = cursor.execute(
        "SELECT * FROM custom_recipes WHERE id = ?", (recipe_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def delete_custom_recipe(recipe_id: str) -> bool:
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM custom_recipes WHERE id = ?", (recipe_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


# Cooked Recipes


def log_cooked_recipe(session_id: str, recipe_id: str, recipe_title: str,
                       notes: str = "", rating: int = 0, difficulty: str = "",
                       cooking_time_minutes: int = 0):
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO cooked_recipes
           (session_id, recipe_id, recipe_title, notes, rating, difficulty, cooking_time_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (session_id, recipe_id, recipe_title, notes, rating, difficulty, cooking_time_minutes),
    )
    conn.commit()
    entry_id = cursor.lastrowid
    conn.close()
    return {"id": entry_id}


def list_cooked_recipes(limit: int = 50) -> list[dict[str, Any]]:
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT * FROM cooked_recipes ORDER BY created_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# Cooking History


def log_cooking_event(session_id: str, event_type: str, description: str, details: str = ""):
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO cooking_history
           (session_id, agent_id, event_type, description, details)
           VALUES (?, 'wellington', ?, ?, ?)""",
        (session_id, event_type, description, details),
    )
    conn.commit()
    entry_id = cursor.lastrowid
    conn.close()
    return {"id": entry_id}


def list_cooking_history(limit: int = 50) -> list[dict[str, Any]]:
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT * FROM cooking_history ORDER BY created_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# Voice Profile Management


def save_voice_profile(profile_id: str, name: str, profile_data: str) -> dict[str, Any]:
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO voice_profiles (id, name, profile_data, updated_at)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(id) DO UPDATE SET
               name = excluded.name,
               profile_data = excluded.profile_data,
               updated_at = CURRENT_TIMESTAMP""",
        (profile_id, name, profile_data),
    )
    conn.commit()
    conn.close()
    return {"id": profile_id, "name": name}


def get_voice_profile(profile_id: str) -> Optional[dict[str, Any]]:
    conn = _get_db()
    cursor = conn.cursor()
    row = cursor.execute(
        "SELECT * FROM voice_profiles WHERE id = ?", (profile_id,)
    ).fetchone()
    conn.close()
    if row:
        return {
            "id": row["id"],
            "name": row["name"],
            "profile_data": row["profile_data"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
    return None


def list_voice_profiles() -> list[dict[str, Any]]:
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT id, name, created_at, updated_at FROM voice_profiles ORDER BY updated_at DESC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def delete_voice_profile(profile_id: str) -> bool:
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM voice_profiles WHERE id = ?", (profile_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


# User Settings


def save_user_setting(key: str, value: str):
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO user_settings (key, value, updated_at)
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(key) DO UPDATE SET
               value = excluded.value,
               updated_at = CURRENT_TIMESTAMP""",
        (key, value),
    )
    conn.commit()
    conn.close()


def get_user_setting(key: str) -> Optional[str]:
    conn = _get_db()
    cursor = conn.cursor()
    row = cursor.execute(
        "SELECT value FROM user_settings WHERE key = ?", (key,)
    ).fetchone()
    conn.close()
    return row["value"] if row else None


def get_all_user_settings() -> dict[str, str]:
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute("SELECT key, value FROM user_settings").fetchall()
    conn.close()
    return {row["key"]: row["value"] for row in rows}
