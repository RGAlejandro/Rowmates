import { expect, type Page } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";

export async function signIn(page: Page, email: string) {
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
}

/** Rates the n-th star input on the page with the keyboard (each → is half a star). */
export async function rateWithKeyboard(page: Page, sliderIndex: number, halfStars: number) {
  const slider = page.getByRole("slider").nth(sliderIndex);
  await slider.focus();
  for (let i = 0; i < halfStars; i++) await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", String(halfStars / 2));
}

/** Completes the four onboarding steps and lands on /home. */
export async function onboard(page: Page, user: { username: string; name: string }, ratings = 10) {
  await page.goto("/home");
  await page.waitForURL("**/onboarding");

  await page.getByLabel("Display name").fill(user.name);
  await page.getByLabel("Username").fill(user.username);
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.getByText("Where do you watch?")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.getByText("Which services do you have?")).toBeVisible();
  await page.getByRole("button", { name: "Netflix" }).click();
  await page.getByRole("button", { name: "MUBI" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.getByText("Teach us your taste")).toBeVisible();
  for (let i = 0; i < ratings; i++) await rateWithKeyboard(page, i, 4 + ((i * 3) % 7));
  await expect(page.getByText(`${Math.min(ratings, 10)} of 10 rated`)).toBeVisible();
  // Give the fire-and-forget quick ratings a moment to land before finishing.
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.waitForURL("**/home");
}
