# bengottschalk.com

Personal website of Ben Gottschalk: competitive cuber, WCA Delegate, and software developer.
Competition, results and ranking data come live from the [World Cube Association API](https://www.worldcubeassociation.org/api);
videos come from the YouTube Data API.

Built with Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4 and DaisyUI 5.

## Getting started

Requires Node.js 24.

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | [oxlint](https://oxc.rs/docs/guide/usage/linter) with type-aware rules |
| `npm run typecheck` | TypeScript (7, native) |
| `npm test` | Unit tests (Vitest) |
| `npm run email` | Preview the contact email template |

## Environment variables

| Variable | Used for |
| --- | --- |
| `YOUTUBE_API_KEY` | Latest videos (home and `/videos`). Without it, video sections are hidden. |
| `RESEND_API_KEY` | Sending contact form messages through [Resend](https://resend.com). |
| `SEND_TO_EMAIL` | Where contact form messages go. |

Set the same variables in the Vercel project settings. `.env` is git-ignored; never commit it.

## Project layout

```
src/
  app/              Routes, plus generated metadata (sitemap, robots, manifest, Open Graph images)
  components/       UI, grouped by page area
  content/          Hand-edited content: experience, projects, links
  lib/wca/          WCA API client, response schemas, caching, and formatting helpers
  lib/youtube.ts    YouTube uploads
  actions/          Server actions (contact form)
  emails/           React Email template for contact messages
  assets/fonts/     DM Sans .woff files for generated images (OFL, see license file)
```

### Data and caching

All WCA and YouTube requests go through `"use cache"` functions in `src/lib/wca/api.ts` and `src/lib/youtube.ts`.
Responses are validated with Zod, which also drops fields the site doesn't use (such as emails).
Successful results are cached for hours or days; failures are cached for minutes so they retry soon.
The WCA API allows 60 requests per minute per IP, so the client retries timeouts, 429s and 5xx responses with backoff.

### Updating content

- **Experience, projects, social links:** edit the files in `src/content/`.
- **Competitions, results, records:** nothing to do; they update from the WCA automatically.
- **Theme colors:** `src/app/globals.css` (DaisyUI themes `midnight` and `midnight-light`).

## Notes

- The competition map uses Esri's keyless Canvas basemaps. If they start requiring a key, switch providers in
  `src/components/competitions/CompetitionMap.tsx`.
- `@wca/helpers` 2.0.0 lists FTO in its types but not its event table; `src/lib/wca/events.ts` works around it.
