import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
    await page.goto('file:///Users/hiteshpatil/my-projects/MamaMove/index.html');
    await page.getByRole('button', { name: '2nd Trimester' }).click();
    await page.getByRole('button', { name: '3rd Trimester' }).click();
    await page.getByText('Shoulder rolls').click();
    await page.getByRole('button', { name: 'Got it' }).click();
    await page.getByText('Pelvic tilts').click();
    await page.getByRole('button', { name: 'Got it' }).click();
    await page.getByText('Neck stretch').click();
    await page.getByRole('button', { name: 'Got it' }).click();
    await page.getByRole('button', { name: 'Enable notifications' }).click();
});