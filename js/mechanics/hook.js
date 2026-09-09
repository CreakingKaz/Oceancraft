const Hook = {
    state: 'idle', // idle, thrown, returning
    x: 0, y: 0,
    targetX: 0, targetY: 0,
    speed: 400,
    caughtItem: null,
    
    init() {
        // Lanzar gancho con Clic Derecho para no interferir con el movimiento
        Engine.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Evita que salga el menú del navegador
            
            if (this.state === 'idle') {
                const rect = Engine.canvas.getBoundingClientRect();
                this.throw(e.clientX - rect.left, e.clientY - rect.top);
            }
        });
    },

    throw(tx, ty) {
        this.state = 'thrown';
        // Sale desde el centro del jugador
        this.x = Player.x + Player.size / 2;
        this.y = Player.y + Player.size / 2;
        this.targetX = tx;
        this.targetY = ty;
        UI.addActionLog("¡Gancho lanzado!");
    },

    update(deltaTime) {
        if (this.state === 'idle') return;

        // Calcular dirección
        let px = Player.x + Player.size / 2;
        let py = Player.y + Player.size / 2;
        
        let tx = this.state === 'thrown' ? this.targetX : px;
        let ty = this.state === 'thrown' ? this.targetY : py;

        let dx = tx - this.x;
        let dy = ty - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Movimiento
        if (distance > 5) {
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
        } else {
            // Cambios de estado al llegar a los destinos
            if (this.state === 'thrown') {
                this.state = 'returning';
            } else if (this.state === 'returning') {
                this.state = 'idle';
                
                // Si trajimos un item, agregarlo al inventario
                if (this.caughtItem) {
                    Inventory.addItem({ name: this.caughtItem.type.toUpperCase() });
                    
                    // Borrarlo del mundo
                    Debris.items = Debris.items.filter(i => i.id !== this.caughtItem.id);
                    this.caughtItem = null;
                }
            }
        }

        // Colisión con la basura (solo al regresar)
        if (this.state === 'returning' && !this.caughtItem) {
            for (let item of Debris.items) {
                if (!item.isHooked) {
                    let distX = (item.x + item.size/2) - this.x;
                    let distY = (item.y + item.size/2) - this.y;
                    if (Math.sqrt(distX*distX + distY*distY) < 25) {
                        item.isHooked = true;
                        this.caughtItem = item;
                        break; // Solo atrapar uno
                    }
                }
            }
        }

        // Arrastrar el item atrapado
        if (this.caughtItem) {
            this.caughtItem.x = this.x - this.caughtItem.size/2;
            this.caughtItem.y = this.y - this.caughtItem.size/2;
        }
    },

    draw(ctx) {
        if (this.state === 'idle') return;

        let px = Player.x + Player.size / 2;
        let py = Player.y + Player.size / 2;

        // Dibujar la soga
        ctx.strokeStyle = "#95a5a6";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        // Dibujar el gancho
        if (Assets.images.gancho) {
            ctx.save();
            ctx.translate(this.x, this.y);
            // Rotar hacia donde está yendo
            let angle = Math.atan2(this.y - py, this.x - px);
            ctx.rotate(angle + Math.PI/2);
            ctx.drawImage(Assets.images.gancho, -12, -12, 24, 24);
            ctx.restore();
        }
    }
};