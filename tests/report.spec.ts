import { test, expect } from '@playwright/test';

test.describe('Playwright Report Page', () => {
  test('should explore key functionality of the report', async ({ page }) => {
    // 1. Navigate to the specified URL
    await page.goto('file:///Users/hiteshpatil/my-projects/playwright/playwright-report/index.html');

    // Verify the page title
    await expect(page).toHaveTitle(/Playwright Test Report/);

    // 2. Explore 1 key functionality: Filtering and expanding tests
    
    // Click on the 'Passed' link to filter for passed tests
    const passedLink = page.getByRole('link', { name: /Passed/ });
    await expect(passedLink).toBeVisible();
    await passedLink.click();

    // Verify the 'Test' file exists and expand it
    const testFileBtn = page.getByRole('button', { name: 'example.spec.ts' });
    await expect(testFileBtn).toBeVisible();
    
    // If it is not expanded, click it
    const isExpanded = await testFileBtn.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await testFileBtn.click();
    }

    // Verify 'View Trace' link is visible inside the test details
    const viewTraceLink = page.getByRole('link', { name: 'View Trace' });
    await expect(viewTraceLink).toBeVisible();
  });
});
