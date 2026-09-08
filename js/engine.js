
// ==========================================
// OCEANCRAFT - MOTOR GRÁFICO (CANVAS Y LÓGICA)
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;

window.addEventListener('resize', () => { 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
});

// Variables del juego
let gameState = 'SPLASH'; // SPLASH, MENU, GAME
let camera = { x: 0, y: 0, zoom: 1.5 };
let player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 2.5, isMoving: false };
let floaters = []; 
let birds = []; // Gaviotas para el fondo del menú
let globalTime = 0;
let lastFrameTime = Date.now();

// Configuración de Balsa
const RAFT_SIZE = 5; 
const TILE = 60;
const RAFT_LIMIT = (RAFT_SIZE * TILE) / 2;

// Estructura de partida actual
let game = {
    slot: 1,
    playTime: 0, 
    lastSaved: "",
    worldConfig: {},
    playerConfig: {},
    inv: [], 
    hotbar: [null, null, null], 
    structures: [],
    stats: { hp: 100, h: 100, s: 100, su: 100 },
    time: { acts: 0, h: 8, d: 1 }
};

/* === INICIO DE PARTIDA === */
function startGame(slotIndex, isNew, config) {
    let save = localStorage.getItem('oceancraft_s' + slotIndex);
    
    if (isNew || !save) {
        game.slot = slotIndex;
        game.playTime = 0;
        game.worldConfig = config || { name: "Archipiélago", diff: 1, freq: "normal" };
        game.playerConfig = { color: config?.color || '#f39c12', icon: config?.icon || 'K' };
        game.inv = []; game.hotbar = [null, null, null]; game.structures = [];
        game.stats = { hp: 100, h: 100, s: 100, su: 100 };
        game.time = { acts: 0, h: 8, d: 1 };
        
        giveItem('gancho_t1', 1); giveItem('madera', 2);
        game.hotbar[0] = game.inv[0].uid;
    } else {
        game = JSON.parse(save);
        // Compatibilidad con guardados viejos
        if(!game.playTime) game.playTime = 0;
        if(!game.worldConfig) game.worldConfig = { name: "Mundo Recuperado", diff: 1, freq: "normal" };
    }
    
    // Cambiar vista UI
    document.getElementById('menu-layer').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    
    updateHUD(); 
    renderHotbar();
    
    // Centrar cámara al jugador
    camera.x = player.x; 
    camera.y = player.y;
    
    gameState = 'GAME'; // Cambia el comportamiento del bucle render
}

function saveGame() {
    game.lastSaved = new Date().toLocaleString();
    localStorage.setItem('oceancraft_s' + game.slot, JSON.stringify(game));
    notify("Partida Guardada exitosamente."); 
}

/* === INTERACCIÓN DEL RATÓN (SOLO EN JUEGO) === */
canvas.addEventListener('click', (e) => {
    if(gameState !== 'GAME' || activeModal) return;
    
    const worldX = (e.clientX - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (e.clientY - canvas.height / 2) / camera.zoom + camera.y;

    // 1. Recoger Barriles/Flotantes
    for(let i = floaters.length -1; i >= 0; i--) {
        let f = floaters[i];
        if(worldX >= f.x - 20 && worldX <= f.x + 20 && worldY >= f.y - 20 && worldY <= f.y + 20) {
            if(f.isBarrel) {
                let r1 = ['madera','plastico'][Math.floor(Math.random()*2)];
                giveItem(r1, 2); giveItem('chatarra', 1); giveItem('papa', 1);
                notify(`Barril: 2 ${ITEMS_DB[r1].name}, 1 Chatarra, 1 Papa`);
            } else { giveItem(f.id, 1); notify("Recogiste " + ITEMS_DB[f.id].name); }
            floaters.splice(i, 1); advanceTime({h:1, s:2, su:1}); return;
        }
    }

    // 2. Movimiento y Restricción a Balsa
    const limit = RAFT_LIMIT - 15;
    player.targetX = Math.max(-limit, Math.min(limit, worldX));
    player.targetY = Math.max(-limit, Math.min(limit, worldY));
    player.isMoving = true;
});

/* === BUCLE DE ACTUALIZACIÓN (LÓGICA Y TIEMPO) === */
function update() {
    let now = Date.now();
    let dt = (now - lastFrameTime) / 1000; // Delta time en segundos
    lastFrameTime = now;
    
    globalTime += dt;
    
    if (gameState === 'GAME') {
        game.playTime += dt; // Sumar tiempo de juego real
        updateRealTimeSystems();
        
        // Mover jugador
        if (player.isMoving) {
            let dx = player.targetX - player.x; let dy = player.targetY - player.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > player.speed) { 
                player.x += (dx / distance) * player.speed; 
                player.y += (dy / distance) * player.speed; 
            } else { 
                player.x = player.targetX; player.y = player.targetY; player.isMoving = false; 
            }
        }
        
        // Cámara sigue al jugador suavemente
        camera.x += (player.x - camera.x) * 0.1; 
        camera.y += (player.y - camera.y) * 0.1;
        
        // Spawnear basura
        if(Math.random() < 0.015) spawnFloater();
    } 
    else if (gameState === 'MENU') {
        // En el menú, la cámara avanza a la derecha sola (simula balsa a la izquierda)
        camera.x += 1.2;
        camera.y = Math.sin(globalTime) * 10; // ligero balanceo vertical
        
        // Generar basura constante para el fondo
        if(Math.random() < 0.03) spawnFloater(camera.x + (canvas.width/camera.zoom) + 100);
        
        // Generar gaviotas
        if(Math.random() < 0.005) {
            birds.push({
                x: camera.x + canvas.width, 
                y: camera.y - 200 + Math.random() * 400,
                speed: Math.random() * 2 + 2,
                offset: Math.random() * 100
            });
        }
    }
    
    // Mover flotantes
    floaters.forEach(f => f.x -= f.speed);
    floaters = floaters.filter(f => f.x > camera.x - (canvas.width/camera.zoom) - 200);
    
    // Mover pájaros (solo para menú/futuras islas)
    birds.forEach(b => { b.x -= b.speed; b.y += Math.sin(globalTime * 5 + b.offset) * 0.5; });
    birds = birds.filter(b => b.x > camera.x - canvas.width);
}

