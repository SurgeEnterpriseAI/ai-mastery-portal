# Deploying to Vercel

The app is Vercel-ready: curriculum is bundled (no runtime filesystem reads), and persistence auto-switches from the local JSON file to **Vercel KV (Upstash Redis)** when its env vars are present.

## 1. Provision the database (required)

The app uses **Postgres via Prisma** (per-row writes, transactions). In the Vercel dashboard → your project → **Storage** → create a **Postgres** database (Neon) and "Connect" it. Set **`DATABASE_URL`** to the **direct / non-pooling** connection string (so `prisma db push` can create the tables at build time).

Tables are created automatically on the first deploy — the Vercel build command is `prisma generate && prisma db push && next build` (already set in `vercel.json`).

**Optional — rate limiting:** also create a **KV / Upstash Redis** store and Connect it (injects `KV_REST_API_URL` / `KV_REST_API_TOKEN`). Without it, rate limiting falls back to per-instance memory.

## 2. Set environment variables (Project → Settings → Environment Variables)

| Variable | Purpose | Needed? |
|---|---|---|
| `PORTAL_SECRET` | signs session cookies | strongly recommended |
| `DATABASE_URL` | Postgres (direct/non-pooling URL) | **required** (from step 1) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | rate limiting | optional (auto-set if you add KV) |
| `TRAINER_EMAIL` / `TRAINER_PASSWORD` | seed login (avoid the public default) | recommended |
| `ANTHROPIC_API_KEY` | the Claude coach | for the real coach |
| `COACH_MODEL` | model override (default `claude-opus-4-8`) | optional |
| `VOYAGE_API_KEY` | per-learner vector embeddings (RAG) | for vector RAG (else keyword fallback) |
| `VOYAGE_MODEL` / `VOYAGE_DIM` | embedding model/dims (default `voyage-3.5-lite` / `512`) | optional |
| `RESEND_API_KEY` + `MAIL_FROM` | email delivery | for real email |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | UPI payments | for real checkout |
| `PRO_PRICE_PAISE` / `PAY_CURRENCY` | price (default `99900` / `INR`) | optional |

## 3. Deploy

**Option A — CLI (fastest):**
```bash
cd ai-mastery-portal
vercel login          # one-time, interactive
vercel --prod         # build + deploy
```

**Option B — GitHub:** push this repo to GitHub, then "Import Project" in Vercel. It auto-detects Next.js. Add the env vars above, deploy.

## 4. Razorpay webhook (after deploy)
In the Razorpay dashboard add a webhook → `https://<your-app>.vercel.app/api/pay/webhook`, event `payment.captured`, secret = `RAZORPAY_WEBHOOK_SECRET`.

## Notes
- First coach request after a deploy computes & caches the curriculum embeddings (~2 Voyage calls) into KV; subsequent requests reuse them.
- The data model is a single JSON blob (last-write-wins). Fine for early scale; move to Postgres rows when write concurrency grows.
