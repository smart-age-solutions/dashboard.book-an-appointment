# SmartAppointment Dashboard

The React/TypeScript admin dashboard for **SmartAppointment**, a Shopify appointment-booking app. This is the merchant-facing UI for managing bookings, booking pages, staff, customers, and settings — it talks to the Flask API in `../api`.

Built with Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix primitives), React Router, React Query, and Recharts.

## Prerequisites

- Node.js 18+ and npm (no specific version is pinned in this repo — any current LTS works).

## Install

```bash
npm install
```

## Configuration

The app reads its API base URL from a single environment variable:

- **`VITE_API_URL`** — base URL of the SmartAppointment API (e.g. `http://localhost:5000` for a local API, or `https://smartappointment.fly.dev` for the deployed one). Most call sites fall back to `http://localhost:5000` if it's unset, so it isn't strictly required for local development against a local API on the default port — but you should always set it explicitly.

Set it in a `.env` file at the root of this project (Vite convention — any variable prefixed `VITE_` is exposed to the client bundle):

```bash
# .env
VITE_API_URL=http://localhost:5000
```

To point the dashboard at the deployed API instead of a local one:

```bash
# .env
VITE_API_URL=https://smartappointment.fly.dev
```

Restart the dev server after changing `.env` — Vite only reads env files at startup.

## Development

```bash
npm run dev
```

Starts the Vite dev server on **port 8080** (configured in `vite.config.ts`), reachable at `http://localhost:8080`.

## Other scripts

| Script | Command | Description |
|--------|---------|--------------|
| `npm run build` | `vite build` | Production build, output to `dist/` |
| `npm run build:dev` | `vite build --mode development` | Build with development mode flags (useful for debugging a production-shaped bundle) |
| `npm run lint` | `eslint .` | Lint the codebase |
| `npm run preview` | `vite preview` | Serve the built `dist/` output locally to sanity-check a production build |

## Deployment

The `vercel.json` rewrite (`/(.*) → /index.html`) indicates this is deployed as a single-page app on Vercel. Set `VITE_API_URL` to the deployed API URL in the Vercel project's environment variables before building.
