const World = {
    raftExists: false,
    raft: { x: 0, y: 0, width: 200, height: 200 },
    
    // Todas las stats añadidas
    stats: { health: 100, energy: 100, thirst: 100, hunger: 100, toxicity: 0 },
    
    // Sistema de Tiempo
    timeOfDay: 8 * 60, // Empieza a las 08:00 AM (en minutos)
    day: 1,
    timeSpeed: 10, // 1 segundo real = 10 minutos en el juego
    
    particles: [], seagulls: [], workstations: [],

    init() {
        this.raft.x = window.innerWidth / 2 - this.raft.width / 2;
        this.raft.y = window.innerHeight / 2 - this.raft.height / 2;
        this.raftExists = true;
        Player.init();
        Hook.init();
        UI.addLog("Te despiertas en la balsa...");
    },

    update(deltaTime) {
        // Reloj del mundo
        this.timeOfDay += deltaTime * this.timeSpeed;
        if (this.timeOfDay >= 1440) { // 24 horas (1440 minutos)
            this.timeOfDay = 0;
            this.day++;
            UI.addLog(`¡Un nuevo día comienza! (Día ${this.day})`, true);
        }

        Player.update(deltaTime);
        Debris.update(deltaTime);
        Hook.update(deltaTime);

        // Consumo de Estadísticas
        this.stats.hunger = Math.max(0, this.stats.hunger - 0.3 * deltaTime);
        this.stats.thirst = Math.max(0, this.stats.thirst - 0.5 * deltaTime);
        this.stats.energy = Math.max(0, this.stats.energy - 0.1 * deltaTime); // Baja lento
        
        // La toxicidad baja la vida
        if (this.stats.toxicity > 0) {
            this.stats.health -= 0.5 * deltaTime;
            this.stats.toxicity = Math.max(0, this.stats.toxicity - 0.1 * deltaTime); // Se cura sola con el tiempo
        }

        // Daño por hambre/sed extrema
        if (this.stats.hunger === 0 || this.stats.thirst === 0) {
            this.stats.health = Math.max(0, this.stats.health - 1 * deltaTime);
        }
    },

    draw(ctx) {
        // Fondo de agua dinámico según la hora (opcional para el futuro)
        // ... (Tu código actual de dibujado de olas, balsa, gancho y debris se mantiene exactamente igual aquí)
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            const waveY = ((this.timeOfDay/1440) * 50 + i * 150) % window.innerHeight;
            ctx.beginPath();
            ctx.moveTo(0, waveY);
            for(let x = 0; x < window.innerWidth; x += 50) {
                ctx.lineTo(x, waveY + Math.sin(x * 0.05) * 10);
            }
            ctx.stroke();
        }

        Debris.draw(ctx);
        if (Assets.images.balsa) ctx.drawImage(Assets.images.balsa, this.raft.x, this.raft.y, this.raft.width, this.raft.height);
        Player.draw(ctx);
        Hook.draw(ctx);
    }
};