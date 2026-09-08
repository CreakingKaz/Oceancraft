const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();
let isGameRunning = false; let camera = { x: 0, y: 0, zoom: 1.5 }; let oceanPhase = 0;
let playerStats = { hp: 100, energy: 100, hunger: 100, thirst: 100, toxicity: 0 };
let floatingItems = []; let raftParticles = []; let islands = []; let entities = [];
let gameTime = 8 * 60; let gameDay = 1; let difficulty = 'normal';
let player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 2.5, icon: 'Kaz', color: '#ff4757', textColor: '#ffffff', isMoving: false, anim: 0 };
let tileSize = 80; let raftTiles = ['0,0', '0,1', '1,0', '1,1']; let structures = []; // {r,c,type,hp,inv}
let mouseWorldX = 0, mouseWorldY = 0; let activeHook = null; 

// SVG Caching for Performance
const RENDER_CACHE = {};
function getRenderedSVG(id, svgStr, size) {
    let cacheKey = id + '_' + size;
    if(RENDER_CACHE[cacheKey]) return RENDER_CACHE[cacheKey];
    let img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    RENDER_CACHE[cacheKey] = img; return img;
}

function doPrimaryAction() {
    let uid = hotbar[selectedSlot]; let item = inventory.find(i => i.uid === uid);
    if (!item) return;
    let base = ITEMS_DB[item.id];
    
    // Consumables
    if (base.cat === 'com') {
        playerStats.hunger = Math.min(100, playerStats.hunger + (base.val.h || 0)); 
        playerStats.thirst = Math.min(100, playerStats.thirst + (base.val.w || 0)); 
        removeItemByUID(uid, 1); updateStatsUI(playerStats); logEvent(`Consumiste ${base.name}.`, 'action'); AudioSys.play('pop'); return;
    }
}

canvas.addEventListener('click', (e) => {
    if(!isGameRunning) return;
    let uid = hotbar[selectedSlot]; let activeItem = uid ? inventory.find(i=>i.uid===uid) : null; let activeId = activeItem ? activeItem.id : null;
    let raftSwayX = Math.cos(oceanPhase) * 5; let raftSwayY = Math.sin(oceanPhase * 1.5) * 5;
    let localX = mouseWorldX - raftSwayX; let localY = mouseWorldY - raftSwayY;
    let gridC = Math.floor(localX / tileSize); let gridR = Math.floor(localY / tileSize); let tileKey = `${gridR},${gridC}`;

    // Structure Building
    if (activeId && ITEMS_DB[activeId].cat === 'est') {
        let hasHammer = inventory.some(i => i.id === 'martillo');
        if(!hasHammer) return showNotification("Necesitas un Martillo en el inventario para construir.");
        
        let base = ITEMS_DB[activeId];
        if (base.buildType === 'floor' && !raftTiles.includes(tileKey)) {
            let adjacent = raftTiles.some(t => { let [r,c] = t.split(',').map(Number); return Math.abs(r-gridR) + Math.abs(c-gridC) === 1; });
            if(adjacent || raftTiles.length === 0) { 
                raftTiles.push(tileKey); structures.push({r: gridR, c: gridC, type: activeId, hp: base.hp || 3, inv: []});
                removeItemByUID(uid, 1); AudioSys.play('build'); return; 
            }
        } else if (base.buildType === 'prop' && raftTiles.includes(tileKey) && !structures.find(s => s.r === gridR && s.c === gridC && ITEMS_DB[s.type].buildType === 'prop')) {
            structures.push({r: gridR, c: gridC, type: activeId, inv: []}); removeItemByUID(uid, 1); AudioSys.play('build'); return;
        }
    }
    
    // Breaking
    if (activeId === 'martillo') {
        // Try breaking prop first
        let propIdx = structures.findIndex(s => s.r === gridR && s.c === gridC && ITEMS_DB[s.type].buildType === 'prop');
        if (propIdx !== -1) { 
            if(structures[propIdx].inv && structures[propIdx].inv.length > 0) return showNotification("Vacía el cofre primero.");
            let removed = structures.splice(propIdx, 1)[0]; giveItem(removed.type, 1); AudioSys.play('break'); return; 
        }
        // Try breaking floor
        if (raftTiles.includes(tileKey) && raftTiles.length > 1) { 
            let floorIdx = structures.findIndex(s => s.r === gridR && s.c === gridC && ITEMS_DB[s.type].buildType === 'floor');
            if(floorIdx !== -1) { let rem = structures.splice(floorIdx, 1)[0]; giveItem(rem.type, 1); }
            else { giveItem('madera', 1); } // Legacy plain tile
            raftTiles.splice(raftTiles.indexOf(tileKey), 1); AudioSys.play('break'); return; 
        }
    }

    // Water Scooping
    if (activeId === 'botella_vacia' && !raftTiles.includes(tileKey) && Math.hypot(player.x - localX, player.y - localY) < 150) {
        removeItemByUID(uid, 1); giveItem('agua_salada', 1); AudioSys.play('splash'); logEvent("Llenaste la botella.", 'action'); return;
    }

    // Hook logic & Movement
    if (activeId && activeId.startsWith('gancho') && !activeHook && !raftTiles.includes(tileKey)) {
        let hookStats = ITEMS_DB[activeId];
        let hdx = mouseWorldX - player.x; let hdy = mouseWorldY - player.y; let hDist = Math.hypot(hdx, hdy);
        if(hDist > hookStats.range) { hdx = (hdx/hDist)*hookStats.range; hdy = (hdy/hDist)*hookStats.range; }
        activeHook = { x: player.x, y: player.y, tx: player.x + hdx, ty: player.y + hdy, speed: hookStats.speed, state: 'thrown', type: activeId, caught: [] };
        AudioSys.play('click'); return; // Pretend throw sound
    }

    // Movement (Clamp to raft)
    if(raftTiles.includes(tileKey)) {
        player.targetX = localX; player.targetY = localY; player.isMoving = true; AudioSys.play('click');
    }
});

