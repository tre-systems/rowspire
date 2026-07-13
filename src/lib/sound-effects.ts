type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

type Tone = readonly [frequency: number, duration: number, type?: OscillatorType, volume?: number];

export class SoundEffects {
  private audioContext: AudioContext | null = null;
  private enabled = true;
  private hasWarned = false;

  async unlock() {
    if (!this.enabled) return;
    await this.ensureAudioContext();
  }

  private getAudioContextConstructor() {
    if (typeof window === 'undefined') return null;

    const audioWindow = window as AudioWindow;
    return audioWindow.AudioContext ?? audioWindow.webkitAudioContext ?? null;
  }

  private createAudioContext() {
    if (this.audioContext) return this.audioContext;

    const AudioContextConstructor = this.getAudioContextConstructor();
    if (!AudioContextConstructor) return null;

    try {
      this.audioContext = new AudioContextConstructor();
      return this.audioContext;
    } catch (error) {
      this.warn('Web Audio API is not available:', error);
      return null;
    }
  }

  private warn(message: string, error: unknown) {
    if (this.hasWarned) return;

    console.warn(message, error);
    this.hasWarned = true;
  }

  private async ensureAudioContext() {
    const ctx = this.createAudioContext();
    if (!ctx) return null;

    if (ctx.state === 'closed') {
      this.audioContext = null;
      return this.createAudioContext();
    }

    if (ctx.state !== 'suspended') return ctx;

    try {
      await ctx.resume();
      return ctx;
    } catch (error) {
      this.warn('Unable to unlock audio:', error);
      return null;
    }
  }

  private async playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.1,
  ) {
    if (!this.enabled) return;

    const ctx = await this.ensureAudioContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      this.warn('Unable to play sound:', error);
    }
  }

  async pieceMove() {
    await this.playTone(523.25, 0.2, 'sine', 0.08);
  }

  private scheduleTones(tones: readonly Tone[], interval: number, initialDelay = 0) {
    if (!this.enabled) return;

    tones.forEach(([frequency, duration, type = 'sine', volume = 0.1], index) => {
      setTimeout(
        () => void this.playTone(frequency, duration, type, volume),
        initialDelay + index * interval,
      );
    });
  }

  gameWin() {
    this.scheduleTones(
      [523.25, 659.25, 783.99, 1046.5].map(frequency => [frequency, 0.3] as Tone),
      200,
    );
  }

  winAnimation() {
    const melody = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].map(
      (frequency, index) =>
        [frequency, index < 3 ? 0.2 : index < 5 ? 0.3 : 0.4, 'sine', 0.08 + index * 0.02] as Tone,
    );
    const sparkle = Array.from(
      { length: 8 },
      () => [800 + Math.random() * 400, 0.1, 'triangle', 0.03] as Tone,
    );

    this.scheduleTones(melody, 150);
    this.scheduleTones(sparkle, 100, 900);
  }

  gameLoss() {
    this.scheduleTones(
      [523.25, 493.88, 440, 392].map(frequency => [frequency, 0.4, 'sine', 0.08] as Tone),
      150,
    );
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  get isEnabled() {
    return this.enabled;
  }
}

export const soundEffects = new SoundEffects();
