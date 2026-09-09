const Engine = {
    canvas: null,
    ctx: null,
    lastTime: 0,
    isRunning: false,

    async init() {
        // Cargar todos los recursos (Las imágenes SVG que hace assets.js)
        await Assets.loadAll();
        
        // Quitar pantalla de carga
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';

        // Configurar el Canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Iniciar los demás módulos del juego
        World.init();
        UI.init();
        AudioSystem.init();

        // Iniciar el bucle del motor
        this.isRunning = true;
        requestAnimationFrame((time) => this.loop(time));
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Si la balsa ya existe, centrarla al redimensionar la ventana
        if (World.raftExists) {
            World.raft.x = this.canvas.width / 2 - World.raft.width / 2;
            World.raft.y = this.canvas.height / 2 - World.raft.height / 2;
        }
    },

    // Bucle Unificado: Resuelve el bug crítico donde el tiempo avanzaba pero la balsa desaparecía
    loop(currentTime) {
        if (!this.isRunning) return;

        // Calcular deltaTime en segundos
        const deltaTime = (currentTime - this.lastTime) / 1000; 
        this.lastTime = currentTime;

        // Actualizar lógicas si el mundo generó bien la balsa
        if (World.raftExists) {
            World.update(deltaTime);
            AudioSystem.update(deltaTime);
        }

        UI.update();

        // Dibujar frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        World.draw(this.ctx);

        // Llamar al siguiente frame
        requestAnimationFrame((time) => this.loop(time));
    }
};

// Arrancar el motor cuando el documento cargue
window.onload = () => Engine.init();