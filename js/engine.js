/* === GUARDADO Y UI PRINCIPAL === */
function startGame(slotIndex, isNew) {
    let save = localStorage.getItem('oceancraft_s' + slotIndex);
    if (!isNew && !save) { alert("No hay partida guardada en este Slot."); return; }
    
    if (isNew || !save) {
        game.slot = slotIndex;
        game.diff = parseFloat(document.getElementById('diff-select').value);
        game.playerConfig.icon = document.getElementById('player-icon').value || 'Kaz';
        game.playerConfig.color = document.getElementById('player-color').value;
        game.inv = []; game.hotbar = [null, null, null]; game.structures = [];
        game.stats = { hp: 100, h: 100, s: 100, su: 100 };
        giveItem('gancho_t1', 1); giveItem('madera', 2);
        game.hotbar[0] = game.inv[0].uid;
    } else {
        game = JSON.parse(save);
        if(!game.stats.hp) game.stats.hp = 100;
        if(!game.structures) game.structures = [];
    }
    
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    updateHUD(); renderHotbar();
    isGameRunning = true; requestAnimationFrame(gameLoop);
}

function saveGame() {
    localStorage.setItem('oceancraft_s' + game.slot, JSON.stringify(game));
    notify("Partida Guardada."); toggleMenu('settings-modal');
}

function updateOpacity() { document.documentElement.style.setProperty('--ui-opacity', document.getElementById('opacity-slider').value); }
function updateZoom() { camera.zoom = parseFloat(document.getElementById('zoom-slider').value); }
function notify(msg) { let d = document.createElement('div'); d.className = 'notif'; d.innerText = msg; document.getElementById('notifications').appendChild(d); setTimeout(() => d.remove(), 3000); }

/* === TIEMPO Y VIDA === */
let lastHpDrain = Date.now();
function updateRealTimeSystems() {
    let now = Date.now();
    if (now - lastHpDrain >= 2300) {
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
    game.stats.h -= (cost.h || 0) * game.diff;
    game.stats.s -= (cost.s || 0) * game.diff;
    game.stats.su -= (cost.su || 0) * game.diff;
    game.time.acts++;
    if (game.time.acts >= 3) { game.time.acts = 0; game.time.h++; if (game.time.h >= 24) { game.time.h = 0; game.time.d++; } }
    updateHUD();
}

function updateHUD() {
    document.getElementById('ui-clock').innerText = `Día ${game.time.d} - ${String(game.time.h).padStart(2,'0')}:00`;
    document.getElementById('ui-hp').innerText = Math.floor(Math.max(0, game.stats.hp));
    document.getElementById('ui-food').innerText = Math.floor(Math.max(0, game.stats.h));
    document.getElementById('ui-thirst').innerText = Math.floor(Math.max(0, game.stats.s));
    document.getElementById('ui-sleep').innerText = Math.floor(Math.max(0, game.stats.su));
}

/* === ACCIÓN PRINCIPAL === */
function doAction() {
    let uid = game.hotbar[selectedSlot];
    let item = game.inv.find(i => i.uid === uid);
    
    if(!item) {
        advanceTime({h:3, s:5, su:2});
        if(Math.random() > 0.4) { let loot = ['madera','plastico','hojas'][Math.floor(Math.random()*3)]; giveItem(loot, 1); notify("+1 " + ITEMS_DB[loot].name); } 
        else notify("No encontraste nada.");
    } else {
        let base = ITEMS_DB[item.id];
        
        if (base.isWeapon && typeof handleCombatAction === "function") {
            handleCombatAction(item, base); advanceTime({h:2, s:3, su:1});
        }
        else if (base.cat === 'herr') {
            advanceTime({h:4, s:6, su:2});
            if(item.id === 'gancho_t1') {
                if(Math.random() > 0.4) { let loot = ['madera','plastico','chatarra'][Math.floor(Math.random()*3)]; giveItem(loot, 1); notify("+1 " + ITEMS_DB[loot].name); } 
                else notify("Gancho regresó vacío.");
            }
            if(item.id === 'martillo') { notify("Martillo equipado. Clic en estructuras para quitarlas."); return; }
            item.dur--; if(item.dur <= 0) { removeItem(item.uid, 1); notify(base.name + " se ha roto."); }
            renderHotbar(); renderInv();
        } 
        else if (base.cat === 'com') {
            game.stats.h = Math.min(100, game.stats.h + base.val.h); game.stats.s = Math.min(100, game.stats.s + base.val.s);
            removeItem(item.uid, 1); notify("Consumiste " + base.name); renderHotbar(); renderInv(); updateHUD();
        } 
        else if (base.cat === 'est') {
            window.pendingStructure = item; notify("Clic en la balsa para colocar: " + base.name);
        }
    }
}

/* === MOTOR CANVAS (Gráficos, Colisiones Reales, Olas) === */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

let isGameRunning = false;
let camera = { x: 0, y: 0, zoom: 1.5 };
let player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 2.5, isMoving: false };
let floaters = []; 
let globalTime = 0;

