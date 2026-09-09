const Player = {
    x: 0,
    y: 0,
    size: 32,
    speed: 150,
    targetX: null,
    targetY: null,
    keys: { w: false, a: false, s: false, d: false },

    init() {
        this.x = World.raft.x + (World.raft.width / 2) - (this.size / 2);
        this.y = World.raft.y + (World.raft.height / 2) - (this.size / 2);

        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) this.keys[key] = true;
        });
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) this.keys[key] = false;
        });

        Engine.canvas.addEventListener('mousedown', (e) => {
            const rect = Engine.canvas.getBoundingClientRect();
            this.targetX = e.clientX - rect.left - (this.size / 2);
            this.targetY = e.clientY - rect.top - (this.size / 2);
        });
    },

    update(deltaTime) {
        let dx = 0; let dy = 0;

        if (this.keys.w) dy -= 1;
        if (this.keys.s) dy += 1;
        if (this.keys.a) dx -= 1;
        if (this.keys.d) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length; dy /= length;
            this.targetX = null;
        } else if (this.targetX !== null && this.targetY !== null) {
            const tDx = this.targetX - this.x;
            const tDy = this.targetY - this.y;
            const distance = Math.sqrt(tDx * tDx + tDy * tDy);
            
            if (distance > 5) {
                dx = tDx / distance; dy = tDy / distance;
            } else {
                this.targetX = null; this.targetY = null;
            }
        }

        let newX = this.x + (dx * this.speed * deltaTime);
        let newY = this.y + (dy * this.speed * deltaTime);

        // Colisión estricta con la balsa
        newX = Math.max(World.raft.x, Math.min(newX, World.raft.x + World.raft.width - this.size));
        newY = Math.max(World.raft.y, Math.min(newY, World.raft.y + World.raft.height - this.size));

        this.x = newX;
        this.y = newY;
    },

    draw(ctx) {
        if (Assets.images.jugador) {
            ctx.drawImage(Assets.images.jugador, this.x, this.y, this.size, this.size);
        }
    }
};