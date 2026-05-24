# Psycho — AGENTS.md

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 + Vite 5 + Framer Motion (entry: `frontend/src/main.tsx`)
- **Backend:** Python + aiohttp, single `server.py` on port 8000 (entry: `server.py:main`)
- **AI:** Gemini Live API over WebSocket (`gemini-3.1-flash-live-preview`, `v1alpha` HTTP options)
- **Database:** SQLite at `backend/psycho.db` (auto-created by `server.py` via `init_db()`)
- **Package mgmt:** `uv` for Python, `npm` for frontend
- **Deploy:** Vercel (`vercel.json` — builds frontend, API routes at `/api/*` via `api/token.py`); also Docker

## Full setup order

```bash
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
cd frontend && npm install && cd ..
cd frontend && npm run build && cd ..    # runs tsc -b && vite build
python3 backend/seed_knowledge.py        # required before first server start
uv run server.py                         # starts on :8000
```

## Development

- Environment variable `GEMINI_API_KEY` in `.env` (`.env` in `.gitignore`)
- Dev server: `cd frontend && npm run dev` — Vite proxies `/api` to `localhost:8000`
- Frontend build: `npm run build` (no separate lint/typecheck scripts — just `tsc -b`)
- No test framework found in this repo

## Architecture

```
server.py              — serves API + static frontend/dist/
backend/rag/search.py  — SQLite CRUD + keyword-based RAG (not vector search)
backend/rag/knowledge_base.py — 30+ knowledge entries
api/token.py            — Vercel serverless function for Gemini ephemeral token
frontend/src/lib/       — geminilive.ts (WebSocket client), commands.ts (#slash), tools.ts (function calling)
```

## Key quirks

- `pyproject.toml` project name is `"plain-js-demo-app"` — ignore, it's a legacy name
- `seed_knowledge.py` must be run before the server the first time, or RAG search returns nothing
- Gemini model is `gemini-3.1-flash-live-preview` with `v1alpha` — not the stable default
- Slash commands (`/help`, `/mood`, `/cbt`, etc.) are defined in `commands.ts` and trilingual (pt/en/es)
- The `.env` file in the repo currently contains a committed API key — regenerate if rotating secrets
