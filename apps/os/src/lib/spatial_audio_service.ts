class SpatialAudioService {
  private context: AudioContext | null = null;
  private ambientOscillator: OscillatorNode | null = null;

  init() {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("SpatialAudioService: AudioContext not supported.");
    }
  }

  playAmbientHum(intensity: number = 0.5) {
    if (!this.context) return;
    if (this.ambientOscillator) this.ambientOscillator.stop();

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(40 + (intensity * 10), this.context.currentTime);
    gain.gain.setValueAtTime(0.005 * intensity, this.context.currentTime);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    this.ambientOscillator = osc;
  }

  playActivityPing() {
    if (!this.context) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.context.currentTime + 0.5);

    gain.gain.setValueAtTime(0.02, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + 0.5);
  }
}

export const spatialAudio = new SpatialAudioService();
