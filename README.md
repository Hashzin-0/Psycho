# 🧠 Psycho — Seu Assistente Psicológico Pessoal

Assistente psicológico baseado em IA com embasamento científico para conversas sobre bem-estar emocional, autoconhecimento e saúde mental.

---

## ✨ Funcionalidades

- **🎙️ Conversa por voz e texto** em tempo real via Gemini Live API
- **🧠 Conhecimento científico** integrado (TCC, Psicanálise, DBT, ACT, Mindfulness, +)
- **🌍 Multilíngue** — detecta e responde em PT, EN ou ES automaticamente
- **😊 Diário de Emoções** — registre e acompanhe seu humor (`/mood`)
- **📋 Histórico de Sessões** — todas as conversas salvas (`/history`)
- **🧘 Técnicas Guiadas** — respiração, grounding, mindfulness (`/breathing`, `/grounding`)
- **📝 Registro de Pensamentos (TCC)** — worksheet interativo (`/cbt`)
- **🚨 Modo Crise** — acesso rápido a técnicas de emergência (`/crisis`)
- **🎯 Metas de Bem-Estar** — acompanhamento de objetivos (`/goals`)
- **📚 Biblioteca de Referências** — artigos e estudos científicos (`/references`)
- **🔊 Controle de Volume** — ajuste por voz ou comando (`/volume whisper`)
- **📖 Diário Pessoal** — entradas rápidas (`/journal`)

---

## 🚀 Início Rápido

```bash
# 1. Instalar dependências do backend
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt

# 2. Configurar chave da API Gemini
echo "GEMINI_API_KEY=sua_chave_aqui" > .env

# 3. Instalar dependências do frontend
cd frontend && npm install && cd ..

# 4. Construir o frontend
cd frontend && npm run build && cd ..

# 5. Popular base de conhecimento
python3 backend/seed_knowledge.py

# 6. Iniciar servidor
uv run server.py

# 7. Abrir no navegador
open http://localhost:8000
```

---

## 📚 Comandos Disponíveis

| Comando | Aliases | Descrição |
|---------|---------|-----------|
| `/help` | `/ajuda` `/ayuda` | Lista todos os comandos |
| `/clear` | `/limpar` | Limpa a conversa |
| `/mood` | `/humor` `/emocao` | Registra emoções |
| `/history` | `/historico` | Histórico de sessões |
| `/breathing` | `/respirar` | Exercício de respiração |
| `/mindfulness` | `/atencao` `/meditacao` | Sessão de mindfulness |
| `/cbt` | `/tcc` `/terapia` | Registro de pensamentos (TCC) |
| `/grounding` | `/aterramento` | Técnica 5-4-3-2-1 |
| `/crisis` | `/crise` `/emergencia` | Modo de crise |
| `/volume` | `/vol` `/som` | Ajustar volume da voz |
| `/goals` | `/metas` `/objetivos` | Metas de bem-estar |
| `/assessment` | `/avaliacao` `/questionario` | Questionários psicológicos |
| `/references` | `/referencias` | Biblioteca científica |
| `/technique` | `/tecnica` | Técnicas terapêuticas |
| `/journal` | `/diario` | Diário pessoal |

---

## 🧠 Conhecimento Psicológico

O Psycho integra conhecimento das seguintes abordagens baseadas em evidências:

- **TCC** — Aaron Beck, Judith Beck (Fordham et al., 2021)
- **Psicanálise** — Freud, Jung, Lacan
- **Humanismo** — Carl Rogers, Abraham Maslow
- **Behaviorismo** — Skinner, Pavlov
- **DBT** — Marsha Linehan (Chapman, 2006)
- **ACT** — Steven Hayes
- **Psicologia Positiva** — Seligman, Csikszentmihalyi
- **Mindfulness** — Kabat-Zinn (Tang et al., 2015; Kim, 2025)
- **Psicologia Existencial** — Frankl, Yalom

---

## 🏗️ Arquitetura

```
Psycho/
├── frontend/                    # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── lib/
│   │   │   ├── systemPrompt.ts  # Prompt psicológico completo
│   │   │   ├── commands.ts      # Sistema de comandos (/)
│   │   │   ├── tools.ts         # Funções chamáveis pela IA (volume, etc.)
│   │   │   ├── geminilive.ts    # Conexão WebSocket com Gemini
│   │   │   ├── mediaUtils.ts    # Streaming de áudio/vídeo
│   │   │   └── knowledge.ts     # Integração com backend RAG
│   │   └── components/
│   │       └── Chat.tsx, ...
│   └── dist/                    # Build de produção
├── backend/
│   └── rag/
│       ├── knowledge_base.py    # 30+ entries de conhecimento psicológico
│       └── search.py            # Busca semântica + SQLite
├── server.py                    # Servidor HTTP + API endpoints
├── requirements.txt
└── pyproject.toml
```

---

## 🔗 API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/token` | Token efêmero para Gemini Live API |
| POST | `/api/rag/search` | Busca na base de conhecimento |
| GET | `/api/rag/entry/{id}` | Detalhe de entry específica |
| POST | `/api/session/create` | Criar nova sessão |
| POST | `/api/session/message` | Salvar mensagem |
| POST | `/api/mood` | Registrar humor |
| GET | `/api/mood/history` | Histórico de humor |
| POST | `/api/goals` | Criar meta |
| GET | `/api/goals` | Listar metas |

---

## ⚠️ Aviso

O **Psycho** é um assistente de apoio — **NÃO substitui terapia profissional, diagnóstico médico ou tratamento psiquiátrico**. Em caso de crise, ligue para o CVV (188) ou SAMU (192).

---

## 🔧 Configuração

1. Obtenha uma chave de API do Google Gemini em https://aistudio.google.com/
2. Crie um arquivo `.env` com `GEMINI_API_KEY=sua_chave`
3. O modelo padrão é `gemini-3.1-flash-live-preview`
