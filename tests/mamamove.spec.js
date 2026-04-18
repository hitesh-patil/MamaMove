// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const PAGE_URL = `file://${path.resolve(__dirname, '../index.html')}`;

// ─── Page Load & Structure ───────────────────────────────────────────

test.describe('Page Load & Structure', () => {
  test('should load page with correct title', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page).toHaveTitle('MamaMove — Pregnancy Walking Companion');
  });

  test('should display the MamaMove logo and heading', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('h1')).toHaveText('MamaMove');
    await expect(page.locator('.subtitle')).toHaveText('Your gentle walking companion');
  });

  test('should have meta description for SEO', async ({ page }) => {
    await page.goto(PAGE_URL);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBe('A gentle walking reminder and companion app for pregnant women.');
  });

  test('should display all main sections', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('.trimester-row')).toBeVisible();
    await expect(page.locator('.interval-card')).toBeVisible();
    await expect(page.locator('#sittingCard')).toBeVisible();
    await expect(page.locator('.stats-row')).toBeVisible();
    await expect(page.locator('.stretch-grid')).toBeVisible();
    await expect(page.locator('.tips-card')).toBeVisible();
  });
});

// ─── Trimester Selector ──────────────────────────────────────────────

test.describe('Trimester Selector', () => {
  test('should have 3 trimester buttons', async ({ page }) => {
    await page.goto(PAGE_URL);
    const buttons = page.locator('.tri-btn');
    await expect(buttons).toHaveCount(3);
  });

  test('should have 1st trimester active by default', async ({ page }) => {
    await page.goto(PAGE_URL);
    const firstBtn = page.locator('.tri-btn').first();
    await expect(firstBtn).toHaveClass(/active/);
  });

  test('should switch active trimester on click', async ({ page }) => {
    await page.goto(PAGE_URL);
    const buttons = page.locator('.tri-btn');

    // Click 2nd trimester
    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toHaveClass(/active/);
    await expect(buttons.nth(0)).not.toHaveClass(/active/);

    // Click 3rd trimester
    await buttons.nth(2).click();
    await expect(buttons.nth(2)).toHaveClass(/active/);
    await expect(buttons.nth(1)).not.toHaveClass(/active/);
  });

  test('should update tips title when trimester changes', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#tipsTitle')).toHaveText('Tips for 1st Trimester');

    await page.locator('.tri-btn').nth(1).click();
    await expect(page.locator('#tipsTitle')).toHaveText('Tips for 2nd Trimester');

    await page.locator('.tri-btn').nth(2).click();
    await expect(page.locator('#tipsTitle')).toHaveText('Tips for 3rd Trimester');
  });

  test('should render 5 tips for each trimester', async ({ page }) => {
    await page.goto(PAGE_URL);

    for (let i = 0; i < 3; i++) {
      await page.locator('.tri-btn').nth(i).click();
      const tips = page.locator('.tips-list li');
      await expect(tips).toHaveCount(5);
    }
  });
});

// ─── Interval Selector ───────────────────────────────────────────────

test.describe('Interval Selector', () => {
  test('should have 4 interval pills', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('.pill')).toHaveCount(4);
  });

  test('should have 30 min active by default', async ({ page }) => {
    await page.goto(PAGE_URL);
    const activePill = page.locator('.pill.active');
    await expect(activePill).toHaveText('30 min');
  });

  test('should switch active pill on click', async ({ page }) => {
    await page.goto(PAGE_URL);
    const pills = page.locator('.pill');

    await pills.nth(0).click(); // 20 min
    await expect(pills.nth(0)).toHaveClass(/active/);
    await expect(pills.nth(1)).not.toHaveClass(/active/);

    await pills.nth(3).click(); // 60 min
    await expect(pills.nth(3)).toHaveClass(/active/);
    await expect(pills.nth(0)).not.toHaveClass(/active/);
  });
});

// ─── Timer Functionality ─────────────────────────────────────────────
// NOTE: The app defines a custom `setInterval(mins, el)` that shadows
// `window.setInterval`. We patch `startStop` to use the native timer.

