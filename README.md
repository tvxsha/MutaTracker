# 🧬 MutaTrack — Clinical DNA Mutation Tracker

A clinical-grade web application for patient DNA comparison and oncogenic mutation analysis,
built for cancer research diagnostics.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 |
| Build Tool | Vite 7 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Radix UI (shadcn/ui) |
| Routing | Wouter |
| Backend | Express.js (static file server only) |
| Storage | Browser `localStorage` (no external DB) |
| Deployment | Vercel |

> ⚠️ **No database**: Patient profiles and mutation records are stored in each browser's
> `localStorage`. If a real DB is needed, the `patientStore.ts` CRUD functions are the
> integration point.

---

## 📁 Project Structure

```
mutatrack-landing/
├── client/               # React frontend (Vite)
│   └── src/
│       ├── components/   # UI components
│       ├── lib/
│       │   ├── dnaEngine.ts      # Mutation analysis engine
│       │   └── patientStore.ts   # localStorage CRUD (the "database")
│       └── pages/        # Route pages
├── server/
│   └── index.ts          # Express static file server
├── shared/               # Shared types between client & server
├── dna.c                 # Reference C implementation of DNA engine
├── vite.config.ts
├── vercel.json           # Vercel deployment config
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x
- pnpm (recommended) or npm

### Install dependencies

```bash
pnpm install
# or
npm install
```

### Run in development

```bash
pnpm dev
# or
npm run dev
```

App will be available at `http://localhost:5173` (Vite default).

### Build for production

```bash
pnpm build
```

### Run production server

```bash
pnpm start
```

---

## 🔑 Environment Variables

The `.env.local` file is **not committed** (it contains Vercel tokens). For local dev,
no environment variables are required. For Vercel deployment, link the project via:

```bash
npx vercel link
npx vercel env pull
```

---

## 🧬 Key Files to Know

| File | Purpose |
|---|---|
| `client/src/lib/dnaEngine.ts` | Core mutation analysis — compares DNA sequences, identifies substitution types, assigns oncogenic risk levels |
| `client/src/lib/patientStore.ts` | All read/write operations for patient profiles and mutation history (backed by localStorage) |
| `dna.c` | Original C-language reference implementation the TS engine is based on |

---

## 🏗 Architecture Notes

- The **Express server** (`server/index.ts`) only serves the built static files — all
  logic runs client-side.
- The app is a **pure SPA** (Single Page Application) with client-side routing via Wouter.
- The **mutation engine** (`dnaEngine.ts`) runs entirely in the browser — no API calls.
- To add a persistent backend DB, replace the `localStorage` calls in `patientStore.ts`
  with API calls to your database service.
