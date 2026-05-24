#!/usr/bin/env python3
"""Psycho — Psychological Assistant Server
Provides Gemini Live API ephemeral tokens, knowledge base search,
session management, mood tracking, and goal management.
"""

import asyncio
import json
import mimetypes
import os
import datetime
import uuid

from aiohttp import web
from google import genai
from dotenv import load_dotenv

from backend.rag.search import (
    init_db,
    seed_knowledge,
    search_knowledge,
    get_entry,
    get_all_categories,
    create_session,
    save_message,
    get_session_history,
    list_sessions,
    save_mood,
    get_mood_history,
    create_goal,
    list_goals,
    get_session_context,
    update_session_summary,
    save_voice_profile,
    get_voice_profile,
    list_voice_profiles,
    delete_voice_profile,
    save_user_setting,
    get_user_setting,
    get_all_user_settings,
)

# Load environment variables
load_dotenv()

# Configuration
HTTP_PORT = 8000
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Initialize the Gemini client
if not GEMINI_API_KEY:
    print("⚠️ Warning: GEMINI_API_KEY not found. Set it in .env file.")
    client = genai.Client(http_options={"api_version": "v1alpha"})
else:
    client = genai.Client(api_key=GEMINI_API_KEY, http_options={"api_version": "v1alpha"})


