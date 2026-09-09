const Player = {
    x: 40, y: 40, size: 32, speed: 150,
    targetX: 40, targetY: 40, isMoving: false, color: '#f1c40f',
    
    init() {
        // Empieza en el centro del primer cuadro de la balsa
        this.x = World.tileSize / 2;
        this.y = World.tileSize / 2;
        this.targetX = this.x;
        this.targetY = this.y;
    },

    update(deltaTime) {
        if (this.isMoving) {
            let dx = this.targetX - this.x; 
            let dy = this.targetY - this.y; 
            let dist = Math.hypot(dx, dy);
            
            if (dist > this.speed * deltaTime) { 
                this.x += (dx / dist) * this.speed * deltaTime; 
                this.y += (dy / dist) * this.speed * deltaTime; 
            } else { 
                this.x = this.targetX; 
                this.y = this.targetY; 
                this.isMoving = false; 
            }
        }
    },

    draw(ctx) {
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; 
        ctx.beginPath(); 
        ctx.arc(this.x, this.y + 15, 18, 0, Math.PI*2); 
        ctx.fill();
        
        // Cuerpo
        ctx.fillStyle = this.color; 
        ctx.strokeStyle = '#2c3e50'; 
        ctx.lineWidth = 3; 
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, 16, 0, Math.PI * 2); 
        ctx.fill(); 
        ctx.stroke();
    }
};