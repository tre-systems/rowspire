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

async function seedHorizontalWin(page: Page) {
  const emptyColumn = [null, null, null, null, null, null];
  const gameState = {
    board: [
      [...emptyColumn.slice(0, 5), 'player1'],
      [...emptyColumn.slice(0, 5), 'player1'],
      [...emptyColumn.slice(0, 5), 'player1'],
      [...emptyColumn.slice(0, 5), 'player1'],
      emptyColumn,
      [...emptyColumn.slice(0, 5), 'player2'],
      [...emptyColumn.slice(0, 4), 'player2', 'player2'],
    ],
    currentPlayer: 'player1',
    gameStatus: 'finished',
    winner: 'player1',
    history: [
      { player: 'player1', column: 0, row: 5 },
      { player: 'player2', column: 6, row: 5 },
      { player: 'player1', column: 1, row: 5 },
      { player: 'player2', column: 6, row: 4 },
      { player: 'player1', column: 2, row: 5 },
      { player: 'player2', column: 5, row: 5 },
      { player: 'player1', column: 3, row: 5 },
    ],
    winningLine: {
      positions: [0, 1, 2, 3].map(column => ({ column, row: 5 })),
      direction: 'horizontal',
    },
  };

  await page.goto('/');
  await page.evaluate(state => {
    localStorage.setItem(
      'rowspire-game-storage',
      JSON.stringify({
        state: {
          gameState: state,
          selectedAI: 'search',
          player1AI: 'search',
          player2AI: 'search',
          difficulty: 'relaxed',
          gameMode: 'human-vs-ai',
        },
        version: 5,
      }),
    );
  }, gameState);
  await page.reload();
}

test.describe('Core Game Functionality', () => {
  test('presents a clear opponent and difficulty choice', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Choose your opponent' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Tactician' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Neural Challenger' })).toBeVisible();
    await expect(page.getByText('Plans ahead and plays a precise, tactical game.')).toBeVisible();
    await expect(page.getByText('Plays a more varied, less predictable game.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play the Tactician' })).toHaveText('Play');
    await expect(page.getByRole('button', { name: 'Play the Neural Challenger' })).toHaveText(
      'Play',
    );
    await expect(page.getByTestId('ko-fi-link-floating')).toContainText('Support Rowspire');
    await expect(page.getByTestId('difficulty-relaxed')).toHaveAttribute('aria-pressed', 'true');

    await page.getByTestId('difficulty-standard').click();
    await expect(page.getByTestId('difficulty-standard')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('difficulty-description')).toContainText('A fair challenge');

    await page.reload();
    await expect(page.getByTestId('difficulty-standard')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('How it works', { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('difficulty-technical-details')).toHaveCount(0);
  });

  test('opens substantial technical details and restores focus', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('difficulty-standard').click();

    const searchInfo = page.getByTestId('ai-info-search');
    await searchInfo.click();
    const searchDialog = page.getByRole('dialog', { name: 'How The Tactician thinks' });
    await expect(searchDialog).toBeVisible();
    await expect(searchDialog).toContainText('Negamax search');
    await expect(searchDialog).toContainText('alpha–beta pruning');
    await expect(searchDialog).toContainText('2 ply');
    await expect(searchDialog).toContainText('6 ply');
    await expect(searchDialog).toContainText('14 ply');
    await expect(searchDialog.locator('tr.is-selected')).toContainText('Standard');
    expect(await searchDialog.evaluate(dialog => dialog.contains(document.activeElement))).toBe(
      true,
    );

    await page.keyboard.press('Escape');
    await expect(searchDialog).not.toBeVisible();
    await expect(searchInfo).toBeFocused();

    const mlInfo = page.getByTestId('ai-info-ml');
    await mlInfo.click();
    const mlDialog = page.getByRole('dialog', { name: 'How The Neural Challenger thinks' });
    await expect(mlDialog).toContainText('policy network');
    await expect(mlDialog).toContainText('value network');
    await expect(mlDialog).toContainText('Monte Carlo tree search');
    await expect(mlDialog).toContainText('500,000');
    await expect(mlDialog).toContainText('4,000 simulations');
    await page.getByTestId('opponent-details-close').click();
    await expect(mlDialog).not.toBeVisible();
    await expect(mlInfo).toBeFocused();
  });

  test('can start a game and see initial state', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('difficulty-standard').click();
    await page.getByTestId('ai-selection-search').click();
    await expect(page.getByRole('heading', { name: 'Rowspire' })).toBeVisible();
    await expect(page.getByText('Drop counters. Plan ahead. Make four in a row.')).toBeVisible();
    await expect(page.getByTestId('game-status-matchup')).toContainText('Standard · Tactician');
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

    const headers = response?.headers() ?? {};
    expect(headers['content-security-policy']).toContain("'wasm-unsafe-eval'");
    expect(headers['content-security-policy']).toContain("script-src-attr 'none'");
    expect(headers['content-security-policy']).toContain("form-action 'none'");
    expect(headers['content-security-policy']).toContain("worker-src 'self'");
    expect(headers['strict-transport-security']).toBe('max-age=31536000');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(initializationFailures).toEqual([]);
  });

  test('runs the ML strategy through the shared worker', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('difficulty-standard').click();
    await page.getByTestId('ai-selection-ml').click();
    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect(page.getByTestId('game-status-matchup')).toContainText(
      'Standard · Neural challenger',
    );
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

  test('can toggle sound settings', async ({ page }) => {
    const soundToggle = page.getByTestId('toggle-sound');
    await expect(soundToggle).toHaveAccessibleName('Mute sound');

    await soundToggle.click();

    await expect(soundToggle).toHaveAccessibleName('Unmute sound');
  });

  test('can open and close help panel', async ({ page }) => {
    await page.getByTestId('how-to-play').click();
    await expect(page.getByTestId('help-panel')).toBeVisible();
    await expect(page.getByTestId('help-close')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Play smarter' })).toBeVisible();

    await page.getByTestId('help-close').click();
    await expect(page.getByTestId('help-panel')).not.toBeVisible();
  });
});

test.describe('Game Lifecycle', () => {
  test('makes the exact winning line prominent before showing the result', async ({ page }) => {
    await seedHorizontalWin(page);

    await expect(page.getByTestId('winning-line-reveal')).toBeVisible();
    await expect(page.getByTestId('winning-line-beam')).toHaveCount(1);
    await expect(page.locator('[data-winning="true"]')).toHaveCount(4);
    await expect(page.locator('[data-dimmed="true"]')).toHaveCount(3);
    await expect(page.getByTestId('game-completion-overlay')).not.toBeVisible();

    await expect(page.getByTestId('game-completion-overlay')).toBeVisible({ timeout: 4_000 });
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
    await page.goto('/');
    await expect(page.getByTestId('difficulty-relaxed')).toBeVisible();
    await page.getByTestId('difficulty-expert').click();
    await expect(page.getByTestId('difficulty-expert')).toHaveAttribute('aria-pressed', 'true');

    const info = page.getByTestId('ai-info-search');
    await info.click();
    const dialog = page.getByRole('dialog', { name: 'How The Tactician thinks' });
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('opponent-details-close')).toBeVisible();
    await page.getByTestId('opponent-details-close').click();
    await expect(info).toBeFocused();

    await page.getByTestId('ai-selection-search').click();

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