// Definimos la balsa real (5x5 bloques, centro en 0,0)
const RAFT_SIZE = 5; 
const TILE = 60;
const RAFT_LIMIT = (RAFT_SIZE * TILE) / 2; // = 150

canvas.addEventListener('click', (e) => {
    if(!isGameRunning || activeModal) return;
    const worldX = (e.clientX - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (e.clientY - canvas.height / 2) / camera.zoom + camera.y;

    // Recoger Barriles/Flotantes
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

    // Interacción Estructuras
    let uid = game.hotbar[selectedSlot];
    let isHammer = (uid && game.inv.find(i => i.uid === uid)?.id === 'martillo');
    
    for(let i=0; i<game.structures.length; i++) {
        let s = game.structures[i];
        if(worldX >= s.x && worldX <= s.x+40 && worldY >= s.y && worldY <= s.y+40) {
            if(isHammer) {
                if(!s.hasItems) {
                    giveItem(s.id, 1); game.structures.splice(i, 1); notify("Recogido.");
                    let hammer = game.inv.find(i => i.uid === uid); hammer.dur -= 5;
                    if(hammer.dur <= 0) { removeItem(hammer.uid, 1); renderHotbar(); }
                }
            } else notify("Interactuando con Estructura.");
            return;
        }
    }

    // FÍSICAS DE COLISIÓN (El jugador no puede caminar en el agua)
    // Restringimos las coordenadas destino dentro de la balsa (-150 a +150), dejando un margen para el cuerpo del jugador (15px)
    const limit = RAFT_LIMIT - 15;
    player.targetX = Math.max(-limit, Math.min(limit, worldX));
    player.targetY = Math.max(-limit, Math.min(limit, worldY));
    player.isMoving = true;

    // Colocar Estructura (solo dentro de la balsa)
    if (window.pendingStructure) {
        let sx = Math.max(-limit, Math.min(limit - 40, worldX - 20));
        let sy = Math.max(-limit, Math.min(limit - 40, worldY - 20));
        game.structures.push({ id: window.pendingStructure.id, x: sx, y: sy, hasItems: false });
        removeItem(window.pendingStructure.uid, 1); notify("Estructura colocada.");
        window.pendingStructure = null; renderHotbar(); renderInv();
    }
});

function update() {
    updateRealTimeSystems();
    globalTime += 0.02; // Tiempo para animaciones (olas, rotación)

    // Generar Flotantes (Más seguido, mejor visualmente)
    if(Math.random() < 0.015) {
        let isBarrel = Math.random() > 0.8;
        let ids = ['madera', 'plastico', 'hojas', 'chatarra'];
        floaters.push({
            id: isBarrel ? 'barrel' : ids[Math.floor(Math.random()*ids.length)],
            isBarrel: isBarrel,
            x: camera.x + (canvas.width/camera.zoom) + 50, 
            y: camera.y + (Math.random()*800 - 400),
            speed: Math.random()*0.8 + 0.5,
            offsetSeed: Math.random() * 100 // Semilla única para rotación y bobbing
        });
    }
    
    // Mover flotantes
    floaters.forEach(f => f.x -= f.speed);
    floaters = floaters.filter(f => f.x > camera.x - (canvas.width/camera.zoom) - 200);

    // Mover Jugador
    if (player.isMoving) {
        let dx = player.targetX - player.x; let dy = player.targetY - player.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > player.speed) { player.x += (dx / distance) * player.speed; player.y += (dy / distance) * player.speed; }
        else { player.x = player.targetX; player.y = player.targetY; player.isMoving = false; }
    }
    
    // Cámara Suave
    camera.x += (player.x - camera.x) * 0.1; camera.y += (player.y - camera.y) * 0.1;
}

