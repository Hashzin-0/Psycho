"""Motor de busca semântica para a base de conhecimento psicológico.

Esta implementação usa busca por similaridade de cosseno com embeddings simples.
Pode ser substituído por ChromaDB, FAISS ou outra solução vetorial.
"""

import json
import os
import sqlite3
from typing import Any, Optional

from .knowledge_base import KNOWLEDGE_ENTRIES

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "psycho.db")


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables for knowledge base and sessions."""
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

    conn.commit()
    conn.close()


def seed_knowledge():
    """Populate the knowledge base with initial entries."""
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


def search_knowledge(query: str, limit: int = 3) -> list[dict[str, Any]]:
    """Search knowledge base by keyword matching on tags and content.

    This is a simple keyword search. For production, replace with
    vector embeddings + cosine similarity using ChromaDB or FAISS.
    """
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


def get_entry(entry_id: str) -> Optional[dict[str, Any]]:
    """Get a single knowledge entry by ID."""
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


def get_all_categories() -> list[str]:
    """Get all unique categories from the knowledge base."""
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT DISTINCT category FROM knowledge_entries ORDER BY category"
    ).fetchall()
    conn.close()
    return [row["category"] for row in rows]


# Session Management


def create_session(session_id: str, title: str = "Nova Sessão") -> dict[str, Any]:
    """Create a new therapy session."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO sessions (session_id, title) VALUES (?, ?)",
        (session_id, title),
    )
    conn.commit()
    conn.close()
    return {"session_id": session_id, "title": title}


def save_message(session_id: str, role: str, content: str):
    """Save a message to the session."""
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
    """Get all messages from a session."""
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at",
        (session_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def list_sessions(limit: int = 20) -> list[dict[str, Any]]:
    """List recent sessions."""
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        """SELECT session_id, title, created_at, updated_at,
                  (SELECT COUNT(*) FROM messages WHERE session_id = sessions.session_id) as message_count
           FROM sessions ORDER BY updated_at DESC LIMIT ?""",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# Mood Tracking


def save_mood(session_id: str, mood: str, intensity: int, note: str = ""):
    """Save a mood entry."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO mood_entries (session_id, mood, intensity, note) VALUES (?, ?, ?, ?)",
        (session_id, mood, intensity, note),
    )
    conn.commit()
    conn.close()


def get_mood_history(days: int = 30) -> list[dict[str, Any]]:
    """Get mood entries for the last N days."""
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        """SELECT mood, intensity, note, created_at
           FROM mood_entries
           WHERE created_at >= datetime('now', '-' || ? || ' days')
           ORDER BY created_at DESC""",
        (days,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# Goals


def create_goal(title: str, description: str = "", category: str = "wellness", target_days: int = 21) -> dict[str, Any]:
    """Create a new goal."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO goals (title, description, category, target_days) VALUES (?, ?, ?, ?)",
        (title, description, category, target_days),
    )
    conn.commit()
    goal_id = cursor.lastrowid
    conn.close()
    return {"id": goal_id, "title": title}


def list_goals(active_only: bool = False) -> list[dict[str, Any]]:
    """List all goals, optionally only active (non-completed) ones."""
    conn = _get_db()
    cursor = conn.cursor()
    if active_only:
        rows = cursor.execute(
            "SELECT * FROM goals WHERE completed_at IS NULL ORDER BY created_at DESC"
        ).fetchall()
    else:
        rows = cursor.execute(
            "SELECT * FROM goals ORDER BY created_at DESC"
        ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_session_context() -> dict[str, Any]:
    """Get context from recent sessions, mood entries, and active goals."""
    conn = _get_db()
    cursor = conn.cursor()

    recent_sessions = cursor.execute(
        """SELECT session_id, title, summary, created_at
           FROM sessions WHERE summary IS NOT NULL AND summary != ''
           ORDER BY updated_at DESC LIMIT 5"""
    ).fetchall()

    mood_trend = cursor.execute(
        """SELECT mood, intensity, note, created_at
           FROM mood_entries
           WHERE created_at >= datetime('now', '-30 days')
           ORDER BY created_at DESC LIMIT 10"""
    ).fetchall()

    active_goals = cursor.execute(
        "SELECT * FROM goals WHERE completed_at IS NULL ORDER BY created_at DESC LIMIT 5"
    ).fetchall()

    conn.close()

    return {
        "recent_sessions": [dict(s) for s in recent_sessions],
        "mood_trend": [dict(m) for m in mood_trend],
        "active_goals": [dict(g) for g in active_goals],
    }


# Voice Profile Management


def save_voice_profile(
    profile_id: str,
    name: str,
    profile_data: str,
) -> dict[str, Any]:
    """Save or update a voice profile."""
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
    """Get a voice profile by ID."""
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
    """List all voice profiles."""
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT id, name, created_at, updated_at FROM voice_profiles ORDER BY updated_at DESC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def delete_voice_profile(profile_id: str) -> bool:
    """Delete a voice profile."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM voice_profiles WHERE id = ?", (profile_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


# User Settings


def save_user_setting(key: str, value: str):
    """Save a user setting (upsert)."""
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
    """Get a user setting by key."""
    conn = _get_db()
    cursor = conn.cursor()
    row = cursor.execute(
        "SELECT value FROM user_settings WHERE key = ?", (key,)
    ).fetchone()
    conn.close()
    return row["value"] if row else None


def get_all_user_settings() -> dict[str, str]:
    """Get all user settings."""
    conn = _get_db()
    cursor = conn.cursor()
    rows = cursor.execute("SELECT key, value FROM user_settings").fetchall()
    conn.close()
    return {row["key"]: row["value"] for row in rows}


def update_session_summary(session_id: str, summary: str):
    """Update the summary of a session."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE sessions SET summary = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?",
        (summary, session_id),
    )
    conn.commit()
    conn.close()