function spawnFloater(startX) {
    let isBarrel = Math.random() > 0.8;
    let ids = ['madera', 'plastico', 'hojas', 'chatarra'];
    floaters.push({
        id: isBarrel ? 'barrel' : ids[Math.floor(Math.random()*ids.length)],
        isBarrel: isBarrel,
        x: startX || (camera.x + (canvas.width/camera.zoom) + 50), 
        y: camera.y + (Math.random()*800 - 400),
        speed: Math.random()*0.8 + 0.5,
        offsetSeed: Math.random() * 100 
    });
}

/* === BUCLE DE DIBUJADO === */
function draw() {
    // 1. Océano dinámico
    let h = game.time.h;
    // Si estamos en el menú, dejarlo azul bonito siempre
    let oceanColor = (gameState === 'MENU' || (h >= 6 && h < 18)) ? '#0a3d62' : '#041c2c';
    if(gameState === 'GAME' && h > 16 && h < 19) oceanColor = '#c23616'; // Atardecer
    
    ctx.fillStyle = oceanColor; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); 
    ctx.scale(camera.zoom, camera.zoom); 
    ctx.translate(-camera.x, -camera.y);

    // Olas trigonométricas
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; 
    ctx.lineWidth = 2;
    for(let i = -15; i < 15; i++) {
        ctx.beginPath();
        for(let wx = camera.x - 1000; wx < camera.x + 1000; wx += 40) {
            let wy = (i * 80) + Math.sin((wx * 0.02) + globalTime * 2) * 15;
            ctx.lineTo(wx, wy);
        }
        ctx.stroke();
    }

    // 2. Balsa
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 15;
    ctx.fillStyle = '#8B4513'; ctx.strokeStyle = '#5c2e0b'; ctx.lineWidth = 3;
    let offset = RAFT_LIMIT;
    // Si es menú, forzamos que la balsa esté en la cámara actual para que siempre se vea
    let raftRenderX = (gameState === 'MENU') ? camera.x - 50 : 0;
    
    for (let row = 0; row < RAFT_SIZE; row++) {
        for (let col = 0; col < RAFT_SIZE; col++) {
            let px = (col * TILE) - offset + raftRenderX; 
            let py = (row * TILE) - offset;
            ctx.fillRect(px, py, TILE, TILE); ctx.strokeRect(px, py, TILE, TILE);
        }
    }
    ctx.shadowBlur = 0;

    // 3. Flotantes (Bobbing animado)
    floaters.forEach(f => {
        ctx.save();
        let bobY = Math.sin(globalTime * 3 + f.offsetSeed) * 5; 
        let rotation = Math.sin(globalTime + f.offsetSeed) * 0.5;
        ctx.translate(f.x, f.y + bobY);
        ctx.rotate(rotation);
        
        if(f.isBarrel) {
            ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI*2); ctx.fill();
        } else if(ITEMS_DB[f.id]) {
            let b = ITEMS_DB[f.id];
            ctx.fillStyle = b.color; ctx.fillRect(-12, -12, 24, 24);
            ctx.fillStyle = 'white'; ctx.font = '14px Courier New'; ctx.fillText(b.symbol, -7, 4);
        }
        ctx.restore();
    });

    // 4. Jugador (Solo en GAME)
    if (gameState === 'GAME') {
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10;
        ctx.fillStyle = game.playerConfig.color; 
        ctx.beginPath(); ctx.arc(player.x, player.y, 16, 0, Math.PI * 2); ctx.fill(); 
        ctx.shadowBlur = 0; ctx.strokeStyle = '#000'; ctx.stroke();
        
        ctx.fillStyle = 'white'; ctx.font = 'bold 12px Courier New'; 
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
        ctx.fillText(game.playerConfig.icon, player.x, player.y);
    }
    
    // 5. Gaviotas de fondo (MENU)
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
    birds.forEach(b => {
        ctx.beginPath();
        let flap = Math.sin(globalTime * 10 + b.offset) * 5;
        ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + 10, b.y - flap); ctx.lineTo(b.x + 20, b.y);
        ctx.stroke();
    });

    ctx.restore();
}

