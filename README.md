# Tonic AI — TON AI Hackathon Submission

> **AI-powered task management on the TON blockchain.**
> Built for the TON AI Hackathon 2026 · "User-Facing AI Agents" track.

---

## What Is Tonic AI?

Tonic AI is a productivity app that fuses an AI task-management agent with the TON blockchain. Users manage their daily work alongside an intelligent assistant powered by GPT-5, earn $TONIC tokens and on-chain achievements for completing real tasks, and climb a gamified leaderboard from **Rookie** all the way to **Mythic**.

The core idea: productivity is a habit that deserves real rewards. Every task you complete, every streak you maintain, every challenge you clear — all of it is verifiable on-chain, permanent, and worth something.

---

## Key Features

### AI Task Agent
A conversational AI assistant (GPT-5 with function calling) that lives inside the app. You can talk to it in plain language:

- *"Create a high-priority task to submit my report by Friday"*
- *"What's my most productive day this week?"*
- *"Plan my day and prioritise my backlog"*

The agent understands your task data and takes real actions — not just answers, but executions.

### On-Chain Achievements
When you unlock an achievement, you can claim it two ways:

| Claim Type | Reward | Chain interaction |
|---|---|---|
| Standard claim | 1× points | Off-chain (instant) |
| 2× On-Chain | 2× points | Sends a TON microtransaction (0.005 TON fee), permanently recording the achievement hash on the TON blockchain |

Every on-chain claim is a real transaction. The app verifies wallet connection via TonConnect before allowing it.

### $TONIC Token Economy
$TONIC is the in-app point currency. All values are denominated in $TONIC with a fixed peg:

```
100,000 TONIC = 1 TON
```

**Earn rates:**
| Action | TONIC earned |
|---|---|
| Complete a low-priority task | +10 TONIC |
| Complete a medium-priority task | +15 TONIC |
| Complete a high-priority task | +25 TONIC |
| Daily login streak bonus | +25 TONIC |
| Daily challenge completion | +50 TONIC |
| On-chain achievement claim | 2× multiplier |

### Gamified Rank System
Ten competitive ranks based on total claimed points:

| Rank | Points Required |
|---|---|
| Rookie | 0 |
| Apprentice | 200 |
| Grinder | 600 |
| Strategist | 1,500 |
| Pro | 3,500 |
| Elite | 7,500 |
| Master | 15,000 |
| Champion | 30,000 |
| Legend | 60,000 |
| Mythic | 120,000 |

### Tonian Badge NFT
A premium on-chain identity badge — mintable for 1 TON. Grants:
- 2× point multiplier on all future claims
- Verified rank marker on the leaderboard
- Exclusive "Tonian" badge displayed on your profile
- Permanent on-chain identity linked to your wallet

### Daily Challenges
A fresh challenge every 24 hours (complete N tasks, reach a streak, etc.). Progress tracked in real time. When the target is hit, an explicit **Claim +50 TONIC** button appears — nothing is claimed automatically.

### Social Leaderboard
A live leaderboard of up to 15 players, sorted by total score. Real users are merged and ranked against the mock ladder. Shows wallet address, TONIC balance, task count, and current rank badge.

### AI-Generated Insights
The Insights tab sends your real task history to GPT-5 and gets back a personalised productivity report: best day of the week, category breakdown, suggested focus areas, and a ranked action plan.

### Telegram Bot
An optional AI-powered Telegram bot (configured via `TELEGRAM_BOT_TOKEN`) that lets users manage tasks and get AI coaching from any Telegram chat.

### Onboarding Tour
A five-step animated coach tour on first launch — spotlight-style with a dark overlay, pulsing rings on the real UI element, and a bouncing pointer guiding the user through Dashboard → AI Agent → Tasks → Insights → Achievements.

---

## Architecture

```
tonic-ai/
├── backend/              Express 5 API server (Node.js / ESM)
│   ├── index.mjs         Main server: REST API, AI proxy, PostgreSQL, TonConnect manifest
│   └── telegram.mjs      Optional Telegram bot integration
│
└── frontend/             Expo / React Native app (web + mobile)
    ├── app/
    │   ├── (tabs)/       Five tab screens: Dashboard, Tasks, Insights, Profile, AI Agent
    │   ├── onboarding/   Onboarding flow (name, wallet connect, tour)
    │   ├── modal.tsx     Add / edit task sheet
    │   └── reset.tsx     App reset utility (clears storage → onboarding)
    ├── components/
    │   ├── AchievementsModal.tsx   Full-screen achievements browser with claim flows
    │   └── AppTour.tsx             Animated onboarding coach overlay
    ├── constants/
    │   ├── api.ts          API base URL and TON wallet address
    │   ├── colors.ts       Design tokens (gold-on-dark theme)
    │   └── achievements.ts 40+ achievement definitions across all categories
    ├── hooks/
    │   └── useTonConnect.ts  TonConnect wallet state + sendTransaction
    ├── providers/
    │   ├── AppStateProvider.tsx      Global user state, streaks, scores
    │   ├── TasksProvider.tsx         Task CRUD + server sync + AI insights
    │   ├── AchievementsProvider.tsx  Achievement unlock, claim, and points engine
    │   ├── ThemeProvider.tsx         Dark / light theme with AsyncStorage persistence
    │   └── TonConnectProvider.tsx    TonConnect UI wrapper
    ├── types/
    │   ├── tasks.ts         TypeScript types for tasks and categories
    │   └── achievements.ts  Types for achievements, levels, and stats
    └── public/
        └── tonconnect-manifest.json  Required by TonConnect for wallet pairing
```

