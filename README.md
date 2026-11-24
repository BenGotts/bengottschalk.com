# bengottschalk.com

A monorepo (npm workspaces + [Turborepo](https://turborepo.com)) with four apps, each deployed as its own Vercel project:

| App | Domain | What it is |
| --- | --- | --- |
| `apps/www` | [bengottschalk.com](https://www.bengottschalk.com) | The personal website |
| `apps/links` | [links.bengottschalk.com](https://links.bengottschalk.com) | Link in bio for social media profiles |
| `apps/mcp` | [mcp.bengottschalk.com](https://mcp.bengottschalk.com) | MCP server (endpoint `/mcp`) for asking AI assistants about Ben |
| `apps/timer` | [timer.bengottschalk.com](https://timer.bengottschalk.com) | Speedcubing timer: every WCA event, sessions with branches, Solve of the Day |

and shared packages:

| Package | What it holds |
| --- | --- |
| `packages/content` | Hand-edited content: social links, projects, experience, site name and URLs |
| `packages/cube` | The self-solving cube (`TwistyCube`) and Square-1 (`SquareOne`, on the links page), their turn models, and the solves they play |
| `packages/theme` | The "Midnight Cube" DaisyUI themes and Tailwind tokens (`theme.css`), and theme names |
| `packages/wca` | WCA event names and result formatting |
| `packages/timer-core` | The timer's logic with no UI: times, averages, events, sessions and branches, Solve of the Day, csTimer import |

Packages ship TypeScript source; each app lists them in `transpilePackages` in its `next.config.ts`.

## Website

Personal website of Ben Gottschalk: competitive cuber, WCA Delegate, and software developer.
Competition, results and ranking data come live from the [World Cube Association API](https://www.worldcubeassociation.org/api);
videos come from the YouTube Data API.

Built with Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4 and DaisyUI 5.

## Getting started

Requires Node.js 26 (see `.nvmrc`).

```bash
npm install                                # once, at the repo root
cp apps/www/.env.example apps/www/.env     # then fill in the values
npm run dev                                # all apps: www :3000, links :3002, MCP :3003, timer :3004
npm run dev -- --filter=@bengottschalk/www # just one app
```

Run scripts from the root to run them in every app and package (through Turborepo), or with `-w` for one,
e.g. `npm run email -w apps/www`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development servers |
| `npm run build` | Production builds |
| `npm run lint` | [oxlint](https://oxc.rs/docs/guide/usage/linter) with type-aware rules |
| `npm run typecheck` | TypeScript (7, native) |
| `npm test` | Unit tests (Vitest) |
| `npm run email -w apps/www` | Preview the contact email template |

Add a dependency to one app with `npm install <package> -w apps/www`.

## Environment variables

| Variable | Used for |
| --- | --- |
| `YOUTUBE_API_KEY` | Latest videos (home and `/videos`). Without it, video sections are hidden. |
| `RESEND_API_KEY` | Sending contact form messages through [Resend](https://resend.com). |
| `SEND_TO_EMAIL` | Where contact form messages go. |

Set the same variables in the website's Vercel project settings. `.env` is git-ignored; never commit it.
A new build-time variable also goes in `turbo.json`'s `build.env`, or Turborepo leaves it out of builds on Vercel.

## Project layout

Under `apps/www/`:

```
src/
  app/              Routes, plus generated metadata (sitemap, robots, manifest, Open Graph images)
  components/       UI, grouped by page area
  content/          Navigation and the maps' outlines (shared content is in packages/content)
  lib/wca/          WCA API client, response schemas, caching (formatting is in packages/wca)
  lib/youtube.ts    YouTube uploads
  actions/          Server actions (contact form)
  emails/           React Email template for contact messages
  assets/fonts/     DM Sans .woff files for generated images (OFL, see license file)
```

### Data and caching

All WCA and YouTube requests go through `"use cache"` functions in `apps/www/src/lib/wca/api.ts` and `apps/www/src/lib/youtube.ts`.
Responses are validated with Zod, which also drops fields the site doesn't use (such as emails).
Successful results are cached for hours or days; failures are cached for minutes so they retry soon.
The WCA API allows 60 requests per minute per IP, so the client retries timeouts, 429s and 5xx responses with backoff.

### Updating content

- **Experience, projects, social links:** edit the files in `packages/content/src/`; all three apps pick them up.
- **The self-solving cube's PR and PB:** `packages/cube/src/solves.ts`; a test checks each solution solves its scramble.
- **The links page's Square-1 solves:** `packages/cube/src/sq1Solves.ts`, in WCA notation (`(1, 0) / (-1, -1) /`); a
  test checks each solution solves its scramble and that no slash is blocked.
- **Link in bio buttons:** `apps/links/src/links.ts`.
- **Competitions, results, records:** nothing to do; they update from the WCA automatically.
- **Theme colors:** `packages/theme/theme.css` (DaisyUI themes `midnight` and `midnight-light`).

## Notes

- The competition map uses Esri's keyless Canvas basemaps. If they start requiring a key, switch providers in
  `apps/www/src/components/competitions/CompetitionMap.tsx`.
- `@wca/helpers` 2.0.0 lists FTO in its types but not its event table; `packages/wca/src/events.ts` works around it.

## Timer

`apps/timer` is a client-side timer. Everything is saved in the browser's IndexedDB (through [Dexie](https://dexie.org)),
so it works offline; signing in with WCA to sync across devices comes next (better-auth with Supabase Postgres).

- **Timing:** hold space (or the screen) until the time turns green, let go to start, any key or a tap to stop. Optional
  WCA inspection with "8 seconds"/"12 seconds" callouts and automatic +2/DNF. Times are saved to the millisecond;
  they're shown to the hundredth by default (thousandths in Settings), singles cut off and averages rounded, like the WCA.
- **Events:** every current WCA event. FMC has an hour's countdown and checks the solution solves the scramble;
  Multi-Blind makes a scramble per cube and asks how many were solved.
- **Sessions:** each event has a Main session. A branch (e.g. an ao100 attempt with a goal) holds its own solves until
  it's merged into Main (its solves join in the order they were done, and it stays as a read-only record) or discarded.
  A solve never moves sessions; Main's view includes merged branches (`packages/timer-core/src/sessions.ts`).
- **Solve of the Day:** one per day, kept apart from solves (so competition attempts can be marked later). "Copy for
  Claude" copies the details for the Solve of the Day skill.
- **csTimer import** (Settings → Import from csTimer), and JSON backup and restore.
- **Shortcuts** (timer idle): Alt+1 / Alt+2 / Alt+3 set the last solve to OK / +2 / DNF, Alt+S marks it Solve of the
  Day, Alt+Z deletes it, Alt+N skips to a new scramble, Escape cancels inspection.

Scrambles come from [cubing.js](https://js.cubing.net/cubing/), which runs its search in a web worker. Next's bundler
breaks that worker, so `scripts/bundle-cubing.mjs` bundles cubing.js with esbuild into `public/vendor/cubing` before
`dev` and `build` (git-ignored), and `src/lib/cubing.ts` loads it from there at runtime.

## MCP server

`apps/mcp` serves a public, read-only [Model Context Protocol](https://modelcontextprotocol.io) server over Streamable HTTP
with [`mcp-handler`](https://www.npmjs.com/package/mcp-handler). Tools are defined in `apps/mcp/src/app/mcp/route.ts`:
`get_about`, `get_social_links`, `get_experience`, `get_projects`, and `get_wca_profile` (live from the WCA API, cached for an hour).
To try it locally, run `npm run dev` and point an MCP client (or `npx @modelcontextprotocol/inspector`) at `http://localhost:3003/mcp`.

## Deploying on Vercel

Each app is its own Vercel project, all connected to this repository:

| Vercel project | Root Directory | Domain |
| --- | --- | --- |
| `bengottschalk` (existing) | `apps/www` | `bengottschalk.com`, `www.bengottschalk.com` |
| new, e.g. `bengottschalk-links` | `apps/links` | `links.bengottschalk.com` |
| new, e.g. `bengottschalk-mcp` | `apps/mcp` | `mcp.bengottschalk.com` |
| new, e.g. `bengottschalk-timer` | `apps/timer` | `timer.bengottschalk.com` |

- Vercel detects the npm workspace from `package-lock.json` at the root, installs from there, and builds with
  Turborepo. Leave the framework preset on Next.js and the build/install commands on their defaults.
- In each project's Settings → Build and Deployment, keep **Include files outside the Root Directory** on (packages
  live outside it) and turn on **Skip deployments when there are no changes to the root directory or its
  dependencies**, so a links-only change doesn't redeploy the website.
- Each app's `package.json` pins Node.js 26.x through `engines`, matching the Node.js version selected in each Vercel project.
- `preview.bengottschalk.com` follows the website's previews only (see `.github/workflows/preview-alias.yml`).
