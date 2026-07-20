# Roast'n Rake — Landing Page

Public, no-login landing page for **roastandrake.com**: captures roasts, shows a
live feed, and collects a waitlist. The golf app moves to **app.roastandrake.com**.

- React + Vite (matches the app)
- Supabase for persistence + realtime feed
- Claude verdict via a Supabase **Edge Function** (the Anthropic key stays
  server-side — never in this bundle)
- Web Speech API for voice input
- Deployed to GitHub Pages at the apex domain

The page runs in **preview mode** until Supabase is connected: submissions get a
local verdict and show in the feed, but nothing is saved. Wire up the steps below
to go live.

---

## 1. Supabase (needs you — I can't create the project)

1. Create a project at supabase.com.
2. **SQL Editor → run** [`supabase/schema.sql`](supabase/schema.sql) (tables, RLS,
   realtime, seed content).
3. **Project Settings → API** → copy the **Project URL** and the **anon public** key.
4. Create `.env` here (see `.env.example`):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
5. Deploy the verdict Edge Function and set the Anthropic secret (Supabase CLI):
   ```
   supabase link --project-ref <your-ref>
   supabase functions deploy verdict --no-verify-jwt
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
   `--no-verify-jwt` lets the anonymous public page call it. The Anthropic key
   lives only in Supabase secrets.

The anon URL + key are safe to ship because RLS allows only public read/insert on
`roasts` and insert-only on `waitlist` (nobody can read the waitlist via the anon
key).

## 2. DNS + hosting cutover (needs you — Cloudflare + GitHub Pages)

Goal: `roastandrake.com` → this landing page, `app.roastandrake.com` → the golf app.

1. **Cloudflare DNS** (roastandrake.com):
   - Add `CNAME`  `app` → `peternewton6969.github.io`  (Proxy: **DNS only**).
   - Keep the apex (`@`) pointing at GitHub Pages (already set).
2. **Golf-app repo** (RoastandRake): change `public/CNAME` to `app.roastandrake.com`
   and redeploy; set its GitHub Pages custom domain to `app.roastandrake.com`.
   Verify the app loads at **app.roastandrake.com** first.
3. **This repo**: push to a new GitHub repo, enable Pages (gh-pages branch), set the
   custom domain to `roastandrake.com` (the included `public/CNAME` already says so),
   then `npm run deploy`.

Cut over in that order so the app isn't offline during the switch.

## 3. Local dev

```
npm install
npm run dev        # http://127.0.0.1:5180
```

## 4. Deploy

```
npm run deploy     # builds and pushes dist to gh-pages
```

---

## Hero image

Header hero currently uses `public/golf-bg.jpg` as a **placeholder**
(`// TODO: Replace with hero-ball.jpg (IMG_2646) — the Newter 69 shot` in `App.jsx`).
Drop `hero-ball.jpg` (IMG_2646, compressed < 300 KB) into `public/` and point the
`<img src>` at it — no other changes needed. Molly's August asset swaps in the same way.

## Moderation

None in V1. Delete egregious rows directly in the Supabase dashboard
(`roasts` table). No admin UI.
