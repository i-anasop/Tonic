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
  git commit -m "fix: critical bug fixes + backend sync — v2.1.0

- Fix stale closure bug in sendTransaction (walletRef instead of state.isConnected)
- Fix wrong zero/burn address in recordAchievementOnChain (uses TON_REWARD_ADDRESS now)
- Fix empty onStatusChange handler — updates wallet state for faster mobile detection
- Fix mainnet TONScan link after badge mint (testnet.tonscan.org)
- Fix minted state not persisting after navigation (backend check on mount)
- Fix AchievementsModal missing backend sync after on-chain claim
- Landing page at /landing with particle animations and full feature showcase
- GPT-4o, real TON testnet transactions, deployer wallet 2 tTON funded
- 8 AI agent tools, 90+ achievements, 10 rank levels (Rookie to Mythic)
- TEP-74/89 Jetton smart contract, SSE streaming, Telegram bot"
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
