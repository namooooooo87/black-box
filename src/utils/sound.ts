class SoundManager {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  public playInteract() {
    this.playTone(587.33, 0.09, 'triangle', 0.07, 0);
    this.playTone(880, 0.12, 'sine', 0.07, 0.06);
  }

  public playHint() {
    this.playTone(523.25, 0.1, 'sine', 0.06, 0);
    this.playTone(659.25, 0.14, 'sine', 0.06, 0.07);
  }

  public playWrong() {
    this.playTone(220, 0.14, 'sawtooth', 0.05, 0);
    this.playTone(185, 0.18, 'sawtooth', 0.05, 0.1);
  }

  public playSolved() {
    this.playTone(523.25, 0.12, 'triangle', 0.08, 0);
    this.playTone(659.25, 0.12, 'triangle', 0.08, 0.09);
    this.playTone(783.99, 0.14, 'triangle', 0.09, 0.18);
    this.playTone(1046.5, 0.28, 'sine', 0.09, 0.27);
  }

  public playDoorUnlock() {
    this.playTone(330, 0.14, 'triangle', 0.07, 0);
    this.playTone(440, 0.16, 'triangle', 0.07, 0.1);
    this.playTone(659.25, 0.25, 'sine', 0.08, 0.2);
  }

  public playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.35, 'triangle', 0.08, idx * 0.1);
    });
  }
}

export const soundFX = new SoundManager();
