// ====== LÓGICA DE INTERFAZ Y GUARDADO ====== //
let selectedSlot = 0;
let currentInvTab = 'todo';
let currentCraftTab = 'todo';
let selectedInvUID = null;
let activeModal = null;

function startGame(slotIndex, isNew) {
    let save = localStorage.getItem('oceancraft_s' + slotIndex);
    if (!isNew && !save) { alert("No hay partida guardada en el Slot " + slotIndex); return; }
    
    if (isNew || !save) {
        game.slot = slotIndex;
        game.diff = parseFloat(document.getElementById('diff-select').value);
        game.playerConfig.icon = document.getElementById('player-icon').value || 'Kaz';
        game.playerConfig.color = document.getElementById('player-color').value;
        game.inv = []; game.hotbar = [null, null, null];
        giveItem('gancho_t1', 1); giveItem('madera', 2); giveItem('papa', 2);
        game.hotbar[0] = game.inv[0].uid;
    } else {
        game = JSON.parse(save);
        player.icon = game.playerConfig.icon;
        player.color = game.playerConfig.color;
    }
    
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    updateHUD(); renderHotbar();
    isGameRunning = true; requestAnimationFrame(gameLoop);
}

function saveGame() {
    localStorage.setItem('oceancraft_s' + game.slot, JSON.stringify(game));
    notify("Partida Guardada con éxito.");
    toggleMenu('settings-modal');
}

function notify(msg) {
    let box = document.getElementById('notifications');
    let d = document.createElement('div');
    d.className = 'notif'; d.innerText = msg;
    box.appendChild(d);
    setTimeout(() => d.remove(), 3000);
}

function updateHUD() {
    document.getElementById('ui-clock').innerText = `Día ${game.time.d} - ${String(game.time.h).padStart(2,'0')}:00`;
    document.getElementById('ui-hp').innerText = Math.floor(game.stats.h);
    document.getElementById('ui-thirst').innerText = Math.floor(game.stats.s);
    document.getElementById('ui-sleep').innerText = Math.floor(game.stats.su);
}

function advanceTime(cost) {
    game.stats.h -= (cost.h || 0) * game.diff;
    game.stats.s -= (cost.s || 0) * game.diff;
    game.stats.su -= (cost.su || 0) * game.diff;
    game.time.acts++;
    if (game.time.acts >= 3) {
        game.time.acts = 0; game.time.h++;
        if (game.time.h >= 24) { game.time.h = 0; game.time.d++; }
    }
    if (game.stats.h <= 0 || game.stats.s <= 0) { alert("¡Has muerto!"); location.reload(); }
    updateHUD();
}

function toggleMenu(id) {
    if(activeModal && activeModal !== id) document.getElementById(activeModal).classList.add('hidden');
    let el = document.getElementById(id);
    if(el.classList.contains('hidden')) {
        el.classList.remove('hidden'); activeModal = id;
        if(id === 'inventory-modal') renderInv();
        if(id === 'craft-modal') renderCraft();
    } else { el.classList.add('hidden'); activeModal = null; }
}

function updateOpacity() { document.documentElement.style.setProperty('--ui-opacity', document.getElementById('opacity-slider').value); }

/* SISTEMA DE INVENTARIO Y CRAFTEO */
function setInvTab(tab) { currentInvTab = tab; renderInv(); }
function setCraftTab(tab) { currentCraftTab = tab; renderCraft(); }

