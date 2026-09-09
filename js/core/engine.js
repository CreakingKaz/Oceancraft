const Engine = {
    canvas: null, ctx: null, lastTime: 0, isRunning: false,
    
    async init() {
        if(window.Assets) await Assets.loadAll();
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        World.init();
        if(window.UI) UI.init();
        if(window.Menus) Menus.init();
        if(window.AudioSystem) AudioSystem.init();
        if(window.Inventory) Inventory.init();

        // CONTROLES DE CÁMARA
        document.getElementById('cam-minus').addEventListener('click', () => { World.camera.zoom = Math.max(0.5, World.camera.zoom - 0.2); });
        document.getElementById('cam-plus').addEventListener('click', () => { World.camera.zoom = Math.min(2.0, World.camera.zoom + 0.2); });

        // SISTEMA DE CLIC (Moverse / Construir)
        this.canvas.addEventListener('mousedown', (e) => {
            // Ignorar clic derecho (reservado para el gancho)
            if(e.button === 2) return; 

            let rect = this.canvas.getBoundingClientRect();
            // Calcular posición real en el mundo con zoom y cámara
            let mouseWorldX = (e.clientX - rect.left - this.canvas.width / 2) / World.camera.zoom + World.camera.x;
            let mouseWorldY = (e.clientY - rect.top - this.canvas.height / 2) / World.camera.zoom + World.camera.y;
            
            // Ajustar al balanceo de las olas
            let raftSwayX = Math.cos(World.oceanPhase) * 5;
            let raftSwayY = Math.sin(World.oceanPhase * 1.5) * 5;
            let localX = mouseWorldX - raftSwayX;
            let localY = mouseWorldY - raftSwayY;
            
            // Calcular en qué baldosa se hizo clic
            let gridC = Math.floor(localX / World.tileSize);
            let gridR = Math.floor(localY / World.tileSize);
            let tileKey = `${gridR},${gridC}`;

            // Si haces clic en la balsa, te mueves hacia ahí
            if (World.raftTiles.includes(tileKey)) {
                Player.targetX = localX; 
                Player.targetY = localY; 
                Player.isMoving = true;
            }
        });

        this.isRunning = true;
        requestAnimationFrame((time) => this.loop(time));
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        World.camera.x = this.canvas.width / 2;
        World.camera.y = this.canvas.height / 2;
    },

    loop(currentTime) {
        if (!this.isRunning) return;
        const deltaTime = (currentTime - this.lastTime) / 1000; 
        this.lastTime = currentTime;

        World.update(deltaTime);
        if(window.AudioSystem) AudioSystem.update(deltaTime);
        if(window.UI) UI.update();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        World.draw(this.ctx);

        requestAnimationFrame((time) => this.loop(time));
    }
};

window.onload = () => Engine.init();