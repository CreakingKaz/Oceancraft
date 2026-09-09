const Engine = {
    canvas: null,
    ctx: null,
    lastTime: 0,
    isRunning: false,

    async init() {
        await Assets.loadAll();
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        World.init();
        UI.init();
        AudioSystem.init();
        Inventory.init();

        this.isRunning = true;
        requestAnimationFrame((time) => this.loop(time));
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (World.raftExists) {
            World.raft.x = this.canvas.width / 2 - World.raft.width / 2;
            World.raft.y = this.canvas.height / 2 - World.raft.height / 2;
        }
    },

    loop(currentTime) {
        if (!this.isRunning) return;
        const deltaTime = (currentTime - this.lastTime) / 1000; 
        this.lastTime = currentTime;

        if (World.raftExists) {
            World.update(deltaTime);
            AudioSystem.update(deltaTime);
        }

        UI.update();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        World.draw(this.ctx);

        requestAnimationFrame((time) => this.loop(time));
    }
};

window.onload = () => Engine.init();
this.canvas.addEventListener('click', (e) => {
    // Calculo del mundo inverso según cámara[cite: 6]
    let mouseWorldX = (e.clientX - this.canvas.width / 2) / World.camera.zoom + World.camera.x;[cite: 6]
    let mouseWorldY = (e.clientY - this.canvas.height / 2) / World.camera.zoom + World.camera.y;[cite: 6]
    
    let raftSwayX = Math.cos(World.oceanPhase) * 5;[cite: 6]
    let raftSwayY = Math.sin(World.oceanPhase * 1.5) * 5;[cite: 6]
    let localX = mouseWorldX - raftSwayX;[cite: 6]
    let localY = mouseWorldY - raftSwayY;[cite: 6]
    
    let gridC = Math.floor(localX / World.tileSize);[cite: 6]
    let gridR = Math.floor(localY / World.tileSize);[cite: 6]
    let tileKey = `${gridR},${gridC}`;[cite: 6]

    // (Aquí puedes leer tu 'Inventory.slots' activo para saber si tienes el 'martillo' o 'cimiento_madera')
    let activeId = "cimiento_madera"; // Ejemplo fijo para probar

    if (ITEMS_DB[activeId] && ITEMS_DB[activeId].buildType === 'floor') {
        if (!World.raftTiles.includes(tileKey)) {
            // Verificar si toca la balsa[cite: 6]
            let adjacent = World.raftTiles.some(t => { 
                let [r,c] = t.split(',').map(Number);[cite: 6]
                return Math.abs(r-gridR) + Math.abs(c-gridC) === 1;[cite: 6]
            });
            if(adjacent || World.raftTiles.length === 0) { 
                World.raftTiles.push(tileKey);[cite: 6]
                console.log("Balsa expandida en", tileKey);
            }
        }
    }
});