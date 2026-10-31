# bengottschalk.com

A monorepo (npm workspaces + [Turborepo](https://turborepo.com)) with three apps, each deployed as its own Vercel project:

| App | Domain | What it is |
| --- | --- | --- |
| `apps/www` | [bengottschalk.com](https://www.bengottschalk.com) | The personal website |
| `apps/links` | [links.bengottschalk.com](https://links.bengottschalk.com) | Link in bio for social media profiles, with click tracking |
| `apps/mcp` | [mcp.bengottschalk.com](https://mcp.bengottschalk.com) | MCP server: public read-only tools at `/mcp`, and Ben's signed-in tools (editing the links page, click stats) at `/private` |

and shared packages:

| Package | What it holds |
| --- | --- |
| `packages/content` | Hand-edited content: social links, projects, experience, site name and URLs |
| `packages/theme` | The "Midnight Cube" DaisyUI themes and Tailwind tokens (`theme.css`), and theme names |
| `packages/wca` | WCA event names and result formatting |
| `packages/db` | The [Turso](https://turso.tech) (libSQL/SQLite) database used by the links and MCP apps: schema, migrations, link and click queries (Drizzle ORM) |

Packages ship TypeScript source; each app lists them in `transpilePackages` in its `next.config.ts`.

## Website

Personal website of Ben Gottschalk: competitive cuber, WCA Delegate, and software developer.
Competition, results and ranking data come live from the [World Cube Association API](https://www.worldcubeassociation.org/api);
videos come from the YouTube Data API.

Built with Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4 and DaisyUI 5.

## Getting started

Requires Node.js 24.

```bash
npm install                                # once, at the repo root
cp apps/www/.env.example apps/www/.env     # then fill in the values
npm run dev                                # all apps: www :3000, links :3002, MCP :3003
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
- **Link in bio buttons:** ask Claude, through the MCP server's `/private` endpoint (see below).
- **Competitions, results, records:** nothing to do; they update from the WCA automatically.
- **Theme colors:** `packages/theme/theme.css` (DaisyUI themes `midnight` and `midnight-light`).

## Notes

- The competition map uses Esri's keyless Canvas basemaps. If they start requiring a key, switch providers in
  `apps/www/src/components/competitions/CompetitionMap.tsx`.
- `@wca/helpers` 2.0.0 lists FTO in its types but not its event table; `packages/wca/src/events.ts` works around it.

## Links page

`apps/links` shows the buttons stored in the database's `links` table, in order, leaving out hidden, archived, and
not-yet-started or ended scheduled links. The list is cached (`"use cache"` with the `links` tag) until the MCP server
changes it and calls `POST /api/revalidate` with `REVALIDATE_SECRET`, so visitors rarely reach the database. If the
database can't be reached, the page shows the fallback list in `apps/links/src/links.ts`.

Buttons go through `/go/<id>`, which records a click and redirects. Bots, link-preview fetchers and prefetches aren't
counted, and no IP addresses are stored: only the time, country (from Vercel's geolocation header), device type, and
source. The source is the `?src=` tag on the links page URL, so put a tagged URL in each profile's bio, e.g.
`links.bengottschalk.com?src=instagram` or `?src=tiktok`. In-app browsers often hide where a visitor came from, so
without the tag most clicks show as `direct`.

## MCP server

`apps/mcp` serves a [Model Context Protocol](https://modelcontextprotocol.io) server over Streamable HTTP with
[`mcp-handler`](https://www.npmjs.com/package/mcp-handler), at two endpoints:

- **`/mcp`**, public and read-only (`apps/mcp/src/lib/tools/public.ts`): `get_about`, `get_social_links`,
  `get_experience`, `get_projects`, and `get_wca_profile` (live from the WCA API, cached for an hour).
- **`/private`**, for Ben only: the same tools plus `list_links`, `add_link`, `update_link`, `reorder_links`,
  `remove_link` (archives the link, so its clicks stay; `update_link` with `archived: false` restores it), and
  `get_link_stats` (`apps/mcp/src/lib/tools/links.ts`).

`/private` is protected with OAuth 2.1 by [Better Auth](https://www.better-auth.com) and its MCP plugin
(`apps/mcp/src/lib/auth.ts`). MCP clients find the sign-in flow on their own through the standard discovery documents
(`/.well-known/oauth-protected-resource/private` and `/.well-known/oauth-authorization-server`), and register through a
Client ID Metadata Document or dynamic client registration. Signing in is with GitHub, and only the account whose email
is `OWNER_EMAIL` can sign in; anyone else is refused before an account is created. After signing in you approve the
client on `/consent`, and it gets an access token valid for `/private` only.

To add it to Claude: Settings → Connectors → Add custom connector, with the URL `https://mcp.bengottschalk.com/private`.

### Running it locally

```bash
cp apps/mcp/.env.example apps/mcp/.env.local       # fill in BETTER_AUTH_SECRET and OWNER_EMAIL
cp apps/links/.env.example apps/links/.env.local
npm run db:migrate                                 # creates .data/dev.db, a local SQLite database
npm run dev
```

There's no GitHub app for localhost, so in development `/login` also offers email and password sign-in for
`OWNER_EMAIL`. Point an MCP client (or `npx @modelcontextprotocol/inspector`) at `http://localhost:3003/private`.

## Database

`packages/db` holds the Drizzle schema (`src/schema.ts`, plus `src/auth-schema.ts` for Better Auth's tables) and SQL
migrations in `packages/db/migrations`. Migration `0001` seeds the links page's first four buttons.

- `npm run db:migrate` applies migrations to the database in `TURSO_DATABASE_URL` (default: `.data/dev.db`). To migrate
  Turso, run it with `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` set to the production values.
- After changing `src/schema.ts`, run `npm run db:generate` to write a new migration, then commit it.
- After changing Better Auth plugins, regenerate `src/auth-schema.ts` with the Better Auth CLI (`npx auth@latest generate`,
  with a config file that exports the result of `getAuth()` from `apps/mcp/src/lib/auth.ts`), then `npm run db:generate`.
- `npm run db:studio` opens Drizzle Studio to browse the data.

Turso's free plan covers this comfortably: about 5 GB of storage, 500 million row reads and 10 million row writes a
month. A click is one row written.

## Deploying on Vercel
Each app is its own Vercel project, all connected to this repository:

| Vercel project | Root Directory | Domain |
| --- | --- | --- |
| `bengottschalk` (existing) | `apps/www` | `bengottschalk.com`, `www.bengottschalk.com` |
| new, e.g. `bengottschalk-links` | `apps/links` | `links.bengottschalk.com` |
| new, e.g. `bengottschalk-mcp` | `apps/mcp` | `mcp.bengottschalk.com` |

- Vercel detects the npm workspace from `package-lock.json` at the root, installs from there, and builds with
  Turborepo. Leave the framework preset on Next.js and the build/install commands on their defaults.
- In each project's Settings → Build and Deployment, keep **Include files outside the Root Directory** on (packages
  live outside it) and turn on **Skip deployments when there are no changes to the root directory or its
  dependencies**, so a links-only change doesn't redeploy the website.
- Each app's `package.json` pins Node.js 24.x through `engines`.
- `preview.bengottschalk.com` follows the website's previews only (see `.github/workflows/preview-alias.yml`).

Environment variables, in each project's Settings → Environment Variables:

| Variable | `www` | `links` | `mcp` | Value |
| --- | :---: | :---: | :---: | --- |
| `YOUTUBE_API_KEY`, `RESEND_API_KEY`, `SEND_TO_EMAIL` | ✓ | | | See above |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | | ✓ | ✓ | From Turso: the database URL (`libsql://…`) and a token |
| `REVALIDATE_SECRET` | | ✓ | ✓ | The same random value in both: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | | | ✓ | `https://mcp.bengottschalk.com` |
| `BETTER_AUTH_SECRET` | | | ✓ | A random value: `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | | | ✓ | From the GitHub OAuth app |
| `OWNER_EMAIL` | | | ✓ | The primary email of your GitHub account |

Preview deployments of the links and MCP apps use the same database as production, so be careful testing edits there.
Signing in only works on `mcp.bengottschalk.com`, because the GitHub OAuth app allows a single callback URL.
