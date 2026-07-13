import { test, expect, type Page } from '@playwright/test';

async function installAudioMock(page: Page) {
  await page.addInitScript(() => {
    type AudioTestWindow = Window & { __rowspireAudioStarts?: number };
    const audioWindow = window as AudioTestWindow;

    class MockOscillator {
      frequency = { value: 0 };
      type: OscillatorType = 'sine';

      connect() {}

      start() {
        audioWindow.__rowspireAudioStarts = (audioWindow.__rowspireAudioStarts ?? 0) + 1;
      }

      stop() {}
    }

    class MockGain {
      gain = {
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        exponentialRampToValueAtTime() {},
      };

      connect() {}
    }

    class MockAudioContext {
      state: AudioContextState = 'suspended';
      currentTime = 0;
      destination = {};

      async resume() {
        this.state = 'running';
      }

      createOscillator() {
        return new MockOscillator();
      }

      createGain() {
        return new MockGain();
      }
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: MockAudioContext,
    });
  });
}

async function audioStarts(page: Page) {
  try {
    return await page.evaluate(
      () => (window as Window & { __rowspireAudioStarts?: number }).__rowspireAudioStarts ?? 0,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Execution context was destroyed'))
      return 0;

    throw error;
  }
}

async function resetAudioStarts(page: Page) {
  await page.evaluate(() => {
    (window as Window & { __rowspireAudioStarts?: number }).__rowspireAudioStarts = 0;
  });
}

test.describe('Audio', () => {
  test('plays move sounds while watching AI vs AI', async ({ page }) => {
    await installAudioMock(page);

    await page.goto('/');
    await page.getByTestId('ai-vs-ai-button').click();
    await expect(page.getByTestId('game-board')).toBeVisible();

    await expect.poll(() => audioStarts(page), { timeout: 15_000 }).toBeGreaterThan(0);
  });

  test('plays move sounds for human moves in single player', async ({ page }) => {
    await installAudioMock(page);

    await page.goto('/');
    await page.getByTestId('ai-selection-search').click();
    await expect(page.getByTestId('game-board')).toBeVisible();
    await expect
      .poll(() => page.getByTestId('game-status-text').innerText(), { timeout: 15_000 })
      .toBe("Your turn — you're Teal");

    await resetAudioStarts(page);
    await page.getByTestId('column-3').click();

    await expect.poll(() => audioStarts(page), { timeout: 5_000 }).toBeGreaterThan(0);
  });
});
