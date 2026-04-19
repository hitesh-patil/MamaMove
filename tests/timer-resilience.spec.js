import { test, expect } from '@playwright/test';

test.describe('Timer Resilience & Sleep Simulation', () => {
  test('timers update correctly and alert triggers after simulated time jumps', async ({ page }) => {
    await page.goto('file:///Users/hiteshpatil/my-projects/MamaMove/index.html');

    // Install the Playwright clock to control time deterministically
    await page.clock.install();

    // 1. Sitting Timer Test
    const startBtn = page.getByRole('button', { name: 'Start sitting' });
    await startBtn.click({ force: true });

    // The default sitting interval is 30 mins
    const ringTime = page.locator('#ringTime');
    await expect(ringTime).toHaveText('30');

    // Simulate 15 minutes passing (e.g. phone goes to sleep)
    // fastForward will jump Date.now() and execute the interval logic accurately
    await page.clock.fastForward(15 * 60 * 1000);

    // It should now show 15 mins left (30 - 15)
    await expect(ringTime).toHaveText('15');

    // 2. Alert Generation Test
    // Fast forward another 15 minutes to reach the 30-minute threshold
    await page.clock.fastForward(15 * 60 * 1000);

    // The alert overlay should now be visible asking the user to walk
    const alertOverlay = page.locator('#alertOverlay');
    await expect(alertOverlay).toHaveClass(/show/);

    // 3. Walk Timer Test
    // Click "Let's walk" to start the walk session
    await page.getByRole('button', { name: "Let's walk" }).click({ force: true });

    // Walk card should be visible
    const walkCard = page.locator('#walkCard');
    await expect(walkCard).toHaveClass(/visible/);

    // Walk timer starts automatically at 10 minutes from the alert
    const walkTimerString = page.locator('#walkTimer');
    await expect(walkTimerString).toHaveText('10:00');

    // Simulate 4 minutes and 30 seconds passing
    await page.clock.fastForward((4 * 60 + 30) * 1000);
    await expect(walkTimerString).toHaveText('5:30');

    // Simulate the remaining 5 minutes and 30 seconds passing
    await page.clock.fastForward((5 * 60 + 30) * 1000);

    // Timer should say 'Done!'
    await expect(walkTimerString).toHaveText('Done!');
  });
});
