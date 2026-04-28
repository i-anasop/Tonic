<div align="center">

# ⚡ Tonic AI

**GPT-4o task management, powered by the TON blockchain.**
Every task you complete fires a real on-chain transaction.
Every achievement you claim is permanently recorded on TON.

<br/>

[![TON AI Hackathon 2026](https://img.shields.io/badge/TON_AI_Hackathon-2026-0088CC?style=for-the-badge&logo=telegram&logoColor=white)](https://ton.org)
[![Track](https://img.shields.io/badge/Track-User--Facing_AI_Agents-7C3AED?style=for-the-badge)](https://ton.org)
[![Status](https://img.shields.io/badge/Testnet-Live-22C55E?style=for-the-badge)](https://testnet.tonscan.org/address/0QBrXSY1xnP25QBRLg6G_9lSgoV4aypr92BK3pFQkactXG6V)

<br/>

[![GPT-4o](https://img.shields.io/badge/AI-GPT--4o-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com)
[![TonConnect](https://img.shields.io/badge/Wallet-TonConnect_2.0-0088CC?style=flat-square)](https://docs.ton.org/develop/dapps/ton-connect/overview)
[![React Native](https://img.shields.io/badge/App-React_Native_Expo-61DAFB?style=flat-square&logo=react&logoColor=black)](https://expo.dev)
[![Node.js](https://img.shields.io/badge/Server-Node.js_ESM-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=flat-square)](LICENSE)

<br/>

**[ Live App](https://i-anasop.github.io/Tonic/)** &nbsp;·&nbsp; **[ Telegram Mini App](https://t.me/TonicAI_bot)**

</div>

---

## 🎬 Demo

<div align="center">
  <img src="https://raw.githubusercontent.com/i-anasop/Tonic/main/.github/assets/demo.gif" width="700" alt="Tonic AI — App Demo" />
  <br/>
  <sub><i>GPT-4o agent creating tasks · on-chain TONIC rewards · achievement claims · Tonian Badge mint on TON testnet</i></sub>
  <br/><br/>
  <a href="https://raw.githubusercontent.com/i-anasop/Tonic/main/.github/assets/demo.mp4">▶ Watch full video (MP4)</a>
</div>

---

## Table of Contents

- [What is Tonic AI?](#-what-is-tonic-ai)
- [Core Features](#-core-features)
- [AI Agent — 8 Function-Calling Tools](#-ai-agent--8-function-calling-tools)
- [$TONIC Protocol](#-tonic-inter-agent-coordination-protocol)
- [On-Chain Rewards](#%EF%B8%8F-real-on-chain-ton-rewards)
- [Achievements System](#-90-achievements--on-chain-claims)
- [Rank Progression](#-10-rank-progression)
- [Tonian Badge](#-tonian-badge)
- [Architecture](#%EF%B8%8F-architecture)
- [Tech Stack](#-tech-stack)
- [API Reference](#-api-reference)
- [Database Schema](#%EF%B8%8F-database-schema)
- [Running Locally](#-running-locally)
- [Hackathon Qualification](#-hackathon-qualification)

---

## What is Tonic AI?

Tonic AI is a **blockchain-native productivity platform** built for the **TON AI Hackathon 2026**.

It combines a real **GPT-4o conversational agent** (8 live function-calling tools, SSE token streaming) with the **TON blockchain** so that every meaningful action — completing a task, claiming [...]

```
Productivity → Task Completion → On-Chain Transaction → TONIC Reward → Rank Up
```

> The driving idea: productivity is a habit that deserves real rewards — provable on-chain, transparent, and permanent.

---

## Core Features

<table>
<tr><td><b>GPT-4o AI Agent</b></td><td>8 function-calling tools, SSE streaming, natural language task control</td></tr>
<tr><td><b>Real On-Chain Rewards</b></td><td>Every task completion sends a live TON testnet transaction to your wallet</td></tr>
<tr><td><b>$TONIC Protocol</b></td><td>Hire specialist sub-agents with $TONIC tokens — inter-agent coordination layer</td></tr>
<tr><td><b>90+ Achievements</b></td><td>Claim on-chain for 2× points — each a permanent TON transaction</td></tr>
<tr><td><b>10 Competitive Ranks</b></td><td>Rookie → Mythic, based on total on-chain claimed points</td></tr>
<tr><td><b>Tonian Badge</b></td><td>1 TON mint = permanent identity + 2× lifetime points multiplier</td></tr>
<tr><td><b>Daily Challenges</b></td><td>Fresh 24h targets — +50 TONIC on completion with explicit claim button</td></tr>
<tr><td><b>AI Insights</b></td><td>GPT-4o reads your task history and gives personalised coaching reports</td></tr>
<tr><td><b>Cross-Platform</b></td><td>Web, iOS, and Android from a single React Native codebase</td></tr>
<tr><td><b>Telegram Mini App</b></td><td>Full app running natively inside Telegram — no browser switch needed</td></tr>
</table>

---

## AI Agent — 8 Function-Calling Tools

The agent takes real actions on your data — not just answers, but executions:

```
"Create a high-priority task to submit my report by Friday"
"What's my most productive day this week?"
"Plan my day and prioritise my backlog"
"Hire a habit coach"   →   spends TONIC, delegates to HabitOS specialist
```

| Tool | What It Does |
|---|---|
| `create_task` | Creates a task with AI-generated category, priority, and due date |
| `complete_task` | Marks done + immediately fires an on-chain TONIC reward transaction |
| `get_productivity_summary` | Returns live stats from your real task history |
| `analyze_habits` | Deep pattern analysis — best hours, categories, streaks |
| `plan_my_day` | AI-prioritised daily schedule with time estimates |
| `reschedule_task` | Moves a task with an AI explanation for why |
| `set_task_priority` | Changes priority with strategic reasoning |
| `delegate_to_specialist` | Burns $TONIC and hands off to a specialist sub-agent |

Responses stream token-by-token over **SSE** — no waiting, no spinners.

---

## 🪙 $TONIC Inter-Agent Coordination Protocol

The `delegate_to_specialist` tool powers an **inter-agent economy**. Spend $TONIC to unlock deep specialist sessions:

| Sub-Agent | Cost | Expertise |
|---|---|---|
| **HabitOS** | 25 $TONIC | Behavioural neuroscience, habit stacking, behaviour design |
| **ChronoX** | 30 $TONIC | Chronobiology, energy mapping, optimal time-blocking |
| **VisionCore** | 40 $TONIC | OKR coaching, goal-gap analysis, 90-day roadmaps |

Each specialist uses a dedicated system prompt, your full task history, and returns a structured deep-work report.

---

## ⛓️ Real On-Chain TON Rewards

Every task completion triggers a **non-blocking TON testnet transaction** from the platform deployer wallet to the user's connected wallet:

```
Amount  → 0.001 tTON
Comment → TONIC:25:task_complete   (scales with priority)
Store   → tx hash saved + shown live in Profile with testnet.tonscan.org link
```

**Platform deployer wallet:**

```
0QBrXSY1xnP25QBRLg6G_9lSgoV4aypr92BK3pFQkactXG6V
```
[![View on Testnet](https://img.shields.io/badge/TONScan-View_Deployer-0088CC?style=flat-square)](https://testnet.tonscan.org/address/0QBrXSY1xnP25QBRLg6G_9lSgoV4aypr92BK3pFQkactXG6V)

**TONIC earn rates:**

| Action | Reward |
|---|---|
| Complete low-priority task | +10 TONIC |
| Complete medium-priority task | +15 TONIC |
| Complete high-priority task | +25 TONIC |
| Daily login streak bonus | +25 TONIC |
| Complete daily challenge | +50 TONIC |
| On-chain achievement claim | **2× multiplier** |

---

## 🏅 90+ Achievements — On-Chain Claims

Unlock achievements by completing tasks, hitting streaks, and reaching milestones. Each can be claimed two ways:

| Claim | Reward | Chain Interaction |
|---|---|---|
| ⚡ **Standard** | 1× points | Instant, off-chain |
| ⛓️ **2× On-Chain** | 2× points | Real 0.005 TON microtransaction — achievement hash permanently recorded on TON |

After an on-chain claim, the tx hash is stored in the backend, shown in Profile's activity feed, and viewable on testnet.tonscan.org.

---

## 👑 10 Rank Progression

<div align="center">

| # | Rank | Points Required |
|:---:|:---:|:---:|
| 1 | 🌱 Rookie | 0 |
| 2 | ⚡ Apprentice | 200 |
| 3 | 🔥 Grinder | 600 |
| 4 | 🎯 Strategist | 1,500 |
| 5 | 💡 Pro | 3,500 |
| 6 | 🛡️ Elite | 7,500 |
| 7 | ⭐ Master | 15,000 |
| 8 | 🏆 Champion | 30,000 |
| 9 | 🌟 Legend | 60,000 |
| 10 | 👑 **Mythic** | 120,000 |

</div>

---

## 🔖 Tonian Badge

A **1 TON one-time mint** that permanently records your identity on the TON blockchain.

| Benefit | Details |
|---|---|
| 2× Lifetime Multiplier | Every future claim — on-chain or off — earns double |
| Verified Leaderboard | "Verified Tonian" marker shown to all players |
| Free Deep Strategy | All premium AI diagnostic sessions, forever |
| Permanent Identity | On-chain record linking your wallet to your Tonic profile |

---

## Architecture

```
tonic-ai/
│
├── backend/                        Node.js (ESM) · Express 5 · PostgreSQL
│   ├── index.mjs                   Entry — middleware, route mounting, bootstrap
│   ├── config.mjs                  TONIC earn rates, AI model, daily challenges
│   ├── db.mjs                      PostgreSQL via pg.Pool + initDB()
│   ├── telegram.mjs                Telegram bot (optional, via TELEGRAM_BOT_TOKEN)
│   │
│   ├── ton/
│   │   ├── client.mjs              Toncenter API client (testnet)
│   │   └── wallet.mjs              Deployer wallet init + sendTonicReward()
│   │
│   ├── agent/
│   │   ├── prompt.mjs              buildAgentSystemPrompt() + specialist prompts
│   │   ├── tools.mjs               8 OpenAI function-calling JSON schemas
│   │   └── executor.mjs            executeToolCall() — shared by all agent routes
│   │
│   └── routes/
│       ├── agent.mjs               POST /api/agent  ·  GET /api/agent/stream
│       ├── tasks.mjs               Task CRUD + on-chain reward on completion
│       ├── users.mjs               Upsert, ton-proof, sync codes
│       ├── tokens.mjs              $TONIC balance, earn, daily challenge
│       ├── records.mjs             On-chain records, claim-points endpoint
│       ├── leaderboard.mjs         Global top-20 leaderboard
│       └── ton-chain.mjs           /api/ton/* — deployer · balance · reward · history
│
└── frontend/                       Expo / React Native · TypeScript · TonConnect
    ├── app/
    │   ├── (tabs)/                 Dashboard · Tasks · Insights · Profile · Agent
    │   ├── onboarding/             Animated 5-step coach tour (spotlight UI)
    │   ├── tonian-badge.tsx        Badge mint screen (1 TON → on-chain identity)
    │   ├── tonic-balance.tsx       $TONIC wallet + earn history
    │   └── sync-device.tsx         Cross-device sync via QR code
    │
    ├── components/
    │   └── AchievementsModal.tsx   90+ achievements + standard/on-chain claim flows
    │
    ├── hooks/
    │   └── useTonConnect.ts        TonConnect 2.0 — connect, send, record on-chain
    │
    ├── providers/
    │   ├── AppStateProvider.tsx    User identity, wallet, persistence
    │   ├── TasksProvider.tsx       Task CRUD, stats, streak tracking
    │   ├── AchievementsProvider.tsx  90+ achievement state + claim logic
    │   ├── ThemeProvider.tsx       Dark/light with gold-accent design tokens
    │   └── TonConnectProvider.tsx  TonConnectUIProvider configuration
    │
    └── constants/
        ├── achievements.ts         All 90+ achievement definitions
        ├── colors.ts               Design tokens (gold-on-dark system)
        └── api.ts                  Runtime API URL + TON address constants
```

---

## Tech Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| Expo / React Native | SDK 52 | Cross-platform app — web, iOS, Android |
| Expo Router | v4 | File-system based tab and modal navigation |
| TypeScript | 5.x | End-to-end type safety |
| TonConnect UI React | 2.x | TON wallet pairing and transaction signing |
| AsyncStorage | — | Offline-first local persistence |
| React Context | — | Global state — tasks, achievements, theme, user |
| Expo Linear Gradient | — | Gradient UI (badge, buttons, cards) |
| Lucide React Native | — | Consistent icon system |
| Bun | 1.x | Package manager and bundler |

### Backend

| Technology | Version | Role |
|---|---|---|
| Node.js (ESM) | 20+ | Runtime |
| Express | 5.x | HTTP API framework |
| PostgreSQL | 15+ | Persistent storage |
| OpenAI SDK | 4.x | GPT-4o — agent, insights, deep analysis |
| @ton/core + ton | — | TON blockchain SDK — wallet, transactions |
| node-telegram-bot-api | — | Telegram bot interface |
| pg | — | PostgreSQL client (connection pool) |

---

## 📡 API Reference

### Core
```
GET  /health                              Server health + feature flags
GET  /tonconnect-manifest.json            Dynamic TonConnect wallet manifest
```

### Users & Auth
```
GET  /api/users/:userId                   Get user profile + verified status
POST /api/users                           Create or upsert user
POST /api/ton-proof                       Store TonConnect verification proof (badge mint)
GET  /api/sync-code/generate              Generate cross-device QR sync code
POST /api/sync-code/restore               Restore account from sync code
```

### Tasks
```
GET    /api/users/:userId/tasks           Fetch all tasks for a user
POST   /api/tasks                         Create or update a task
DELETE /api/tasks/:taskId                 Delete a task
POST   /api/tasks/sync                    Bulk sync tasks from client
```

### AI Agent
```
POST /api/agent                           GPT-4o agent (8 tools, one-shot)
GET  /api/agent/stream                    SSE streaming agent (token-by-token)
POST /api/agent/deep-analysis             Premium deep strategy diagnostic report
POST /api/insights                        GPT-4o productivity insights from task history
```

### $TONIC & Blockchain
```
GET  /api/users/:userId/tokens            $TONIC balance
POST /api/earn-tokens                     Award $TONIC (task complete, achievement, etc.)
GET  /api/daily-challenge                 Today's challenge + done status
POST /api/daily-challenge/complete        Mark complete + award +50 TONIC
POST /api/records                         Upsert an on-chain record (with tx hash)
GET  /api/users/:userId/records           Fetch all records with tx hashes
POST /api/claim-points                    Record on-chain achievement claim
GET  /api/ton/deployer                    Deployer wallet address + balance + status
GET  /api/ton/balance/:address            Live TON balance via Toncenter API
POST /api/ton/reward                      Send on-chain $TONIC reward transaction
GET  /api/ton/history/:userId             On-chain tx history for user (last 20)
```

### Leaderboard
```
GET  /api/leaderboard                     Top 20 players sorted by score
```

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id              TEXT PRIMARY KEY,          -- wallet address or guest UUID
  name            TEXT,
  wallet_address  TEXT,
  is_guest        BOOLEAN DEFAULT true,
  tonic_tokens    INTEGER DEFAULT 0,         -- cumulative earned TONIC
  verified_at     TIMESTAMPTZ,               -- set after Tonian Badge mint
  ton_proof       TEXT,                      -- TonConnect proof BOC
  last_daily_challenge  DATE,
  daily_challenge_done  BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT REFERENCES users(id),
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,          -- work / personal / health / finance / learning
  priority        TEXT,          -- low / medium / high
  status          TEXT,          -- pending / in_progress / completed
  due_date        TIMESTAMPTZ,
  ai_suggested    BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,
  tonic_reward    INTEGER,       -- TONIC credited on this task's completion
  ton_tx_hash     TEXT,          -- on-chain tx hash for this reward
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- On-chain activity records
CREATE TABLE on_chain_records (
  id              TEXT PRIMARY KEY,
  user_id         TEXT REFERENCES users(id),
  record_type     TEXT,          -- tonic_reward / points_claim / ton_proof
  title           TEXT,
  description     TEXT,
  ton_tx_hash     TEXT,          -- TON blockchain transaction hash
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Running Locally

### Prerequisites

- Node.js 20+
- Bun 1.x
- PostgreSQL 15+ (or Replit's built-in database)
- OpenAI API key (or Replit AI Integrations)

### 1. Start the Backend

```bash
cd backend
npm install
node index.mjs
# Server starts on $PORT (default: 3000)
```

### 2. Build the Frontend (Production)

```bash
cd frontend
bun install
bun run expo export --platform web
# Output: frontend/dist/  — served automatically by the backend
```

### 3. Frontend Dev Mode

```bash
bun run start          # Expo dev server (all platforms)
bun run start-web      # Web only
bun run start-android  # Android (requires emulator or device)
bun run start-ios      # iOS (requires macOS + Xcode)
```

### 4. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | ✅ | OpenAI-compatible API base URL |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | ✅ | API key |
| `TON_DEPLOYER_MNEMONIC` | ✅ | 24-word mnemonic for TON testnet deployer wallet |
| `TELEGRAM_BOT_TOKEN` | ☑️ | Enables the Telegram bot |
| `TONCENTER_API_KEY` | ☑️ | Higher rate limits on Toncenter API |
| `PORT` | ☑️ | HTTP port (default: 3000) |
| `REPLIT_DEV_DOMAIN` | ☑️ | Auto-set by Replit — used in TonConnect manifest URL |
| `REPLIT_DOMAINS` | ☑️ | Auto-set by Replit — used in production manifest URL |

---

## Hackathon Qualification

**TON AI Hackathon 2026 — "User-Facing AI Agents" track**

Tonic AI satisfies all four core criteria:

| Criterion | Implementation |
|---|---|
| **Conversational AI Agent** | GPT-4o + 8 live function-calling tools + real-time SSE streaming as the primary interface |
| **Real TON Integration** | Every task completion produces a verifiable on-chain testnet transaction; tx hashes shown live in-app |
| **Inter-Agent Protocol** | $TONIC token economy funds specialist sub-agent delegation (HabitOS · ChronoX · VisionCore) |
| **Smart Contract** | Full TEP-74/89 Jetton implementation in Tact language, ready for mainnet deployment |

---

## Design Principles

**Offline-first** — All tasks and achievements are stored locally via AsyncStorage and synced to the server when online. The app works fully without a connection.

**Wallet-optional** — Start as a guest with zero setup. Connect your TON wallet whenever you want to unlock blockchain features. Nothing is gated behind wallet connection.

**Transparent economy** — Every TONIC value is shown before any action. On-chain claims clearly state the fee (0.005 TON) and reward (2× points). No surprises.

**Real AI, real actions** — The agent calls real functions and shows results inline in the chat. Not summaries — actual task creation, completion, and scheduling executed against live data.

---

<div align="center">

Built with Love for the **TON AI Hackathon 2026** by *Anas*

[![TON](https://img.shields.io/badge/TON_Blockchain-0088CC?style=for-the-badge&logo=telegram&logoColor=white)](https://ton.org)
[![OpenAI](https://img.shields.io/badge/GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](LICENSE)

</div>
