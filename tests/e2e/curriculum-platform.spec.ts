import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Yapsu Pipeline")).toBeVisible();
});

test("UC01 adds and reorders curriculum cards", async ({ page }) => {
  await expect(page.getByText("Curriculum & Language Editor")).toBeVisible();

  const firstTable = page.locator("table").first();
  const firstCodeBefore = await firstTable.locator("tbody tr").first().locator("td").nth(3).innerText();
  await firstTable.getByTitle("Move down").first().click();
  const firstCodeAfter = await firstTable.locator("tbody tr").first().locator("td").nth(3).innerText();
  expect(firstCodeAfter).not.toBe(firstCodeBefore);

  await page.getByRole("button", { name: "Vocab Card" }).click();
  await expect(page.getByText(/Added Vocab Card at row \d+/)).toBeVisible();
  await expect(page.getByText("UNSAVED CHANGES")).toBeVisible();
});

test("UC02 generates audio, runs AI QA, then enables Human QA", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Upload Audio" })).toBeVisible();
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByRole("button", { name: /Generate Selected/ }).click();
  await expect(page.getByText(/Generating audio for \d+ items/)).toBeVisible();

  await page.waitForTimeout(1_800);
  await page.getByRole("button", { name: /AI QA Selected/ }).click();
  await expect(page.getByText(/AI QA passed for \d+ audio row/)).toBeVisible();
  await expect(page.getByTitle("Pass Human QA").first()).toBeEnabled();
});

test("UC03 keeps Main Drill and Extra Drill assignments explicit", async ({ page }) => {
  await page.getByRole("button", { name: "Drill Config (UC03)" }).click();
  await expect(page.getByText("Layer 2 Source Assignment")).toBeVisible();
  await expect(page.getByText("Drill Configuration Table")).toBeVisible();
  await expect(page.getByText(/Each source card can belong to Main Drill or Extra Drill/)).toBeVisible();

  const addButton = page.getByRole("button", { name: "Add to Main Drill" }).first();
  if (await addButton.isVisible()) {
    await addButton.click();
    await expect(page.getByText(/Added .* to Main Drill/)).toBeVisible();
    const firstToken = page.getByRole("button", { name: "你", exact: true }).first();
    await firstToken.click();
    await firstToken.click();
  }
  await page.getByRole("button", { name: "Save Drill Configuration" }).click();
  await expect(page.getByRole("status").getByText(/Saved \d+ Drill and \d+ Extra Drill item/)).toBeVisible();
});

test("UC04 edits mobile context and adds a complete roleplay goal", async ({ page }) => {
  await page.getByRole("button", { name: "Roleplay Setup (UC04)" }).click();
  await expect(page.getByText("Roleplay Editor")).toBeVisible();
  await expect(page.getByText("Lesson Title (Inherited)")).toBeVisible();

  const goalRowsBefore = await page.locator("tbody tr").count();
  await page.getByRole("button", { name: "Add Goal" }).click();
  await expect(page.getByText(/Added Roleplay Goal at row \d+/)).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(goalRowsBefore + 1);

  const lastRow = page.locator("tbody tr").last();
  await lastRow.getByPlaceholder("Goal title").fill("Introduce yourself");
  await lastRow.getByPlaceholder("Success criteria (for AI)").fill("Student introduces themselves clearly");
  await lastRow.getByPlaceholder(/Description \(English\)/).fill("Introduce yourself using the lesson vocabulary.");
  await page.getByRole("button", { name: "Save Roleplay" }).click();
  await expect(page.getByRole("status").getByText(/Roleplay configured with \d+ active goal/)).toBeVisible();
});
