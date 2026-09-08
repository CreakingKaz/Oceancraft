const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();
let isGameRunning = false; let camera = { x: 0, y: 0, zoom: 1.5 }; let oceanPhase = 0;
let playerStats = { hp: 100, energy: 100, hunger: 100, thirst: 100, toxicity: 100 };
let floatingItems = []; let raftParticles = []; let entities = [];
let gameTime = 8 * 60; let gameDay = 1; let difficulty = 'normal';
let player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 2, icon: 'Kaz', color: '#ff4757', isMoving: false };
let tileSize = 80; let raftTiles = ['0,0', '0,1', '1,0', '1,1']; let structures = []; 
let mouseWorldX = 0, mouseWorldY = 0; let currentSaveSlot = 1;

// Weather Engine Lerp
let weather = { current: 'CLEAR', target: 'CLEAR', progress: 1.0, fogDensity: 0 };
const WEATHER_COLORS = {
    'CLEAR': { top: [2, 132, 199], bottom: [12, 74, 110] }, // #0284c7 to #0c4a6e
    'STORM': { top: [7, 89, 133], bottom: [8, 47, 73] },    // #075985 to #082f49
    'FOG':   { top: [100, 116, 139], bottom: [71, 85, 105] } // #64748b to #475569
};
let curTop = [...WEATHER_COLORS['CLEAR'].top], curBot = [...WEATHER_COLORS['CLEAR'].bottom];

// Hook Mechanic
let activeHook = null; 

// SVG Pre-renderer
const RENDER_CACHE = {};
function preRenderSVG(id, svgStr, size) {
    if(RENDER_CACHE[id]) return RENDER_CACHE[id];
    let img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    RENDER_CACHE[id] = img; return img;
}

// Menu & Initialization
window.onload = () => {
    // Populate slots
    for(let i=1; i<=3; i++) {
        let data = localStorage.getItem('oceancraft_save_'+i);
        if(data) { let p = JSON.parse(data); document.getElementById('slot-'+i).innerText = `Slot ${i}: Día ${p.gameDay} (${p.difficulty})`; }
    }
    setTimeout(() => {
        document.getElementById('loading-bar').style.width = '100%';
        setTimeout(() => { document.getElementById('loading-screen').classList.add('hidden'); document.getElementById('main-menu').classList.remove('hidden'); }, 500);
    }, 1000);
};

function startGame() {
    player.icon = document.getElementById('player-icon').value || 'Kaz'; player.color = document.getElementById('player-color').value;
    difficulty = document.getElementById('difficulty-select').value;
    document.getElementById('main-menu').classList.add('hidden'); document.getElementById('game-ui').classList.remove('hidden');
    giveItem('gancho_t1', 1); giveItem('papa', 2); hotbar[0] = inventory[0].uid; hotbar[1] = inventory[1].uid;
    renderHotbarUI(); selectSlot(0); logEvent("El océano se expande ante ti.", "event");
    isGameRunning = true; requestAnimationFrame(gameLoop);
}

function saveCurrentGame() {
    let data = { inventory, hotbar, playerStats, gameTime, gameDay, difficulty, raftTiles, structures, itemsGatheredTotal, playerIcon: player.icon, playerColor: player.color };
    localStorage.setItem('oceancraft_save_' + currentSaveSlot, JSON.stringify(data));
    showNotification("Partida Guardada en Slot " + currentSaveSlot); AudioSys.play('pop');
}
function loadGameSlot(slot) {
    let data = localStorage.getItem('oceancraft_save_' + slot);
    if(data) {
        let p = JSON.parse(data);
        inventory = p.inventory; hotbar = p.hotbar; playerStats = p.playerStats; gameTime = p.gameTime; gameDay = p.gameDay; difficulty = p.difficulty; raftTiles = p.raftTiles; structures = p.structures; itemsGatheredTotal = p.itemsGatheredTotal || 0;
        player.icon = p.playerIcon || 'Kaz'; player.color = p.playerColor || '#ff4757'; currentSaveSlot = slot;
        document.getElementById('main-menu').classList.add('hidden'); document.getElementById('game-ui').classList.remove('hidden');
        renderHotbarUI(); selectSlot(0); updateStatsUI(playerStats); isGameRunning = true; requestAnimationFrame(gameLoop);
    } else { currentSaveSlot = slot; startGame(); }
}

