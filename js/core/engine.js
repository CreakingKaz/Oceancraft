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