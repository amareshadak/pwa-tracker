# Daily Tracker 📱

Personal habit + expense tracker PWA. Works on iPhone and Android. Local-first (works offline), with optional Supabase backend for multi-user login, sync, and push notifications.

## Try it right now (no setup)

The app works immediately in **local-only mode** — data stays on the device, no login:

```bash
cd pwa-tracker
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy (required for iPhone install — PWAs need HTTPS)

Easiest: [Netlify Drop](https://app.netlify.com/drop) — drag this whole folder into the page, done. Or Vercel: `npx vercel`. You get a URL like `https://your-app.netlify.app`.

## Install on iPhone

1. Open the deployed URL in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Open the app from the Home Screen icon (needed for notifications).

On Android, Chrome will offer "Install app" automatically.

## Supabase setup (login, sync, push) — ~20 minutes

### 1. Create project
[supabase.com](https://supabase.com) → New project (free tier). Copy from **Project Settings → API**: the **Project URL** and **anon public key** into `config.js`.

### 2. Create tables
SQL Editor → paste the contents of `supabase/schema.sql` → Run.

### 3. Create users (max 5–10)
Authentication → Users → **Add user** → enter email + password for yourself and each person.

**Important:** also go to Authentication → Sign In / Up and turn **off** "Allow new users to sign up" — the anon key in config.js is publicly visible (that's normal and safe thanks to row-level security), but disabling self-signup ensures only users you create can log in.

### 4. Push notifications
Generate VAPID keys (once, on your computer):

```bash
npx web-push generate-vapid-keys
```

- Put the **public key** into `config.js` → `VAPID_PUBLIC_KEY`.
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
Redeploy the folder (config.js changed), open the app **from the Home Screen icon**, sign in, then Settings → **Enable Push Notifications**.

### 6. AI quick-fill (optional)
The expense sheet has an "Or type: 250 lunch swiggy hdfc" field that uses Gemini to prefill amount/category/account/note — you still review and tap **Add Expense** yourself, nothing auto-saves.

Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey), then:

```bash
supabase secrets set GEMINI_API_KEY="..."
supabase functions deploy parse-expense
```

(No `--no-verify-jwt` here — the platform checks the user is logged in before running it, so the free quota can't be hit by strangers.)

## What's inside

```
index.html / styles.css / app.js   — the app (no build step)
config.js                          — your Supabase keys go here
manifest.webmanifest, sw.js, icons — PWA install + offline + push
supabase/schema.sql                — tables + row-level security
supabase/functions/send-reminders  — cron push sender (habit reminders,
                                     missed-habit alerts, expense nudge)
supabase/functions/parse-expense   — AI quick-fill for the expense sheet (Gemini)
```

## Notes

- iOS push requires iOS 16.4+ and the app installed to the Home Screen.
- Reminder timezone is set in `supabase/functions/send-reminders/index.ts` (`Asia/Kolkata`).
- Data model and behavior follow `daily-tracker-PRD.md`.
