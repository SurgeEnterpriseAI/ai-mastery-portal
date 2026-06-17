# Deploying to Vercel

The app is Vercel-ready: curriculum is bundled (no runtime filesystem reads), and persistence auto-switches from the local JSON file to **Vercel KV (Upstash Redis)** when its env vars are present.

## 1. Provision storage (required — serverless has no writable disk)

In the Vercel dashboard → your project → **Storage** → create a **KV / Upstash Redis** database and "Connect" it. That injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically. (The app also accepts `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.)

Without KV, the app falls back to a local file and **will lose all data between requests on Vercel** — so KV is required in production.

## 2. Set environment variables (Project → Settings → Environment Variables)

| Variable | Purpose | Needed? |
|---|---|---|
| `PORTAL_SECRET` | signs session cookies | strongly recommended |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | persistence | **required** (auto-set by step 1) |
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
