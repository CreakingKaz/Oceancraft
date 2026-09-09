const World = {
    raftTiles: ['0,0', '0,1', '1,0', '1,1'], // Balsa de 2x2 inicial
    structures: [],
    tileSize: 80,
    stats: { health: 100, energy: 100, thirst: 100, hunger: 100, toxicity: 0 },
    timeOfDay: 8 * 60, day: 1, timeSpeed: 10,
    
    camera: { x: window.innerWidth/2, y: window.innerHeight/2, zoom: 1.2 },
    oceanPhase: 0,
    
    weather: { current: 'CLEAR', target: 'CLEAR', progress: 1.0, fogDensity: 0 },
    WEATHER_COLORS: {
        'CLEAR': { top: [2, 132, 199], bottom: [12, 74, 110] },
        'STORM': { top: [7, 89, 133], bottom: [8, 47, 73] },
        'FOG':   { top: [100, 116, 139], bottom: [71, 85, 105] }
    },
    curTop: [2, 132, 199], curBot: [12, 74, 110],

    lerpColor(c1, c2, t) {
        return [
            Math.round(c1[0] + (c2[0]-c1[0])*t),
            Math.round(c1[1] + (c2[1]-c1[1])*t),
            Math.round(c1[2] + (c2[2]-c1[2])*t)
        ];
    },

    init() {
        Player.init();
        if(window.Hook) Hook.init();
    },

    update(deltaTime) {
        // Reloj
        this.timeOfDay += deltaTime * this.timeSpeed;
        if (this.timeOfDay >= 1440) { 
            this.timeOfDay = 0; 
            this.day++; 
            if (window.UI) UI.addLog(`¡Día ${this.day}!`, true);
        }

        // Clima
        if (this.weather.progress < 1.0) {
            this.weather.progress += 0.002;
            this.curTop = this.lerpColor(this.curTop, this.WEATHER_COLORS[this.weather.target].top, this.weather.progress);
            this.curBot = this.lerpColor(this.curBot, this.WEATHER_COLORS[this.weather.target].bottom, this.weather.progress);
        }
        
        this.oceanPhase += this.weather.current === 'STORM' ? 0.08 : 0.04;
        
        // Supervivencia
        this.stats.hunger = Math.max(0, this.stats.hunger - 0.3 * deltaTime);
        this.stats.thirst = Math.max(0, this.stats.thirst - 0.5 * deltaTime);
        this.stats.energy = Math.max(0, this.stats.energy - 0.1 * deltaTime);
        if (this.stats.hunger === 0 || this.stats.thirst === 0) {
            this.stats.health = Math.max(0, this.stats.health - 1 * deltaTime);
        }

        Player.update(deltaTime);
        if(window.Debris) Debris.update(deltaTime);
        if(window.Hook) Hook.update(deltaTime);
    },

    draw(ctx) {
        // Fondo 
        let grad = ctx.createRadialGradient(window.innerWidth/2, window.innerHeight/2, 100, window.innerWidth/2, window.innerHeight/2, window.innerWidth);
        grad.addColorStop(0, `rgb(${this.curTop[0]},${this.curTop[1]},${this.curTop[2]})`);
        grad.addColorStop(1, `rgb(${this.curBot[0]},${this.curBot[1]},${this.curBot[2]})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        ctx.save();
        ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        // Olas
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 2;
        for (let i = -1000; i < 1000; i += 150) {
            const waveY = ((this.timeOfDay/1440) * 50 + i) % 1000;
            ctx.beginPath();
            ctx.moveTo(-1000, waveY);
            for(let x = -1000; x < 2000; x += 50) {
                ctx.lineTo(x, waveY + Math.sin(x * 0.05 + this.oceanPhase) * 10);
            }
            ctx.stroke();
        }

        if(window.Debris) Debris.draw(ctx);

        // Balsa (se balancea con las olas)
        let raftSwayX = Math.cos(this.oceanPhase) * 5;
        let raftSwayY = Math.sin(this.oceanPhase * 1.5) * 5;
        
        ctx.save(); 
        ctx.translate(raftSwayX, raftSwayY);

        this.raftTiles.forEach(t => {
            let [r,c] = t.split(',').map(Number);
            let px = c * this.tileSize;
            let py = r * this.tileSize;
            
            ctx.fillStyle = '#b45309'; ctx.fillRect(px, py, this.tileSize, this.tileSize);
            ctx.fillStyle = '#92400e'; ctx.fillRect(px + 4, py + 4, this.tileSize - 8, this.tileSize - 8);
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.strokeRect(px, py, this.tileSize, this.tileSize);
        });
        
        Player.draw(ctx);
        ctx.restore(); // Salimos del balanceo de la balsa
        
        if(window.Hook) Hook.draw(ctx);
        
        ctx.restore(); // Salimos de la cámara
        
        // Ciclo Día/Noche
        let hour = this.timeOfDay / 60;
        let darkness = hour < 5 || hour >= 20 ? 0.6 : (hour >= 5 && hour < 7 ? 0.6 - ((hour - 5) / 2) * 0.6 : (hour >= 18 && hour < 20 ? ((hour - 18) / 2) * 0.6 : 0));
        if (darkness > 0) {
            ctx.fillStyle = `rgba(10, 15, 30, ${darkness})`;
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }
};