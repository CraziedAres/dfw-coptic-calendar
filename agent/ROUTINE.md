# Weekly church scan (Claude Code routine)

You are the weekly scanner for the DFW Coptic Calendar. Your job is to find upcoming events on each
Coptic Orthodox church's public web pages, categorize them, and post them to the site. Machine-readable
calendars are already synced daily by the site itself — **skip sources with `type: "ics"` or
`type: "stmary-json"`**.

Environment variables available to you: `SITE_URL` (e.g. https://dfwcoptic.org) and `INGEST_SECRET`.

## Steps

0. Check the setup before scanning anything:
   - If `SITE_URL` or `INGEST_SECRET` is empty, stop at once and report
     "Environment not configured: <missing variables>". Do not scan.
   - Run `curl -sS -o /dev/null -w "%{http_code}" "$SITE_URL/api/churches"`. If the result isn't `200`, stop
     and report the code, noting that the host may be blocked by the environment's network settings.
1. `curl -s "$SITE_URL/api/churches"` → JSON with `churches` (each has `slug`, `name`, `sources`) and the
   allowed `categories` (slug + label + group).
2. For every church with `type: "web"` sources, first run `curl -s "$SITE_URL/api/events?church=<slug>"` to
   see the events already saved for it. Events are matched by church + title + day, so **when an event
   you find is one already saved** (same day and start time, or clearly the same gathering) **reuse the
   saved title exactly, character for character**, even if this week's schedule words it differently.
   A reworded title is stored as a second copy of the same event. Then, for every source with
   `type: "web"`:
   - If the source has a `hint`, follow it. Hints record how that particular site publishes its schedule.
   - Fetch it. Sources may be HTML pages, JSON APIs (e.g. a calendar service or WordPress
     `wp-json/wp/v2/posts`), or pages that link to a monthly PDF/image schedule — follow such links
     one level and read them (you can read PDFs and images).
   - Read calendar grids (PDF or image) from the rendered image; never infer days from extracted-text
     column positions.
   - Extract every **dated** event between today and 6 weeks from today (America/Chicago).
   - Liturgies depend on the church's `liturgy_times` from `/api/churches`:
     - **If `liturgy_times` is empty**, the calendar is the only place its liturgies appear, so include
       every dated liturgy in the schedule (Divine Liturgy, Arabic/English liturgies, early-morning
       liturgies), categorized `liturgy`. A church often has several on one day: give each a distinct
       title, by language or as the schedule names them ("Divine Liturgy (Arabic)", "Divine Liturgy
       (English)"), because events with the same title on the same day are merged into one.
     - **If `liturgy_times` is set**, skip ordinary recurring liturgies it already covers, **unless** they
       are tied to a feast or special occasion, or fall at a time `liturgy_times` doesn't list.
   - Beyond liturgies, we want meetings, feasts, retreats, youth/couples events, Bible studies,
     vespers/Tasbeha, service days.
   - Ignore `type: "social"` sources (Instagram/Facebook cannot be fetched reliably).
3. For each event build:
   ```json
   {
     "church_slug": "st-mary-colleyville",
     "title": "Young Adults Meeting",
     "description": "Short, factual. No invented details.",
     "start": "2026-10-17T19:30:00-05:00",
     "end": "2026-10-17T21:00:00-05:00",
     "all_day": false,
     "location": null,
     "categories": ["young-adults"],
     "source_url": "https://…the page you read it from"
   }
   ```
   - Times are Central: offset `-05:00` during daylight time (Mar–early Nov), `-06:00` otherwise.
   - If no time is given, send `"start": "YYYY-MM-DD"` and `"all_day": true`.
   - `categories`: one or more slugs from `/api/churches`. Use the audience first (young-adults, teens,
     middle-school, kids, couples, families), then the type (liturgy, vespers-tasbeha, feasts, bible-study,
     retreats, service). Examples: "Servants' Bible study" → bible-study; "HS Friday meeting" → teens;
     "Feast of the Nativity liturgy" → liturgy, feasts; "Family picnic" → families.
   - Keep the church's own title wording (translate Arabic titles to English, keep the original in the description).
   - **Never invent** an event, time, or location. If a detail is unclear, leave it null or skip the event.
4. POST all events in one request (split into batches of ≤ 500 if needed). The body must be an object
   with an `events` array, `{"events": [ …event objects from step 3… ]}`, not a bare array:
   ```sh
   curl -s -X POST "$SITE_URL/api/ingest" \
     -H "Authorization: Bearer $INGEST_SECRET" -H "Content-Type: application/json" \
     --data @events.json
   ```
   The endpoint upserts by church + title + date, so re-running is safe. It returns
   `{ inserted, updated, skipped, unknown_churches }`.
5. Finish with a short report (this is what the owner reads):
   - per church: events found, and from which source
   - sources that failed (HTTP error, moved page, empty) — suggest a replacement URL if you can find
     one on the church's site
   - the ingest response

Do not modify files in this repository during the run.
