# Local dev, GitHub, and Vercel deploy — VoiceInterviewAI

This project is a **TanStack Start** app (React 19 + Vite 7) with two routes:

- `/` — marketing landing page
- `/interview` — the voice interview agent (STT → LLM → TTS)

It also has three server routes under `src/routes/api/*` (`stt`, `tts`, `interview`) that call OpenAI + Gemini via the Lovable AI Gateway using `GEMINI_API_KEY`.

---

## 1. Run it on your local machine

### Prerequisites
- **Node 20+** (or **Bun 1.1+** — recommended, matches what Lovable uses)
- A microphone-capable browser (Chrome, Edge, Safari)
- `GEMINI_API_KEY` (auto-provisioned when the Lovable Cloud button is on — copy from Project → Cloud → Advanced → Secrets)

### Steps
```bash
# 1. Clone
git clone <your-repo-url> voice-interview-ai
cd voice-interview-ai

# 2. Install deps (pick one)
bun install
# or: npm install

# 3. Environment
cp .env.example .env    # then edit .env
# .env should contain:
#   GEMINI_API_KEY=lv_...
#   LOVABLE_AI_BASE_URL=https://ai.gateway.lovable.dev/v1   (optional, has default)

# 4. Start the dev server
bun dev
# or: npm run dev

# → open http://localhost:8080
```

Click **Start Free Interview** on the landing page. Grant mic access. Speak.

---

## 2. Push to GitHub

If you built this inside Lovable, the fastest path is Lovable's one-click GitHub sync:

**In Lovable** → top-right **⋯ menu** → **GitHub → Connect project** → authorize → **Create Repository**.
Changes now sync both ways automatically.

Or manually:
```bash
git init
git add .
git commit -m "Initial: VoiceInterviewAI"
git branch -M main
git remote add origin git@github.com:<you>/voice-interview-ai.git
git push -u origin main
```

**⚠️ Never commit `.env`** — the repo ships with `.env` in `.gitignore`. Only `.env.example` is committed.

---

## 3. Deploy to Vercel

TanStack Start runs on any Node/Edge host. Vercel is the easiest.

1. Go to **https://vercel.com/new** → **Import Git Repository** → pick the GitHub repo.
2. Vercel auto-detects **Vite**. Keep defaults:
   - Build command: `bun run build` (or `npm run build`)
   - Output: `.output` (TanStack Start handles this automatically)
3. **Environment Variables** → add:
   - `GEMINI_API_KEY` = your key from Lovable → Cloud → Secrets
4. Click **Deploy**. First deploy takes ~2 min.

Your app is now live at `https://<project>.vercel.app` with `/` (landing) and `/interview` (agent) working.

### Custom domain on Vercel
Vercel → Project → **Settings → Domains** → add `yourdomain.com`, then follow the DNS instructions Vercel shows (`A` record to `76.76.21.21` or CNAME to `cname.vercel-dns.com`).

---

## 4. Alternative: Publish on Lovable (one-click)

Click the **Publish** button (top-right in the Lovable editor). Your app is instantly live at:

```
https://<project>.lovable.app
```

No env-var setup required — `GEMINI_API_KEY` is auto-injected.
To connect a custom domain: **Project Settings → Domains → Connect Domain**.

---

## 5. Responsive & mobile

The landing page and the interview agent are both fully responsive (breakpoints: 375 / 768 / 1024+). Mic capture uses `MediaRecorder`, which needs **HTTPS** — both `*.vercel.app` and `*.lovable.app` are HTTPS by default. Local `http://localhost` is also treated as secure by browsers, so mic works in dev.

---

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| `GEMINI_API_KEY is not configured` in the browser console | Add the env var to Vercel and redeploy, or restart `bun dev` after editing `.env` |
| Mic button does nothing | Grant microphone permission in the browser site settings |
| STT returns empty text | Speak louder / longer; the client rejects clips <2 KB |
| TTS silent | Check network tab for `/api/tts` 200; some browsers block auto-play — first click on the page satisfies that |
| 404 on refresh at `/interview` | Redeploy on Vercel (TanStack routes are file-based; both routes must be built) |
