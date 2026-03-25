#!/bin/bash
set -e

REPO_URL="https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/i-anasop/Tonic.git"

echo "🔧 Configuring git identity..."
git config user.email "tonic-ai@replit.dev"
git config user.name "Tonic AI"

# Remove stale lock files if present
rm -f .git/index.lock .git/config.lock

echo "📋 Checking for uncommitted changes..."
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  echo "   Staging all changes..."
  git add -A
  git commit -m "feat: add landing page, priority-based TONIC rewards, bug fixes — v2.0.0

- Beautiful marketing landing page (/landing) with particle animations
- Priority-based on-chain TONIC rewards: high=25, medium=15, low=10
- Fixed AI agent task completion not crediting user TONIC balance
- Fixed hardcoded fallback API URL in frontend
- Fixed leaderboard rank names (Rookie→Mythic unified system)
- Fixed dashboard reward label and tonic-balance earn rates display
- Removed tonicCost from agent tools required array
- GPT-4o powered, TON testnet real transactions verified
- 8 AI agent tools, 90+ achievements, 10 rank levels
- TEP-74/89 Jetton smart contract (Tact language)
- Comprehensive README for TON AI Hackathon 2026 submission"
  echo "   Committed."
else
  echo "   Nothing to commit — all changes already committed."
fi

echo "🔗 Setting up GitHub remote..."
if git remote get-url github &>/dev/null; then
  git remote set-url github "$REPO_URL"
  echo "   Remote updated."
else
  git remote add github "$REPO_URL"
  echo "   Remote added."
fi

echo "📦 Pushing to GitHub (this may take 30-60 seconds)..."
git push github main

echo ""
echo "✅ Done! Your repo is live at:"
echo "   https://github.com/i-anasop/Tonic"
