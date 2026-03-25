#!/bin/bash
set -e

REPO_URL="https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/i-anasop/Tonic.git"

echo "Configuring git identity..."
git config user.email "tonic-ai@replit.dev"
git config user.name "Tonic AI"

# Remove stale lock files if present
rm -f .git/index.lock .git/config.lock

# Remove files from Git tracking that should be hidden on GitHub
# (the files stay on disk — only removed from the git index)
echo "Cleaning tracked files that belong in .gitignore..."
git rm --cached -r contracts/   2>/dev/null || true
git rm --cached -r landing/     2>/dev/null || true
git rm --cached -r .local/      2>/dev/null || true
git rm --cached -r .agents/     2>/dev/null || true
git rm --cached -r .cache/      2>/dev/null || true
git rm --cached -r .config/     2>/dev/null || true
git rm --cached prompt.txt      2>/dev/null || true
git rm --cached push-to-github.sh 2>/dev/null || true
git rm --cached replit.md       2>/dev/null || true
git rm --cached .replit         2>/dev/null || true
git rm --cached pnpm-lock.yaml  2>/dev/null || true
git rm --cached pnpm-workspace.yaml 2>/dev/null || true
git rm --cached package.json    2>/dev/null || true
git rm --cached tsconfig.json   2>/dev/null || true
git rm --cached .npmrc          2>/dev/null || true
echo "   Done."

echo "Staging all changes..."
git add -A
git status --short | head -20

echo "Committing..."
git diff --cached --quiet && echo "   Nothing new to commit." || git commit -m "chore: clean repo — only frontend/ backend/ README.md visible — v2.2.0

- Add .gitignore: hides contracts, landing, replit internals, scripts
- Remove previously-tracked hidden files from git index
- Redesign README with badges, shields, tables, emoji, architecture tree
- Fix stale closure bug in sendTransaction (walletRef)
- Fix wrong burn address in recordAchievementOnChain (TON_REWARD_ADDRESS)
- Fix onStatusChange handler updates wallet state immediately on mobile
- Fix mainnet TONScan link after badge mint -> testnet.tonscan.org
- Fix Tonian Badge minted state resets on navigation (backend check on mount)
- Fix AchievementsModal missing backend sync after on-chain claim"

echo "Setting up GitHub remote..."
if git remote get-url github &>/dev/null; then
  git remote set-url github "$REPO_URL"
else
  git remote add github "$REPO_URL"
fi

echo "Pushing to GitHub..."
git push github main

echo ""
echo "Done! Live at: https://github.com/i-anasop/Tonic"