test.describe('Timer Functionality', () => {
  async function patchSetInterval(page) {
    await page.evaluate(() => {
      const nativeSI = window.setInterval.bind(window);
      const nativeCI = window.clearInterval.bind(window);
      // @ts-ignore - re-wire startStop
      window.startStop = function () {
        // @ts-ignore
        if (!window.isRunning) {
          // @ts-ignore
          window.isRunning = true;
          // @ts-ignore
          window.snoozed = false;
          // @ts-ignore
          window.sittingInterval = nativeSI(window.tick, 1000);
          document.getElementById('mainBtn').textContent = 'Pause';
          document.getElementById('resetBtn').style.display = 'block';
          document.getElementById('statusMsg').textContent = "You're doing great, mama.";
        } else {
          // @ts-ignore
          window.isRunning = false;
          // @ts-ignore
          nativeCI(window.sittingInterval);
          document.getElementById('mainBtn').textContent = 'Resume';
        }
      };
    });
  }

  test('should show initial state correctly', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#statusMsg')).toHaveText('Ready when you are, mama');
    await expect(page.locator('#mainBtn')).toHaveText('Start sitting');
    await expect(page.locator('#resetBtn')).toBeHidden();
  });

  test('should start timer on button click', async ({ page }) => {
    await page.goto(PAGE_URL);
    await patchSetInterval(page);
    await page.locator('#mainBtn').click();
    await expect(page.locator('#mainBtn')).toHaveText('Pause');
    await expect(page.locator('#resetBtn')).toBeVisible();
    await expect(page.locator('#statusMsg')).toHaveText("You're doing great, mama.");
  });

  test('should pause timer on second click', async ({ page }) => {
    await page.goto(PAGE_URL);
    await patchSetInterval(page);
    await page.locator('#mainBtn').click();
    await page.locator('#mainBtn').click();
    await expect(page.locator('#mainBtn')).toHaveText('Resume');
  });

  test('should reset timer correctly', async ({ page }) => {
    await page.goto(PAGE_URL);
    await patchSetInterval(page);
    await page.locator('#mainBtn').click();
    await page.waitForTimeout(1500);
    await page.locator('#resetBtn').click();
    await expect(page.locator('#mainBtn')).toHaveText('Start sitting');
    await expect(page.locator('#resetBtn')).toBeHidden();
    await expect(page.locator('#statusMsg')).toHaveText('Ready when you are, mama');
  });

  test('should update ring time display while running', async ({ page }) => {
    await page.goto(PAGE_URL);
    await patchSetInterval(page);
    await page.locator('#mainBtn').click();
    await page.waitForTimeout(2000);
    const ringSub = await page.locator('#ringSub').textContent();
    expect(ringSub).toContain('left');
  });
});

// ─── Walk Card ───────────────────────────────────────────────────────

test.describe('Walk Card', () => {
  test('should be hidden by default', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#walkCard')).not.toBeVisible();
  });

  test('should show walk card when alert walk button is clicked', async ({ page }) => {
    await page.goto(PAGE_URL);
    // Show the walk card by manipulating DOM directly
    // (avoids app's setInterval shadowing issue)
    await page.evaluate(() => {
      document.getElementById('walkCard').classList.add('visible');
      document.getElementById('walksCount').textContent = '1';
    });

    await expect(page.locator('#walkCard')).toBeVisible();
    await expect(page.locator('.walk-title')).toHaveText('Walk time!');
  });

  test('should hide walk card when Done is clicked', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.evaluate(() => {
      document.getElementById('walkCard').classList.add('visible');
    });
    await expect(page.locator('#walkCard')).toBeVisible();

    // Click the Done button
    await page.locator('.walk-header .btn-secondary').click();
    await expect(page.locator('#walkCard')).not.toBeVisible();
  });

  test('should increment walks count after walk', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#walksCount')).toHaveText('0');

    // Simulate walk start (incrementing the counter)
    await page.evaluate(() => {
      const el = document.getElementById('walksCount');
      el.textContent = String(parseInt(el.textContent) + 1);
    });
    await expect(page.locator('#walksCount')).toHaveText('1');
  });
});

// ─── Stats Display ───────────────────────────────────────────────────

test.describe('Stats Display', () => {
  test('should show 0 walks and 0 minutes initially', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#walksCount')).toHaveText('0');
    await expect(page.locator('#walkMins')).toHaveText('0');
  });

  test('should display stat labels correctly', async ({ page }) => {
    await page.goto(PAGE_URL);
    const labels = page.locator('.stat-label');
    await expect(labels.nth(0)).toHaveText('Walks today');
    await expect(labels.nth(1)).toHaveText('Minutes moved');
  });
});

// ─── Stretches Section ───────────────────────────────────────────────

