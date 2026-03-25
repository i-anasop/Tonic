# Tonic AI — TON AI Hackathon 2026

## Overview
Tonic AI is a GPT-4o powered, TON blockchain-native task management app built for the TON AI Hackathon 2026. Features a conversational AI agent with 8 function-calling tools, a real on-chain $TONIC reward system (TON testnet), specialist agent delegation, 90+ achievements, 10-level rank system, SSE streaming, Telegram bot, and cross-device sync.

## Project Structure

```
workspace/
├── backend/                  ← Express API server (Node.js / ESM)
│   ├── index.mjs             ← Entry: middleware, routes, bootstrap
│   ├── db.mjs                ← pg.Pool + initDB()
│   ├── openai.mjs            ← OpenAI client singleton
│   ├── config.mjs            ← Constants (AI_MODEL=gpt-4o, TONIC rates, challenges)
│   ├── static.mjs            ← Static file serving + portrait CSS injection
│   ├── telegram.mjs          ← Telegram bot (/start /tasks /today /done /stats /ai)
│   ├── ton/
│   │   ├── client.mjs        ← Toncenter API client (testnet)
│   │   └── wallet.mjs        ← Deployer wallet (init, sendTonicReward, getDeployerInfo)
│   ├── agent/
│   │   ├── prompt.mjs        ← buildAgentSystemPrompt() + buildSpecialistPrompt()
│   │   ├── tools.mjs         ← buildAgentTools() — 8 OpenAI function schemas
│   │   └── executor.mjs      ← executeToolCall() — shared by both agent endpoints
│   └── routes/
│       ├── agent.mjs         ← POST /api/agent, POST /api/agent/stream, POST /api/agent/deep-analysis
│       ├── tasks.mjs         ← CRUD /api/tasks* + on-chain reward on completion
│       ├── users.mjs         ← POST /api/users, /api/ton-proof, /api/sync-code/*
│       ├── tokens.mjs        ← GET/POST /api/*tokens, /api/daily-challenge/*
│       ├── records.mjs       ← GET/POST /api/records, POST /api/claim-points
│       ├── leaderboard.mjs   ← GET /api/leaderboard
│       └── ton-chain.mjs     ← GET /api/ton/deployer, /api/ton/balance/:addr, POST /api/ton/reward, GET /api/ton/history/:userId
├── contracts/
│   ├── tonic.tact            ← $TONIC Jetton smart contract (TEP-74/89 compliant, Tact)
│   └── deploy.mjs            ← Deployment script (requires @tact-lang/compiler)
└── frontend/                 ← Expo / React Native mobile + web app
    ├── app/
    │   ├── (tabs)/           ← Dashboard, Tasks, Insights, Profile, Agent
    │   ├── onboarding/       ← Onboarding flow (returning user check)
    │   ├── modal.tsx         ← Add/edit task modal
    │   └── reset.tsx         ← App reset screen
    ├── components/           ← AchievementsModal, AppTour
    ├── constants/            ← Colors, API URL, achievements config
    ├── hooks/                ← useTonConnect
    ├── providers/            ← AppState, Tasks, Achievements, Theme, TonConnect
    └── types/                ← tasks.ts (AgentAction includes specialist_hired, update_priority)
```

## Backend

- **Framework**: Express 5 (Node.js ESM)
- **Database**: PostgreSQL (DATABASE_URL)
- **AI**: GPT-4o via Replit AI Integrations proxy
- **TON**: @ton/ton + @ton/crypto (testnet deployer wallet)
- **Port**: 3000

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (v2.0.0) |
| GET | `/tonconnect-manifest.json` | TonConnect manifest |
| POST | `/api/insights` | GPT-4o productivity insights |
| POST | `/api/users` | Upsert user |
| GET | `/api/users/:userId` | Fetch user (includes verifiedAt) |
| GET | `/api/users/:userId/tasks` | Fetch tasks |
| POST | `/api/tasks` | Upsert task (fires on-chain reward on completion) |
| DELETE | `/api/tasks/:taskId` | Delete task |
| POST | `/api/tasks/sync` | Bulk sync |
| POST | `/api/records` | Save on-chain record |
| GET | `/api/users/:userId/records` | Fetch on-chain records |
| POST | `/api/claim-points` | Claim achievement points |
| POST | `/api/agent` | AI agent chat (8 tools, function calling) |
| GET  | `/api/agent/stream` | SSE streaming agent |
| POST | `/api/agent/deep-analysis` | Deep Strategy analysis (premium) |
| GET | `/api/ton/deployer` | Deployer wallet status + address |
| GET | `/api/ton/balance/:address` | Real TON balance from Toncenter API |
| POST | `/api/ton/reward` | Send on-chain TONIC reward tx |
| GET | `/api/ton/history/:userId` | On-chain tx history |

