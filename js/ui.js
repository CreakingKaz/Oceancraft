let selectedSlot = 0;
let currentInvTab = 'todo';
let currentCraftTab = 'todo';
let currentStation = 'basic';
let selectedInvUID = null;

// Menu System
function switchMenu(menuId) {
    ['menu-home', 'menu-new', 'menu-load', 'menu-cosmetics'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(menuId).classList.remove('hidden');
    document.getElementById('menu-title').classList.toggle('hidden', menuId !== 'menu-home');
    if (menuId === 'menu-load') renderLoadSlots();
    if (menuId === 'menu-cosmetics') updatePreview();
}

function getLuminance(hex) {
    let rgb = parseInt(hex.substring(1), 16); return ((rgb >> 16) & 0xff)*0.299 + ((rgb >> 8) & 0xff)*0.587 + ((rgb >> 0) & 0xff)*0.114;
}

function updatePreview() {
    let name = document.getElementById('player-icon').value || 'Kaz'; let color = document.getElementById('player-color').value;
    document.getElementById('hex-display').innerText = color;
    document.getElementById('preview-player').style.background = color;
    document.getElementById('preview-text').innerText = name;
    document.getElementById('preview-text').style.color = getLuminance(color) > 160 ? '#1e293b' : '#ffffff';
}

function renderLoadSlots() {
    let container = document.getElementById('save-slots-container'); container.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
        let data = localStorage.getItem('oceancraft_save_' + i);
        let div = document.createElement('div'); div.style.display = 'flex'; div.style.gap = '10px'; div.style.alignItems = 'center';
        if (data) {
            let p = JSON.parse(data);
            let timeStr = `${Math.floor(p.gameTime / 60).toString().padStart(2,'0')}:${Math.floor(p.gameTime % 60).toString().padStart(2,'0')}`;
            div.innerHTML = `<div style="flex:1; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:10px; text-align:left; cursor:pointer;" onclick="loadGameSlot(${i})">
                <strong style="color:white;">Slot ${i} (${p.difficulty})</strong><br>
                <span style="color:#94a3b8; font-size:13px;">Día ${p.gameDay} - ${timeStr} | Ítems: ${p.itemsGatheredTotal || 0}</span></div>
                <button class="btn btn-text" style="color:#ef4444;" onclick="deleteSave(${i})">X</button>`;
        } else {
            div.innerHTML = `<div style="flex:1; background:rgba(0,0,0,0.2); border:1px dashed rgba(255,255,255,0.2); border-radius:8px; padding:15px; color:#64748b;">Slot ${i} Vacío</div>`;
        }
        container.appendChild(div);
    }
}

function deleteSave(slot) { if(confirm(`¿Borrar Slot ${slot}?`)) { localStorage.removeItem('oceancraft_save_' + slot); renderLoadSlots(); } }

// In-Game UI
function toggleMenu(id) {
    let el = document.getElementById(id); el.classList.toggle('hidden');
    if(!el.classList.contains('hidden')) { AudioSys.play('click'); if(id==='inventory-modal') renderInventory(); if(id==='craft-modal') renderCrafting(currentStation); }
}

function updateStatsUI(stats) {
    ['hp', 'energy', 'thirst', 'hunger', 'tox'].forEach(key => {
        let val = key === 'tox' ? stats.toxicity : stats[key];
        document.getElementById(`bar-${key}`).style.width = val + '%';
    });
}

function logEvent(text, type='info') {
    let log = document.getElementById('history-log');
    let color = type==='action' ? '#a7f3d0' : (type==='danger' ? '#fca5a5' : (type==='event' ? '#fde047' : '#94a3b8'));
    log.innerHTML = `<div style="color:${color}">${text}</div>` + log.innerHTML;
}

function showNotification(text) {
    let c = document.getElementById('notifications');
    let t = document.createElement('div'); t.className = 'toast'; t.innerText = text;
    c.appendChild(t); setTimeout(() => t.remove(), 3000);
}

