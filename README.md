# Daily Tracker 📱

Personal habit + expense tracker PWA. Works on iPhone and Android. Local-first (works offline), with optional Supabase backend for multi-user login, sync, and push notifications.

## Local development

The frontend is a Vite + TypeScript PWA. Supabase continues to provide authentication, sync, database storage, AI Edge Functions, and push delivery.

```bash
npm install
npm run dev
# open http://localhost:8080/pwa-tracker/
```

Useful validation commands:

```bash
npm test
npm run build
npm run preview
```

## Deploy

Merges to `main` are built and deployed to GitHub Pages by `.github/workflows/deploy-pages.yml`. Feature branches run tests and builds without replacing the live app.

The static output is generated in `dist/`; no Node.js server is required in production.

## Install on iPhone

1. Open the deployed URL in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Open the app from the Home Screen icon (needed for notifications).

On Android, Chrome will offer "Install app" automatically.

## Supabase setup (login, sync, push) — ~20 minutes

### 1. Create project
[supabase.com](https://supabase.com) → New project (free tier). Put the **Project URL** and **anon public key** in `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### 2. Create tables
SQL Editor → paste the contents of `supabase/schema.sql` → Run.

### 3. Create users (max 5–10)
Authentication → Users → **Add user** → enter email + password for yourself and each person.

**Important:** also go to Authentication → Sign In / Up and turn **off** "Allow new users to sign up" — the browser key is public by design and data is protected by row-level security, while disabling self-signup ensures only users you create can log in.

### 4. Push notifications
Generate VAPID keys (once, on your computer):

```bash
npx web-push generate-vapid-keys
```

- Put the **public key** in `.env.local` as `VITE_VAPID_PUBLIC_KEY`.
- Set secrets for the edge function (needs [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set VAPID_PUBLIC_KEY="..." VAPID_PRIVATE_KEY="..." VAPID_SUBJECT="mailto:amareshadak2014@gmail.com"
supabase functions deploy send-reminders --no-verify-jwt
```

- Schedule it every 5 minutes: Dashboard → **Integrations → Cron** (enable pg_cron) → new job:

```sql
select cron.schedule('send-reminders', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type":"application/json"}'::jsonb
  ) $$);
```

(Enable the `pg_net` extension under Database → Extensions if prompted.)

### 5. Redeploy + enable on phone
Run a new build/deployment, open the app **from the Home Screen icon**, sign in, then Settings → **Enable Push Notifications**.

### 6. AI quick-fill (optional)
The expense sheet has an "Or type: 250 lunch swiggy hdfc" field that uses Gemini to prefill amount/category/account/note — you still review and tap **Add Expense** yourself, nothing auto-saves.

Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey), then:

```bash
supabase secrets set GEMINI_API_KEY="..."
supabase functions deploy parse-expense
```

(No `--no-verify-jwt` here — the platform checks the user is logged in before running it, so the free quota can't be hit by strangers.)

## Architecture

```
src/core/                 — typed config, dates, application state, persistence and sync
src/features/*/view.ts    — feature-owned screen markup
src/features/*/model.ts   — independently tested feature-domain logic
src/ui/shell.ts           — composes global overlays, navigation and feature screens
src/app.ts                — event and rendering controller
src/styles.css            — Tailwind theme plus tracker component styles
public/                   — manifest, icons and service worker
supabase/migrations/      — versioned database changes
supabase/functions/       — AI parsing and notification delivery
.github/workflows/        — branch validation and main-only Pages deployment
```

Public browser configuration lives in `src/core/config.ts` and can be overridden with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, and `VITE_TIMEZONE`. Private credentials remain in Supabase Secrets.

Tailwind CSS v4 is integrated through the official `@tailwindcss/vite` plugin. `index.html` contains only metadata, the root mount, and the TypeScript entrypoint; screen markup belongs to feature modules.

## Notes

- iOS push requires iOS 16.4+ and the app installed to the Home Screen.
- Reminder timezone is set in `supabase/functions/send-reminders/index.ts` (`Asia/Kolkata`).
- Data model and behavior follow `daily-tracker-PRD.md`.