### Database Schema
- `users` — id, name, wallet_address, is_guest, ton_proof, verified_at, tonic_tokens, sync_code, timestamps
- `tasks` — id, user_id, title, desc, category, priority, status, due_date, ai_suggested, stake_amount, stake_tx_hash, timestamps
- `on_chain_records` — id, user_id, record_type, title, description, ton_tx_hash, recorded_at
- `agent_conversations` — id, user_id, messages (JSONB), timestamps

## TON Blockchain Integration

### Deployer Wallet
- Address: `0QBrXSY1xnP25QBRLg6G_9lSgoV4aypr92BK3pFQkactXG6V`
- Network: TON Testnet
- Explorer: https://testnet.tonscan.org/address/0QBrXSY1xnP25QBRLg6G_9lSgoV4aypr92BK3pFQkactXG6V
- Mnemonic: saved as `TON_DEPLOYER_MNEMONIC` env var
- Faucet: https://t.me/testgiver_ton_bot

### On-Chain Flow
1. User completes a task → backend fires `sendTonicReward()` (non-blocking)
2. Deployer sends 0.001 tTON to user's wallet with comment `TONIC:15:task_complete`
3. Tx hash stored in `on_chain_records.ton_tx_hash`
4. Frontend profile shows tx with link to testnet.tonscan.org

### Jetton Contract
- Source: `contracts/tonic.tact` (TEP-74/89 compliant Tact implementation)
- Includes: TonicJettonMinter (master) + TonicWallet (per-user)
- Deploy: `node contracts/deploy.mjs` (requires @tact-lang/compiler)

## Agent System (8 Tools)
1. `create_task` — Create a task from natural language
2. `complete_task` — Mark a task complete (triggers on-chain reward)
3. `show_stats` — Display productivity stats
4. `plan_my_day` — Build a daily schedule
5. `analyze_habits` — Deep behavioral pattern analysis
6. `reschedule_task` — Move a task's due date
7. `update_priority` — Change task priority
8. `delegate_to_specialist` — Hire HabitOS/ChronoX/VisionCore (costs $TONIC)

## Specialist Agents ($TONIC Protocol)
- **HabitOS** (25 $TONIC) — Behavioral neuroscience, habit stacks
- **ChronoX** (30 $TONIC) — Chronobiology, time-blocking
- **VisionCore** (40 $TONIC) — OKR coaching, goal alignment

## Frontend Key Features
1. **AI Agent** — GPT-4o, 8 tools, SSE streaming, specialist delegation
2. **Deep Strategy** — Premium analysis (free for Tonian badge holders, 0.05 TON otherwise)
3. **Real TON Balance** — Profile fetches live wallet balance from Toncenter API
4. **On-Chain Activity Feed** — Profile shows real testnet tx links
5. **$TONIC rewards** — Every task completion → real TON testnet tx
6. **Achievements** — 90+ achievements, 10-level rank system (Rookie → Mythic)
7. **Telegram Bot** — /start /tasks /today /done /stats /ai
8. **Cross-device sync** — Sync code backup/restore

## Running the App
- **Backend**: `node backend/index.mjs` (workflow: "Start application", port 3000)
- **Frontend build**: `cd frontend && bun run expo export --platform web`
- **Frontend dev**: `cd frontend && bun run start`

## Environment Variables
| Variable | Source | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Auto-provisioned | PostgreSQL |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Auto-provisioned | Replit AI proxy |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Auto-provisioned | Replit AI proxy key |
| `TELEGRAM_BOT_TOKEN` | Secrets | Telegram bot (optional) |
| `REPLIT_DEV_DOMAIN` | Auto-provisioned | TonConnect manifest URL |
| `TON_DEPLOYER_MNEMONIC` | Env vars (shared) | TON testnet deployer wallet |
| `TONCENTER_API_KEY` | Optional secret | Higher rate limits on Toncenter |
| `TONIC_JETTON_CONTRACT` | Env var | Deployed Jetton contract address |
| `TON_NETWORK` | Env var | "testnet" |

## Bugs Fixed (Final Session)
- AgentAction type now includes `specialist_hired` and `update_priority`
- LLM cannot override specialist costs (always server-enforced)
- speechRecognition converted from module var to useRef
- deepAbortRef added to cancel in-flight deep analysis on unmount
- GET /api/users/:userId now returns `verifiedAt` (was breaking Tonian check)
- Telegram /today query fixed (was including tomorrow's tasks)
- All gpt-5.2 references replaced with gpt-4o
- ton_tx_hash field name fixed in profile on-chain activity feed
- tonscan.org updated to testnet.tonscan.org throughout