// Inventory & Crafting Logic
function setInvTab(tab, el) { currentInvTab = tab; document.querySelectorAll('#inventory-modal .tab').forEach(t=>t.classList.remove('active')); el.classList.add('active'); renderInventory(); }
function setCraftTab(tab, el) { currentCraftTab = tab; document.querySelectorAll('#craft-modal .tab').forEach(t=>t.classList.remove('active')); el.classList.add('active'); renderCrafting(currentStation); }
function openCrafting(station) { currentStation = station; document.getElementById('craft-title').innerText = station.toUpperCase(); toggleMenu('craft-modal'); }

function renderInventory() {
    document.getElementById('inv-count').innerText = inventory.length; 
    let grid = document.getElementById('inv-grid'); grid.innerHTML = '';
    let filterVal = document.getElementById('inv-filter').value;
    let searchVal = document.getElementById('inv-search').value.toLowerCase();
    
    let filtered = inventory.filter(i => {
        let base = ITEMS_DB[i.id];
        return (currentInvTab === 'todo' || base.cat === currentInvTab) && base.name.toLowerCase().includes(searchVal);
    });

    if(filterVal === 'recent') filtered.sort((a,b) => b.time - a.time); 
    if(filterVal === 'qty') filtered.sort((a,b) => b.qty - a.qty); 
    if(filterVal === 'az') filtered.sort((a,b) => ITEMS_DB[a.id].name.localeCompare(ITEMS_DB[b.id].name));
    filtered.sort((a,b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0)); // Favs top

    filtered.forEach(item => {
        let base = ITEMS_DB[item.id]; let div = document.createElement('div'); 
        div.className = 'inv-item'; div.style.background = `linear-gradient(135deg, ${base.color}88, ${base.color})`;
        div.innerHTML = base.svg;
        if(item.fav) div.innerHTML += `<div class="fav-badge">★</div>`;
        if (base.cat !== 'herr' && base.cat !== 'est') div.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
        else if (base.cat === 'herr' && item.dur) { let durPct = (item.dur / base.maxDur) * 100; div.innerHTML += `<div class="durability-bar" style="width: ${durPct}%; background: ${durPct>50?'#22c55e':'#ef4444'};"></div>`; }
        div.onclick = () => showLore(item, base); grid.appendChild(div);
    });
}

function showLore(item, base) {
    selectedInvUID = item.uid; 
    let rarities = { 'mat': {n:'Común', bg:'rgba(148,163,184,0.2)', c:'#cbd5e1'}, 'com': {n:'Orgánico', bg:'rgba(34,197,94,0.2)', c:'#4ade80'}, 'herr': {n:'Utilidad', bg:'rgba(56,189,248,0.2)', c:'#7dd3fc'}, 'est': {n:'Estructura', bg:'rgba(245,158,11,0.2)', c:'#fcd34d'} };
    let r = rarities[base.cat];
    document.getElementById('lore-text').innerHTML = `<div class="rarity-label" style="background:${r.bg}; color:${r.c};">${r.n}</div><br><strong style="color:#fff; font-size:20px;">${base.name}</strong><br><span style="color:#94a3b8; font-size: 14px;">${base.desc}</span>`;
    document.getElementById('lore-actions').innerHTML = `
        <button class="btn btn-text" style="color: ${item.fav ? '#f59e0b' : '#fff'};" onclick="toggleFavorite('${item.uid}')">★ Fav</button>
        <button class="btn btn-text" style="color: #ef4444;" onclick="dropItem('${item.uid}')">Tirar 1</button>
        <button class="btn btn-text" onclick="equipToHotbar(0)">Eq. 1</button>
        <button class="btn btn-text" onclick="equipToHotbar(1)">Eq. 2</button>
        <button class="btn btn-text" onclick="equipToHotbar(2)">Eq. 3</button>`;
}

function toggleFavorite(uid) { let item = inventory.find(i => i.uid === uid); if(item) { item.fav = !item.fav; renderInventory(); showLore(item, ITEMS_DB[item.id]); } }

