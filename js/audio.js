const AudioSystem = {
    ctx: null,
    isMusicPlaying: false,

    init() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        document.body.addEventListener('click', () => {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
                this.startOceanWind();
            }
        }, { once: true });
    },

    update(deltaTime) {
        if (!this.ctx || this.ctx.state === 'suspended') return;
        if (Math.random() < 0.001) this.playSeagull();
        if (!this.isMusicPlaying && Math.random() < 0.0005) this.playRandomMusic();
    },

    startOceanWind() {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300; 
        const gain = this.ctx.createGain();
        gain.gain.value = 0.5;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    },

    playSeagull() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },

    playRandomMusic() {
        this.isMusicPlaying = true;
        const notes = [261.63, 293.66, 329.63, 392.00, 440.00]; 
        let startTime = this.ctx.currentTime;
        for (let i = 0; i < 8; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
            gain.gain.setValueAtTime(0, startTime + i * 1);
            gain.gain.linearRampToValueAtTime(0.1, startTime + i * 1 + 0.2);
            gain.gain.linearRampToValueAtTime(0, startTime + i * 1 + 0.8);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(startTime + i * 1);
            osc.stop(startTime + i * 1 + 1);
        }
        setTimeout(() => { this.isMusicPlaying = false; }, 8000);
    }
};