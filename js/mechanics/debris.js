const Debris = {
    items: [],
    spawnTimer: 0,
    spawnRate: 2.5, // Aparece basura cada 2.5 segundos
    speed: 60, // Velocidad a la que se mueve el océano

    update(deltaTime) {
        this.spawnTimer += deltaTime;
        
        // Generar nueva basura
        if (this.spawnTimer >= this.spawnRate) {
            this.spawn();
            this.spawnTimer = 0;
        }

        // Mover basura hacia abajo
        for (let i = this.items.length - 1; i >= 0; i--) {
            let item = this.items[i];
            
            // Si no está enganchada, se mueve con la corriente
            if (!item.isHooked) {
                item.y += this.speed * deltaTime;
                
                // Rotación visual ligera
                item.rotation += deltaTime; 
            }

            // Destruir si sale de la pantalla por abajo
            if (item.y > window.innerHeight + 50) {
                this.items.splice(i, 1);
            }
        }
    },

    spawn() {
        // 60% chance de madera, 40% de plástico
        const isWood = Math.random() > 0.4;
        this.items.push({
            id: Math.random().toString(),
            x: Math.random() * window.innerWidth,
            y: -50,
            type: isWood ? 'madera' : 'plastico',
            size: 20,
            isHooked: false,
            rotation: Math.random() * Math.PI * 2
        });
    },

    draw(ctx) {
        this.items.forEach(item => {
            const assetName = item.type === 'madera' ? 'madera_flotante' : 'plastico_flotante';
            if (Assets.images[assetName]) {
                ctx.save();
                ctx.translate(item.x + item.size/2, item.y + item.size/2);
                ctx.rotate(item.rotation);
                ctx.drawImage(Assets.images[assetName], -item.size/2, -item.size/2, item.size, item.size);
                ctx.restore();
            }
        });
    }
};