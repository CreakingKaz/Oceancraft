const World = {
    raftExists: false,
    raft: { x: 0, y: 0, width: 200, height: 200 },
    stats: { health: 100, hunger: 100, thirst: 100 },
    
    particles: [],
    seagulls: [],
    time: 0,
    workstations: [],

    init() {
        this.raft.x = window.innerWidth / 2 - this.raft.width / 2;
        this.raft.y = window.innerHeight / 2 - this.raft.height / 2;
        this.raftExists = true;
        
        // Colocamos una mesa de crafteo en la balsa
        this.workstations.push({
            id: 'Mesa de Trabajo',
            x: this.raft.x + 20,
            y: this.raft.y + 20,
            size: 40
        });

        Player.init();
        UI.addActionLog("El viaje comienza...");
    },

    update(deltaTime) {
        this.time += deltaTime;
        Player.update(deltaTime);

        // Supervivencia
        this.stats.hunger = Math.max(0, this.stats.hunger - 0.5 * deltaTime);
        this.stats.thirst = Math.max(0, this.stats.thirst - 0.8 * deltaTime);
        if (this.stats.hunger === 0 || this.stats.thirst === 0) {
            this.stats.health = Math.max(0, this.stats.health - 2 * deltaTime);
        }

        // Partículas de espuma (balsa moviéndose)
        if (Math.random() < 0.3) {
            this.particles.push({
                x: this.raft.x + Math.random() * this.raft.width,
                y: this.raft.y + this.raft.height,
                life: 1.0,
                maxLife: 1.0 + Math.random()
            });
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].life -= deltaTime;
            this.particles[i].y += 50 * deltaTime;
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }

        // Gaviotas aleatorias en el cielo
        if (Math.random() < 0.005) {
            this.seagulls.push({
                x: -50,
                y: Math.random() * window.innerHeight,
                speedX: 100 + Math.random() * 50,
                speedY: (Math.random() - 0.5) * 50
            });
        }
        for (let i = this.seagulls.length - 1; i >= 0; i--) {
            this.seagulls[i].x += this.seagulls[i].speedX * deltaTime;
            this.seagulls[i].y += this.seagulls[i].speedY * deltaTime;
            if (this.seagulls[i].x > window.innerWidth + 50) this.seagulls.splice(i, 1);
        }
    },

    draw(ctx) {
        // Dibujar Olas con Parallax
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            const waveY = (this.time * 50 + i * 150) % window.innerHeight;
            ctx.beginPath();
            ctx.moveTo(0, waveY);
            for(let x = 0; x < window.innerWidth; x += 50) {
                ctx.lineTo(x, waveY + Math.sin(x * 0.05 + this.time * 2) * 10);
            }
            ctx.stroke();
        }

        // Dibujar Espuma
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, (p.life / p.maxLife) * 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Dibujar Balsa y Mesas
        if (Assets.images.balsa) ctx.drawImage(Assets.images.balsa, this.raft.x, this.raft.y, this.raft.width, this.raft.height);
        this.workstations.forEach(ws => {
            if (Assets.images.mesa) ctx.drawImage(Assets.images.mesa, ws.x, ws.y, ws.size, ws.size);
        });

        // Dibujar Jugador
        Player.draw(ctx);

        // Dibujar Gaviotas en "V"
        ctx.strokeStyle = "#ecf0f1";
        ctx.lineWidth = 2;
        this.seagulls.forEach(s => {
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x + 10, s.y + 10);
            ctx.lineTo(s.x + 20, s.y);
            ctx.stroke();
        });
    }
};