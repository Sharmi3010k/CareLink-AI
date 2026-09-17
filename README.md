# CareLink

**AI-Assisted, Human-Centric Health Coordination Platform**
Built by K. Sharmila & S. Sandhiya for the Healix AI Hackathon 2026.

CareLink centralizes appointments, medications, and caregiver coordination in one place,
and layers AI-assisted summarization, triage support, and personalized reminders on top —
reducing the coordination burden on patients, families, and care teams.

Stack: **MongoDB, Express, React, Node.js (MERN)**

---

## Project structure

```
carelink/
├── backend/          Express API + MongoDB models + AI service
│   ├── config/        DB connection
│   ├── models/        Mongoose schemas
│   ├── controllers/    Route handlers
│   ├── routes/         API route definitions
│   ├── middleware/     JWT auth guard
│   ├── services/       aiService.js — summarization, triage, reminders
│   └── scripts/seed.js Demo data seeder
└── frontend/          React (Vite) dashboard
    └── src/
        ├── api/         Axios client
        ├── pages/       Login, Dashboard
        └── components/  Feature panels (overview, AI summary, triage)
```

---

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`) **or** a free MongoDB Atlas connection string

---

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set `MONGO_URI` and `JWT_SECRET` (any long random string works for `JWT_SECRET`).

Seed demo data (creates a demo patient + caregiver with sample appointments,
medications, and tasks):

```bash
npm run seed
```

Start the API:

```bash
npm run dev        # with auto-restart (nodemon)
# or
npm start
```

The API runs at `http://localhost:5000`. Check it's alive:

```bash
curl http://localhost:5000/api/health
```

**Demo login (after seeding):**
- Patient: `patient@demo.com` / `password123`
- Caregiver: `caregiver@demo.com` / `password123`

---

## 2. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` requests to the
backend on port 5000 automatically (see `vite.config.js`), so no extra CORS setup is
needed during local development.

---

## What to demo (maps to the hackathon submission)

1. **Log in** with the demo patient account.
2. **Dashboard** — shows upcoming appointments, care tasks (toggle complete), and
   medications with dose history.
3. **Smart reminders** — click "Get smart reminder" next to Metformin. Because the
   seed data includes a missed dose, it should suggest reminding earlier (30 min
   before) and explain why.
4. **AI Care Summarization** — a sample clinical note is pre-filled; click
   "Summarize note" to see the condensed AI summary.
5. **Triage / Urgency Support** — type a symptom (try "chest pain and difficulty
   breathing" for emergency, or "mild headache" for low urgency) and click
   "Classify urgency." Note the confidence score and the "Escalated to human" badge
   on ambiguous or emergency cases — the system never auto-resolves those.

---

## How the AI layer works (`backend/services/aiService.js`)

All three AI features run as **rule-based logic with zero external dependencies**,
so the whole app is demoable offline / without any API key:

- **`summarizeCareNote()`** — extractive summarization: scores sentences by
  clinically relevant keywords (medication, diagnosis, follow-up, etc.) and keeps
  the top-scoring sentences in original order.
- **`classifyUrgency()`** — keyword/pattern-based triage across four urgency tiers
  (low/moderate/high/emergency). Emergency-level and low-confidence results are
  **always** flagged `escalatedToHuman: true` — the system is designed to defer
  rather than guess on ambiguous cases.
- **`suggestReminderTime()`** — looks at a medication's dose log (taken/missed/late)
  and adjusts the reminder lead time accordingly.

There's a clean seam (`USE_LLM` flag + `summarizeWithLLM()`) for swapping in a real
LLM provider (OpenAI, Anthropic, etc.) later — set `AI_PROVIDER=openai` and
`OPENAI_API_KEY` in `.env`, and install the `openai` package. This isn't required
to run or demo the project as-is.

---

## Responsible AI notes (also see the project PPT)

- Every AI output is decision support, not a diagnosis — this is stated in the UI
  disclaimer shown alongside every triage result.
- Low-confidence and emergency-level triage results are escalated to a human
  reviewer (`reviewTriage` endpoint) before being considered resolved.
- No patient data leaves the system — the offline rule-based AI runs entirely
  in-process; nothing is sent to a third party unless you explicitly enable the
  LLM plug-in with your own API key.

---

## API reference (quick)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/auth/me` | Current user (auth required) |
| GET/POST | `/api/care/appointments` | List/create appointments |
| GET/POST | `/api/care/medications` | List/create medications |
| POST | `/api/care/medications/:id/log-dose` | Log a taken/missed dose |
| GET/POST | `/api/care/tasks` | List/create care tasks |
| PATCH | `/api/care/tasks/:id/toggle` | Toggle task complete |
| POST | `/api/ai/summarize` | AI care note summarization |
| POST | `/api/ai/triage` | AI symptom urgency classification |
| PATCH | `/api/ai/triage/:id/review` | Human review of a triage record |
| GET | `/api/ai/medications/:id/reminder-suggestion` | Smart reminder timing |

All `/api/care/*` and `/api/ai/*` routes require `Authorization: Bearer <token>`.

---

## Limitations (matches the project doc)

- Prototype stage — not integrated with real hospital systems.
- Rule-based AI, not a trained clinical model — good for demoing the *architecture*
  and *responsible AI pattern*, not for real medical use.
- Triage is decision support only, never a diagnosis.
