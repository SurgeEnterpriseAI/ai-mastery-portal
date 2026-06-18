# 🧠 Tensorpath

A complete training portal for a **20-day, story-driven AI course** — from the 2017 paper *"Attention Is All You Need"* all the way to the **June 2026 frontier** (reasoning models, multimodal AI, agents & MCP).

A senior trainer logs in, schedules sessions, emails the class, and teaches from an **auto-advancing presentation engine**. The portal remembers exactly where each class stopped, resumes there next time, and emails everyone *"what's coming next."*

---

## What's inside

| Capability | Where |
|---|---|
| **Trainer login** (session cookie, hashed password) | `/login` |
| **Trainer console** — schedule, trainees, progress, outbox, settings | `/trainer` |
| **Schedule a session** for any day + date + time | console → Schedule |
| **Email invites** to all trainees (SMTP or Outbox) | console → Send invites |
| **"What's coming next" announcement** to the whole class | console / end-of-day |
| **Live presentation** with speaker notes & market callouts | `/present/[day]` |
| **Auto-resume** — the room reopens at the saved slide | automatic |
| **Auto-advance to next topic** — finishing a day rolls the class pointer forward | end-of-day button |
| **20 days of curriculum** (rich JSON, one file per day) | `content/curriculum/day-XX.json` |
| **Learner accounts** — self-service signup with a personal profile | `/join`, `/signin` |
| **AI coach "Aria"** — Claude-powered, journey-RAG personalised hand-holding | `/learn/coach` |
| **Personalised "what to learn next"** recommendations | `/learn` → 🧭 |
| **Freemium gate** — 3 free coaching sessions, then a paywall | `/api/coach/session` (402) |
| **UPI payments** (Razorpay) — pay → auto-approve/unlock to Pro | `/api/pay/*` |
| **Human-help escalation** — raise a ticket mid-session, trainer is emailed | `/api/help`, console |
| **Resend email** (invites, welcome, receipts, help) → SMTP → Outbox fallback | `lib/email.ts` |

---

## Run it

```bash
cd ai-mastery-portal
npm install
# point DATABASE_URL at a Postgres DB (Neon free tier works great):
echo 'DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"' > .env
npx prisma db push      # create the tables
npm run dev
```

Open **http://localhost:4321**

**Default trainer login**
- email: `trainer@surgesoftware.co.in`
- password: `teachai2026`

> **Quick local DB without Postgres:** flip `provider = "postgresql"` → `"sqlite"` in `prisma/schema.prisma`, set `DATABASE_URL="file:./dev.db"`, then `npx prisma db push`. The schema is portable (arrays stored as JSON strings). Switch back to `postgresql` before deploying.

> Without keys, the coach uses a built-in demo responder, RAG falls back to keyword search, emails go to the **Outbox**, and the paywall simulates a UPI payment — so every feature is testable. Add keys (`.env`, see `.env.example`) to go live.

---

## How the "self-driving classroom" works

1. Trainer schedules **Day N** for a date/time and clicks **Send invites** → trainees get an email with the join link `/present/N`.
2. Trainer clicks **Start / Resume class** → the deck opens at the **exact slide** the class last reached.
3. As the trainer advances (← → / Space), the portal **saves the cursor** after every slide.
4. At the end of the day, **Mark Day complete** marks the day done, **advances the class pointer to Day N+1**, and offers a one-click **"email the class what's coming next."**
5. Next session, **Start / Resume class** opens **Day N+1, slide 1** — the class literally picks up where it left off.

---

## Curriculum arc (20 days)

1. The World Before Transformers → *Attention Is All You Need*
2. Inside the Transformer (self-attention, multi-head, positional encoding)
3. How Transformers Learn to Speak (tokens, embeddings, decoding)
4. BERT & the Encoder Revolution
5. GPT & the Generative Line
6. Scale as Strategy — GPT-3 & scaling laws
7. Prompting & In-Context Learning
8. Alignment — InstructGPT, RLHF, the ChatGPT moment
9. The Open-Weight Awakening — LLaMA, Mistral
10. Fine-Tuning, LoRA & PEFT
11. Embeddings, Vector DBs & RAG
12. Agents, Tool Use & Function Calling (MCP intro)
13. Multimodal AI & Vision
14. Diffusion & Generative Media (image/video/audio)
15. Reasoning Models & Test-Time Compute
16. MoE, Long Context & New Architectures
17. Trust, Truth, Safety & Evaluation
18. Shipping AI — Inference, Quantization & Cost
19. The 2025–2026 Frontier — Agents, MCP, Computer Use
20. Becoming the Teacher — Capstone & how to teach it

Each day is a JSON file with a cover, 9–14 rich slides (with speaker notes + 2026 market connections), key takeaways, a market snapshot, homework, and a teaser for the next day.

---

## The AI agentic learning platform

Beyond the live classroom, the portal is a self-service AI learning product:

1. A learner **signs up** at `/join` with their background, goal, and level.
2. They get **Aria**, a Claude-powered coach (`claude-opus-4-8`) that hand-holds them — answering questions, giving scenarios and materials, and recommending the next step. Every answer is **grounded by RAG**: the coach retrieves the most relevant slides from the 230-slide curriculum *and* the learner's own journey (`lib/rag.ts`), so guidance is personal and on-syllabus.
3. The **first 3 coaching sessions are free**. The 4th triggers a **paywall**.
4. They **pay via UPI** (Razorpay Checkout). On verified payment the account is **auto-approved and upgraded to Pro** — unlimited coaching.
5. Any time during coaching they can **"Raise human help"** → a ticket is created and the trainer is emailed; the trainer replies from the console and the learner is emailed back.

**Zero-config by design** — the whole platform runs with no keys:
- no `ANTHROPIC_API_KEY` → a built-in demo coach still streams replies
- no `RESEND_API_KEY` / SMTP → all mail lands in the in-app **Outbox**
- no `RAZORPAY_*` keys → the paywall **simulates** a successful UPI payment so the unlock flow is testable

Add the keys in `.env.local` (see `.env.example`) to go live.

### Endpoints
`/api/learner/*` (signup/login/profile) · `/api/coach/session` (gate) · `/api/coach/chat` (streaming) · `/api/coach/recommend` · `/api/help` · `/api/pay/order` · `/api/pay/verify` · `/api/pay/webhook` (Razorpay server confirmation) · `/api/tickets` (trainer resolves).

## Tech

Next.js 14 (App Router) · TypeScript · Tailwind · **Postgres + Prisma** (per-row writes & transactions) · **@anthropic-ai/sdk** (streaming coach) · **Voyage** embeddings (per-learner vector RAG) · Vercel KV rate limiting · Resend/nodemailer email · Razorpay UPI payments · react-markdown.
