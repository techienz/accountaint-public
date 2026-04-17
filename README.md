# Accountaint

Self-hosted, AI-powered accounting app for New Zealand businesses. Your financial data stays on your machine, encrypted at rest. Claude handles reasoning (with PII sanitisation), an optional local LLM handles sensitive tasks like OCR and categorisation.

## Highlights

- **Local-first** — SQLite + LanceDB on your disk; no cloud database
- **AI chat that is your accountant** — direct, confident answers backed by NZ tax law and IRD guidance (RAG)
- **Double-entry bookkeeping engine** — Chart of Accounts, journal entries, Trial Balance, P&L, Balance Sheet, General Ledger
- **Bank feeds via Akahu** — NZ banks; ANZ/ASB/BNZ/Westpac live, Kiwibank via Akahu from Dec 2026
- **Xero is optional** — use it for parallel running and cross-check, or don't use it at all
- **Dividends** — declare, generate board resolution PDFs (Companies Act 1993 s107), post journal entries
- **Payroll** — PAYE, KiwiSaver, student loan, ESCT, payslips
- **GST** — returns from the ledger (includes expenses, not just invoices)
- **Multi-tenant** — multiple businesses per user with isolated data
- **Privacy first** — PII encrypted at rest; sanitised before leaving the machine

## Deployment

Two supported options. Pick one:

### Option A: Docker (recommended for new installs)

```bash
# 1. Pull the compose file
curl -O https://raw.githubusercontent.com/techienz/accountaint-public/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/techienz/accountaint-public/main/.env.docker.example

# 2. Copy the env template and fill in secrets
cp .env.docker.example .env
# Edit .env — set APP_ENCRYPTION_KEY, JWT_SECRET, ANTHROPIC_API_KEY, VAPID_* keys.
# See comments in .env.docker.example for how to generate each.

# 3. Prepare the data directory (must be UID 1000)
mkdir -p data && sudo chown -R 1000:1000 data

# 4. Start it
docker compose up -d
```

Open http://localhost:3000 and follow the **First-run guide** below.

Image is published at `ghcr.io/techienz/accountaint`. Tags: `:latest`, `:main`, `:v0.1.0`, `:sha-<short>`.

To rebuild from source instead of pulling, clone the repo and in `docker-compose.yml` replace `image: …` with `build: .`.

**Local LLM note:** if LM Studio or Ollama is running on the host, use `host.docker.internal:PORT` as the URL (either in `.env` or via Settings → Local LLM in-app). If LM Studio isn't running at all, the app falls back to Claude Haiku with PII sanitisation — functional but less private.

### Option B: Systemd user service (direct on host)

For long-running installs where you already manage the Node process directly.

```bash
git clone https://github.com/techienz/accountaint-public.git
cd accountaint-public
npm ci
cp .env.example .env        # fill in secrets
npx drizzle-kit push        # create DB schema
npm run build
# Either `npm start` or configure a systemd user service pointing at
# `.next/standalone/server.js`.
```

A sample systemd user unit file and Nginx reverse-proxy config for HTTPS are in the wiki.

## First-run guide

After starting the app, visit `http://localhost:3000` and do the following in order:

1. **Create your account** — set an email and 4-digit PIN. The first account becomes the owner.
2. **Add your first business** — Overview → Settings → business details. Pick entity type (company, sole trader, partnership, trust), GST period, GST basis, balance date.
3. **Bank Feeds (recommended)** — Settings → Bank Feeds. Paste your Akahu **App ID Token** and **User Access Token** from [my.akahu.nz](https://my.akahu.nz). Click "Sync Now" to pull accounts and transactions. Link each bank account to either "Personal Budget" or your business.
4. **Local LLM (optional)** — Settings → Local LLM. Pick a preset (LM Studio or Ollama), Test Connection, Save. Without this, OCR/categorisation/summarisation fall back to Claude Haiku.
5. **IRD knowledge base** — Settings → Regulatory Updates → "Fetch IRD guides". Downloads the IRD guides used for RAG-backed tax advice. Takes 30 seconds to a couple of minutes.
6. **Shareholders / Employees** — Earn → Shareholders, or People → Employees. Add IRD numbers, ownership %, start dates, pay details.
7. **Opening Balances (if migrating from Xero)** — Settings → Opening Balances. Imports your balance sheet starting point so the ledger gives accurate reports from day one.
8. **Xero (optional, for parallel running)** — Settings → Xero. OAuth2 flow connects a company. Use Xero Monitor to compare ledger vs. Xero while you gain confidence in the local ledger.
9. **Notifications (optional)** — Settings → Notifications. Configure email, desktop push, or Slack alerts for deadlines.
10. **Tax Savings bank link (optional)** — Settings → Bank Feeds. Check "Tax Savings" on the account you use for tax set-aside. The tracker reads its balance automatically.

You're ready to go. The AI chat (click the icon top-right) can walk you through anything else.

## Documentation

Full architecture, design decisions, and knowledge system docs live in the **[wiki](https://github.com/techienz/accountaint-public/wiki)**:

- [Architecture](https://github.com/techienz/accountaint-public/wiki/Architecture)
- [Design Decisions](https://github.com/techienz/accountaint-public/wiki/Design-Decisions)
- [Database Schema](https://github.com/techienz/accountaint-public/wiki/Database-Schema)
- [NZ Tax Knowledge](https://github.com/techienz/accountaint-public/wiki/NZ-Tax-Knowledge)
- [Xero Integration](https://github.com/techienz/accountaint-public/wiki/Xero-Integration)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, standalone output) |
| UI | Tailwind CSS + shadcn/ui |
| Database | SQLite via better-sqlite3 + Drizzle ORM; application-level field encryption |
| Vector Store | LanceDB (hybrid vector + BM25) |
| AI (reasoning) | Claude Sonnet API with PII sanitisation |
| AI (local) | Any OpenAI-compatible local LLM (LM Studio, Ollama, vLLM, llama.cpp) |
| Embeddings | Nomic Embed Text V2 via local LLM |
| PDF generation | Puppeteer (invoices, payslips, board resolutions) |
| Auth | Email + 4-digit PIN with JWT sessions |

## Prerequisites

For Docker deployment: Docker 20+ and Docker Compose v2.

For direct deployment: Node.js 22+ and npm 10+.

In either case:
- **Claude API key** — [console.anthropic.com](https://console.anthropic.com/)
- **Akahu personal app tokens** (recommended) — [my.akahu.nz](https://my.akahu.nz)
- **LM Studio or Ollama** (optional, for local AI)
- **Xero developer app** (optional, only if you want parallel running)

## License

Not currently licensed for redistribution. All rights reserved.