function draw() {
    // 1. Océano Animado (Olas dinámicas)
    let h = game.time.h;
    let oceanColor = (h >= 6 && h < 18) ? (h > 16 ? '#c23616' : '#0984e3') : '#0a3d62';
    ctx.fillStyle = oceanColor; ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); ctx.scale(camera.zoom, camera.zoom); ctx.translate(-camera.x, -camera.y);

    // Dibujar Olas usando Seno
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
    for(let i = -10; i < 10; i++) {
        ctx.beginPath();
        for(let wx = camera.x - 600; wx < camera.x + 600; wx += 40) {
            let wy = (i * 80) + Math.sin((wx * 0.02) + globalTime) * 15; // Onda
            ctx.lineTo(wx, wy);
        }
        ctx.stroke();
    }

    // 2. Balsa con Sombras
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 15;
    ctx.fillStyle = '#8B4513'; ctx.strokeStyle = '#5c2e0b'; ctx.lineWidth = 3;
    let offset = RAFT_LIMIT;
    for (let row = 0; row < RAFT_SIZE; row++) {
        for (let col = 0; col < RAFT_SIZE; col++) {
            let px = (col * TILE) - offset; let py = (row * TILE) - offset;
            ctx.fillRect(px, py, TILE, TILE); ctx.strokeRect(px, py, TILE, TILE);
        }
    }
    ctx.shadowBlur = 0; // Apagar sombras para el resto

    // 3. Flotantes Animados (Bobbing y Rotación)
    floaters.forEach(f => {
        ctx.save();
        // Bobbing: sube y baja matemáticamente usando seno
        let bobY = Math.sin(globalTime * 3 + f.offsetSeed) * 5; 
        // Rotación lenta
        let rotation = Math.sin(globalTime + f.offsetSeed) * 0.5;
        
        ctx.translate(f.x, f.y + bobY);
        ctx.rotate(rotation);
        
        if(f.isBarrel) {
            ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI*2); ctx.fill();
        } else {
            let b = ITEMS_DB[f.id];
            ctx.fillStyle = b.color; ctx.fillRect(-12, -12, 24, 24);
            ctx.fillStyle = 'white'; ctx.font = '14px Courier New'; ctx.fillText(b.symbol, -7, 4);
        }
        ctx.restore();
    });

    // 4. Estructuras (Con resaltado)
    let uid = game.hotbar[selectedSlot];
    let isHammer = (uid && game.inv.find(i => i.uid === uid)?.id === 'martillo');
    
    game.structures.forEach(s => {
        let base = ITEMS_DB[s.id];
        ctx.fillStyle = base.color; ctx.fillRect(s.x, s.y, 40, 40);
        ctx.fillStyle = 'white'; ctx.font = '18px Courier New'; ctx.fillText(base.symbol, s.x+12, s.y+26);
        
        if (isHammer) {
            ctx.strokeStyle = s.hasItems ? '#e67e22' : '#2ecc71';
            ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x+20, s.y+20, 28, 0, Math.PI*2); ctx.stroke();
        }
    });

    // 5. Jugador
    if (player.isMoving) { ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(player.targetX, player.targetY); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]); }
    
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10;
    ctx.fillStyle = game.playerConfig.color; ctx.beginPath(); ctx.arc(player.x, player.y, 16, 0, Math.PI * 2); ctx.fill(); 
    ctx.shadowBlur = 0; ctx.strokeStyle = '#000'; ctx.stroke();
    
    ctx.fillStyle = 'white'; ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(game.playerConfig.icon, player.x, player.y);

    ctx.restore();
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }