/**
 * SoundTx.js
 * Browser-native synthesized audio for tactical feedback.
 * No external files required.
 */

class SoundTx {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled) return;
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type; // sine, square, sawtooth, triangle
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // High-pitched "chirp" for new data
    playAlert() {
        this.playTone(1200, 'sine', 0.1, 0.05);
        setTimeout(() => this.playTone(1800, 'sine', 0.1, 0.05), 100);
    }

    // Low "thud" or "click" for UI interaction
    playClick() {
        this.playTone(400, 'square', 0.05, 0.02);
    }

    // Success "trill"
    playSuccess() {
        this.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.1, 0.1), 100);
        setTimeout(() => this.playTone(1200, 'sine', 0.2, 0.1), 200);
    }

    // Error "buzz"
    playError() {
        this.playTone(150, 'sawtooth', 0.3, 0.1);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.3, 0.1), 150);
    }
}

export default new SoundTx();
