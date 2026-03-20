# Single-host deployment

## URL map

| Path | App | Local port (`next start`) |
|------|-----|---------------------------|
| `/` | Patient (`web-patient`) | 3001 |
| `/doctor/` | Doctor (`web-doctor`, `basePath: /doctor`) | 3002 |
| `/admin/` | Admin (`web-admin`, `basePath: /admin`) | 3003 |
| `/api/` | Nest API (`api/v1`) | 4000 |

## Environment

**API** (`apps/api`):

- `WEB_ORIGIN=https://your-domain.com` — one browser origin when all three UIs are served from the same host (omit or leave unset for local multi-port dev).
- `PATIENT_APP_URL`, `DOCTOR_APP_URL`, `ADMIN_APP_URL` — email links and legacy CORS when `WEB_ORIGIN` is not set. For doctor emails, **include the path prefix**, e.g. `DOCTOR_APP_URL=https://your-domain.com/doctor` (or `http://localhost:3002/doctor` in dev).

**All Next apps** (build-time / runtime):

- `NEXT_PUBLIC_API_URL=https://your-domain.com/api/v1` (same origin as the browser).

**Patient** (`web-patient`):

- `NEXT_PUBLIC_DOCTOR_APP_URL=https://your-domain.com/doctor` — used for “Register as doctor” links; defaults to `http://localhost:3002/doctor` in dev.

## Reverse proxy

See `nginx.example.conf`. Order matters: `location /api/`, then `/admin/`, then `/doctor/`, then `/`.

## Local dev

Run each app as usual. Open:

- Patient: `http://localhost:3001`
- Doctor: `http://localhost:3002/doctor` (not `http://localhost:3002/` alone)
- Admin: `http://localhost:3003/admin`

## Render (API only)

Use **repository root** as the service root (leave **Root Directory** empty).

| Field | Value |
|--------|--------|
| **Build Command** | `npm ci --include=dev && npm run build:api` |
| **Start Command** | `npm run start:api:prod` |

Render sets `NODE_ENV=production` during install, so plain `npm ci` **skips devDependencies** — `@nestjs/cli` would be missing and `nest` fails. `--include=dev` forces dev tools to install.

Do **not** set Build Command to `npm` alone — that only prints npm’s help and fails the build.

Optional: set **Node version** to 20 in the environment or per [Render’s Node docs](https://render.com/docs/node-version) (e.g. `NODE_VERSION=20`).

## Vercel (frontends — three projects)

Deploy **patient**, **doctor**, and **admin** as **three separate Vercel projects**, all pointing at the same Git repo.

Each app includes a **`vercel.json`** that pins **Install** and **Build** to the monorepo root. That avoids Vercel’s Nx autodetection, which runs `nx build web-patient` — but this repo’s Nx project id is **`@dochain/web-patient`**, so that command fails.

**Root Directory** for each project:

| App | Root Directory |
|-----|----------------|
| Patient | `apps/web-patient` |
| Doctor | `apps/web-doctor` |
| Admin | `apps/web-admin` |

Leave dashboard **Install** / **Build** empty so `vercel.json` applies, or set the same commands manually:

| Setting | Patient | Doctor | Admin |
|--------|---------|--------|-------|
| **Install Command** | `cd ../.. && npm ci --include=dev` | same | same |
| **Build Command** | `cd ../.. && npm run build:web-patient` | `cd ../.. && npm run build:web-doctor` | `cd ../.. && npm run build:web-admin` |

Replace `https://YOUR-API.onrender.com` with your real Render API URL.

**Environment variables (all three apps)**

| Variable | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-API.onrender.com/api/v1` | same | same |

**Patient only**

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_DOCTOR_APP_URL` | `https://your-doctor.vercel.app` — public URL of the **doctor** Vercel deployment (no `/doctor` path when using standalone mode below). |

**Doctor and Admin only** (required so each app is served at the **root** of its own `*.vercel.app` domain, not under `/doctor` or `/admin`)

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_STANDALONE_DEPLOY` | `true` |

**API CORS on Render** — if you are **not** using `WEB_ORIGIN`, set these to your real Vercel URLs (scheme + origin only):

- `PATIENT_APP_URL` — patient deployment URL  
- `DOCTOR_APP_URL` — doctor deployment URL  
- `ADMIN_APP_URL` — admin deployment URL  

Redeploy the API after changing CORS env vars.

**Google OAuth:** add authorized redirect URIs for each deployed frontend and update `GOOGLE_CALLBACK_URL` on the API if needed.

## Troubleshooting

**Invalid hook call / two copies of React** — The repo root `package.json` pins `react` / `react-dom` and uses `overrides` so every workspace resolves the same version. After changing dependencies, run `npm install` from the monorepo root (not inside `apps/*`).

**`Cannot find module ... middleware-manifest.json`** — Usually a broken `.next` cache (e.g. after a failed build or EPERM on Windows). Stop the dev server, delete `apps/<app>/.next`, and start again.
