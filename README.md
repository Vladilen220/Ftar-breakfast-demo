# 🍳 Ftar React

Welcome to **Ftar React** — a modern, multi-tenant breakfast ordering system built for teams and companies.

It combines a clean React UI, a tRPC-powered backend, and MongoDB persistence to deliver a fast ordering workflow with admin controls and company-level isolation.

---

## 📢 Public Repo Note

This public repository is configured as a **frontend demo**.

- It runs in demo mode with local sample data.
- Backend source is not included in this public repo.
- Use the commands below for the public demo build:

```bash
pnpm run dev          # demo dev server
pnpm run build        # demo static build
pnpm run start        # preview demo build
```

> The backend details below are kept as a product teaser/overview.

---

## ✨ Features

- 🔐 **Session Authentication** with persistent sessions (`express-session` + `connect-mongo`)
- 🏢 **Multi-Tenant Architecture** (data isolated per company)
- 📋 **Daily Menu Management** (add/edit/remove items)
- 👥 **Shared Items Support** (participant tracking + split pricing)
- 🧾 **Summary Calculations** (per-user totals + delivery fee split)
- 🛡️ **Owner Admin Panel**
  - review company requests
  - view/manage all companies
  - reassign company admins
  - add company members
  - block/unblock companies
- 🧑‍💼 **Company Admin Tools** for users and menu
- 🌍 **Arabic-first UI** with RTL-friendly pages

---

## 🧱 Tech Stack

- **Frontend:** React, Vite, Wouter, TanStack Query, Tailwind, Radix UI
- **Backend:** Express, tRPC, Zod
- **Database:** MongoDB
- **Validation & Types:** TypeScript
- **Testing:** Vitest

---

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have:

- Node.js 20.19+ (or 22.12+)
- pnpm
- Access to a MongoDB database

### Installation

```bash
git clone https://github.com/<your-username>/ftar-react.git
cd ftar-react
pnpm install
```

### Environment Setup

Create your `.env` file (you can start from `.env.example`) and configure required values:

```env
SESSION_SECRET=change-this-in-production
PORT=3000
NODE_ENV=development
OWNER_EMAIL=you@example.com
APP_URL=http://localhost:3000
GOOGLE_APP_PASSWORD=your-16-char-app-password
```

> Email transport uses Gmail SMTP app password when `GOOGLE_APP_PASSWORD` is set.
> Otherwise, it falls back to an Ethereal test transport in development.

---

## ▶️ Run the App (Teaser: Full Version)

```bash
pnpm dev
```

Then open:

- App: `http://localhost:3000`
- tRPC endpoint: `http://localhost:3000/api/trpc`

> For this public repo, use demo mode commands in the sections above/below (`pnpm run dev`, `pnpm run build`, `pnpm run start`).

---

## 🎬 Demo Mode (Frontend-only)

Demo mode runs a static version of the app with sample data and no backend dependency.

```bash
# run demo locally
pnpm run dev:demo

# build demo static files
pnpm run build:demo

# preview demo build
pnpm run preview:demo
```

---

## 🛠️ Scripts (Public Demo + Teaser)

```bash
# Public demo (available in this repo)
pnpm dev
pnpm build
pnpm start
pnpm run dev:demo
pnpm run build:demo
pnpm run preview:demo
pnpm run check
pnpm test

# Full-version teaser (not included in this public repo)
pnpm run seed
```

---

## ▲ Deploy Demo on Vercel (via GitHub)

This repository is preconfigured for demo deployment using `vercel.json`:

- Install: `pnpm install --frozen-lockfile`
- Build: `pnpm run build:demo`
- Output: `dist-demo`
- Node: `>=22.12.0`

Additional deployment helpers included:

- `.nvmrc` and `.node-version` pin local/runtime Node to `22.12.0`
- `.vercelignore` trims non-essential files from upload

Steps:

1. Push this project to a GitHub repository.
2. In Vercel, click **Add New Project** and import the repo.
3. Click **Deploy** directly.

No Vercel dashboard edits are required (no build command/output/env vars to set).

After each push to your default branch, Vercel redeploys automatically.

---

## 📁 Project Structure

```txt
ftar-react/
├─ client/                 # React frontend
│  └─ src/
│     ├─ components/
│     ├─ contexts/
│     ├─ hooks/
│     ├─ lib/
│     └─ pages/
├─ server/                 # Express + tRPC backend
│  ├─ _core/
│  ├─ migrations/
│  ├─ routers.ts
│  └─ *.test.ts
├─ shared/                 # Shared constants/types
├─ package.json
└─ tsconfig.json
```

---

## ✅ Quality Status

- TypeScript check passes
- Test suite passes
- Session persistence configured and verified

---

## 📄 License

MIT (declared in `package.json`).

For GitHub clarity, add a `LICENSE` file to the repository root.