// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const PAGE_URL = `file://${path.resolve(__dirname, '../index.html')}`;

// ─── Responsive Layout Tests ─────────────────────────────────────────

test.describe('Responsive Layout - 320px (iPhone SE)', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('should have no horizontal overflow', async ({ page }) => {
    await page.goto(PAGE_URL);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px tolerance
  });

  test('should display all trimester buttons without overflow', async ({ page }) => {
    await page.goto(PAGE_URL);
    const row = page.locator('.trimester-row');
    const rowBox = await row.boundingBox();
    expect(rowBox).not.toBeNull();
    expect(rowBox.width).toBeLessThanOrEqual(320);
  });

  test('should display interval card within viewport', async ({ page }) => {
    await page.goto(PAGE_URL);
    const card = page.locator('.interval-card');
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x + box.width).toBeLessThanOrEqual(320 + 1);
  });

  test('should display timer ring centered', async ({ page }) => {
    await page.goto(PAGE_URL);
    const ring = page.locator('.ring-wrap');
    const ringBox = await ring.boundingBox();
    const card = page.locator('#sittingCard');
    const cardBox = await card.boundingBox();

    expect(ringBox).not.toBeNull();
    expect(cardBox).not.toBeNull();

    // Check ring is roughly centered in the card
    const ringCenter = ringBox.x + ringBox.width / 2;
    const cardCenter = cardBox.x + cardBox.width / 2;
    expect(Math.abs(ringCenter - cardCenter)).toBeLessThan(10);
  });

  test('should display ring text centered within ring', async ({ page }) => {
    await page.goto(PAGE_URL);
    const ring = page.locator('.ring-wrap');
    const ringBox = await ring.boundingBox();
    const inner = page.locator('.ring-inner');
    const innerBox = await inner.boundingBox();

    expect(ringBox).not.toBeNull();
    expect(innerBox).not.toBeNull();

    // Ring inner should overlay the ring
    expect(innerBox.x).toBeGreaterThanOrEqual(ringBox.x - 1);
    expect(innerBox.width).toBeLessThanOrEqual(ringBox.width + 2);
  });

  test('should display stats cards side by side', async ({ page }) => {
    await page.goto(PAGE_URL);
    const cards = page.locator('.stat-card');
    const box1 = await cards.nth(0).boundingBox();
    const box2 = await cards.nth(1).boundingBox();

    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();

    // Both should be on the same row (same Y roughly)
    expect(Math.abs(box1.y - box2.y)).toBeLessThan(5);
    // Both should fit within viewport
    expect(box2.x + box2.width).toBeLessThanOrEqual(320 + 1);
  });

  test('should display all buttons without clipping', async ({ page }) => {
    await page.goto(PAGE_URL);
    const mainBtn = page.locator('#mainBtn');
    const box = await mainBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320 + 1);
  });
});

test.describe('Responsive Layout - 375px (iPhone 12)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should have no horizontal overflow', async ({ page }) => {
    await page.goto(PAGE_URL);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('should display ring text centered', async ({ page }) => {
    await page.goto(PAGE_URL);
    const ring = page.locator('.ring-wrap');
    const ringBox = await ring.boundingBox();
    const timeText = page.locator('#ringTime');
    const timeBox = await timeText.boundingBox();

    expect(ringBox).not.toBeNull();
    expect(timeBox).not.toBeNull();

    const ringCenter = ringBox.x + ringBox.width / 2;
    const timeCenter = timeBox.x + timeBox.width / 2;
    expect(Math.abs(ringCenter - timeCenter)).toBeLessThan(15);
  });
});

test.describe('Responsive Layout - 768px (Tablet)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('should constrain app width to max-width', async ({ page }) => {
    await page.goto(PAGE_URL);
    const app = page.locator('.app');
    const box = await app.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeLessThanOrEqual(480 + 32); // max-width + padding
  });

  test('should center the app container', async ({ page }) => {
    await page.goto(PAGE_URL);
    const app = page.locator('.app');
    const box = await app.boundingBox();
    expect(box).not.toBeNull();

    const leftGap = box.x;
    const rightGap = 768 - (box.x + box.width);
    expect(Math.abs(leftGap - rightGap)).toBeLessThan(5);
  });
});

// ─── Visual Snapshot Tests ───────────────────────────────────────────

test.describe('Visual Regression', () => {
  test('desktop screenshot matches', async ({ page }) => {
    test.use({ viewport: { width: 480, height: 900 } });
    await page.goto(PAGE_URL);
    await page.waitForTimeout(500); // Wait for animations
    await expect(page).toHaveScreenshot('desktop-full.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('mobile 320px screenshot matches', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(PAGE_URL);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('mobile-320.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('mobile 375px screenshot matches', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(PAGE_URL);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('mobile-375.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
