import { expect, test, type Page } from "@playwright/test";
import { onboard, rateWithKeyboard, signIn } from "./helpers";
import { USER_A, USER_B } from "./users";

/**
 * The whole "watch with your people" loop with two real browser sessions:
 * circle → invite → Pick Night → screening → blind reveal → spoiler lock → compatibility.
 */
test("two friends go from Pick Night to a blind reveal", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const a = await contextA.newPage();
  const b = await contextB.newPage();

  await test.step("both sign in and onboard", async () => {
    await signIn(a, USER_A.email);
    await onboard(a, USER_A);
    await signIn(b, USER_B.email);
    await onboard(b, USER_B);
  });

  let circleUrl = "";
  await test.step("A creates a crew and B joins with the invite link", async () => {
    await a.goto("/circles");
    await a.getByRole("button", { name: "New circle" }).first().click();
    await a.getByLabel("Circle name").fill("E2E Crew");
    await a.getByRole("button", { name: /Crew/ }).click();
    await a.getByRole("button", { name: "Create circle" }).click();
    await a.waitForURL(/\/circles\/[^/?]+\?invite=1/);
    circleUrl = a.url().split("?")[0];

    const linkInput = a.getByRole("textbox", { name: "Invite link" });
    await expect(linkInput).toHaveValue(/\/join\//);
    const invite = await linkInput.inputValue();
    await a.keyboard.press("Escape");

    await b.goto(invite);
    await b.getByRole("button", { name: "Join circle" }).click();
    await b.waitForURL(circleUrl);
    await expect(b.getByRole("heading", { level: 1 })).toHaveText("E2E Crew");
  });

  let pickUrl = "";
  await test.step("A starts a Pick Night and both vote blind", async () => {
    await a.goto(`${circleUrl}/pick`);
    await a.getByRole("switch").first().click(); // streaming filter off: mock availability is random
    await a.getByRole("button", { name: "Find our film" }).click();
    await a.waitForURL(/\/pick\//);
    pickUrl = a.url();

    await b.goto(pickUrl);
    await voteAll(a, "Yes");
    await expect(a.getByText(/Waiting for Blake/)).toBeVisible();
    await voteFirstYesThenNo(b);
    for (const page of [a, b]) await expect(page.getByText("Tonight you're watching")).toBeVisible({ timeout: 20_000 });
  });

  let screeningUrl = "";
  let filmTitle = "";
  await test.step("A plans the screening; B can't see A's sealed rating", async () => {
    filmTitle = (await a.getByRole("heading", { level: 1 }).textContent()) ?? "";
    await a.getByRole("button", { name: "Plan the screening" }).click();
    await a.waitForURL(/\/screenings\//);
    screeningUrl = a.url();

    await rateWithKeyboard(a, 0, 10);
    await a.getByRole("button", { name: "Seal my rating" }).click();
    await expect(a.getByText("Waiting for Blake")).toBeVisible();

    await b.goto(screeningUrl);
    await expect(b.getByLabel("Sealed").first()).toBeVisible();
    await expect(b.getByText("The reveal")).toHaveCount(0);
    await expect(b.getByText("Biggest fan")).toHaveCount(0);
  });

  await test.step("B seals and the ratings flip for everyone", async () => {
    await rateWithKeyboard(b, 0, 4);
    await b.getByRole("button", { name: "Seal my rating" }).click();
    for (const page of [b, a]) {
      await expect(page.getByRole("heading", { name: "The reveal" })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText("Divisive!")).toBeVisible();
      await expect(page.getByText("Biggest fan")).toBeVisible();
    }
  });

  await test.step("threads stay locked until you've logged the film", async () => {
    // A film neither tester rated during onboarding and that didn't win Pick Night.
    const filmId = filmTitle.trim() === "Casablanca" ? 539 : 289;
    await a.goto(`/film/${filmId}`);
    await a.getByRole("button", { name: "Log", exact: true }).click();
    await rateWithKeyboard(a, 0, 8);
    await a.getByRole("combobox").click();
    await a.getByRole("option", { name: "E2E Crew" }).click();
    await a.getByRole("button", { name: "Save to diary" }).click();
    await expect(a.getByText("Logged. Nice.")).toBeVisible();

    await a.goto(`${circleUrl}/threads/${filmId}`);
    await a.getByPlaceholder("Say what you really thought…").fill("The spinning top. Discuss.");
    await a.getByRole("button", { name: "Post" }).click();
    // Wait for the server round-trip: the comment is in the list and the composer is cleared.
    await expect(a.getByRole("listitem").filter({ hasText: "The spinning top. Discuss." })).toBeVisible();
    await expect(a.getByPlaceholder("Say what you really thought…")).toHaveValue("");

    await b.goto(`${circleUrl}/threads/${filmId}`);
    await expect(b.getByRole("heading", { name: "Spoiler-locked" })).toBeVisible();
    await expect(b.getByText("1 comment waiting for you")).toBeVisible();
    await expect(b.getByText("The spinning top. Discuss.")).toHaveCount(0);
  });

  await test.step("compatibility link turns into a Duo", async () => {
    await a.goto("/home");
    await a.getByRole("button", { name: "Create my link" }).click();
    const compatLink = await a.getByRole("textbox", { name: "Share this link with a friend" }).inputValue();

    await b.goto(compatLink);
    await b.getByRole("button", { name: "How compatible are we?" }).click();
    await expect(b.getByRole("heading", { name: /You're \d+% compatible/ })).toBeVisible();
    await b.getByRole("button", { name: "Create our Duo" }).click();
    await b.waitForURL(/\/circles\//);
    await expect(b.getByText("Duo").first()).toBeVisible();
  });

  expect(filmTitle.length).toBeGreaterThan(0);
  await contextA.close();
  await contextB.close();
});

async function voteAll(page: Page, choice: "Yes" | "No") {
  const total = await deckSize(page);
  for (let i = 0; i < total; i++) await page.getByRole("button", { name: choice, exact: true }).click();
}

async function voteFirstYesThenNo(page: Page) {
  const total = await deckSize(page);
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  for (let i = 1; i < total; i++) await page.getByRole("button", { name: "No", exact: true }).click();
}

async function deckSize(page: Page): Promise<number> {
  const progress = await page.getByText(/^1 of \d+$/).textContent();
  return Number(progress?.split(" of ")[1]);
}
