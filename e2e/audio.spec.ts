import { test, expect } from '@playwright/test';

test.describe('Audio', () => {
  test('plays move sounds while watching AI vs AI', async ({ page }) => {
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

    await page.goto('/');
    await page.getByTestId('ai-vs-ai-button').click();
    await expect(page.getByTestId('game-board')).toBeVisible();

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              (window as Window & { __rowspireAudioStarts?: number }).__rowspireAudioStarts ?? 0,
          ),
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);
  });
});