// Main Loops
setInterval(() => {
    if (!isGameRunning) return;
    let mult = difficulty === 'hard' ? 1.5 : (difficulty === 'peaceful' ? 0.5 : 1);
    let emptyStats = 0; playerStats.energy -= 0.5 * mult; playerStats.hunger -= 0.8 * mult; playerStats.thirst -= 1.2 * mult;
    if (playerStats.energy <= 0) emptyStats++; if (playerStats.hunger <= 0) emptyStats++; if (playerStats.thirst <= 0) emptyStats++;
    if (emptyStats === 1) playerStats.hp -= 1; else if (emptyStats >= 2) playerStats.hp -= 3;
    updateStatsUI(playerStats); 
    if (playerStats.hp <= 0) { isGameRunning=false; location.reload(); } // Fast reload for demo
}, 2500);

// Spawners
setInterval(() => {
    if(!isGameRunning) return;
    if(floatingItems.length < 50) {
        let types = ['madera', 'plastico', 'hojas', 'chatarra'];
        floatingItems.push({ type: types[Math.floor(Math.random() * types.length)], x: camera.x + (canvas.width / camera.zoom) / 2 + 100, y: camera.y + (Math.random() - 0.5) * (canvas.height / camera.zoom) * 2, size: 30, speed: 1.0 + Math.random() * 1.5, bobOffset: Math.random() * Math.PI * 2 });
    }
    // Islands gen
    if(islands.length < 3 && Math.random() < 0.1 && difficulty !== 'low') {
        islands.push({x: camera.x + 2000, y: camera.y + (Math.random()-0.5)*1000, r: 150 + Math.random()*200});
    }
}, 1000);

function update() {
    if (player.isMoving) {
        let dx = player.targetX - player.x; let dy = player.targetY - player.y; let dist = Math.hypot(dx, dy);
        if (dist > player.speed) { player.x += (dx / dist) * player.speed; player.y += (dy / dist) * player.speed; player.anim += 0.2;} else { player.x = player.targetX; player.y = player.targetY; player.isMoving = false; player.anim = 0;}
    }

    // Hook Logic (Multi-catch)
    if(activeHook) {
        if (activeHook.state === 'thrown') {
            let hdx = activeHook.tx - activeHook.x; let hdy = activeHook.ty - activeHook.y; let hDist = Math.hypot(hdx, hdy);
            if (hDist > activeHook.speed) { activeHook.x += (hdx/hDist)*activeHook.speed; activeHook.y += (hdy/hDist)*activeHook.speed; } 
            else { activeHook.state = 'returning'; AudioSys.play('splash'); }
        } else if (activeHook.state === 'returning') {
            let hdx = player.x - activeHook.x; let hdy = player.y - activeHook.y; let hDist = Math.hypot(hdx, hdy);
            
            // Culling/Collision Check for Hook
            for(let i = floatingItems.length - 1; i >= 0; i--) {
                if(Math.hypot(floatingItems[i].x - activeHook.x, floatingItems[i].y - activeHook.y) < 30) {
                    activeHook.caught.push(floatingItems.splice(i, 1)[0]);
                }
            }
            activeHook.caught.forEach(c => { c.x = activeHook.x; c.y = activeHook.y; });

            if (hDist > activeHook.speed) { activeHook.x += (hdx/hDist)*activeHook.speed; activeHook.y += (hdy/hDist)*activeHook.speed; } 
            else { 
                if(activeHook.caught.length > 0) { AudioSys.play('pickup'); activeHook.caught.forEach(c => { giveItem(c.type, 1); logEvent("Agarraste " + ITEMS_DB[c.type].name, 'action'); }); renderHotbarUI(); }
                activeHook = null; 
            }
        }
    }

    // Culling array cleanup
    let viewRadius = (canvas.width / camera.zoom) * 0.8;
    for(let i = floatingItems.length - 1; i >= 0; i--) {
        floatingItems[i].x -= floatingItems[i].speed;
        if(floatingItems[i].x < camera.x - viewRadius) floatingItems.splice(i, 1);
    }
    for(let i = islands.length - 1; i >= 0; i--) { islands[i].x -= 0.5; if(islands[i].x < camera.x - 3000) islands.splice(i, 1); }
    
    // Proximity to tables
    let nearWork = false; let nearFurnace = false;
    structures.forEach(s => { 
        let px = (s.c * tileSize) + tileSize/2; let py = (s.r * tileSize) + tileSize/2; 
        if(Math.hypot(player.x - px, player.y - py) < tileSize * 1.5) { if(s.type === 'mesa_trabajo') nearWork = true; } 
    });
    document.getElementById('btn-craft-work').style.display = nearWork ? 'flex' : 'none';
    
    // Camera follow & Time
    oceanPhase += 0.05; gameTime += 0.2; if(gameTime >= 24 * 60) { gameTime = 0; gameDay++; document.getElementById('ui-day').innerText = gameDay; }
    document.getElementById('ui-clock').innerText = `${Math.floor(gameTime / 60).toString().padStart(2,'0')}:${Math.floor(gameTime % 60).toString().padStart(2,'0')}`;
    camera.x += ((player.x + Math.cos(oceanPhase)*5) - camera.x) * 0.1; camera.y += ((player.y + Math.sin(oceanPhase*1.5)*5) - camera.y) * 0.1;
}

function draw() {
    ctx.fillStyle = '#0284c7'; ctx.fillRect(0, 0, canvas.width, canvas.height); // Optimized clear
    ctx.save(); ctx.translate(canvas.width / 2, canvas.height / 2); ctx.scale(camera.zoom, camera.zoom); ctx.translate(-camera.x, -camera.y);
    
    let viewRadiusSq = Math.pow((canvas.width / camera.zoom) * 0.8, 2);

    // Render Islands
    islands.forEach(isl => {
        if(Math.pow(isl.x - camera.x, 2) + Math.pow(isl.y - camera.y, 2) > Math.pow(viewRadiusSq + isl.r, 2)) return; // Cull
        ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(isl.x, isl.y, isl.r, 0, Math.PI*2); ctx.fill(); // Sand
        ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(isl.x, isl.y, isl.r*0.7, 0, Math.PI*2); ctx.fill(); // Grass
    });

    // Render Items
    floatingItems.forEach(item => {
        if(Math.pow(item.x - camera.x, 2) + Math.pow(item.y - camera.y, 2) > viewRadiusSq) return; // Cull
        let bob = Math.sin(oceanPhase * 2 + item.bobOffset) * 5;
        let base = ITEMS_DB[item.type]; let img = getRenderedSVG(item.type, base.svg, item.size);
        if(img.complete) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(item.x, item.y + 10, item.size/2, 0, Math.PI*2); ctx.fill();
            ctx.drawImage(img, item.x - item.size/2, item.y + bob - item.size/2, item.size, item.size);
        }
    });

    // Hook Render
    if(activeHook) {
        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(activeHook.x, activeHook.y); ctx.stroke();
        let hBase = ITEMS_DB[activeHook.type]; let hImg = getRenderedSVG(activeHook.type, hBase.svg, 30);
        if(hImg.complete) { ctx.save(); ctx.translate(activeHook.x, activeHook.y); ctx.rotate(Math.atan2(activeHook.y - player.y, activeHook.x - player.x)); ctx.drawImage(hImg, -15, -15, 30, 30); ctx.restore(); }
        activeHook.caught.forEach(c => { let img = getRenderedSVG(c.type, ITEMS_DB[c.type].svg, 20); if(img.complete) ctx.drawImage(img, activeHook.x-10, activeHook.y-10, 20, 20); });
    }

    // Raft Rendering
    let raftSwayX = Math.cos(oceanPhase) * 5; let raftSwayY = Math.sin(oceanPhase * 1.5) * 5; ctx.save(); ctx.translate(raftSwayX, raftSwayY);
    
    // Draw floors
    structures.filter(s => ITEMS_DB[s.type].buildType === 'floor').forEach(s => {
        let px = s.c * tileSize; let py = s.r * tileSize; let base = ITEMS_DB[s.type]; let img = getRenderedSVG(s.type, base.svg, tileSize);
        if(img.complete) ctx.drawImage(img, px, py, tileSize, tileSize);
        // Damage cracks
        if(s.hp < base.hp) {
            ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(px+10, py+10); ctx.lineTo(px+30, py+40); ctx.lineTo(px+70, py+50); ctx.stroke();
            if(s.hp === 1) { ctx.moveTo(px+70, py+20); ctx.lineTo(px+40, py+40); ctx.lineTo(px+20, py+70); ctx.stroke(); }
        }
    });
    
    // Draw props
    structures.filter(s => ITEMS_DB[s.type].buildType === 'prop').forEach(s => { 
        let px = s.c * tileSize; let py = s.r * tileSize; let base = ITEMS_DB[s.type]; let img = getRenderedSVG(s.type, base.svg, tileSize);
        if(img.complete) ctx.drawImage(img, px + 10, py + 10, tileSize-20, tileSize-20); 
        if (base.name.includes("Cofre")) {
            ctx.fillStyle = (s.inv && s.inv.length >= 5) ? '#ef4444' : (s.inv && s.inv.length > 0 ? '#f59e0b' : 'transparent');
            if(ctx.fillStyle !== 'transparent') { ctx.beginPath(); ctx.arc(px+tileSize/2, py-10, 5, 0, Math.PI*2); ctx.fill(); }
        }
    });

    // Player & Held Items
    let activeItem = hotbar[selectedSlot] ? inventory.find(i=>i.uid===hotbar[selectedSlot]) : null;
    let bobY = Math.sin(player.anim)*5;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(player.x, player.y + 15, 18, 0, Math.PI*2); ctx.fill(); 
    ctx.fillStyle = player.color; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(player.x, player.y + bobY, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); 
    ctx.fillStyle = player.textColor || '#ffffff'; ctx.font = 'bold 14px Nunito'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(player.icon, player.x, player.y + bobY); 
    
    // Draw held item model
    if(activeItem && ITEMS_DB[activeItem.id].cat === 'herr') {
        let hImg = getRenderedSVG(activeItem.id, ITEMS_DB[activeItem.id].svg, 30);
        if(hImg.complete) {
            ctx.save(); ctx.translate(player.x + 20, player.y + bobY); 
            if(activeHook) ctx.rotate(Math.atan2(activeHook.ty - player.y, activeHook.tx - player.x));
            ctx.drawImage(hImg, -15, -15, 30, 30); ctx.restore();
        }
    }
    
    ctx.restore(); ctx.restore();
}
function gameLoop() { update(); draw(); if(isGameRunning) requestAnimationFrame(gameLoop); }