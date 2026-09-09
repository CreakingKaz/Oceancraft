const World = {
    raftTiles: ['0,0', '0,1', '1,0', '1,1'], // Balsa inicial[cite: 6]
    structures: [],[cite: 6]
    tileSize: 80,[cite: 6]
    stats: { health: 100, energy: 100, thirst: 100, hunger: 100, toxicity: 0 },
    timeOfDay: 8 * 60, day: 1, timeSpeed: 10,
    
    camera: { x: 0, y: 0, zoom: 1.5 },[cite: 6]
    oceanPhase: 0,[cite: 6]
    
    // Motor de Clima[cite: 6]
    weather: { current: 'CLEAR', target: 'CLEAR', progress: 1.0, fogDensity: 0 },[cite: 6]
    WEATHER_COLORS: {
        'CLEAR': { top: [2, 132, 199], bottom: [12, 74, 110] },[cite: 6]
        'STORM': { top: [7, 89, 133], bottom: [8, 47, 73] },[cite: 6]
        'FOG':   { top: [100, 116, 139], bottom: [71, 85, 105] }[cite: 6]
    },
    curTop: [2, 132, 199], curBot: [12, 74, 110],[cite: 6]

    lerpColor(c1, c2, t) {
        return [
            Math.round(c1[0] + (c2[0]-c1[0])*t),[cite: 6]
            Math.round(c1[1] + (c2[1]-c1[1])*t),[cite: 6]
            Math.round(c1[2] + (c2[2]-c1[2])*t) [cite: 6]
        ];
    },

    init() {
        Player.init();
        Hook.init();
    },

    update(deltaTime) {
        this.timeOfDay += deltaTime * this.timeSpeed;
        if (this.timeOfDay >= 1440) { this.timeOfDay = 0; this.day++; }

        // Interpolación de Clima[cite: 6]
        if (this.weather.progress < 1.0) {
            this.weather.progress += 0.002;[cite: 6]
            this.curTop = this.lerpColor(this.curTop, this.WEATHER_COLORS[this.weather.target].top, this.weather.progress);[cite: 6]
            this.curBot = this.lerpColor(this.curBot, this.WEATHER_COLORS[this.weather.target].bottom, this.weather.progress);[cite: 6]
        }
        
        this.oceanPhase += this.weather.current === 'STORM' ? 0.08 : 0.04;[cite: 6]
        Player.update(deltaTime);
        Debris.update(deltaTime);
    },

    draw(ctx) {
        // Fondo Oceánico Gradual[cite: 6]
        let grad = ctx.createRadialGradient(window.innerWidth/2, window.innerHeight/2, 100, window.innerWidth/2, window.innerHeight/2, window.innerWidth);[cite: 6]
        grad.addColorStop(0, `rgb(${this.curTop[0]},${this.curTop[1]},${this.curTop[2]})`);[cite: 6]
        grad.addColorStop(1, `rgb(${this.curBot[0]},${this.curBot[1]},${this.curBot[2]})`);[cite: 6]
        ctx.fillStyle = grad;[cite: 6]
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        ctx.save();
        ctx.translate(window.innerWidth / 2, window.innerHeight / 2);[cite: 6]
        ctx.scale(this.camera.zoom, this.camera.zoom);[cite: 6]
        ctx.translate(-this.camera.x, -this.camera.y);[cite: 6]

        let raftSwayX = Math.cos(this.oceanPhase) * 5;[cite: 6]
        let raftSwayY = Math.sin(this.oceanPhase * 1.5) * 5;[cite: 6]
        ctx.save(); ctx.translate(raftSwayX, raftSwayY);[cite: 6]

        // Dibujar Cuadrícula de la Balsa[cite: 6]
        this.raftTiles.forEach(t => {
            let [r,c] = t.split(',').map(Number);[cite: 6]
            let px = c * this.tileSize;[cite: 6]
            let py = r * this.tileSize;[cite: 6]
            
            ctx.fillStyle = '#b45309'; ctx.fillRect(px, py, this.tileSize, this.tileSize);[cite: 6]
            ctx.fillStyle = '#92400e'; ctx.fillRect(px + 4, py + 4, this.tileSize - 8, this.tileSize - 8);[cite: 6]
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.strokeRect(px, py, this.tileSize, this.tileSize);[cite: 6]
        });
        
        ctx.restore();
        Player.draw(ctx);
        ctx.restore();
        
        // Oscuridad Nocturna[cite: 6]
        let hour = this.timeOfDay / 60;[cite: 6]
        let darkness = hour < 5 || hour >= 20 ? 0.6 : (hour >= 5 && hour < 7 ? 0.6 - ((hour - 5) / 2) * 0.6 : (hour >= 18 && hour < 20 ? ((hour - 18) / 2) * 0.6 : 0));[cite: 6]
        if (darkness > 0) {
            ctx.fillStyle = `rgba(10, 15, 30, ${darkness})`;[cite: 6]
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }
};