function gameLoop() { 
    update(); 
    draw(); 
    if(gameState !== 'SPLASH') requestAnimationFrame(gameLoop); 
}

/* === SISTEMAS DE TIEMPO (RESTO DEL CÓDIGO) === */
let lastHpDrain = Date.now();
function updateRealTimeSystems() {
    let now = Date.now();
    if (now - lastHpDrain >= (2300 / game.worldConfig.diff)) {
        lastHpDrain = now;
        let emptyStats = 0;
        if (game.stats.h <= 0) emptyStats++;
        if (game.stats.s <= 0) emptyStats++;
        if (game.stats.su <= 0) emptyStats++;
        
        if (emptyStats === 3) game.stats.hp = 0; 
        else if (emptyStats === 2) game.stats.hp -= 3;
        else if (emptyStats === 1) game.stats.hp -= 1;
        
        if (game.stats.hp <= 0) { alert("Has muerto. La naturaleza ha reclamado tu balsa."); location.reload(); }
        updateHUD();
    }
}

function advanceTime(cost) {
    let diff = game.worldConfig.diff;
    game.stats.h -= (cost.h || 0) * diff;
    game.stats.s -= (cost.s || 0) * diff;
    game.stats.su -= (cost.su || 0) * diff;
    game.time.acts++;
    if (game.time.acts >= 3) { 
        game.time.acts = 0; game.time.h++; 
        if (game.time.h >= 24) { game.time.h = 0; game.time.d++; } 
    }
    updateHUD();
}

function updateHUD() {
    document.getElementById('ui-clock').innerText = `Día ${game.time.d} - ${String(game.time.h).padStart(2,'0')}:00`;
    document.getElementById('ui-hp').innerText = Math.floor(Math.max(0, game.stats.hp));
    document.getElementById('ui-food').innerText = Math.floor(Math.max(0, game.stats.h));
    document.getElementById('ui-thirst').innerText = Math.floor(Math.max(0, game.stats.s));
    document.getElementById('ui-sleep').innerText = Math.floor(Math.max(0, game.stats.su));
}

function doAction() {
    let uid = game.hotbar[selectedSlot];
    let item = game.inv.find(i => i.uid === uid);
    
    if(!item) {
        advanceTime({h:3, s:5, su:2});
        if(Math.random() > 0.4) { let loot = ['madera','plastico','hojas'][Math.floor(Math.random()*3)]; giveItem(loot, 1); notify("+1 " + ITEMS_DB[loot].name); } 
        else notify("No encontraste nada.");
    } else {
        let base = ITEMS_DB[item.id];
        if (base.cat === 'herr') {
            advanceTime({h:4, s:6, su:2});
            if(item.id === 'gancho_t1') {
                if(Math.random() > 0.4) { let loot = ['madera','plastico','chatarra'][Math.floor(Math.random()*3)]; giveItem(loot, 1); notify("+1 " + ITEMS_DB[loot].name); } 
                else notify("Gancho regresó vacío.");
            }
            item.dur--; if(item.dur <= 0) { removeItem(item.uid, 1); notify(base.name + " se ha roto."); }
            renderHotbar(); renderInv();
        } 
        else if (base.cat === 'com') {
            game.stats.h = Math.min(100, game.stats.h + base.val.h); game.stats.s = Math.min(100, game.stats.s + base.val.s);
            removeItem(item.uid, 1); notify("Consumiste " + base.name); renderHotbar(); renderInv(); updateHUD();
        } 
    }
}
