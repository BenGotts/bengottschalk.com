# bengottschalk.com

A monorepo (npm workspaces + [Turborepo](https://turborepo.com)) with three apps, each deployed as its own Vercel project:

| App | Domain | What it is |
| --- | --- | --- |
| `apps/www` | [bengottschalk.com](https://www.bengottschalk.com) | The personal website |
| `apps/links` | [links.bengottschalk.com](https://links.bengottschalk.com) | Link in bio for social media profiles |
| `apps/mcp` | [mcp.bengottschalk.com](https://mcp.bengottschalk.com) | MCP server (endpoint `/mcp`) for asking AI assistants about Ben |

and shared packages:

| Package | What it holds |
| --- | --- |
| `packages/content` | Hand-edited content: social links, projects, experience, site name and URLs |
| `packages/theme` | The "Midnight Cube" DaisyUI themes and Tailwind tokens (`theme.css`), and theme names |
| `packages/wca` | WCA event names and result formatting |

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
- **Link in bio buttons:** `apps/links/src/links.ts`.
- **Competitions, results, records:** nothing to do; they update from the WCA automatically.
- **Theme colors:** `packages/theme/theme.css` (DaisyUI themes `midnight` and `midnight-light`).

## Notes

- The competition map uses Esri's keyless Canvas basemaps. If they start requiring a key, switch providers in
  `apps/www/src/components/competitions/CompetitionMap.tsx`.
- `@wca/helpers` 2.0.0 lists FTO in its types but not its event table; `packages/wca/src/events.ts` works around it.

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

- Vercel detects the npm workspace from `package-lock.json` at the root, installs from there, and builds with
  Turborepo. Leave the framework preset on Next.js and the build/install commands on their defaults.
- In each project's Settings → Build and Deployment, keep **Include files outside the Root Directory** on (packages
  live outside it) and turn on **Skip deployments when there are no changes to the root directory or its
  dependencies**, so a links-only change doesn't redeploy the website.
- Each app's `package.json` pins Node.js 24.x through `engines`.
- `preview.bengottschalk.com` follows the website's previews only (see `.github/workflows/preview-alias.yml`).
