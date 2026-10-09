# Rowmates

**Movies are better together.** A social film diary built around the people you actually watch with: plan the night, pick the film in minutes, rate in secret and reveal together.

> Working name. Letterboxd is where strangers read your reviews; Rowmates is where you watch with your people.

## What makes it different

| | |
|---|---|
| **Circles** | Private groups: a *Duo* (you and your person) or a *Crew* (up to 20). Shared watchlist, shared diary, discussions. |
| **Pick Night** | "What should we watch?" solved in three minutes. Candidates come from everyone's watchlists and the group's taste, filtered by the services you actually pay for. Everyone votes blind (yes / maybe / no, one veto each) and the result is revealed at once. |
| **Blind Reveal** | After a screening everyone seals a secret rating. When the last person rates (or after 48 h) all cards flip together: group average, *Unanimous* or *Divisive!*, biggest fan, toughest critic, and a story-sized share card. |
| **Spoiler-locked threads** | Every film gets a thread inside the circle that only unlocks once you've logged the film ("3 comments waiting for you"). |
| **How compatible are we?** | Send a link, get a compatibility score with what you both love and what you'll argue about, then turn it into a Duo in one tap. |
| **Your data is yours** | Import your Letterboxd (ZIP) or IMDb (CSV) history; export everything as JSON or as a Letterboxd-compatible CSV. No ads. |

## Stack

Next.js 16.4 (App Router, Cache Components + Partial Prerendering, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 + shadcn/ui (Radix) · Motion · Prisma 7 + PostgreSQL · Clerk (Core 3) · TanStack Query · Zod · Vitest · Playwright. Film data from [TMDB](https://www.themoviedb.org/) (streaming availability by JustWatch).

## Getting started

Requirements: Node 20.9+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env            # set DATABASE_URL
npx clerk@latest init --accountless   # temporary Clerk dev keys in .env.local, no account needed
npm run db:migrate              # create the schema
npm run db:seed                 # demo people, a crew with two reveals, a thread and a duo
npm run dev
```

Open http://localhost:3000. The demo crew can be joined at `/join/demo-sunday-club`.

**TMDB:** without `TMDB_API_READ_TOKEN` the app runs on an offline catalogue of 92 films (typographic posters, invented availability), which is also what the tests use. Add a free [TMDB API Read Access Token](https://www.themoviedb.org/settings/api) to get the full catalogue and real posters. TMDB is free for non-commercial use; a commercial license is required before monetizing.

## Scripts

| Command | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (generates the Prisma client first) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit tests (Vitest): taste, compatibility, Pick Night scoring and voting, reveal rules, importers, TMDB mock |
| `npm run test:e2e` | End-to-end (Playwright + `@clerk/testing`): public pages and the full social loop with two real users |
| `npm run db:migrate` / `db:seed` / `db:reset` | Database |

## How it works

```
src/
  app/(marketing)        landing (static)
  app/(app)              the product: home, film, profile, circles, pick, screenings, compat, import, settings
  app/api                live "pulse" endpoints, search, import progress, export, OG share card, Clerk webhook
  lib/                   pure logic (taste, pick, reveal, import parsers, visibility rules) + TMDB client
  server/                data access, Server Actions, import worker
  i18n/en.ts             every user-facing string (typed keys, ready for translation)
prisma/                  schema, migrations, seed
e2e/                     Playwright specs
```

Key decisions:

- **Visibility in one place.** `src/lib/visibility.ts` builds the Prisma filters for "who can see this diary entry". A rating sealed in an unrevealed screening is visible only to its author in every query (feed, profile, film page), and the screening query never sends other people's ratings to the browser before the reveal.
- **Taste, explained.** Ratings are centered on each person's own average so harsh and generous raters compare fairly. Compatibility is an adjusted cosine over shared films with shrinkage for small overlaps, blended with genre profiles. Pick Night scores candidates with a *least misery* blend (70% group average, 30% the least happy person) so nobody gets a film they'd hate, and every candidate explains itself ("On 3 of 4 watchlists · Streaming on Netflix").
- **Real time without infrastructure.** Pick Night and the reveal poll a tiny pulse endpoint every 2 s and refresh the server-rendered page when it changes (`useLiveRefresh`). Swapping in a managed realtime service touches one hook.
- **Imports that scale.** Exports are parsed in the browser and uploaded in chunks. A server worker matches films against TMDB under a database lease (single-flight, resumable after timeouts), caches matches globally, merges diary, ratings, reviews, likes and watchlist per film, and sends ambiguous rows to manual review.
- **Cache Components.** Session-dependent UI streams behind Suspense boundaries; TMDB reads are `use cache`d. Every route ships a static shell.

## Roadmap

Circle stats and Year in Review cards, public clubs with a weekly pick, email reminders, TV series, a read-only demo mode, PWA. Before a public launch: TMDB commercial license, distributed rate limiting, moderation tools and observability.
