# Tonic AI — TON AI Hackathon 2026

> **GPT-4o powered, TON blockchain-native task management with real on-chain $TONIC rewards.**
> Built for the TON AI Hackathon 2026 · "User-Facing AI Agents" track.

---

## What Is Tonic AI?

Tonic AI is a productivity app that fuses a GPT-4o AI agent with the TON blockchain. Users manage their daily work through a conversational AI assistant with 8 function-calling tools, earn $TONIC tokens for completing tasks, and trigger **real on-chain TON testnet transactions** every time a task is marked complete.

The core idea: productivity is a habit that deserves real rewards — provable on-chain, transparent, and permanent.

---

## Key Features

### AI Agent — GPT-4o + 8 Function-Calling Tools
A conversational AI assistant that lives inside the app. You can talk to it in plain language:

- *"Create a high-priority task to submit my report by Friday"*
- *"What's my most productive day this week?"*
- *"Plan my day and prioritise my backlog"*
- *"Hire a habit coach"* → delegates to **HabitOS** specialist via the **$TONIC Protocol**

The agent understands your task data and takes real actions — not just answers, but executions. Responses stream token-by-token via SSE.

**8 tools:** `create_task` · `complete_task` · `get_productivity_summary` · `analyze_habits` · `plan_my_day` · `reschedule_task` · `set_task_priority` · `delegate_to_specialist`

### $TONIC Inter-Agent Coordination Protocol
Spend $TONIC to hire specialist sub-agents for deep-work sessions:
| Specialist | Cost | Capability |
|---|---|---|
| HabitOS | 25 $TONIC | Behavioral neuroscience, habit stacks |
| ChronoX | 30 $TONIC | Chronobiology, time-blocking |
| VisionCore | 40 $TONIC | OKR coaching, goal alignment |

### Real On-Chain TON Rewards
Every task completion fires a **real TON testnet transaction** (non-blocking, via `setImmediate`) from the deployer wallet to the user's connected wallet:
- Amount: 0.001 tTON per task
- Comment: `TONIC:25:task_complete` (priority-based)
- Tx hash stored and shown in Profile with a live testnet.tonscan.org link

**Deployer:** `0QBrXSY1xnP25QBRLg6G_9lSgoV4aypr92BK3pFQkactXG6V`

### Deep Strategy (Premium AI)
A full diagnostic productivity report structured as: Executive Summary → Pattern Analysis → Critical Vulnerabilities → Strategic Action Plan → 30-Day Forecast. Free for Tonian badge holders.

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
The Insights tab sends your real task history to GPT-4o and gets back a personalised productivity report: best day of the week, category breakdown, suggested focus areas, and a ranked action plan.

### Telegram Bot
An optional AI-powered Telegram bot (configured via `TELEGRAM_BOT_TOKEN`) that lets users manage tasks and get AI coaching from any Telegram chat.

### Onboarding Tour
A five-step animated coach tour on first launch — spotlight-style with a dark overlay, pulsing rings on the real UI element, and a bouncing pointer guiding the user through Dashboard → AI Agent → Tasks → Insights → Achievements.

---

## Architecture