function dropItem(uid) {
    let item = inventory.find(i => i.uid === uid);
    if(item) {
        let type = item.id; removeItem(uid, 1); AudioSys.play('splash');
        if(typeof floatingItems !== 'undefined') {
            floatingItems.push({ type: type, x: player.x + (Math.random() > 0.5 ? 50 : -50), y: player.y + (Math.random() > 0.5 ? 50 : -50), size: 30, speed: 0.2, bobOffset: Math.random() * Math.PI * 2, caught: false });
        }
        if(!inventory.find(i => i.uid === uid)) { document.getElementById('lore-text').innerHTML = "Selecciona un ítem."; document.getElementById('lore-actions').innerHTML = ""; selectedInvUID = null; }
    }
}

function equipToHotbar(slot) {
    if (!selectedInvUID) return;
    let oldIdx = hotbar.indexOf(selectedInvUID); if (oldIdx !== -1) hotbar[oldIdx] = null;
    hotbar[slot] = selectedInvUID; renderHotbarUI(); AudioSys.play('click');
}

function selectSlot(idx) {
    selectedSlot = idx; document.querySelectorAll('.hotbar-slot').forEach(el => el.classList.remove('selected'));
    document.getElementById('slot-' + idx).classList.add('selected'); AudioSys.play('click');
}

function renderHotbarUI() {
    for (let i = 0; i < 3; i++) {
        let el = document.getElementById('slot-' + i); el.innerHTML = '';
        if (hotbar[i]) {
            let item = inventory.find(it => it.uid === hotbar[i]);
            if (item) {
                let base = ITEMS_DB[item.id]; el.innerHTML = base.svg;
                if(base.cat !== 'herr' && base.cat !== 'est') el.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
            } else { hotbar[i] = null; }
        }
    }
}

function renderCrafting(station) {
    let grid = document.getElementById('craft-grid'); grid.innerHTML = ''; 
    let searchVal = document.getElementById('craft-search').value.toLowerCase();
    let affordOnly = document.getElementById('craft-toggle-afford').checked;
    
    let validRecipes = RECIPES.filter(r => r.station === station && (currentCraftTab === 'todo' || r.cat === currentCraftTab));
    let processed = validRecipes.map(r => {
        let canAfford = true;
        for (let reqId in r.req) { let count = inventory.filter(i => i.id === reqId).reduce((a,b)=>a+b.qty, 0); if(count < r.req[reqId]) canAfford = false; }
        return { ...r, canAfford };
    });
    processed = processed.filter(r => ITEMS_DB[r.id].name.toLowerCase().includes(searchVal) && (affordOnly ? r.canAfford : true));
    processed.sort((a,b) => (b.canAfford ? 1 : 0) - (a.canAfford ? 1 : 0));

    processed.forEach(r => {
        let base = ITEMS_DB[r.id]; let reqText = Object.keys(r.req).map(k => `${r.req[k]} ${ITEMS_DB[k].name}`).join(', ');
        let btn = document.createElement('button'); btn.className = 'btn btn-primary'; btn.style.display = 'flex'; btn.style.alignItems = 'center'; btn.style.gap = '10px'; btn.style.textAlign = 'left';
        let iconHtml = `<div style="width:40px;height:40px;flex-shrink:0;">${base.svg}</div>`;
        if (!r.canAfford) { btn.style.opacity = '0.6'; btn.style.background = '#475569'; btn.innerHTML = `${iconHtml} <span><b>${base.name}</b><br><small style="color:#fca5a5;">Falta: ${reqText}</small></span>`; } 
        else { btn.innerHTML = `${iconHtml} <span><b>${base.name}</b><br><small style="color:#a7f3d0;">Req: ${reqText}</small></span>`; }
        btn.onclick = () => {
            if(!r.canAfford) return showNotification("Materiales insuficientes.");
            for (let reqId in r.req) removeItemByName(reqId, r.req[reqId]); 
            giveItem(r.id, 1); showNotification("Crafteaste: " + base.name); AudioSys.play('build'); renderCrafting(station);
        };
        grid.appendChild(btn);
    });
}