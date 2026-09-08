
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;

window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

let gameState = 'SPLASH'; 
let camera = { x: 0, y: 0, zoom: 1.5 };
let player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 2.5, isMoving: false };
let floaters = []; let birds = []; let globalTime = 0; let lastFrameTime = Date.now();
const RAFT_SIZE = 5; const TILE = 60; const RAFT_LIMIT = (RAFT_SIZE * TILE) / 2;

let game = { slot: 1, playTime: 0, lastSaved: "", worldConfig: {}, playerConfig: {}, inv: [], hotbar: [null,null,null], structures: [], stats: { hp: 100, h: 100, s: 100, su: 100 }, time: { acts: 0, h: 8, d: 1 } };

function startGame(slotIndex, isNew, config) {
    let save = localStorage.getItem('oceancraft_s' + slotIndex);
    
    if (isNew || !save) {
        game.slot = slotIndex; game.playTime = 0;
        game.worldConfig = config || { name: "Archipiélago", diff: 1, freq: "normal" };
        game.playerConfig = { color: config?.color || '#f39c12', icon: config?.icon || 'K' };
        game.inv = []; game.hotbar = [null, null, null]; game.structures = [];
        game.stats = { hp: 100, h: 100, s: 100, su: 100 }; game.time = { acts: 0, h: 8, d: 1 };
        
        try {
            if(typeof giveItem === 'function') {
                giveItem('gancho_t1', 1); giveItem('madera', 2);
                if(game.inv.length > 0) game.hotbar[0] = game.inv[0].uid;
            }
        } catch(e) { console.error("Error items.js no cargado:", e); }
    } else {
        game = JSON.parse(save);
    }
    
    document.getElementById('menu-layer').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    
    try { if(typeof updateHUD === 'function') updateHUD(); if(typeof renderHotbar === 'function') renderHotbar(); } catch(e){}
    camera.x = player.x; camera.y = player.y;
    gameState = 'GAME'; 
}

function update() {
    let now = Date.now(); let dt = (now - lastFrameTime) / 1000; lastFrameTime = now; globalTime += dt;
    
    if (gameState === 'GAME') {
        game.playTime += dt; 
        if (player.isMoving) {
            let dx = player.targetX - player.x; let dy = player.targetY - player.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > player.speed) { player.x += (dx / distance) * player.speed; player.y += (dy / distance) * player.speed; } 
            else { player.x = player.targetX; player.y = player.targetY; player.isMoving = false; }
        }
        camera.x += (player.x - camera.x) * 0.1; camera.y += (player.y - camera.y) * 0.1;
    } else if (gameState === 'MENU' || gameState === 'SPLASH') {
        camera.x += 1.2; camera.y = Math.sin(globalTime) * 10;
        if(Math.random() < 0.005) birds.push({ x: camera.x + canvas.width, y: camera.y - 200 + Math.random() * 400, speed: Math.random() * 2 + 2, offset: Math.random() * 100 });
    }
    birds.forEach(b => { b.x -= b.speed; b.y += Math.sin(globalTime * 5 + b.offset) * 0.5; });
    birds = birds.filter(b => b.x > camera.x - canvas.width);
}

function draw() {
    try {
        ctx.fillStyle = '#0a3d62'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save(); ctx.translate(canvas.width / 2, canvas.height / 2); ctx.scale(camera.zoom, camera.zoom); ctx.translate(-camera.x, -camera.y);

        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
        for(let i = -15; i < 15; i++) {
            ctx.beginPath();
            for(let wx = camera.x - 1000; wx < camera.x + 1000; wx += 40) {
                let wy = (i * 80) + Math.sin((wx * 0.02) + globalTime * 2) * 15; ctx.lineTo(wx, wy);
            }
            ctx.stroke();
        }
        
        let raftRenderX = (gameState !== 'GAME') ? camera.x - 50 : 0;
        ctx.fillStyle = '#8B4513'; ctx.strokeStyle = '#5c2e0b'; ctx.lineWidth = 3; let offset = RAFT_LIMIT;
        for (let row = 0; row < RAFT_SIZE; row++) {
            for (let col = 0; col < RAFT_SIZE; col++) {
                let px = (col * TILE) - offset + raftRenderX; let py = (row * TILE) - offset;
                ctx.fillRect(px, py, TILE, TILE); ctx.strokeRect(px, py, TILE, TILE);
            }
        }

        if (gameState === 'GAME') {
            ctx.fillStyle = game.playerConfig.color || '#f39c12'; ctx.beginPath(); ctx.arc(player.x, player.y, 16, 0, Math.PI * 2); ctx.fill(); 
            ctx.strokeStyle = '#000'; ctx.stroke();
            ctx.fillStyle = 'white'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
            ctx.fillText(game.playerConfig.icon || 'K', player.x, player.y);
        }
        
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
        birds.forEach(b => {
            ctx.beginPath(); let flap = Math.sin(globalTime * 10 + b.offset) * 5;
            ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + 10, b.y - flap); ctx.lineTo(b.x + 20, b.y); ctx.stroke();
        });
        ctx.restore();
    } catch(e) {
        // Evitar que un error mate el bucle entero
        console.error("Error en draw:", e);
    }
}

function gameLoop() { 
    update(); 
    draw(); 
    requestAnimationFrame(gameLoop); 
}
