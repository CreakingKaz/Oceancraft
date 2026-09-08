const AudioSys = {
    ctx: null,
    // Using a known raw github proxy for Minecraft vanilla sounds to bypass CORS
    apiBase: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.2/assets/minecraft/sounds/",
    enabled: true,
    cache: {},
    
    init() { 
        if(!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); 
    },
    
    async play(type) {
        if(!this.enabled) return;
        this.init();
        if(this.ctx.state === 'suspended') this.ctx.resume();
        
        let file = '';
        if(type === 'click') file = 'random/click.ogg';
        if(type === 'pop' || type === 'pickup') file = 'random/pop.ogg';
        if(type === 'splash') file = 'random/splash.ogg';
        if(type === 'build') file = 'dig/wood1.ogg';
        if(type === 'break') file = 'random/break.ogg';
        
        if(!file) return this.playSynthFallback(type);

        if(this.cache[file]) { this.playBuffer(this.cache[file]); return; }

        try {
            let res = await fetch(this.apiBase + file);
            if(!res.ok) throw new Error("CORS/404");
            let arrayBuffer = await res.arrayBuffer();
            let audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.cache[file] = audioBuffer;
            this.playBuffer(audioBuffer);
        } catch(e) {
            // Fallback to synth if GitHub raw is blocked or fails
            this.playSynthFallback(type);
        }
    },
    
    playBuffer(buffer) {
        let source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
    },

    playSynthFallback(type) {
        const t = this.ctx.currentTime; const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        if (type === 'click') { osc.type = 'square'; osc.frequency.setValueAtTime(350, t); osc.frequency.exponentialRampToValueAtTime(150, t + 0.05); gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05); osc.start(t); osc.stop(t + 0.05); } 
        else if (type === 'pop' || type === 'pickup') { osc.type = 'sine'; osc.frequency.setValueAtTime(500, t); osc.frequency.exponentialRampToValueAtTime(1000, t + 0.1); gain.gain.setValueAtTime(0.15, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1); osc.start(t); osc.stop(t + 0.1); }
        else if (type === 'splash') { osc.type = 'triangle'; osc.frequency.setValueAtTime(100, t); osc.frequency.exponentialRampToValueAtTime(30, t + 0.3); gain.gain.setValueAtTime(0.2, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3); osc.start(t); osc.stop(t + 0.3); }
        else if (type === 'build') { osc.type = 'square'; osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(50, t + 0.15); gain.gain.setValueAtTime(0.2, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15); osc.start(t); osc.stop(t + 0.15); }
    }
};
document.addEventListener('click', e => {
    if(e.target.closest('button') || e.target.closest('.inv-item') || e.target.closest('.hotbar-slot') || e.target.closest('.menu-tab')) AudioSys.play('click');
});