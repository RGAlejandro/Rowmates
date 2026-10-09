// Demo data: four people with distinct tastes, a crew with a divisive and a
// unanimous reveal, an upcoming screening, a spoiler thread and a duo.
// Idempotent: removes previous seed users (clerkId "seed_*") and recreates them.

import "dotenv/config";
import { createPrismaClient } from "../src/lib/prisma-client";
import { FIXTURE_FILMS } from "../src/lib/tmdb/fixtures";
import { computeTasteProfile, type RatedFilm } from "../src/lib/taste/profile";

const db = createPrismaClient(process.env.DATABASE_URL!);

/** Deterministic PRNG so the demo looks the same on every machine. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const dateOnly = (d: Date) => new Date(d.toISOString().slice(0, 10));

const PEOPLE = [
  { key: "ana", name: "Ana García", taste: { 18: 0.8, 10749: 0.9, 36: 0.3, 27: -0.7, 28: -0.4, 16: 0.3 } },
  { key: "leo", name: "Leo Martins", taste: { 28: 0.9, 878: 0.9, 12: 0.7, 10749: -0.6, 35: 0.2 } },
  { key: "maya", name: "Maya Chen", taste: { 27: 1, 53: 0.8, 9648: 0.7, 80: 0.5, 10751: -0.6, 10749: -0.3 } },
  { key: "sam", name: "Sam Okafor", taste: { 35: 0.9, 16: 1, 10751: 0.8, 12: 0.4, 27: -0.8, 18: -0.2 } },
] as const;

const REVIEWS = [
  "Thought about it for days afterwards.",
  "The last twenty minutes are unreal.",
  "Fine, but I don't get the hype.",
  "Rewatched it with my mum and she cried twice.",
  "Perfect Sunday film.",
];

async function main() {
  console.log("Seeding films…");
  for (const f of FIXTURE_FILMS) {
    const data = {
      title: f.title,
      originalTitle: f.title,
      year: f.year,
      overview: f.overview,
      runtime: f.runtime,
      genres: f.genres,
      directors: f.directors,
      originalLanguage: f.lang,
      popularity: f.popularity,
      voteAverage: f.vote,
      detailsFetchedAt: new Date(),
    };
    await db.film.upsert({ where: { tmdbId: f.id }, create: { tmdbId: f.id, ...data }, update: data });
  }

  console.log("Resetting demo people…");
  await db.user.deleteMany({ where: { clerkId: { startsWith: "seed_" } } });

  const users: Record<string, string> = {};
  for (const person of PEOPLE) {
    const user = await db.user.create({
      data: {
        clerkId: `seed_${person.key}`,
        username: person.key,
        displayName: person.name,
        bio: `Demo member. Taste: ${Object.entries(person.taste).filter(([, w]) => w > 0.5).length} strong favourites.`,
        region: "US",
        onboardedAt: daysAgo(320),
        createdAt: daysAgo(320),
        services: {
          create: [
            { providerId: 8, providerName: "Netflix" },
            { providerId: 9, providerName: "Amazon Prime Video" },
            { providerId: 1899, providerName: "Max" },
            { providerId: 11, providerName: "MUBI" },
          ],
        },
      },
    });
    users[person.key] = user.id;
  }

  console.log("Writing diaries…");
  for (const [index, person] of PEOPLE.entries()) {
    const random = mulberry32(1000 + index);
    const films = [...FIXTURE_FILMS].sort(() => random() - 0.5).slice(0, 30);
    const watchlist = [...FIXTURE_FILMS].filter((f) => !films.includes(f)).sort(() => random() - 0.5).slice(0, 6);

    const rated: RatedFilm[] = [];
    for (const [i, film] of films.entries()) {
      const weights = film.genres.map((g) => (person.taste as Record<number, number>)[g] ?? 0);
      const affinity = weights.reduce((s, w) => s + w, 0) / weights.length;
      const rating = Math.min(10, Math.max(1, Math.round(6 + 3 * affinity + (film.vote - 7.5) * 1.2 + (random() * 3 - 1.5))));
      const watched = dateOnly(daysAgo(Math.floor(random() * 300) + 2));
      rated.push({ filmId: film.id, rating, genres: film.genres, directors: film.directors });
      await db.logEntry.create({
        data: {
          userId: users[person.key],
          filmId: film.id,
          rating,
          liked: rating >= 9,
          watchedOn: watched,
          review: i % 7 === 0 ? REVIEWS[(i + index) % REVIEWS.length] : null,
          createdAt: watched,
        },
      });
    }
    await db.watchlistItem.createMany({ data: watchlist.map((f) => ({ userId: users[person.key], filmId: f.id })) });
    await db.favoriteFilm.createMany({
      data: [...rated]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4)
        .map((r, i) => ({ userId: users[person.key], filmId: r.filmId, position: i + 1 })),
    });
    const profile = computeTasteProfile(rated);
    await db.tasteProfile.create({ data: { userId: users[person.key], ...profile } });
  }

  console.log("Following each other…");
  await db.follow.createMany({
    data: PEOPLE.flatMap((a) => PEOPLE.filter((b) => b !== a).map((b) => ({ followerId: users[a.key], followeeId: users[b.key] }))),
  });

  console.log("Building the Sunday Movie Club…");
  const club = await db.circle.create({
    data: {
      name: "Sunday Movie Club",
      kind: "CREW",
      createdById: users.ana,
      members: {
        create: [
          { userId: users.ana, role: "OWNER", joinedAt: daysAgo(200) },
          { userId: users.leo, joinedAt: daysAgo(199) },
          { userId: users.maya, joinedAt: daysAgo(198) },
          { userId: users.sam, joinedAt: daysAgo(150) },
        ],
      },
      invites: { create: { token: "demo-sunday-club", createdById: users.ana, expiresAt: new Date("2099-01-01") } },
    },
  });

  await db.circleWatchlistItem.createMany({
    data: [666277, 915935, 840430, 792307, 346648].map((filmId, i) => ({
      circleId: club.id,
      filmId,
      addedById: [users.ana, users.leo, users.maya, users.sam][i % 4],
    })),
  });

  const reveals: { filmId: number; days: number; ratings: Record<string, number>; reviews?: Record<string, string> }[] = [
    {
      filmId: 530385, // Midsommar: divisive
      days: 20,
      ratings: { ana: 3, leo: 4, maya: 10, sam: 2 },
      reviews: { maya: "Florence Pugh deserved every award.", sam: "I need a hug and a nap." },
    },
    { filmId: 129, days: 45, ratings: { ana: 9, leo: 9, maya: 8, sam: 10 } }, // Spirited Away: unanimous
  ];

  for (const reveal of reveals) {
    const watchedAt = daysAgo(reveal.days);
    const screening = await db.screening.create({
      data: {
        circleId: club.id,
        filmId: reveal.filmId,
        hostId: users.ana,
        scheduledAt: watchedAt,
        watchedAt,
        status: "REVEALED",
        revealedAt: new Date(watchedAt.getTime() + 2 * 60 * 60 * 1000),
        attendees: { create: Object.keys(reveal.ratings).map((key) => ({ userId: users[key], rsvp: "GOING" as const })) },
      },
    });
    for (const [key, rating] of Object.entries(reveal.ratings)) {
      await db.logEntry.create({
        data: {
          userId: users[key],
          filmId: reveal.filmId,
          screeningId: screening.id,
          rating,
          review: reveal.reviews?.[key] ?? null,
          hasSpoilers: Boolean(reveal.reviews?.[key]),
          watchedOn: dateOnly(watchedAt),
          createdAt: watchedAt,
        },
      });
    }
  }

  const upcoming = new Date(Date.now() + 3 * DAY);
  upcoming.setUTCHours(21, 0, 0, 0);
  await db.screening.create({
    data: {
      circleId: club.id,
      filmId: 693134,
      hostId: users.leo,
      scheduledAt: upcoming,
      location: "CINEMA",
      venue: "The Grand, Screen 3",
      attendees: {
        create: [
          { userId: users.leo, rsvp: "GOING" },
          { userId: users.ana, rsvp: "GOING" },
          { userId: users.maya, rsvp: "MAYBE" },
        ],
      },
    },
  });

  const thread = await db.thread.create({ data: { circleId: club.id, filmId: 530385, lastActivityAt: daysAgo(19) } });
  await db.comment.createMany({
    data: [
      { threadId: thread.id, authorId: users.maya, body: "That ending. The bear. I'm still thinking about it.", createdAt: daysAgo(20) },
      { threadId: thread.id, authorId: users.sam, body: "I watched most of it through my fingers.", createdAt: daysAgo(20) },
      { threadId: thread.id, authorId: users.ana, body: "Beautifully shot, but two and a half hours of dread is a lot for a Sunday.", createdAt: daysAgo(19) },
    ],
  });

  await db.circle.create({
    data: {
      name: "Ana & Leo",
      kind: "DUO",
      createdById: users.ana,
      members: { create: [{ userId: users.ana, role: "OWNER" }, { userId: users.leo }] },
    },
  });

  console.log("Done. Demo invite: /join/demo-sunday-club");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
