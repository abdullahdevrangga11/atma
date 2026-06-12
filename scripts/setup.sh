#!/usr/bin/env bash
# AMANA Day 1 setup script
# Run from repo root: bash scripts/setup.sh

set -e

echo "🟢 AMANA Day 1 Setup"
echo "=================="

# Check prerequisites
echo ""
echo "Step 1/6 — Checking prerequisites..."
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm not installed. Run: npm i -g pnpm"; exit 1; }
command -v forge >/dev/null 2>&1 || { echo "❌ Foundry not installed. Run: curl -L https://foundry.paradigm.xyz | bash && foundryup"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ git not installed"; exit 1; }
echo "✅ pnpm, forge, git installed"

# Initialize git
echo ""
echo "Step 2/6 — Initializing git..."
if [ ! -d .git ]; then
  git init
  git add .
  git commit -m "chore: initial AMANA scaffold (README + skills + subagent prompts)"
  echo "✅ Git initialized"
else
  echo "ℹ️  Git already initialized"
fi

# Install Node deps
echo ""
echo "Step 3/6 — Installing Node dependencies..."
pnpm install
echo "✅ Node deps installed"

# Setup Foundry contracts
echo ""
echo "Step 4/6 — Setting up Foundry contracts..."
cd contracts
if [ ! -d lib/openzeppelin-contracts ]; then
  forge install OpenZeppelin/openzeppelin-contracts --no-commit
fi
if [ ! -d lib/forge-std ]; then
  forge install foundry-rs/forge-std --no-commit
fi
forge build || true
cd ..
echo "✅ Foundry contracts ready"

# Copy env example
echo ""
echo "Step 5/6 — Copying .env.example to .env.local..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ .env.local created — FILL IN before pnpm dev"
  echo ""
  echo "Required env vars to fill (minimum):"
  echo "  NEXT_PUBLIC_PRIVY_APP_ID"
  echo "  ANTHROPIC_API_KEY"
  echo "  PRIVATE_KEY (for forge script deploy)"
  echo "  MANTLESCAN_API_KEY (for contract verification)"
else
  echo "ℹ️  .env.local already exists, skipping"
fi

# Setup done
echo ""
echo "Step 6/6 — Setup complete! ✅"
echo ""
echo "=================================================="
echo "Next steps:"
echo ""
echo "1. Fill in .env.local with your keys"
echo ""
echo "2. Launch Claude Code subagents in parallel:"
echo "   - Agent A (Contracts):  cat prompts/agent-a-contracts.md"
echo "   - Agent B (Agents):     cat prompts/agent-b-agents.md"
echo "   - Agent C (Frontend):   cat prompts/agent-c-frontend.md"
echo "   - Agent D (Docs):       cat prompts/agent-d-docs.md"
echo "   - Agent E (Comms):      cat prompts/agent-e-comms.md (Day 3 only)"
echo ""
echo "3. Day 1 priorities:"
echo "   - Agent A: forge init in contracts/ + AmanaVault.sol + 30 tests + deploy Sepolia"
echo "   - Agent C: Next.js init + Tailwind theme + Privy + Lenis"
echo "   - Agent B: Skeleton agent classes + Skill files reading"
echo "   - Agent D: Polish README + ARCHITECTURE + runbooks"
echo ""
echo "4. Twitter Day 1 announce:"
echo "   '🟢 Building AMANA — Treasury Orchestration Protocol for @0xMantle"
echo "    3 AI agents. 4 RWA assets. 1 verifiable on-chain policy."
echo "    3-day sprint for #MantleAIHackathon. Day 1 GO.'"
echo ""
echo "Deadline: June 15, 2026, 15:59 UTC."
echo "=================================================="
