const World = {
    raftExists: false, 
    stats: {
        health: 100,
        hunger: 100,
        thirst: 100
    },
    
    raft: {
        x: 0,
        y: 0,
        width: 150,
        height: 150
    },

    init() {
        // Inicializar posición de la balsa
        this.raft.x = window.innerWidth / 2 - this.raft.width / 2;
        this.raft.y = window.innerHeight / 2 - this.raft.height / 2;
        this.raftExists = true; // Confirmar que la balsa se creó correctamente
    },

    update(deltaTime) {
        // Consumo de necesidades con deltaTime para que sea fluido e independiente de los FPS
        this.stats.hunger -= 0.5 * deltaTime;
        this.stats.thirst -= 0.8 * deltaTime;

        // Daño si el hambre o la sed llegan a 0
        if (this.stats.hunger <= 0 || this.stats.thirst <= 0) {
            this.stats.health -= 2 * deltaTime;
        }

        // Limitar valores para que no bajen de 0
        this.stats.health = Math.max(0, this.stats.health);
        this.stats.hunger = Math.max(0, this.stats.hunger);
        this.stats.thirst = Math.max(0, this.stats.thirst);
    },

    draw(ctx) {
        if (!this.raftExists) return;

        // Dibujar Balsa (Generada por IA en assets.js)
        if (Assets.images.balsa) {
            ctx.drawImage(Assets.images.balsa, this.raft.x, this.raft.y, this.raft.width, this.raft.height);
        }
        
        // Dibujar Jugador en el centro de la balsa (Generado por IA en assets.js)
        if (Assets.images.jugador) {
            const playerX = this.raft.x + (this.raft.width / 2) - 16; // 16 es la mitad del ancho del jugador (32)
            const playerY = this.raft.y + (this.raft.height / 2) - 16;
            ctx.drawImage(Assets.images.jugador, playerX, playerY, 32, 32);
        }
    }
};