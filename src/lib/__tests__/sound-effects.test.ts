import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SoundEffects, soundEffects } from '../sound-effects';

function createAudioContextMock(state: AudioContextState = 'running') {
  const oscillator = {
    connect: vi.fn(),
    frequency: { value: 0 },
    type: 'sine' as OscillatorType,
    start: vi.fn(),
    stop: vi.fn(),
  };

  const gainNode = {
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
    createGain: vi.fn(() => gainNode),
  };

  const constructor = vi.fn(function AudioContextMock() {
    return context;
  });

  return {
    constructor,
    context,
    oscillator,
  };
}

function setAudioConstructors(
  audioContext: unknown = undefined,
  webkitAudioContext: unknown = undefined,
) {
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    value: audioContext,
  });

  Object.defineProperty(window, 'webkitAudioContext', {
    configurable: true,
    value: webkitAudioContext,
  });
}

describe('SoundEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    soundEffects.setEnabled(true);
    setAudioConstructors();
  });

  afterEach(() => {
    vi.clearAllMocks();
    soundEffects.setEnabled(true);
    setAudioConstructors();
  });

  describe('enabled state', () => {
    it('should start with sound enabled', () => {
      expect(soundEffects.isEnabled).toBe(true);
    });

    it('should toggle enabled state', () => {
      expect(soundEffects.toggle()).toBe(false);
      expect(soundEffects.isEnabled).toBe(false);

      expect(soundEffects.toggle()).toBe(true);
      expect(soundEffects.isEnabled).toBe(true);
    });

    it('should set enabled state', () => {
      soundEffects.setEnabled(false);
      expect(soundEffects.isEnabled).toBe(false);

      soundEffects.setEnabled(true);
      expect(soundEffects.isEnabled).toBe(true);
    });
  });

  describe('sound methods', () => {
    it('should have all required sound methods', () => {
      expect(typeof soundEffects.columnSelect).toBe('function');
      expect(typeof soundEffects.pieceMove).toBe('function');
      expect(typeof soundEffects.specialLanding).toBe('function');
      expect(typeof soundEffects.gameWin).toBe('function');
      expect(typeof soundEffects.gameLoss).toBe('function');
      expect(typeof soundEffects.aiThinking).toBe('function');
      expect(typeof soundEffects.buttonClick).toBe('function');
    });

    it('should return promises from sound methods', async () => {
      const promises = [
        soundEffects.columnSelect(),
        soundEffects.pieceMove(),
        soundEffects.specialLanding(),
        soundEffects.gameWin(),
        soundEffects.gameLoss(),
        soundEffects.aiThinking(),
        soundEffects.buttonClick(),
      ];

      promises.forEach(promise => {
        expect(promise).toBeInstanceOf(Promise);
      });

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('should not play sounds when disabled', async () => {
      soundEffects.setEnabled(false);

      await expect(soundEffects.pieceMove()).resolves.toBeUndefined();
      await expect(soundEffects.columnSelect()).resolves.toBeUndefined();
      await expect(soundEffects.buttonClick()).resolves.toBeUndefined();
    });

    it('does not create an audio context when disabled', async () => {
      const mockAudio = createAudioContextMock();
      const effects = new SoundEffects();

      setAudioConstructors(mockAudio.constructor);
      effects.setEnabled(false);

      await effects.pieceMove();

      expect(mockAudio.constructor).not.toHaveBeenCalled();
    });
  });

  describe('browser environment handling', () => {
    it('should handle missing AudioContext gracefully', async () => {
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', { value: {}, writable: true });

      await expect(soundEffects.pieceMove()).resolves.toBeUndefined();

      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
      });
    });

    it('should handle AudioContext errors gracefully', async () => {
      const mockAudioContext = vi.fn(function AudioContextMock() {
        throw new Error('AudioContext not supported');
      });

      setAudioConstructors(mockAudioContext);

      await expect(soundEffects.pieceMove()).resolves.toBeUndefined();

      expect(mockAudioContext).toHaveBeenCalled();
    });

    it('creates the audio context lazily when a sound plays', async () => {
      const mockAudio = createAudioContextMock();
      const effects = new SoundEffects();

      setAudioConstructors(mockAudio.constructor);

      expect(mockAudio.constructor).not.toHaveBeenCalled();

      await effects.pieceMove();

      expect(mockAudio.constructor).toHaveBeenCalledOnce();
      expect(mockAudio.context.createOscillator).toHaveBeenCalledOnce();
      expect(mockAudio.oscillator.start).toHaveBeenCalledWith(1);
    });

    it('supports WebKit audio contexts', async () => {
      const mockAudio = createAudioContextMock();
      const effects = new SoundEffects();

      setAudioConstructors(undefined, mockAudio.constructor);

      await effects.pieceMove();

      expect(mockAudio.constructor).toHaveBeenCalledOnce();
    });
  });

  describe('audio context state management', () => {
    it('should handle suspended audio context', async () => {
      const mockAudio = createAudioContextMock('suspended');
      const effects = new SoundEffects();

      setAudioConstructors(mockAudio.constructor);

      await expect(effects.unlock()).resolves.toBeUndefined();

      expect(mockAudio.context.resume).toHaveBeenCalledOnce();
    });
  });

  describe('sound effect timing', () => {
    it('should handle setTimeout calls in sound effects', async () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      await soundEffects.columnSelect();

      expect(setTimeoutSpy).toHaveBeenCalled();

      setTimeoutSpy.mockRestore();
    });
  });
});
