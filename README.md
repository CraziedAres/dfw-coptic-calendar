# DFW Coptic Calendar

One calendar for the Coptic Orthodox churches of Dallas–Fort Worth: a church map, category filters
(youth, couples & families, liturgical, service & retreats), and a weekly email digest per subscriber.

```
Claude Code routine (weekly)  ──POST /api/ingest──►  Next.js on Vercel  ──►  Supabase
Vercel Cron daily             ──/api/sync-ics────►   (Google Calendar / ICS feeds)
Vercel Cron Mon 7am CT        ──/api/digest──────►   Resend ──► subscribers
```

## Run locally (no accounts needed)

```sh
cp .env.example .env.local    # fill INGEST_SECRET / CRON_SECRET / ADMIN_PASSWORD (any values)
npm install
npm run seed                  # loads data/churches.seed.json → data/dev-db.json
npm run dev
# pull real events from church ICS feeds:
curl localhost:3000/api/sync-ics -H "Authorization: Bearer $CRON_SECRET"
```

Without Supabase, data lives in `data/dev-db.json`. Without Resend, emails are written to `data/outbox/*.html`.

## Deploy

1. **Supabase**: create an organization (Personal, Free) and a project (region East US). Run
   `supabase/migrations/0001_init.sql` in the SQL Editor.
   - The project URL is in the **Connect** dialog at the top of the project (`https://<ref>.supabase.co`).
   - The key is under **Settings → API Keys**. Use a **secret key** (`sb_secret_…`); the legacy `service_role`
     key is being deprecated by the end of 2026. Put it in `SUPABASE_SERVICE_ROLE_KEY`.
2. **Resend**: add a **subdomain** (e.g. `mail.yourdomain.org`), add the DNS records it shows, then click Verify.
   Create an API key. The free plan allows 100 emails a day and 3,000 a month, so the Monday digest is capped at
   100 subscribers until you upgrade.
3. **GitHub**: push this repo. `agent/ROUTINE.md` must be on the default branch.
4. **Vercel**: import the GitHub repo and set every variable from `.env.example` (`SITE_URL` = your production URL).
   `vercel.json` registers the two crons, and Vercel sends `CRON_SECRET` automatically. Cron times are UTC, and
   on the Hobby plan a job fires at some point within the scheduled hour.
5. Seed production: put the Supabase vars in `.env.local` and run `npm run seed`.
6. **Cloud agent (routine)**: at claude.ai/code/routines, click **New routine**.
   - Prompt: *"Follow agent/ROUTINE.md"*. Repository: this repo.
   - Trigger: **Schedule → weekly**, Sunday ~9:07 PM. Times are entered in your local zone; runs set exactly on
     the hour can start late.
   - Environment, under its settings icon:
     - **Network access → Full** (or Custom with the church domains and your site). The default "Trusted" setting
       blocks church websites and Vercel.
     - **Environment variables:** `SITE_URL=…` and `INGEST_SECRET=…`.
   - Remove any connectors the routine doesn't need, then click **Run now** to test it.

## Adding or fixing a church

Edit `data/churches.seed.json` and run `npm run seed` again; it updates rows in place by `slug`. Event sources:
- `ics`: public calendar feeds, synced daily by plain code
- `web`: pages or JSON the weekly agent reads and interprets
- `social`: reference only; not scraped

## Key files

- `src/lib/categories.ts`: the category list and keyword classifier
- `src/lib/coptic-date.ts`: Coptic calendar dates, Pascha, and fasting seasons
- `src/lib/db.ts`: storage (Supabase, or a local JSON file)
- `src/lib/ingest.ts`, `src/lib/ics.ts`: event ingestion
- `src/lib/digest.ts`, `src/emails/`: the weekly email
- `agent/ROUTINE.md`: instructions for the cloud agent
