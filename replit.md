# Tonic AI — TON AI Hackathon Project

## Overview
Tonic AI is a TON blockchain-integrated, AI-powered task management mobile app built with Expo/React Native. Built for the TON AI Hackathon ($20,000 prize, deadline March 25, 2026) targeting the "User-Facing AI Agents" track.

## Architecture

### Mobile App (`Tonic-AI/expo/`)
- **Framework**: Expo / React Native
- **Package manager**: bun
- **Navigation**: Expo Router (tab-based)
- **Screens**: Dashboard, Tasks, AI Insights, Profile + Onboarding
- **State**: React Context providers (TasksProvider, AppStateProvider, AchievementsProvider)
- **Local Storage**: AsyncStorage for offline-first caching

### Backend Server (`server/`)
- **Framework**: Express 5 (Node.js, ESM)
- **Database**: PostgreSQL (via `pg` pool, DATABASE_URL env var)
- **AI**: OpenAI GPT-5.2 via Replit AI Integrations proxy (no user API key needed)
- **Port**: 3000 (configured via PORT env var)
- **Domain**: `92c86d49-9cf4-41d6-8464-6cb2972e01f7-00-3btckq8mc5vwe.picard.replit.dev`

## Backend API Endpoints
- `GET /health` — health check
- `GET /tonconnect-manifest.json` — TonConnect wallet manifest
- `POST /api/insights` — Real AI-generated productivity insights (GPT-5.2)
- `POST /api/users` — Create/upsert user (wallet or guest)
- `GET /api/users/:userId/tasks` — Fetch user's tasks from DB
- `POST /api/tasks` — Create/update single task
- `DELETE /api/tasks/:taskId` — Delete task
- `POST /api/tasks/sync` — Bulk sync tasks to DB
- `POST /api/records` — Save on-chain achievement record
- `GET /api/users/:userId/records` — Fetch on-chain records

## Database Schema
- `users` — id, name, wallet_address, is_guest, timestamps
- `tasks` — id, user_id, title, description, category, priority, status, due_date, created_at, completed_at
- `on_chain_records` — id, user_id, record_type, title, description, ton_tx_hash, recorded_at

## Key Features Implemented
1. **Real AI Insights** — GPT-5.2 generates personalized, data-driven insights based on actual task data. Falls back to local rule-based if API unavailable.
2. **Real TON Integration** — `sendTransaction` and `recordAchievementOnChain` in `useTonConnect.ts`. Profile screen has "Record Achievement On-Chain" button that sends a real TON transaction with an on-chain productivity proof.
3. **Backend Persistence** — PostgreSQL stores users and tasks. AppStateProvider syncs users on creation. TasksProvider can bulk-sync tasks. Data survives reinstalls.
4. **Name Consistency** — "Tonic AI" everywhere. Zero "Pulse" references remaining.

## TON Integration Details
- `useTonConnect.ts` hook wraps TonConnect UI with `sendTransaction` + `recordAchievementOnChain`
- Achievement recording sends 0.05 TON to achievement contract with comment: `Tonic AI | [title] | Tasks: N | Streak: Nd`
- TonConnect manifest served from backend (`/tonconnect-manifest.json`)
- Manifest URL updated from hardcoded local IP to Replit production domain

## Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI proxy URL (auto-provisioned)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI proxy key (auto-provisioned)
- `REPLIT_DEV_DOMAIN` — Used in TonConnect manifest generation

## Running the App
- **Backend**: `node server/index.mjs` (workflow: "Start application")
- **Mobile**: Run in Expo Go or build with `bun run start` from `Tonic-AI/expo/`

## Mobile App Constants
- `Tonic-AI/expo/constants/api.ts` — API base URL and TON constants
- `Tonic-AI/expo/constants/colors.ts` — Design system colors (gold-on-dark theme)
