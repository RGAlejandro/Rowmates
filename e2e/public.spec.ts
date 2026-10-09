import { expect, test } from "@playwright/test";

test("landing explains the loop and links to sign up", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Movies are better together.");
  await expect(page.getByRole("link", { name: "Get started — it's free" })).toHaveAttribute("href", "/sign-up");
  await expect(page.getByText("This product uses the TMDB API")).toBeVisible();
});

test("film pages are public and show where to watch", async ({ page }) => {
  await page.goto("/film/496243");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Parasite");
  await expect(page.getByText("Directed by Bong Joon Ho")).toBeVisible();
  await expect(page.getByText("Where to watch")).toBeVisible();
  await expect(page.getByText("Streaming availability powered by JustWatch.").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in to log, rate and add to your watchlist" })).toBeVisible();
});

test("search finds films accent-insensitively", async ({ page }) => {
  await page.goto("/search?q=amelie");
  await expect(page.getByRole("link", { name: /Amélie/ }).first()).toBeVisible();
});

test("demo profiles are public", async ({ page }) => {
  await page.goto("/u/maya");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Maya Chen");
  await expect(page.getByRole("heading", { name: "Rating spread" })).toBeVisible();
});