function die() {
    isGameRunning = false; document.getElementById('game-ui').classList.add('hidden');
    document.getElementById('death-screen').classList.remove('hidden');
    document.getElementById('death-days').innerText = gameDay; document.getElementById('death-items').innerText = itemsGatheredTotal;
    if(playerStats.hp <= 0) document.getElementById('death-cause').innerText = "Moriste de daño físico.";
    if(playerStats.toxicity <= 0) document.getElementById('death-cause').innerText = "Tu cuerpo sucumbió a la intoxicación.";
    localStorage.removeItem('oceancraft_save_' + currentSaveSlot); // Permadeath per slot
}

// Controls & Interaction
canvas.addEventListener('wheel', e => { camera.zoom = Math.max(0.4, Math.min(camera.zoom + (e.deltaY < 0 ? 0.1 : -0.1), 2.0)); });
canvas.addEventListener('mousemove', e => { mouseWorldX = (e.clientX - canvas.width / 2) / camera.zoom + camera.x; mouseWorldY = (e.clientY - canvas.height / 2) / camera.zoom + camera.y; });

function doPrimaryAction() {
    let uid = hotbar[selectedSlot]; let item = inventory.find(i => i.uid === uid);
    if (item && ITEMS_DB[item.id].cat === 'com') {
        let base = ITEMS_DB[item.id]; 
        playerStats.hunger = Math.min(100, playerStats.hunger + (base.val.h || 0)); 
        playerStats.thirst = Math.min(100, playerStats.thirst + (base.val.w || 0)); 
        if (base.val.tox) playerStats.toxicity += base.val.tox;
        removeItem(uid, 1); updateStatsUI(playerStats); logEvent(`Consumiste ${base.name}.`, 'action'); AudioSys.play('pop'); return;
    }
}

canvas.addEventListener('click', (e) => {
    if(!isGameRunning) return;
    let activeItem = hotbar[selectedSlot] ? inventory.find(i=>i.uid===hotbar[selectedSlot]) : null; let activeId = activeItem ? activeItem.id : null;
    let raftSwayX = Math.cos(oceanPhase) * 5; let raftSwayY = Math.sin(oceanPhase * 1.5) * 5;
    let localX = mouseWorldX - raftSwayX; let localY = mouseWorldY - raftSwayY;
    let gridC = Math.floor(localX / tileSize); let gridR = Math.floor(localY / tileSize); let tileKey = `${gridR},${gridC}`;

    // Structure Building & Raft Expanding
    if (ITEMS_DB[activeId] && ITEMS_DB[activeId].cat === 'est') {
        if (ITEMS_DB[activeId].buildType === 'floor') {
            if (!raftTiles.includes(tileKey)) {
                let adjacent = raftTiles.some(t => { let [r,c] = t.split(',').map(Number); return Math.abs(r-gridR) + Math.abs(c-gridC) === 1; });
                if(adjacent || raftTiles.length === 0) { raftTiles.push(tileKey); removeItem(hotbar[selectedSlot], 1); AudioSys.play('build'); logEvent("Balsa expandida.", 'action'); return; }
            }
        } else if (ITEMS_DB[activeId].buildType === 'prop') {
            if (raftTiles.includes(tileKey) && !structures.find(s => s.r === gridR && s.c === gridC)) {
                structures.push({r: gridR, c: gridC, type: activeId}); removeItem(hotbar[selectedSlot], 1); AudioSys.play('build'); logEvent("Construiste: " + ITEMS_DB[activeId].name, 'action'); return;
            }
        }
    }
    
    // Breaking
    if (activeId === 'martillo') {
        let sIdx = structures.findIndex(s => s.r === gridR && s.c === gridC);
        if (sIdx !== -1) { let removed = structures.splice(sIdx, 1)[0]; giveItem(removed.type, 1); AudioSys.play('pop'); logEvent("Desmontaste " + ITEMS_DB[removed.type].name, 'action'); return; }
        if (raftTiles.includes(tileKey) && raftTiles.length > 1) { raftTiles.splice(raftTiles.indexOf(tileKey), 1); giveItem('madera', 1); AudioSys.play('pop'); return; }
    }

    // Hook / Collection
    let clickedItemIndex = floatingItems.findIndex(i => Math.hypot(i.x - mouseWorldX, i.y - mouseWorldY) < i.size + 20);
    if (clickedItemIndex !== -1) {
        let item = floatingItems[clickedItemIndex]; let dist = Math.hypot(item.x - player.x, item.y - player.y);
        if (dist < 120) { // Near grab
            giveItem(item.type, 1); logEvent("Agarraste " + ITEMS_DB[item.type].name, 'action'); AudioSys.play('pickup'); floatingItems.splice(clickedItemIndex, 1); return;
        } else if (activeId && activeId.startsWith('gancho') && !activeHook) { // Throw Hook
            let hookStats = ITEMS_DB[activeId];
            if (dist <= hookStats.range) {
                activeHook = { x: player.x, y: player.y, tx: item.x, ty: item.y, targetIdx: clickedItemIndex, speed: hookStats.speed, state: 'thrown', type: activeId };
                AudioSys.play('throw'); return;
            }
        }
    }

    // Movement (Clamp to raft)
    if(raftTiles.includes(tileKey)) {
        player.targetX = localX; player.targetY = localY; player.isMoving = true;
    }
});

