const AudioSys = {
    ctx: null,
    apiBase: "https://minecraftsounds.com/api/sounds/",
    enabled: true,
    volume: 1,
    init() {
        if(!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    play(type) {
        if(!this.enabled) return;
        this.init();
        if(this.ctx.state === 'suspended') this.ctx.resume();
        try {
            this.playSynthFallback(type);
        } catch(e) {
            this.playSynthFallback(type);
        }
    },
    playSynthFallback(type) {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        let vol = this.volume;
        if (type === 'click') {
            osc.type = 'square'; osc.frequency.setValueAtTime(350, t); osc.frequency.exponentialRampToValueAtTime(150, t + 0.05);
            gain.gain.setValueAtTime(0.05 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01 * vol, t + 0.05);
            osc.start(t); osc.stop(t + 0.05);
        } else if (type === 'pop' || type === 'pickup') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(500, t); osc.frequency.exponentialRampToValueAtTime(1000, t + 0.1);
            gain.gain.setValueAtTime(0.15 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01 * vol, t + 0.1);
            osc.start(t); osc.stop(t + 0.1);
        } else if (type === 'splash') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(100, t); osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
            gain.gain.setValueAtTime(0.2 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01 * vol, t + 0.3);
            osc.start(t); osc.stop(t + 0.3);
        } else if (type === 'throw') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(200, t); osc.frequency.linearRampToValueAtTime(600, t + 0.2);
            gain.gain.setValueAtTime(0.1 * vol, t); gain.gain.linearRampToValueAtTime(0.01 * vol, t + 0.2);
            osc.start(t); osc.stop(t + 0.2);
        } else if (type === 'build') {
            osc.type = 'square'; osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
            gain.gain.setValueAtTime(0.2 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01 * vol, t + 0.15);
            osc.start(t); osc.stop(t + 0.15);
        }
    }
};

document.addEventListener('click', e => {
    if(e.target.closest('button') || e.target.closest('.inv-item') || e.target.closest('.hotbar-slot')) AudioSys.play('click');
});