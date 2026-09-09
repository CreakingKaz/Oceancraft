const UI = {
    actionBtn: null,
    activeWorkstation: null,

    init() {
        this.actionBtn = document.getElementById('btn-action');

        // Botón Acción (Se habilita si estás sobre la mesa)
        this.actionBtn.addEventListener('click', () => {
            if (this.activeWorkstation) {
                this.addActionLog(`Usando: ${this.activeWorkstation.id}`);
                // ¡Magia! Te da madera que va a tus cuadrados rojos
                Inventory.addItem({ name: "Madera" }); 
            }
        });

        // Demás botones
        document.getElementById('btn-craft').addEventListener('click', () => this.addActionLog("Menú de Crafteo..."));
        document.getElementById('btn-inv').addEventListener('click', () => this.addActionLog("Revisando Mochila..."));
        document.getElementById('btn-sleep').addEventListener('click', () => this.addActionLog("Durmiendo... zZz"));
        
        document.getElementById('btn-save').addEventListener('click', () => this.addActionLog("Partida Guardada."));
        document.getElementById('btn-options').addEventListener('click', () => this.addActionLog("Abriendo opciones..."));

        // Eventos aleatorios de mundo (Log Amarillo)
        setInterval(() => {
            if(Math.random() < 0.2) this.addActionLog("El viento sopla fuerte...");
        }, 15000);
    },

    update() {
        document.getElementById('health-val').innerText = Math.floor(World.stats.health);
        document.getElementById('hunger-val').innerText = Math.floor(World.stats.hunger);
        document.getElementById('thirst-val').innerText = Math.floor(World.stats.thirst);

        // Trigger de proximidad con las mesas
        let isNearStation = false;
        World.workstations.forEach(ws => {
            const dx = (Player.x + Player.size/2) - (ws.x + ws.size/2);
            const dy = (Player.y + Player.size/2) - (ws.y + ws.size/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < 50) {
                isNearStation = true;
                this.activeWorkstation = ws;
            }
        });

        if (isNearStation) {
            this.actionBtn.classList.remove('disabled');
            this.actionBtn.innerText = `Usar ${this.activeWorkstation.id}`;
        } else {
            this.actionBtn.classList.add('disabled');
            this.actionBtn.innerText = 'Acción';
            this.activeWorkstation = null;
        }
    },

    addActionLog(text) {
        const log = document.getElementById('action-log');
        const msg = document.createElement('div');
        msg.className = 'log-msg';
        msg.innerText = text;
        log.appendChild(msg);
        setTimeout(() => { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 4800);
    },

    addLootLog(text) {
        const log = document.getElementById('loot-log');
        const msg = document.createElement('div');
        msg.className = 'log-msg';
        msg.innerText = text;
        log.appendChild(msg);
        setTimeout(() => { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 4800);
    }
};