// Loops & Spawners
setInterval(() => {
    if (!isGameRunning) return;
    let mult = difficulty === 'hard' ? 1.5 : (difficulty === 'peaceful' ? 0.5 : 1);
    let emptyStats = 0; playerStats.energy -= 0.5 * mult; playerStats.hunger -= 0.8 * mult; playerStats.thirst -= 1.2 * mult; playerStats.toxicity = Math.min(100, playerStats.toxicity + 0.8);
    if (playerStats.energy <= 0) emptyStats++; if (playerStats.hunger <= 0) emptyStats++; if (playerStats.thirst <= 0) emptyStats++;
    if (emptyStats === 1) playerStats.hp -= 1; else if (emptyStats >= 2) playerStats.hp -= 3;
    updateStatsUI(playerStats); if (playerStats.toxicity <= 0 || playerStats.hp <= 0) die();
}, 2500);

setInterval(() => {
    if(!isGameRunning) return;
    let types = ['madera', 'plastico', 'hojas', 'arena', 'chatarra', 'algas'];
    if(Math.random() > 0.85) types.push('botella_vacia', 'mineral_cobre', 'mineral_hierro');
    floatingItems.push({ 
        type: types[Math.floor(Math.random() * types.length)], 
        x: camera.x + (canvas.width / camera.zoom) / 2 + 100, y: camera.y + (Math.random() - 0.5) * (canvas.height / camera.zoom) * 2, 
        size: 30, speed: 1.0 + Math.random() * 1.5, bobOffset: Math.random() * Math.PI * 2 
    });
    // Particle spawner
    if(Math.random() < 0.7) { 
        raftParticles.push({ x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200, life: 1.0, speed: -1.5 - Math.random()*2 });
    }
    // Shark Spawner (Prep for Combat)
    if(difficulty !== 'peaceful' && entities.length < 1 && Math.random() < 0.05) {
        entities.push({ type: 'shark', x: camera.x - 300, y: camera.y, targetX: camera.x, targetY: camera.y, state: 'circling', angle: 0 });
    }
}, 1200);

function lerpColor(c1, c2, t) { return [ Math.round(c1[0] + (c2[0]-c1[0])*t), Math.round(c1[1] + (c2[1]-c1[1])*t), Math.round(c1[2] + (c2[2]-c1[2])*t) ]; }

function update() {
    if (player.isMoving) {
        let dx = player.targetX - player.x; let dy = player.targetY - player.y; let dist = Math.hypot(dx, dy);
        if (dist > player.speed) { player.x += (dx / dist) * player.speed; player.y += (dy / dist) * player.speed; } else { player.x = player.targetX; player.y = player.targetY; player.isMoving = false; }
    }

    // Hook Logic
    if(activeHook) {
        let tIdx = activeHook.targetIdx; let targetItem = floatingItems[tIdx];
        if(!targetItem && activeHook.state === 'thrown') activeHook.state = 'returning'; // Item despawned
        
        if (activeHook.state === 'thrown') {
            let hdx = activeHook.tx - activeHook.x; let hdy = activeHook.ty - activeHook.y; let hDist = Math.hypot(hdx, hdy);
            if (hDist > activeHook.speed) { activeHook.x += (hdx/hDist)*activeHook.speed; activeHook.y += (hdy/hDist)*activeHook.speed; } 
            else { activeHook.state = 'returning'; AudioSys.play('splash'); }
        } else if (activeHook.state === 'returning') {
            let hdx = player.x - activeHook.x; let hdy = player.y - activeHook.y; let hDist = Math.hypot(hdx, hdy);
            if (hDist > activeHook.speed) { 
                activeHook.x += (hdx/hDist)*activeHook.speed; activeHook.y += (hdy/hDist)*activeHook.speed; 
                if(targetItem) { targetItem.x = activeHook.x; targetItem.y = activeHook.y; targetItem.speed = 0; }
            } 
            else { 
                if(targetItem) { giveItem(targetItem.type, 1); logEvent("Enganchaste " + ITEMS_DB[targetItem.type].name, 'action'); AudioSys.play('pickup'); floatingItems.splice(tIdx, 1); }
                activeHook = null; 
            }
        }
    }

    floatingItems.forEach((f, index) => { f.x -= f.speed; if (f.x < camera.x - (canvas.width / camera.zoom) / 2 - 200) floatingItems.splice(index, 1); });
    raftParticles.forEach((p, index) => { p.x += p.speed; p.life -= 0.015; if(p.life <= 0) raftParticles.splice(index, 1); });
    
    // Entities
    entities.forEach(e => {
        if(e.type === 'shark') {
            e.angle += 0.01; e.targetX = Math.cos(e.angle)*250; e.targetY = Math.sin(e.angle)*250;
            e.x += (e.targetX - e.x) * 0.02; e.y += (e.targetY - e.y) * 0.02;
        }
    });

    let nearWork = false; let nearFurnace = false;
    structures.forEach(s => { let px = (s.c * tileSize) + tileSize/2; let py = (s.r * tileSize) + tileSize/2; if(Math.hypot(player.x - px, player.y - py) < tileSize * 1.5) { if(s.type === 'mesa_trabajo') nearWork = true; if(s.type === 'horno') nearFurnace = true; } });
    document.getElementById('btn-craft-work').style.display = nearWork ? 'flex' : 'none'; document.getElementById('btn-craft-furnace').style.display = nearFurnace ? 'flex' : 'none';
    
    // Time & Weather
    gameTime += 0.15; if(gameTime >= 24 * 60) { gameTime = 0; gameDay++; document.getElementById('ui-day').innerText = gameDay; logEvent("¡Día " + gameDay + "!", "event"); }
    document.getElementById('ui-clock').innerText = `${Math.floor(gameTime / 60).toString().padStart(2,'0')}:${Math.floor(gameTime % 60).toString().padStart(2,'0')}`;
    
    if(Math.random() < 0.0005) { 
        let weathers = ['CLEAR', 'STORM', 'FOG'];
        weather.target = weathers[Math.floor(Math.random()*weathers.length)];
        if(difficulty === 'peaceful' && weather.target === 'STORM') weather.target = 'CLEAR';
        weather.progress = 0; if (weather.target !== 'CLEAR') logEvent("Cambio de clima...", "danger"); 
    }
    
    if (weather.progress < 1.0) {
        weather.progress += 0.002;
        curTop = lerpColor(curTop, WEATHER_COLORS[weather.target].top, weather.progress);
        curBot = lerpColor(curBot, WEATHER_COLORS[weather.target].bottom, weather.progress);
        weather.fogDensity += (weather.target === 'FOG' ? 0.005 : -0.005); weather.fogDensity = Math.max(0, Math.min(0.7, weather.fogDensity));
    } else { weather.current = weather.target; }
    
    oceanPhase += weather.current === 'STORM' ? 0.08 : 0.04;
    camera.x += ((player.x + Math.cos(oceanPhase)*5) - camera.x) * 0.08; camera.y += ((player.y + Math.sin(oceanPhase*1.5)*5) - camera.y) * 0.08;
}

