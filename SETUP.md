# World Cup Bracket Pool — Deploy on Render

One Render web service serves the page **and** the shared data (Postgres), so
everyone opens the same URL and all brackets + results pool together. No API
keys to paste, no separate static host.

Files in this folder:

- `world-cup-bracket-poolhtml.html` — the app (frontend)
- `server.js` — tiny Express API (`/api/kv`) + serves the page
- `package.json` — dependencies (`express`, `pg`)
- `render.yaml` — Blueprint that creates the web service + free database

---

## Deploy (Blueprint — easiest)

1. Put this folder in a **GitHub repo** (Render deploys from Git):
   ```bash
   cd world_cup
   git init && git add . && git commit -m "World Cup bracket pool"
   # create an empty repo on github.com, then:
   git remote add origin https://github.com/<you>/world-cup-pool.git
   git push -u origin main
   ```
2. Go to <https://render.com> → sign up (free) → **New +** → **Blueprint**.
3. Connect the repo. Render reads `render.yaml`, creates the **free Postgres**
   and the **web service**, and wires `DATABASE_URL` automatically. Click
   **Apply** and wait for the first deploy (~2 min).
4. Open the service URL (e.g. `https://world-cup-pool.onrender.com`) and share it.
   Everyone who opens that link shares the same pool.

### Manual alternative (no Blueprint)

1. Render → **New + → PostgreSQL** (Free) → create it. Copy its **Internal
   Database URL**.
2. Render → **New + → Web Service** → connect the repo.
   - Build command: `npm install`
   - Start command: `node server.js`
   - Add env var `DATABASE_URL` = the Internal Database URL from step 1.
3. Deploy, open the URL, share it.

---

## Run it locally first (optional)

```bash
npm install
# point at any Postgres, or just run without a DB to smoke-test the page:
node server.js                 # http://localhost:3000  (saves will 500 with no DB)
# with a local DB:
DATABASE_URL=postgres://user:pass@localhost:5432/wc node server.js
```

---

## How it works

- The app's storage calls go to same-origin `/api/kv` (see the shim at the top
  of the `<script>` in the HTML). `server.js` backs that with a `kv` table:
  brackets are rows keyed `bracket:...`, the real results are one `actual:v1` row.
- **Results entry stays manual** — the organizer opens the *Actual results* tab,
  taps the real winners, hits **Save results**, and everyone's scores update on
  refresh.
- **Trust model:** anyone with the link can submit/delete brackets and edit
  results (same as the original). Fine for a friends pool. Want results locked to
  just you? Ask and I'll add an organizer passcode.

## Two Render free-tier gotchas

- **Web service sleeps** after ~15 min idle; the first hit then takes ~30–60s to
  wake. Harmless for a casual pool.
- **Free Postgres is deleted ~30 days** after creation. The 2026 knockout stage
  runs only a few weeks, so it likely fits — but if you want it to live longer,
  upgrade the database to a paid plan (~$7/mo) or tell me and I'll point it at a
  different free database.

## Updating the bracket draw

The 32 teams/matchups are hardcoded in `BASE()` in the HTML (`m1`–`m16`, each with
`a`/`b` team names). If the real 2026 draw differs, send me the actual draw and
I'll update them.