function renderInv() {
    document.getElementById('inv-count').innerText = game.inv.length;
    let grid = document.getElementById('inv-grid'); grid.innerHTML = '';
    let filtered = game.inv.filter(i => currentInvTab === 'todo' || ITEMS_DB[i.id].cat === currentInvTab);
    
    document.querySelectorAll('#inventory-modal .tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`#inventory-modal .tab[onclick*="${currentInvTab}"]`).classList.add('active');

    filtered.forEach(item => {
        let base = ITEMS_DB[item.id];
        let div = document.createElement('div');
        div.className = 'inv-item'; div.style.background = base.color; div.innerText = base.symbol;
        if(base.cat !== 'herr') div.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
        else div.innerHTML += `<div class="durability-bar" style="width: ${(item.dur/base.maxDur)*100}%"></div>`;
        div.onclick = () => {
            selectedInvUID = item.uid;
            document.getElementById('lore-text').innerHTML = `<strong>${base.name}</strong><br>${base.desc}`;
            document.getElementById('lore-actions').innerHTML = `
                <button class="btn-small" onclick="equip(0)">Eq.1</button>
                <button class="btn-small" onclick="equip(1)">Eq.2</button>
                <button class="btn-small" onclick="equip(2)">Eq.3</button>
            `;
        };
        grid.appendChild(div);
    });
}

function equip(slot) { game.hotbar[slot] = selectedInvUID; renderHotbar(); }

function renderCraft() {
    let list = document.getElementById('craft-list'); list.innerHTML = '';
    document.querySelectorAll('#craft-modal .tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`#craft-modal .tab[onclick*="${currentCraftTab}"]`).classList.add('active');

    RECIPES.forEach(rec => {
        let base = ITEMS_DB[rec.id];
        if(currentCraftTab !== 'todo' && base.cat !== currentCraftTab) return;
        
        let canCraft = true; let reqTxt = '';
        for(let k in rec.req) {
            let has = countItem(k);
            if(has < rec.req[k]) canCraft = false;
            reqTxt += `${ITEMS_DB[k].symbol}${has}/${rec.req[k]} `;
        }
        
        let div = document.createElement('div');
        div.className = 'recipe-row'; div.style.opacity = canCraft ? '1' : '0.5';
        div.innerHTML = `<div class="inv-item" style="background:${base.color}; width:50px; height:50px;">${base.symbol}</div>
                         <div><strong>${base.name}</strong><br><span style="font-size:12px">${reqTxt}</span></div>`;
        div.onclick = () => {
            document.getElementById('craft-lore-text').innerText = base.desc;
            document.getElementById('craft-actions').innerHTML = `<button class="btn" ${canCraft?'':'disabled'} onclick="doCraft('${rec.id}')">Fabricar</button>`;
        };
        list.appendChild(div);
    });
}

function doCraft(id) {
    let rec = RECIPES.find(r => r.id === id);
    for(let k in rec.req) {
        let rem = rec.req[k];
        for (let i = game.inv.length - 1; i >= 0; i--) {
            if (game.inv[i].id === k) {
                let take = Math.min(game.inv[i].qty, rem);
                removeItem(game.inv[i].uid, take); rem -= take;
                if (rem <= 0) break;
            }
        }
    }
    giveItem(id, 1); advanceTime({h:2, s:2, su:0});
    notify("Crafteado: " + ITEMS_DB[id].name);
    renderCraft(); renderInv(); renderHotbar();
}

/* HOTBAR Y ACCIONES */
function selectSlot(idx) {
    document.querySelectorAll('.hotbar-slot').forEach(el => el.classList.remove('selected'));
    document.getElementById('slot-' + idx).classList.add('selected');
    selectedSlot = idx;
    let uid = game.hotbar[idx];
    let btn = document.getElementById('action-btn');
    if(!uid || !game.inv.find(i => i.uid === uid)) btn.innerText = "Buscar con mano";
    else btn.innerText = ITEMS_DB[game.inv.find(i => i.uid === uid).id].action || "Usar";
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
        } else { s.style.background = 'rgba(34,34,34,var(--ui-opacity))'; }
    }
    selectSlot(selectedSlot);
}

function doAction() {
    let uid = game.hotbar[selectedSlot];
    let item = game.inv.find(i => i.uid === uid);
    
    if(!item) {
        advanceTime({h:3, s:5, su:2});
        if(Math.random() > 0.4) {
            let loot = ['madera','plastico','hojas'][Math.floor(Math.random()*3)];
            giveItem(loot, 1); notify("+1 " + ITEMS_DB[loot].name);
        } else notify("No encontraste nada.");
    } else {
        let base = ITEMS_DB[item.id];
        if(base.cat === 'herr') {
            advanceTime({h:4, s:6, su:2});
            if(item.id === 'gancho_t1') {
                if(Math.random() > 0.4) {
                    let loot = ['madera','plastico','chatarra'][Math.floor(Math.random()*3)];
                    giveItem(loot, 1); notify("+1 " + ITEMS_DB[loot].name);
                } else notify("El gancho regresó vacío.");
            }
            item.dur--;
            if(item.dur <= 0) { removeItem(item.uid, 1); notify("Se rompió " + base.name); }
            renderHotbar(); renderInv();
        } else if (base.cat === 'com') {
            game.stats.h += base.val.h; game.stats.s += base.val.s;
            if(game.stats.h > 100) game.stats.h = 100; if(game.stats.s > 100) game.stats.s = 100;
            removeItem(item.uid, 1); notify("Consumiste " + base.name); renderHotbar(); renderInv(); updateHUD();
        }
    }
}

