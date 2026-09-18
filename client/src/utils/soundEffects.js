class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.activeNodes = new Set();
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  trackNode(node) {
    if (!node) return node;
    this.activeNodes.add(node);
    const prevOnEnded = node.onended;
    node.onended = (ev) => {
      this.activeNodes.delete(node);
      if (prevOnEnded) prevOnEnded(ev);
    };
    return node;
  }

  stopAll() {
    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.activeNodes.clear();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopAll();
    }
    return this.muted;
  }

  playWolfHowl() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Deep Guttural Throat Rumble (The predator awakening)
      const rumbleOsc = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumbleOsc.type = 'triangle';
      rumbleOsc.frequency.setValueAtTime(85, now);
      rumbleOsc.frequency.exponentialRampToValueAtTime(140, now + 0.5);
      rumbleOsc.frequency.exponentialRampToValueAtTime(60, now + 2.2);
      rumbleGain.gain.setValueAtTime(0.01, now);
      rumbleGain.gain.linearRampToValueAtTime(0.22, now + 0.3);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      // 2. Main Piercing Wolf Vocal Chords (Dual detuned saw/sine oscillators)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const mainGain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      // Pitch sweep: Low throat growl (140Hz) -> Menacing Rise (490Hz) -> Prolonged mournful howl -> Eerie descent
      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.exponentialRampToValueAtTime(320, now + 0.4);
      osc1.frequency.exponentialRampToValueAtTime(490, now + 1.1);
      osc1.frequency.linearRampToValueAtTime(460, now + 2.0);
      osc1.frequency.exponentialRampToValueAtTime(180, now + 3.4);

      osc2.frequency.setValueAtTime(142, now);
      osc2.frequency.exponentialRampToValueAtTime(324, now + 0.4);
      osc2.frequency.exponentialRampToValueAtTime(495, now + 1.1);
      osc2.frequency.linearRampToValueAtTime(464, now + 2.0);
      osc2.frequency.exponentialRampToValueAtTime(182, now + 3.4);

      // Eerie vibrato LFO (5.2Hz waver)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.2, now);
      lfoGain.gain.setValueAtTime(0, now);
      lfoGain.gain.linearRampToValueAtTime(12, now + 0.8);
      lfoGain.gain.linearRampToValueAtTime(4, now + 2.8);
      lfo.connect(osc1.frequency);
      lfo.connect(osc2.frequency);
      lfo.start(now);
      lfo.stop(now + 3.5);

      // Formant Bandpass Filter (Simulating wolf vocal tract acoustic resonance)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3.2, now);
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(820, now + 1.0);
      filter.frequency.exponentialRampToValueAtTime(400, now + 3.2);

      // Lowpass filter for natural acoustic body
      const darkFilter = this.ctx.createBiquadFilter();
      darkFilter.type = 'lowpass';
      darkFilter.frequency.setValueAtTime(1600, now);

      mainGain.gain.setValueAtTime(0.01, now);
      mainGain.gain.linearRampToValueAtTime(0.35, now + 0.7);
      mainGain.gain.setValueAtTime(0.3, now + 1.8);
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(darkFilter);
      darkFilter.connect(mainGain);
      mainGain.connect(this.ctx.destination);

      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(this.ctx.destination);

      // 3. Icy mountain wind breath behind the howl
      const bufferSize = this.ctx.sampleRate * 2.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.08;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(400, now);
      noiseFilter.frequency.linearRampToValueAtTime(700, now + 1.2);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.6);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      this.trackNode(noise);
      this.trackNode(rumbleOsc);
      this.trackNode(osc1);
      this.trackNode(osc2);
      this.trackNode(lfo);

      noise.start(now);
      noise.stop(now + 2.2);

      rumbleOsc.start(now);
      rumbleOsc.stop(now + 2.0);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.5);
      osc2.stop(now + 2.5);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playMorningChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.18);

        gain.gain.setValueAtTime(0.15, now + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 1.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 1.6);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playGavel() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playGhostWhisper() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Shimmering mystical tones
      [880, 920, 830].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq + (idx % 2 === 0 ? 30 : -30), now + 1.8);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 2.1);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playHeartbeat() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [0, 0.22].forEach((offset) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(70, now + offset);
        osc.frequency.exponentialRampToValueAtTime(30, now + offset + 0.15);

        gain.gain.setValueAtTime(0.25, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.17);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playCardFlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // 1. Crisp card whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);

      // 2. Soft mystical chime ring
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'triangle';
      chimeOsc.frequency.setValueAtTime(987.77, now + 0.08);
      chimeGain.gain.setValueAtTime(0.08, now + 0.08);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chimeOsc.start(now + 0.08);
      chimeOsc.stop(now + 0.58);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playGunshot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // White noise blast for gunshot crack
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.3);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      // Low end boom
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);
      oscGain.gain.setValueAtTime(0.5, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playPotion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Bubbling frequencies
      [300, 450, 600, 750].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.6, now + idx * 0.08 + 0.12);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.16);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playHaunt() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(80, now + 1.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.5);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playShield() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [587.33, 880, 1174.66, 1760].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.12, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 1.3);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playBite() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
}

export const sounds = new SoundManager();