---

## Tech Stack

### Frontend
| Technology | Role |
|---|---|
| Expo / React Native | Cross-platform app framework (web + iOS + Android) |
| Expo Router | File-system based tab navigation |
| TypeScript | End-to-end type safety |
| TonConnect UI | TON wallet pairing and transaction signing |
| AsyncStorage | Offline-first local persistence |
| React Context | Global state (tasks, achievements, theme, user) |
| Expo Linear Gradient | UI gradients (badge, buttons) |
| Lucide React Native | Icon system |
| Bun | Package manager and bundler |

### Backend
| Technology | Role |
|---|---|
| Node.js (ESM) | Runtime |
| Express 5 | HTTP API framework |
| PostgreSQL | Persistent storage via `pg` |
| OpenAI GPT-5 | AI agent + insights (via Replit AI Integrations proxy) |
| TonConnect | Wallet manifest and transaction verification |
| node-telegram-bot-api | Telegram bot (optional) |

---

## API Reference

### Base
```
GET  /health                           Health check
GET  /tonconnect-manifest.json         TonConnect wallet manifest
```

### Users
```
POST /api/users                        Create or upsert a user (wallet address or guest)
```

### Tasks
```
GET    /api/users/:userId/tasks        Fetch all tasks for a user
POST   /api/tasks                      Create or update a task
DELETE /api/tasks/:taskId             Delete a task
POST   /api/tasks/sync                Bulk sync tasks from client
```

### AI
```
POST /api/agent                        AI agent chat turn (GPT-5 with function calling)
POST /api/insights                     Generate AI productivity insights from task history
```

### Blockchain
```
POST /api/records                      Record an on-chain achievement entry
GET  /api/users/:userId/records        Fetch a user's on-chain records
POST /api/claim-points                 Trigger a TON transaction for point claim
```

### Leaderboard
```
GET /api/leaderboard                   Top 15 players sorted by score
```

---

## Database Schema

```sql
users (
  id              TEXT PRIMARY KEY,        -- wallet address or guest UUID
  name            TEXT,
  wallet_address  TEXT,
  is_guest        BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)

tasks (
  id              UUID PRIMARY KEY,
  user_id         TEXT REFERENCES users(id),
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,                    -- work / personal / health / finance / learning
  priority        TEXT,                    -- low / medium / high
  status          TEXT,                    -- pending / in_progress / completed
  due_date        TIMESTAMPTZ,
  ai_suggested    BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)

on_chain_records (
  id              UUID PRIMARY KEY,
  user_id         TEXT REFERENCES users(id),
  record_type     TEXT,                    -- achievement / proof_of_productivity
  title           TEXT,
  description     TEXT,
  ton_tx_hash     TEXT,                    -- TON blockchain transaction hash
  recorded_at     TIMESTAMPTZ
)
```

---

## Running Locally

### Prerequisites
- Node.js 20+
- Bun
- A PostgreSQL database (or use Replit's built-in DB)
- Replit AI Integrations (for GPT-5 access) or your own OpenAI API key

### 1. Backend
```bash
cd backend
npm install
node index.mjs
```

The server starts on port `3000` (or the `PORT` environment variable).

### 2. Frontend (web)
```bash
cd frontend
bun install
bun run expo export --platform web   # production build → ./dist
```

Serve `frontend/dist` with any static host, or point the backend to serve it.

### 3. Frontend (dev mode)
```bash
cd frontend
bun run start          # Expo dev server
bun run start-web      # web only
bun run start-android  # Android
bun run start-ios      # iOS
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Yes | OpenAI-compatible API base (Replit proxy) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Yes | API key for the proxy |
| `TELEGRAM_BOT_TOKEN` | No | Enables the Telegram bot |
| `PORT` | No | HTTP port (default: 3000) |
| `REPLIT_DEV_DOMAIN` | No | Auto-set by Replit for TonConnect manifest URL |
| `REPLIT_DOMAINS` | No | Auto-set by Replit for production manifest URL |

---

## Design Principles

**Offline-first.** All tasks and achievements are stored locally via AsyncStorage and synced to the server when online. The app is fully usable without a connection.

**Wallet-optional.** Users can start as a guest (no wallet needed) and progressively connect their TON wallet to unlock on-chain features. Nothing is gated behind blockchain setup.

**Transparent economy.** Every TONIC value is shown before any action. The 2× on-chain claim clearly states the fee (0.005 TON) and the reward (double points). No hidden costs.

**Real AI, real actions.** The AI agent doesn't just generate text — it calls real functions: creating tasks, reading your stats, and planning your day. Function call results are shown inline in the chat.

---

## Hackathon Track

**TON AI Hackathon 2026 — "User-Facing AI Agents" track**

Tonic AI qualifies under this track by combining:
1. A **conversational AI agent** (GPT-5 with function calling) as the primary user interface for task management
2. **TON blockchain integration** via TonConnect for on-chain achievement claims, Tonian Badge NFT minting, and Proof of Productivity
3. A **$TONIC token economy** tied to real user actions, with a fixed 100,000 TONIC = 1 TON exchange rate

---

## License

MIT