// ====== MOTOR GRÁFICO (CANVAS) ====== //
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

let isGameRunning = false;
let camera = { x: 0, y: 0, zoom: 1.5 };
let player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 2, isMoving: false, icon: 'Kaz', color: '#e74c3c' };
let floaters = []; // Objetos en el océano

function zoomIn() { camera.zoom = Math.min(camera.zoom + 0.2, 3.0); }
function zoomOut() { camera.zoom = Math.max(camera.zoom - 0.2, 0.5); }

// Movimiento e interacción del Canvas
canvas.addEventListener('click', (e) => {
    if(!isGameRunning || activeModal) return;
    const worldX = (e.clientX - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (e.clientY - canvas.height / 2) / camera.zoom + camera.y;

    // Verificar si clickeó un objeto flotante
    let clickedFloater = false;
    for(let i = floaters.length -1; i >= 0; i--) {
        let f = floaters[i];
        if(worldX >= f.x && worldX <= f.x+f.w && worldY >= f.y && worldY <= f.y+f.h) {
            giveItem(f.id, 1); notify("Recogiste " + ITEMS_DB[f.id].name);
            floaters.splice(i, 1); clickedFloater = true;
            advanceTime({h:1, s:2, su:1});
            break;
        }
    }
    
    // Si no clickeó item, mover al jugador
    if(!clickedFloater) { player.targetX = worldX; player.targetY = worldY; player.isMoving = true; }
});

function update() {
    // Generar flotantes
    if(Math.random() < 0.005) {
        let ids = ['madera', 'plastico', 'hojas', 'chatarra'];
        floaters.push({
            id: ids[Math.floor(Math.random()*ids.length)],
            x: camera.x + (canvas.width/camera.zoom),
            y: camera.y + (Math.random()*400 - 200),
            w: 20, h: 20, speed: Math.random()*0.5 + 0.2
        });
    }
    
    // Mover flotantes de Derecha a Izquierda
    floaters.forEach(f => f.x -= f.speed);
    floaters = floaters.filter(f => f.x > camera.x - (canvas.width/camera.zoom) - 100);

    // Mover Jugador
    if (player.isMoving) {
        let dx = player.targetX - player.x; let dy = player.targetY - player.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > player.speed) { player.x += (dx / distance) * player.speed; player.y += (dy / distance) * player.speed; }
        else { player.x = player.targetX; player.y = player.targetY; player.isMoving = false; }
    }
    // Cámara sigue al jugador
    camera.x += (player.x - camera.x) * 0.1; camera.y += (player.y - camera.y) * 0.1;
}

function draw() {
    // Ciclo Día/Noche (Colores del océano)
    let h = game.time.h;
    if (h >= 6 && h < 18) ctx.fillStyle = h > 16 ? '#c23616' : '#0984e3'; // Tarde o Día
    else ctx.fillStyle = '#0a3d62'; // Noche
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); ctx.scale(camera.zoom, camera.zoom); ctx.translate(-camera.x, -camera.y);

    // Balsa (3x3 inicial)
    ctx.fillStyle = '#8B4513'; ctx.strokeStyle = '#5c2e0b'; ctx.lineWidth = 2;
    for (let row = -1; row <= 1; row++) {
        for (let col = -1; col <= 1; col++) {
            ctx.fillRect(col*60, row*60, 60, 60); ctx.strokeRect(col*60, row*60, 60, 60);
        }
    }

    // Flotantes
    floaters.forEach(f => {
        let b = ITEMS_DB[f.id];
        ctx.fillStyle = b.color; ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.fillStyle = 'white'; ctx.font = '10px Courier New'; ctx.fillText(b.symbol, f.x+2, f.y+14);
    });

    // Línea de movimiento
    if (player.isMoving) {
        ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(player.targetX, player.targetY);
        ctx.strokeStyle = 'white'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
    }

    // Jugador
    ctx.fillStyle = game.playerConfig.color; ctx.beginPath(); ctx.arc(player.x, player.y, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'white'; ctx.font = '12px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(game.playerConfig.icon, player.x, player.y);

    ctx.restore();
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }