let activeModal = null;
let selectedSlot = 0;

/* === GUARDADO Y UI === */
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
        // Compatibilidad por si la partida vieja no tenía HP o estructuras
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

/* === TIEMPO Y SISTEMA DE VIDA EN TIEMPO REAL === */
let lastHpDrain = Date.now();

function updateRealTimeSystems() {
    let now = Date.now();
    // Drenaje de vida cada 2.3s
    if (now - lastHpDrain >= 2300) {
        lastHpDrain = now;
        let emptyStats = 0;
        if (game.stats.h <= 0) emptyStats++;
        if (game.stats.s <= 0) emptyStats++;
        if (game.stats.su <= 0) emptyStats++;
        
        if (emptyStats === 3) game.stats.hp = 0; // Instakill
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

/* === INVENTARIO, HOTBAR Y ACCIONES === */
let currentInvTab = 'todo'; let currentCraftTab = 'todo'; let selectedInvUID = null;
function toggleMenu(id) {
    if(activeModal && activeModal !== id) document.getElementById(activeModal).classList.add('hidden');
    let el = document.getElementById(id);
    if(el.classList.contains('hidden')) { el.classList.remove('hidden'); activeModal = id; if(id === 'inventory-modal') renderInv(); if(id === 'craft-modal') renderCraft(); } 
    else { el.classList.add('hidden'); activeModal = null; }
}

function setInvTab(tab) { currentInvTab = tab; renderInv(); }
function setCraftTab(tab) { currentCraftTab = tab; renderCraft(); }

function renderInv() {
    document.getElementById('inv-count').innerText = game.inv.length;
    let grid = document.getElementById('inv-grid'); grid.innerHTML = '';
    document.querySelectorAll('#inventory-modal .tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`#inventory-modal .tab[onclick*="${currentInvTab}"]`).classList.add('active');
    
    let filtered = game.inv.filter(i => currentInvTab === 'todo' || ITEMS_DB[i.id].cat === currentInvTab);
    filtered.forEach(item => {
        let base = ITEMS_DB[item.id];
        let div = document.createElement('div'); div.className = 'inv-item'; div.style.background = base.color; div.innerText = base.symbol;
        if(base.cat !== 'herr') div.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
        else div.innerHTML += `<div class="durability-bar" style="width: ${(item.dur/base.maxDur)*100}%"></div>`;
        
        div.onclick = () => {
            selectedInvUID = item.uid; document.getElementById('lore-text').innerHTML = `<strong>${base.name}</strong><br>${base.desc}`;
            document.getElementById('lore-actions').innerHTML = `<button class="btn-small" onclick="equip(0)">Eq.1</button> <button class="btn-small" onclick="equip(1)">Eq.2</button> <button class="btn-small" onclick="equip(2)">Eq.3</button>`;
        };
        grid.appendChild(div);
    });
}

function equip(slot) { game.hotbar[slot] = selectedInvUID; renderHotbar(); }

function selectSlot(idx) {
    document.querySelectorAll('.hotbar-slot').forEach(el => el.classList.remove('selected'));
    document.getElementById('slot-' + idx).classList.add('selected');
    selectedSlot = idx;
    let uid = game.hotbar[idx];
    let btn = document.getElementById('action-btn');
    if(!uid || !game.inv.find(i => i.uid === uid)) btn.innerText = "Buscar a mano";
    else {
        let item = game.inv.find(i => i.uid === uid);
        let base = ITEMS_DB[item.id];
        if(base.isWeapon) btn.innerText = updateCombatBtnText(item, base);
        else btn.innerText = base.action || "Usar";
    }
}

function renderHotbar() {
    for(let i=0; i<3; i++) {
        let s = document.getElementById('slot-'+i); s.innerHTML = '';
        let uid = game.hotbar[i]; let item = game.inv.find(x => x.uid === uid);
        if(item) {
            let base = ITEMS_DB[item.id];
            s.style.background = base.color; s.innerText = base.symbol;
            if(base.cat !== 'herr') s.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
            else s.innerHTML += `<div class="durability-bar" style="width: ${(item.dur/base.maxDur)*100}%"></div>`;
        } else s.style.background = 'rgba(34,34,34,var(--ui-opacity))';
    }
    selectSlot(selectedSlot);
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
        
        if (base.isWeapon) {
            handleCombatAction(item, base);
            advanceTime({h:2, s:3, su:1});
        }
        else if (base.cat === 'herr') {
            advanceTime({h:4, s:6, su:2});
            if(item.id === 'gancho_t1') {
                if(Math.random() > 0.4) { let loot = ['madera','plastico','chatarra'][Math.floor(Math.random()*3)]; giveItem(loot, 1); notify("+1 " + ITEMS_DB[loot].name); } 
                else notify("Gancho regresó vacío.");
            }
            if(item.id === 'martillo') {
                notify("Modo Construcción Activo. Haz clic en la balsa o estructuras.");
                return; // El martillo gasta durabilidad al usarlo en el click, no aquí.
            }
            item.dur--; if(item.dur <= 0) { removeItem(item.uid, 1); notify(base.name + " se ha roto."); }
            renderHotbar(); renderInv();
        } else if (base.cat === 'com') {
            game.stats.h = Math.min(100, game.stats.h + base.val.h); game.stats.s = Math.min(100, game.stats.s + base.val.s);
            removeItem(item.uid, 1); notify("Consumiste " + base.name); renderHotbar(); renderInv(); updateHUD();
        } else if (base.cat === 'est') {
            window.pendingStructure = item;
            notify("Haz clic en la balsa para colocar " + base.name);
        }
    }
}

/* === CRAFTEO === */
function renderCraft() {
    let list = document.getElementById('craft-list'); list.innerHTML = '';
    document.querySelectorAll('#craft-modal .tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`#craft-modal .tab[onclick*="${currentCraftTab}"]`).classList.add('active');

    RECIPES.forEach(rec => {
        let base = ITEMS_DB[rec.id];
        if(currentCraftTab !== 'todo' && base.cat !== currentCraftTab) return;
        let canCraft = true; let reqTxt = '';
        for(let k in rec.req) { let has = countItem(k); if(has < rec.req[k]) canCraft = false; reqTxt += `${ITEMS_DB[k].symbol}${has}/${rec.req[k]} `; }
        let div = document.createElement('div'); div.className = 'recipe-row'; div.style.opacity = canCraft ? '1' : '0.5';
        div.innerHTML = `<div class="inv-item" style="background:${base.color}; width:50px; height:50px;">${base.symbol}</div><div><strong>${base.name}</strong><br><span style="font-size:12px">${reqTxt}</span></div>`;
        div.onclick = () => { document.getElementById('craft-lore-text').innerText = base.desc; document.getElementById('craft-actions').innerHTML = `<button class="btn" ${canCraft?'':'disabled'} onclick="doCraft('${rec.id}')">Fabricar</button>`; };
        list.appendChild(div);
    });
}

function doCraft(id) {
    let rec = RECIPES.find(r => r.id === id);
    for(let k in rec.req) {
        let rem = rec.req[k];
        for (let i = game.inv.length - 1; i >= 0; i--) {
            if (game.inv[i].id === k) { let take = Math.min(game.inv[i].qty, rem); removeItem(game.inv[i].uid, take); rem -= take; if (rem <= 0) break; }
        }
    }
    giveItem(id, 1); advanceTime({h:2, s:2, su:0}); notify("Crafteado: " + ITEMS_DB[id].name); renderCraft(); renderInv(); renderHotbar();
}

/* === MOTOR CANVAS (Movimiento, Balsa, Clima, Estructuras) === */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

let isGameRunning = false;
let camera = { x: 0, y: 0, zoom: 1.5 };
let player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 2, isMoving: false, icon: 'Kaz', color: '#e74c3c' };
let floaters = []; 
let rainParticles = []; // Efecto de tormenta
let isStorming = false;

canvas.addEventListener('click', (e) => {
    if(!isGameRunning || activeModal) return;
    const worldX = (e.clientX - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (e.clientY - canvas.height / 2) / camera.zoom + camera.y;

    // Verificar clic en Estructuras si tenemos Martillo
    let uid = game.hotbar[selectedSlot];
    let isHammer = (uid && game.inv.find(i => i.uid === uid)?.id === 'martillo');
    
    for(let i=0; i<game.structures.length; i++) {
        let s = game.structures[i];
        if(worldX >= s.x && worldX <= s.x+40 && worldY >= s.y && worldY <= s.y+40) {
            if(isHammer) {
                // Lógica de desarme
                let baseSt = ITEMS_DB[s.id];
                if(s.hasItems) {
                    notify("No puedes romper un " + baseSt.name + " lleno.");
                } else {
                    giveItem(s.id, 1);
                    game.structures.splice(i, 1);
                    notify(baseSt.name + " recogido.");
                    // Gastar durabilidad del martillo
                    let hammer = game.inv.find(i => i.uid === uid);
                    hammer.dur -= 5;
                    if(hammer.dur <= 0) { removeItem(hammer.uid, 1); notify("Martillo roto."); renderHotbar(); }
                }
            } else {
                notify("Interactuando con " + ITEMS_DB[s.id].name);
            }
            return;
        }
    }

    // Colocar Estructura Pendiente
    if (window.pendingStructure) {
        game.structures.push({
            id: window.pendingStructure.id, x: worldX - 20, y: worldY - 20,
            hasItems: (window.pendingStructure.id === 'cofre' ? false : false) // Por defecto
        });
        removeItem(window.pendingStructure.uid, 1);
        notify(ITEMS_DB[window.pendingStructure.id].name + " colocado.");
        window.pendingStructure = null; renderHotbar(); renderInv();
        return;
    }

    // Recoger Barriles/Flotantes
    for(let i = floaters.length -1; i >= 0; i--) {
        let f = floaters[i];
        if(worldX >= f.x && worldX <= f.x+f.w && worldY >= f.y && worldY <= f.y+f.h) {
            if(f.isBarrel) {
                let r1 = ['madera','plastico'][Math.floor(Math.random()*2)];
                let r2 = ['chatarra','cuerda'][Math.floor(Math.random()*2)];
                giveItem(r1, 2); giveItem(r2, 1); giveItem('papa', 1);
                notify(`Barril: 2 ${ITEMS_DB[r1].name}, 1 ${ITEMS_DB[r2].name}, 1 Papa`);
            } else { giveItem(f.id, 1); notify("Recogiste " + ITEMS_DB[f.id].name); }
            floaters.splice(i, 1); advanceTime({h:1, s:2, su:1}); return;
        }
    }
    
    // Mover
    player.targetX = worldX; player.targetY = worldY; player.isMoving = true;
});

function update() {
    updateRealTimeSystems(); // Vida

    // Tormentas Aleatorias
    isStorming = (game.time.h > 12 && game.time.h < 15); // Tormenta al mediodía para probar
    
    if(isStorming && Math.random() < 0.2) {
        rainParticles.push({ x: camera.x + (Math.random()*canvas.width - canvas.width/2)/camera.zoom, y: camera.y - canvas.height/camera.zoom, speed: Math.random()*5 + 10 });
    }
    rainParticles.forEach(p => { p.y += p.speed; p.x -= p.speed/2; });
    rainParticles = rainParticles.filter(p => p.y < camera.y + canvas.height/camera.zoom);

    // Flotantes y Barriles (Ahora incluye plásticos reales)
    if(Math.random() < 0.008) {
        let isBarrel = Math.random() > 0.8;
        let ids = ['madera', 'plastico', 'hojas', 'chatarra'];
        floaters.push({
            id: isBarrel ? 'barrel' : ids[Math.floor(Math.random()*ids.length)],
            isBarrel: isBarrel,
            x: camera.x + (canvas.width/camera.zoom), y: camera.y + (Math.random()*600 - 300),
            w: isBarrel ? 35 : 20, h: isBarrel ? 35 : 20, speed: Math.random()*0.8 + 0.3
        });
    }
    floaters.forEach(f => f.x -= f.speed);
    floaters = floaters.filter(f => f.x > camera.x - (canvas.width/camera.zoom) - 200);

    // Balsa Colisión Básica (El jugador no puede salir de la zona central por ahora)
    if (player.isMoving) {
        let dx = player.targetX - player.x; let dy = player.targetY - player.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > player.speed) { player.x += (dx / distance) * player.speed; player.y += (dy / distance) * player.speed; }
        else { player.x = player.targetX; player.y = player.targetY; player.isMoving = false; }
    }
    camera.x += (player.x - camera.x) * 0.1; camera.y += (player.y - camera.y) * 0.1;
}

function draw() {
    let h = game.time.h;
    if(isStorming) ctx.fillStyle = '#1e272e'; // Gris oscuro tormenta
    else if (h >= 6 && h < 18) ctx.fillStyle = h > 16 ? '#c23616' : '#0984e3'; 
    else ctx.fillStyle = '#0a3d62';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); ctx.scale(camera.zoom, camera.zoom); ctx.translate(-camera.x, -camera.y);

    // Balsa
    ctx.fillStyle = '#8B4513'; ctx.strokeStyle = '#5c2e0b'; ctx.lineWidth = 2;
    for (let row = -2; row <= 2; row++) {
        for (let col = -2; col <= 2; col++) {
            ctx.fillRect(col*60, row*60, 60, 60); ctx.strokeRect(col*60, row*60, 60, 60);
        }
    }

    // Estructuras y Martillo Highlighter
    let uid = game.hotbar[selectedSlot];
    let isHammer = (uid && game.inv.find(i => i.uid === uid)?.id === 'martillo');
    
    game.structures.forEach(s => {
        let base = ITEMS_DB[s.id];
        ctx.fillStyle = base.color; ctx.fillRect(s.x, s.y, 40, 40);
        ctx.fillStyle = 'white'; ctx.font = '16px Courier New'; ctx.fillText(base.symbol, s.x+12, s.y+26);
        
        // Highlight de Martillo
        if (isHammer) {
            ctx.strokeStyle = s.hasItems ? '#e67e22' : '#2ecc71'; // Naranja si está lleno, Verde si está vacío
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(s.x+20, s.y+20, 30, 0, Math.PI*2); ctx.stroke();
        }
    });

    // Flotantes
    floaters.forEach(f => {
        if(f.isBarrel) {
            ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(f.x+17, f.y+17, 17, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'white'; ctx.fillText('B', f.x+12, f.y+22);
        } else {
            let b = ITEMS_DB[f.id];
            ctx.fillStyle = b.color; ctx.fillRect(f.x, f.y, f.w, f.h);
            ctx.fillStyle = 'white'; ctx.font = '10px Courier New'; ctx.fillText(b.symbol, f.x+2, f.y+14);
        }
    });

    // Lluvia
    if(isStorming) {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
        rainParticles.forEach(p => { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.speed/2, p.y + p.speed); ctx.stroke(); });
    }

    // Jugador
    if (player.isMoving) { ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(player.targetX, player.targetY); ctx.strokeStyle = 'white'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = game.playerConfig.color; ctx.beginPath(); ctx.arc(player.x, player.y, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'white'; ctx.font = '12px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(game.playerConfig.icon, player.x, player.y);

    ctx.restore();
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }

