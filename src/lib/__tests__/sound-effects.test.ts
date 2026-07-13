import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SoundEffects } from '../sound-effects';

function createAudioContextMock(state: AudioContextState = 'running') {
  const oscillator = {
    connect: vi.fn(),
    frequency: { value: 0 },
    type: 'sine' as OscillatorType,
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  };
  const context = {
    state,
    currentTime: 1,
    destination: {},
    resume: vi.fn(async () => {
      context.state = 'running';
    }),
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
  };
  const constructor = vi.fn(function AudioContextMock() {
    return context;
  });

  return { constructor, context, oscillator };
}

function setAudioConstructors(audioContext?: unknown, webkitAudioContext?: unknown) {
  Object.defineProperty(window, 'AudioContext', { configurable: true, value: audioContext });
  Object.defineProperty(window, 'webkitAudioContext', {
    configurable: true,
    value: webkitAudioContext,
  });
}

describe('SoundEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAudioConstructors();
  });

  afterEach(() => {
    vi.useRealTimers();
    setAudioConstructors();
  });

  it('controls its enabled state', () => {
    const effects = new SoundEffects();

    expect(effects.isEnabled).toBe(true);
    expect(effects.toggle()).toBe(false);
    expect(effects.isEnabled).toBe(false);
    effects.setEnabled(true);
    expect(effects.isEnabled).toBe(true);
  });

  it('creates audio lazily and plays a move tone', async () => {
    const audio = createAudioContextMock();
    const effects = new SoundEffects();
    setAudioConstructors(audio.constructor);

    expect(audio.constructor).not.toHaveBeenCalled();
    await effects.pieceMove();

    expect(audio.constructor).toHaveBeenCalledOnce();
    expect(audio.context.createOscillator).toHaveBeenCalledOnce();
    expect(audio.oscillator.frequency.value).toBe(523.25);
    expect(audio.oscillator.start).toHaveBeenCalledWith(1);
  });

  it('does not create audio while disabled', async () => {
    const audio = createAudioContextMock();
    const effects = new SoundEffects();
    setAudioConstructors(audio.constructor);
    effects.setEnabled(false);

    await effects.pieceMove();
    await effects.unlock();
    effects.gameWin();

    expect(audio.constructor).not.toHaveBeenCalled();
  });

  it('resumes a suspended context when unlocked', async () => {
    const audio = createAudioContextMock('suspended');
    const effects = new SoundEffects();
    setAudioConstructors(audio.constructor);

    await effects.unlock();

    expect(audio.context.resume).toHaveBeenCalledOnce();
  });

  it('recreates a closed context', async () => {
    const audio = createAudioContextMock('closed');
    const effects = new SoundEffects();
    setAudioConstructors(audio.constructor);

    await effects.unlock();

    expect(audio.constructor).toHaveBeenCalledTimes(2);
  });

  it('supports the prefixed WebKit constructor', async () => {
    const audio = createAudioContextMock();
    const effects = new SoundEffects();
    setAudioConstructors(undefined, audio.constructor);

    await effects.pieceMove();

    expect(audio.constructor).toHaveBeenCalledOnce();
  });

  it('handles unavailable and failing audio contexts', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const unavailable = new SoundEffects();
    await expect(unavailable.pieceMove()).resolves.toBeUndefined();

    const constructor = vi.fn(() => {
      throw new Error('Unavailable');
    });
    setAudioConstructors(constructor);

    await expect(new SoundEffects().pieceMove()).resolves.toBeUndefined();
    expect(constructor).toHaveBeenCalledOnce();
    expect(warning).toHaveBeenCalledWith('Web Audio API is not available:', expect.any(Error));
    warning.mockRestore();
  });

  it('schedules complete win and loss sequences', async () => {
    vi.useFakeTimers();
    const audio = createAudioContextMock();
    const effects = new SoundEffects();
    setAudioConstructors(audio.constructor);

    effects.gameWin();
    effects.gameLoss();
    effects.winAnimation();
    await vi.runAllTimersAsync();

    expect(audio.oscillator.start).toHaveBeenCalledTimes(22);
  });
});