async def get_ephemeral_token(request):
    """Generates an ephemeral token for the Gemini Live API."""
    try:
        now = datetime.datetime.now(tz=datetime.timezone.utc)
        expire_time = now + datetime.timedelta(minutes=30)

        token = client.auth_tokens.create(
            config={
                "uses": 1,
                "expire_time": expire_time.isoformat(),
                "new_session_expire_time": (now + datetime.timedelta(minutes=1)).isoformat(),
                "http_options": {"api_version": "v1alpha"},
            }
        )

        return web.json_response({
            "token": token.name,
            "expires_at": expire_time.isoformat()
        })
    except Exception as e:
        print(f"Error generating ephemeral token: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def handle_rag_search(request):
    """Search the psychological knowledge base."""
    try:
        data = await request.json()
        query = data.get("query", "")
        limit = data.get("limit", 3)

        if not query:
            return web.json_response({"error": "Query is required"}, status=400)

        results = search_knowledge(query, limit)
        return web.json_response({"results": results})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_knowledge_entry(request):
    """Get a specific knowledge entry by ID."""
    entry_id = request.match_info.get("id")
    entry = get_entry(entry_id)

    if entry:
        return web.json_response(entry)
    return web.json_response({"error": "Entry not found"}, status=404)


async def handle_categories(request):
    """List all knowledge categories."""
    categories = get_all_categories()
    return web.json_response({"categories": categories})


async def handle_create_session(request):
    """Create a new therapy session."""
    data = await request.json() if request.body_exists else {}
    session_id = data.get("session_id", str(uuid.uuid4()))
    title = data.get("title", "Nova Sessão")

    session = create_session(session_id, title)
    return web.json_response(session)


async def handle_save_message(request):
    """Save a message in a session."""
    data = await request.json()
    session_id = data.get("session_id")
    role = data.get("role")
    content = data.get("content")

    if not all([session_id, role, content]):
        return web.json_response({"error": "session_id, role, and content are required"}, status=400)

    save_message(session_id, role, content)
    return web.json_response({"status": "ok"})


async def handle_get_session(request):
    """Get session history."""
    session_id = request.match_info.get("session_id")
    messages = get_session_history(session_id)
    return web.json_response({"messages": messages})


async def handle_list_sessions(request):
    """List all sessions."""
    sessions = list_sessions()
    return web.json_response({"sessions": sessions})


async def handle_session_context(request):
    """Get session context (recent sessions, mood trend, active goals)."""
    context = get_session_context()
    return web.json_response(context)


async def handle_update_summary(request):
    """Update session summary."""
    data = await request.json() if request.body_exists else {}
    session_id = data.get("session_id") or request.match_info.get("session_id")
    summary = data.get("summary", "")
    if not session_id:
        return web.json_response({"error": "session_id is required"}, status=400)
    update_session_summary(session_id, summary)
    return web.json_response({"status": "ok"})


async def handle_save_mood(request):
    """Save a mood entry."""
    data = await request.json()
    session_id = data.get("session_id", str(uuid.uuid4()))
    mood = data.get("mood")
    intensity = data.get("intensity", 5)
    note = data.get("note", "")

    if not mood:
        return web.json_response({"error": "mood is required"}, status=400)

    save_mood(session_id, mood, intensity, note)
    return web.json_response({"status": "ok"})


async def handle_mood_history(request):
    """Get mood history."""
    days = int(request.query.get("days", "30"))
    entries = get_mood_history(days)
    return web.json_response({"entries": entries})


async def handle_create_goal(request):
    """Create a new goal."""
    data = await request.json()
    title = data.get("title")
    description = data.get("description", "")
    category = data.get("category", "wellness")
    target_days = data.get("target_days", 21)

    if not title:
        return web.json_response({"error": "title is required"}, status=400)

    goal = create_goal(title, description, category, target_days)
    return web.json_response(goal)


async def handle_list_goals(request):
    """List all goals."""
    goals = list_goals()
    return web.json_response({"goals": goals})


# Voice Profile Endpoints


async def handle_save_profile(request):
    """Save or update a voice profile."""
    try:
        data = await request.json()
        profile_id = data.get("id", "default")
        name = data.get("name", "Minha Voz")
        profile_data = data.get("profile_data")

        if not profile_data:
            return web.json_response({"error": "profile_data is required"}, status=400)

        result = save_voice_profile(profile_id, name, json.dumps(profile_data))
        return web.json_response(result)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_get_profile(request):
    """Get a voice profile."""
    profile_id = request.match_info.get("id", "default")
    profile = get_voice_profile(profile_id)
    if profile:
        profile["profile_data"] = json.loads(profile["profile_data"])
        return web.json_response(profile)
    return web.json_response({"error": "Profile not found"}, status=404)


async def handle_list_profiles(request):
    """List all voice profiles."""
    profiles = list_voice_profiles()
    return web.json_response({"profiles": profiles})


async def handle_delete_profile(request):
    """Delete a voice profile."""
    profile_id = request.match_info.get("id", "default")
    deleted = delete_voice_profile(profile_id)
    if deleted:
        return web.json_response({"status": "ok"})
    return web.json_response({"error": "Profile not found"}, status=404)


# User Settings Endpoints


async def handle_save_settings(request):
    """Save user settings."""
    try:
        data = await request.json()
        for key, value in data.items():
            save_user_setting(key, json.dumps(value) if not isinstance(value, str) else value)
        return web.json_response({"status": "ok"})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_get_settings(request):
    """Get all user settings."""
    settings = get_all_user_settings()
    parsed = {}
    for key, value in settings.items():
        try:
            parsed[key] = json.loads(value)
        except (json.JSONDecodeError, TypeError):
            parsed[key] = value
    return web.json_response({"settings": parsed})


async def serve_static_file(request):
    """Serve static files from the frontend dist directory."""
    path = request.match_info.get("path", "index.html")
    path = path.lstrip("/")

    if ".." in path:
        return web.Response(text="Invalid path", status=400)

    if not path or path == "/":
        path = "index.html"

    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend", "dist")
    file_path = os.path.join(frontend_dir, path)

    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        return web.Response(text="File not found", status=404)

    content_type, _ = mimetypes.guess_type(file_path)
    if content_type is None:
        content_type = "application/octet-stream"

    try:
        with open(file_path, "rb") as f:
            content = f.read()
        return web.Response(body=content, content_type=content_type)
    except Exception as e:
        return web.Response(text="Internal server error", status=500)


async def main():
    """Initialize database and start the HTTP server."""
    # Initialize database
    try:
        init_db()
        seed_knowledge()
        print("🧠 Base de conhecimento do Psycho carregada com sucesso!")
    except Exception as e:
        print(f"⚠️ Erro ao inicializar banco: {e}")

    app = web.Application()

    # Gemini API endpoints
    app.router.add_post("/api/token", get_ephemeral_token)

    # Knowledge base (RAG) endpoints
    app.router.add_post("/api/rag/search", handle_rag_search)
    app.router.add_get("/api/rag/entry/{id}", handle_knowledge_entry)
    app.router.add_get("/api/rag/categories", handle_categories)

    # Session endpoints
    app.router.add_post("/api/session/create", handle_create_session)
    app.router.add_post("/api/session/message", handle_save_message)
    app.router.add_get("/api/session/{session_id}", handle_get_session)
    app.router.add_get("/api/sessions", handle_list_sessions)

    # Mood endpoints
    app.router.add_post("/api/mood", handle_save_mood)
    app.router.add_get("/api/mood/history", handle_mood_history)

    # Goal endpoints
    app.router.add_post("/api/goals", handle_create_goal)
    app.router.add_get("/api/goals", handle_list_goals)

    # Session context & summary
    app.router.add_post("/api/session/context", handle_session_context)
    app.router.add_post("/api/session/{session_id}/summary", handle_update_summary)

    # Voice Profile endpoints
    app.router.add_post("/api/profile", handle_save_profile)
    app.router.add_get("/api/profile/{id}", handle_get_profile)
    app.router.add_get("/api/profiles", handle_list_profiles)
    app.router.add_delete("/api/profile/{id}", handle_delete_profile)

    # User Settings endpoints
    app.router.add_post("/api/settings", handle_save_settings)
    app.router.add_get("/api/settings", handle_get_settings)

    # Static files
    app.router.add_get("/", serve_static_file)
    app.router.add_get("/{path:.*}", serve_static_file)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", HTTP_PORT)
    await site.start()

    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║              🌟 Psycho — Assistente Psicológico           ║
    ╠════════════════════════════════════════════════════════════╣
    ║                                                            ║
    ║  💜 Web Interface:  http://localhost:{:<5}                  ║
    ║  🔑 API: POST      /api/token                              ║
    ║  📚 RAG: POST      /api/rag/search                         ║
    ║  📋 Session:       /api/session/*                          ║
    ║  😊 Mood:          /api/mood/*                             ║
    ║  🎯 Goals:         /api/goals/*                            ║
    ║  🧠 Memory:        /api/session/context                    ║
    ║                                                            ║
    ║  Modelo Padrão: gemini-3.1-flash-live-preview               ║
    ║                                                            ║
    ╚════════════════════════════════════════════════════════════╝
    """)

    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    print("🧠 Iniciando servidor do Psycho...")
    print("📚 Use Ctrl+C para parar o servidor")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Psycho encerrado. Até logo! 💜")