function draw() {
    let grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, canvas.width);
    grad.addColorStop(0, `rgb(${curTop[0]},${curTop[1]},${curTop[2]})`); grad.addColorStop(1, `rgb(${curBot[0]},${curBot[1]},${curBot[2]})`);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save(); ctx.translate(canvas.width / 2, canvas.height / 2); ctx.scale(camera.zoom, camera.zoom); ctx.translate(-camera.x, -camera.y);
    
    // Wave lines
    ctx.strokeStyle = `rgba(255,255,255,${weather.current === 'STORM' ? 0.15 : 0.05})`; ctx.lineWidth = 2;
    for(let i = -1000; i < 1000; i += 100) { ctx.beginPath(); for(let j = -1000; j < 1000; j += 50) ctx.lineTo(j, i + Math.sin((j + oceanPhase * 150)*0.01)*20); ctx.stroke(); }
    
    // Items
    floatingItems.forEach(item => {
        let bob = Math.sin(oceanPhase * 2 + item.bobOffset) * (weather.current==='STORM'? 10: 5);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(item.x, item.y + 10, item.size/2, 0, Math.PI*2); ctx.fill();
        let base = ITEMS_DB[item.type]; let img = preRenderSVG(item.type, base.svg, item.size);
        if(img.complete) ctx.drawImage(img, item.x - item.size/2, item.y + bob - item.size/2, item.size, item.size);
    });

    // Hook Render
    if(activeHook) {
        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(activeHook.x, activeHook.y); ctx.stroke();
        let hBase = ITEMS_DB[activeHook.type]; let hImg = preRenderSVG(activeHook.type, hBase.svg, 30);
        if(hImg.complete) { ctx.save(); ctx.translate(activeHook.x, activeHook.y); ctx.rotate(Math.atan2(activeHook.y - player.y, activeHook.x - player.x)); ctx.drawImage(hImg, -15, -15, 30, 30); ctx.restore(); }
    }

    // Entities (Sharks)
    entities.forEach(e => {
        if(e.type === 'shark') {
            ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle);
            ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-20, 15); ctx.lineTo(-20, -15); ctx.fill(); // Simple fin/body
            ctx.restore();
        }
    });

    // Raft Rendering
    let raftSwayX = Math.cos(oceanPhase) * 5; let raftSwayY = Math.sin(oceanPhase * 1.5) * 5; ctx.save(); ctx.translate(raftSwayX, raftSwayY);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; raftParticles.forEach(p => { ctx.beginPath(); ctx.ellipse(p.x, p.y, 8 * p.life, 3 * p.life, 0, 0, Math.PI*2); ctx.fill(); });
    
    raftTiles.forEach(t => {
        let [r,c] = t.split(',').map(Number); let px = c * tileSize; let py = r * tileSize;
        ctx.fillStyle = '#b45309'; ctx.fillRect(px, py, tileSize, tileSize); ctx.fillStyle = '#92400e'; ctx.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.strokeRect(px, py, tileSize, tileSize);
    });
    
    structures.forEach(s => { 
        let px = s.c * tileSize; let py = s.r * tileSize; let base = ITEMS_DB[s.type]; let img = preRenderSVG(s.type, base.svg, tileSize);
        if(img.complete) ctx.drawImage(img, px + 10, py + 10, tileSize-20, tileSize-20); 
    });

    // Build Preview
    let activeItem = hotbar[selectedSlot] ? inventory.find(i=>i.uid===hotbar[selectedSlot]) : null; let activeId = activeItem ? activeItem.id : null;
    let localX = mouseWorldX - raftSwayX; let localY = mouseWorldY - raftSwayY; let hoverC = Math.floor(localX / tileSize); let hoverR = Math.floor(localY / tileSize); let hoverKey = `${hoverR},${hoverC}`;
    
    if (ITEMS_DB[activeId] && ITEMS_DB[activeId].cat === 'est') {
        let px = hoverC * tileSize; let py = hoverR * tileSize;
        let canBuild = false;
        if(ITEMS_DB[activeId].buildType === 'floor') canBuild = !raftTiles.includes(hoverKey) && raftTiles.some(t => { let [r,c] = t.split(',').map(Number); return Math.abs(r-hoverR) + Math.abs(c-hoverC) === 1; });
        if(ITEMS_DB[activeId].buildType === 'prop') canBuild = raftTiles.includes(hoverKey) && !structures.find(s => s.r === hoverR && s.c === hoverC);
        ctx.fillStyle = canBuild ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'; ctx.fillRect(px, py, tileSize, tileSize);
    } else if (activeId === 'martillo') {
        let px = hoverC * tileSize; let py = hoverR * tileSize;
        if(structures.find(s => s.r === hoverR && s.c === hoverC) || raftTiles.includes(hoverKey)) {
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+tileSize,py+tileSize); ctx.moveTo(px+tileSize,py); ctx.lineTo(px,py+tileSize); ctx.stroke();
        }
    }

    // Player
    if (player.isMoving) { ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(player.targetX, player.targetY); ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(245, 158, 11, 0.8)'; ctx.beginPath(); ctx.arc(player.targetX, player.targetY, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(player.x, player.y + 15, 18, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = player.color; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(player.x, player.y, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Nunito'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(player.icon, player.x, player.y); 
    ctx.restore(); ctx.restore();
    
    // Overlays (Night & Fog)
    let hour = gameTime / 60; let darkness = hour < 5 || hour >= 20 ? 0.6 : (hour >= 5 && hour < 7 ? 0.6 - ((hour - 5) / 2) * 0.6 : (hour >= 18 && hour < 20 ? ((hour - 18) / 2) * 0.6 : 0)); 
    if (darkness > 0 || weather.fogDensity > 0 || weather.current === 'STORM') { 
        let dVal = Math.min(0.8, darkness + (weather.current === 'STORM' ? 0.3 : 0));
        if(dVal > 0) { ctx.fillStyle = `rgba(10, 15, 30, ${dVal})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        if(weather.fogDensity > 0) { ctx.fillStyle = `rgba(148, 163, 184, ${weather.fogDensity})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    }
}
function gameLoop() { update(); draw(); if(isGameRunning) requestAnimationFrame(gameLoop); }