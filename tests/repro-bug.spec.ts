import { test, expect } from '@playwright/test';
import { seedCleanState } from './helpers';

test('REPRODUCE: note should not be deleted when typing after /code', async ({ page }) => {
  await seedCleanState(page);
  await page.goto('/');
  await page.waitForSelector('header h1', { timeout: 10000 });
  await page.waitForTimeout(500);

  // Step 1: Create a new note (there's already one from seed)
  // Step 2: Add a title
  const proseMirror = page.locator('.ProseMirror');
  await proseMirror.click();
  await page.keyboard.type('My Test Title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);

  // Step 3: Add a code block with /code
  // Type / to trigger slash menu
  await page.keyboard.type('/');

  // Wait for slash menu to appear (tippy popup)
  const slashMenu = page.locator('[data-tippy-root]');
  await expect(slashMenu).toBeVisible({ timeout: 3000 });

  // Continue typing "code" to filter
  await page.keyboard.type('code');
  await page.waitForTimeout(300);

  // Verify we can see "Code Block" option
  const codeBlockOption = page.getByText('Code Block').first();
  await expect(codeBlockOption).toBeVisible({ timeout: 3000 });

  // Click on the Code Block option instead of pressing Enter
  await codeBlockOption.click();
  await page.waitForTimeout(500);

  // Verify code block was inserted
  const codeBlock = page.locator('.cm-content').first();
  await expect(codeBlock).toBeVisible({ timeout: 5000 });

  // Step 4: Press any key - this should type into the code block, NOT delete the note
  await page.keyboard.type('x');
  await page.waitForTimeout(500);

  // Verify the note still exists and has content
  await expect(proseMirror).toContainText('My Test Title', { timeout: 5000 });

  // The code block should contain 'x'
  await expect(codeBlock).toContainText('x', { timeout: 5000 });
});
