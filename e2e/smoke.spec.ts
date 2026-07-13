import { test, expect, type Page } from '@playwright/test';

async function expectNoError(page: Page) {
  await expect(page.getByTestId('error-modal')).not.toBeVisible();
}

async function startGame(page: Page) {
  await page.goto('/');

  const aiSelectionPanel = page.getByTestId('ai-selection-search');
  if (await aiSelectionPanel.isVisible()) {
    await aiSelectionPanel.click();
  }

  await expect(page.getByTestId('game-board')).toBeVisible();
  await expectNoError(page);
  await expect(page.getByTestId('column-3')).toBeEnabled({ timeout: 15_000 });
}

async function playColumn(page: Page, column: number) {
  const target = page.getByTestId(`column-${column}`);
  const pieces = page.locator(`[data-testid^="piece-${column}-"]`);
  await expect(target).toBeEnabled({ timeout: 15_000 });
  const initialPieceCount = await pieces.count();
  await target.click();
  await expect.poll(() => pieces.count()).toBeGreaterThan(initialPieceCount);
  await expectNoError(page);
}

test.describe('Core Game Functionality', () => {
  test('can start a game and see initial state', async ({ page }) => {
    await startGame(page);
    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rowspire' })).toBeVisible();
    await expect(page.getByText('Drop counters. Plan ahead. Make four in a row.')).toBeVisible();
  });

  test('loads WebAssembly under the production security policy', async ({ page }) => {
    const initializationFailures: string[] = [];
    page.on('console', message => {
      if (message.text().includes('Failed to initialize WASM AI')) {
        initializationFailures.push(message.text());
      }
    });

    const response = await page.goto('/');
    await page.getByTestId('ai-selection-search').click();
    await expect(page.getByTestId('column-3')).toBeEnabled({ timeout: 20_000 });

    expect(response?.headers()['content-security-policy']).toContain("'wasm-unsafe-eval'");
    expect(initializationFailures).toEqual([]);
  });

  test('runs the ML strategy through the shared worker', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('ai-selection-ml').click();
    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByTestId('column-3')).toBeEnabled({ timeout: 20_000 });

    const pieces = page.locator('[data-testid^="piece-"]');
    const initialPieceCount = await pieces.count();
    await page.getByTestId('column-3').click();

    await expect
      .poll(() => pieces.count(), { timeout: 20_000 })
      .toBeGreaterThanOrEqual(initialPieceCount + 2);
    await expectNoError(page);
  });

  test('serves the offline fallback route', async ({ page }) => {
    await page.goto('/offline');

    await expect(page.getByTestId('offline-page')).toBeVisible();
    await expect(page.getByTestId('offline-retry')).toBeVisible();
  });
});

test.describe('Game Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await startGame(page);
  });

  test('can click on board columns', async ({ page }) => {
    const gameBoard = page.getByTestId('game-board');
    await expect(gameBoard).toBeVisible();

    await playColumn(page, 3);

    await expect(gameBoard).toBeVisible();
  });

  test('can make a move by clicking on a column', async ({ page }) => {
    await playColumn(page, 3);

    await expect(page.getByTestId('game-status-text')).not.toBeEmpty();
  });

  test('can toggle sound settings', async ({ page }) => {
    const soundToggle = page.getByTestId('toggle-sound');
    await expect(soundToggle).toBeVisible();

    await soundToggle.click();

    await expect(soundToggle).toBeVisible();
  });

  test('can open and close help panel', async ({ page }) => {
    await page.getByTestId('how-to-play').click();
    await expect(page.getByTestId('help-panel')).toBeVisible();
    await expect(page.getByTestId('help-close')).toBeVisible();

    await page.getByTestId('help-close').click();
    await expect(page.getByTestId('help-panel')).not.toBeVisible();
  });
});

test.describe('Game Lifecycle', () => {
  test('can make moves and see game state changes', async ({ page }) => {
    await startGame(page);

    await playColumn(page, 3);
    await playColumn(page, 2);

    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByTestId('game-status-text')).not.toBeEmpty();
  });

  test('can reset game', async ({ page }) => {
    await startGame(page);

    await playColumn(page, 3);

    await page.getByTestId('reset-game').click();

    await expect(page.getByTestId('ai-selection-search')).toBeVisible();

    await page.getByTestId('ai-selection-search').click();

    await expect(page.getByTestId('game-board')).toBeVisible();
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test('handles rapid column clicks gracefully', async ({ page }) => {
    await startGame(page);
    const pieces = page.locator('[data-testid^="piece-"]');
    const initialPieceCount = await pieces.count();

    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`column-${i}`).dispatchEvent('click');
    }

    await expect.poll(() => pieces.count()).toBeGreaterThan(initialPieceCount);
    await expectNoError(page);

    await expect(page.getByTestId('game-board')).toBeVisible();
  });

  test('maintains game state during navigation', async ({ page }) => {
    await startGame(page);

    await playColumn(page, 3);
    const pieces = page.locator('[data-testid^="piece-3-"]');
    const pieceCount = await pieces.count();

    await page.goto('/');

    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect.poll(() => pieces.count()).toBeGreaterThanOrEqual(pieceCount);
  });

  test('restores the game and AI runtime offline', async ({ page, context }) => {
    await startGame(page);
    await playColumn(page, 3);
    await page.evaluate(async () => void (await navigator.serviceWorker.ready));
    await page.reload();

    await context.setOffline(true);
    try {
      await page.reload();

      const pieces = page.locator('[data-testid^="piece-"]');
      const pieceCount = await pieces.count();
      await playColumn(page, 2);
      await expect.poll(() => pieces.count()).toBeGreaterThanOrEqual(pieceCount + 2);
    } finally {
      await context.setOffline(false);
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('game is fully functional on mobile', async ({ page }) => {
    await startGame(page);

    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByTestId('toggle-sound')).toBeVisible();
    await expect(page.getByTestId('how-to-play')).toBeVisible();

    await playColumn(page, 3);
    await expect(page.getByTestId('game-board')).toBeVisible();
  });
});

test.describe('Motion Accessibility', () => {
  test('keeps ambient motion static while preserving gameplay', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const background = page.getByTestId('animated-background');
    await expect(background).toBeVisible();

    const firstFrame = await background.evaluate(canvas =>
      (canvas as HTMLCanvasElement).toDataURL(),
    );
    await page.waitForTimeout(150);
    const secondFrame = await background.evaluate(canvas =>
      (canvas as HTMLCanvasElement).toDataURL(),
    );

    expect(secondFrame).toBe(firstFrame);
    await page.getByTestId('ai-selection-search').click();
    await expect(page.getByTestId('game-board')).toBeVisible();
  });
});