```
workspace/
├── backend/
│   ├── index.mjs             Entry: middleware, routes, bootstrap
│   ├── db.mjs                pg.Pool + initDB()
│   ├── config.mjs            Constants (AI_MODEL, TONIC rates, challenges)
│   ├── telegram.mjs          Telegram bot
│   ├── ton/
│   │   ├── client.mjs        Toncenter API client (testnet)
│   │   └── wallet.mjs        Deployer wallet (init, sendTonicReward)
│   ├── agent/
│   │   ├── prompt.mjs        buildAgentSystemPrompt() + specialist prompt
│   │   ├── tools.mjs         8 OpenAI function schemas
│   │   └── executor.mjs      executeToolCall() — shared by all agent routes
│   └── routes/
│       ├── agent.mjs         POST /api/agent, GET /api/agent/stream, POST /api/agent/deep-analysis
│       ├── tasks.mjs         Task CRUD + on-chain reward on completion
│       ├── users.mjs         User upsert, ton-proof, sync codes
│       ├── tokens.mjs        $TONIC balance, earn, daily challenge
│       ├── records.mjs       On-chain records, claim-points
│       ├── leaderboard.mjs   Global leaderboard
│       └── ton-chain.mjs     /api/ton/* — deployer, balance, reward, history
├── contracts/
│   ├── tonic.tact            $TONIC Jetton smart contract (TEP-74/89, Tact)
│   └── deploy.mjs            Deployment script
└── frontend/
    ├── app/
    │   ├── (tabs)/           Dashboard, Tasks, Insights, Profile, Agent
    │   ├── onboarding/       First-launch onboarding flow
    │   ├── modal.tsx         Add/edit task sheet
    │   ├── tonic-balance.tsx $TONIC balance screen
    │   ├── tonian-badge.tsx  Tonian badge verification screen
    │   └── sync-device.tsx   Cross-device sync screen
    ├── components/
    │   └── AchievementsModal.tsx  Achievement browser + claim flows
    ├── constants/
    │   ├── api.ts            API base URL (runtime window.location.origin)
    │   ├── colors.ts         Design tokens (gold-on-dark)
    │   └── achievements.ts   90+ achievement definitions
    ├── providers/            AppState, Tasks, Achievements, Theme, TonConnect
    ├── hooks/useTonConnect.ts
    └── types/tasks.ts        TypeScript types
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
| OpenAI GPT-4o | AI agent, insights, deep analysis (via Replit AI Integrations proxy) |
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
POST /api/agent                        AI agent (GPT-4o + 8 function-calling tools)
GET  /api/agent/stream                 SSE streaming agent
POST /api/agent/deep-analysis          Premium deep strategy analysis
POST /api/insights                     GPT-4o productivity insights from task history
```

### Blockchain & $TONIC
```
GET  /api/users/:userId/tokens         $TONIC balance
POST /api/earn-tokens                  Award $TONIC to a user
GET  /api/daily-challenge              Today's challenge
POST /api/daily-challenge/complete     Complete daily challenge (+50 $TONIC)
POST /api/records                      Save on-chain record
GET  /api/users/:userId/records        Fetch on-chain records (with tx hashes)
POST /api/claim-points                 Claim achievement points on TON
POST /api/ton-proof                    Store TonConnect wallet verification proof
GET  /api/ton/deployer                 Deployer wallet status + address
GET  /api/ton/balance/:address         Live TON balance from Toncenter API
POST /api/ton/reward                   Send on-chain $TONIC reward tx
GET  /api/ton/history/:userId          On-chain tx history for user
```

### Leaderboard & Sync
```
GET  /api/leaderboard                  Top 20 players sorted by score
GET  /api/sync-code/generate           Generate cross-device sync code
POST /api/sync-code/restore            Restore from sync code
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
| `TON_DEPLOYER_MNEMONIC` | Yes | 24-word mnemonic for the TON testnet deployer wallet |
| `TELEGRAM_BOT_TOKEN` | No | Enables the Telegram bot |
| `TONCENTER_API_KEY` | No | Higher rate limits on Toncenter API |
| `TONIC_JETTON_CONTRACT` | No | Deployed $TONIC Jetton contract address |
| `TON_NETWORK` | No | `testnet` (default) |
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
1. A **conversational AI agent** (GPT-4o + 8 tools + SSE streaming) as the primary UI for task management
2. **Real TON testnet integration** — every task completion fires a verifiable on-chain transaction; tx hashes shown live in the app
3. A **$TONIC inter-agent coordination protocol** — spend tokens to hire specialist sub-agents (HabitOS · ChronoX · VisionCore)
4. A **TEP-74/89 Jetton smart contract** (`contracts/tonic.tact`) ready for mainnet deployment

---

## License

MIT