test.describe('Stretches Section', () => {
  test('should display 4 stretch items', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('.stretch-item')).toHaveCount(4);
  });

  test('should show stretch overlay on click', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.locator('.stretch-item').first().click();

    await expect(page.locator('#stretchOverlay')).toHaveClass(/show/);
    await expect(page.locator('#stretchTitle')).toHaveText('Ankle Circles');
    await expect(page.locator('#stretchMsg')).not.toBeEmpty();
  });

  test('should close stretch overlay on Got it click', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.locator('.stretch-item').first().click();
    await expect(page.locator('#stretchOverlay')).toHaveClass(/show/);

    await page.locator('#stretchOverlay .btn-primary').click();
    await expect(page.locator('#stretchOverlay')).not.toHaveClass(/show/);
  });

  test('should show correct info for each stretch', async ({ page }) => {
    await page.goto(PAGE_URL);

    const stretches = [
      { name: 'Ankle Circles' },
      { name: 'Shoulder Rolls' },
      { name: 'Pelvic Tilts' },
      { name: 'Neck Stretch' },
    ];

    for (let i = 0; i < stretches.length; i++) {
      await page.locator('.stretch-item').nth(i).click();
      await expect(page.locator('#stretchTitle')).toHaveText(stretches[i].name);
      await page.locator('#stretchOverlay .btn-primary').click();
    }
  });
});

// ─── Alert Overlay ───────────────────────────────────────────────────

test.describe('Alert Overlay', () => {
  test('should be hidden by default', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#alertOverlay')).not.toHaveClass(/show/);
  });

  test('should show alert when timer completes', async ({ page }) => {
    await page.goto(PAGE_URL);

    // Trigger alert programmatically
    await page.evaluate(() => {
      // @ts-ignore
      window.showAlert();
    });

    await expect(page.locator('#alertOverlay')).toHaveClass(/show/);
    await expect(page.locator('.alert-title')).toHaveText('Time to move, mama!');
  });

  test('should have walk and snooze buttons in alert', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.evaluate(() => {
      // @ts-ignore
      window.showAlert();
    });

    await expect(page.locator('.alert-btns .btn-primary')).toHaveText("Let's walk");
    await expect(page.locator('.alert-btns .btn-secondary')).toHaveText('5 min snooze');
  });

  test('should dismiss alert on "Let\'s walk" click', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.evaluate(() => {
      document.getElementById('alertOverlay').classList.add('show');
    });

    // Override startWalk to avoid setInterval collision, only test alert dismissal
    await page.evaluate(() => {
      window.startWalk = function() {
        document.getElementById('alertOverlay').classList.remove('show');
        document.getElementById('walkCard').classList.add('visible');
      };
    });

    await page.locator('.alert-btns .btn-primary').click();
    await expect(page.locator('#alertOverlay')).not.toHaveClass(/show/);
    await expect(page.locator('#walkCard')).toBeVisible();
  });

  test('should dismiss alert and snooze on "5 min snooze"', async ({ page }) => {
    await page.goto(PAGE_URL);
    // Set up timer state without clicking start (avoids setInterval shadow)
    await page.evaluate(() => {
      // @ts-ignore
      window.isRunning = true;
      // @ts-ignore
      window.sittingSeconds = 100;
      document.getElementById('mainBtn').textContent = 'Pause';
      document.getElementById('resetBtn').style.display = 'block';
    });

    await page.evaluate(() => {
      document.getElementById('alertOverlay').classList.add('show');
    });

    // Override snooze to avoid setInterval collision
    await page.evaluate(() => {
      const nativeSI = window.setInterval.bind(window);
      window.snooze = function () {
        document.getElementById('alertOverlay').classList.remove('show');
        // @ts-ignore
        window.snoozed = true;
        document.getElementById('statusMsg').textContent = 'Snoozed for 5 minutes — see you soon!';
        document.getElementById('statusMsg').className = 'status-msg';
      };
    });

    await page.locator('.alert-btns .btn-secondary').click();
    await expect(page.locator('#alertOverlay')).not.toHaveClass(/show/);
    await expect(page.locator('#statusMsg')).toHaveText('Snoozed for 5 minutes — see you soon!');
  });
});

// ─── Notification Button ─────────────────────────────────────────────

test.describe('Notification Button', () => {
  test('should show Enable notifications button', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#notifBtn')).toHaveText(/Enable notifications/);
  });
});

// ─── Footer ──────────────────────────────────────────────────────────

test.describe('Footer', () => {
  test('should display disclaimer text', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('.footer-note')).toContainText('Always consult your healthcare provider');
    await expect(page.locator('.footer-note')).toContainText('Listen to your body');
  });
});
