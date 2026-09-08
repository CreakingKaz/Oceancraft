let selectedSlot = 0; let currentInvTab = 'todo'; let currentCraftTab = 'todo'; let selectedInvUID = null; let currentStation = 'basic';
function logEvent(msg, type = 'action') {
    let logBox = document.getElementById('history-log'); let entry = document.createElement('div');
    entry.className = `log-entry log-${type}`; let time = document.getElementById('ui-clock').innerText;
    entry.innerText = `[${time}] ${msg}`; logBox.prepend(entry);
    if(logBox.children.length > 15) logBox.lastChild.remove();
}
function toggleMenu(menuId) {
    let menu = document.getElementById(menuId); if (!menu) return; 
    if (menu.classList.contains('hidden')) {
        document.querySelectorAll('.modal-wrapper').forEach(m => m.classList.add('hidden')); menu.classList.remove('hidden');
        if(menuId === 'inventory-modal') renderInventory();
        if(menuId === 'craft-modal') renderCrafting(currentStation);
    } else { menu.classList.add('hidden'); }
}
function openCrafting(station) {
    currentStation = station; document.getElementById('craft-title').innerText = station === 'basic' ? 'Crafteo Básico' : 'Mesa de Trabajo';
    toggleMenu('craft-modal');
}
function selectSlot(index) {
    document.querySelectorAll('.hotbar-slot').forEach(el => el.classList.remove('selected'));
    document.getElementById('slot-' + index).classList.add('selected'); selectedSlot = index; updateActionButton();
}
function updateActionButton() {
    let btn = document.getElementById('action-btn'); let item = inventory.find(i => i.uid === hotbar[selectedSlot]);
    btn.innerText = item ? (ITEMS_DB[item.id].action || "Usar") : "Interactuar";
}

// MAIN MENU LOGIC
function switchMenuTab(tab) {
    document.querySelectorAll('.menu-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.menu-content').forEach(c => c.classList.add('hidden'));
    event.target.classList.add('active'); document.getElementById('tab-' + tab).classList.remove('hidden');
    if(tab === 'continue') populateSaveSlots();
}
function getLuminance(hex) {
    let rgb = parseInt(hex.slice(1), 16); let r = (rgb >> 16) & 0xff; let g = (rgb >>  8) & 0xff; let b = (rgb >>  0) & 0xff;
    return (0.299*r + 0.587*g + 0.114*b);
}
function updateCosmeticPreview() {
    let icon = document.getElementById('player-icon').value || 'Kaz'; let color = document.getElementById('player-color').value;
    let textMode = document.getElementById('text-color-mode').value;
    let preview = document.getElementById('preview-player'); let text = document.getElementById('preview-text');
    preview.style.background = color; text.innerText = icon;
    if(textMode === 'auto') { text.style.color = getLuminance(color) > 186 ? '#000000' : '#ffffff'; } else { text.style.color = textMode; }
}

function startNewGame() {
    player.icon = document.getElementById('player-icon').value || 'Kaz'; player.color = document.getElementById('player-color').value;
    let textMode = document.getElementById('text-color-mode').value;
    player.textColor = textMode === 'auto' ? (getLuminance(player.color) > 186 ? '#000000' : '#ffffff') : textMode;
    difficulty = document.getElementById('difficulty-select').value;
    let worldName = document.getElementById('world-name').value || "Mundo 1";
    
    // Reset Data
    inventory = []; hotbar = [null,null,null]; raftTiles = ['0,0', '0,1', '1,0', '1,1']; structures = []; gameDay = 1; gameTime = 8*60;
    
    document.getElementById('main-menu').classList.add('hidden'); document.getElementById('game-ui').classList.remove('hidden');
    giveItem('gancho_t1', 1); giveItem('botella_vacia', 1); giveItem('papa', 2); giveItem('martillo', 1);
    hotbar[0] = inventory[0].uid; hotbar[1] = inventory[1].uid; hotbar[2] = inventory[3].uid;
    renderHotbarUI(); selectSlot(0); logEvent("Comienzas una nueva aventura.", "event");
    isGameRunning = true; requestAnimationFrame(gameLoop);
}

function populateSaveSlots() {
    let container = document.getElementById('save-slots-container'); container.innerHTML = '';
    for(let i=1; i<=3; i++) {
        let data = localStorage.getItem('oceancraft_save_'+i);
        if(data) { 
            let p = JSON.parse(data); 
            container.innerHTML += `<div class="save-card" onclick="loadGameSlot(${i})">
                <h3 style="color:var(--primary); margin:0;">${p.worldName || 'Mundo Guardado'} (Slot ${i})</h3>
                <span style="color:#cbd5e1; font-size:12px;">Día ${p.gameDay} - Dificultad: ${p.difficulty} - Ítems: ${p.inventory.length}</span>
            </div>`;
        } else {
            container.innerHTML += `<div class="save-card" style="opacity:0.5; cursor:default;"><h3 style="margin:0;">Slot ${i} - Vacío</h3></div>`;
        }
    }
}

// INVENTORY & CRAFTING
function renderInventory() {
    document.getElementById('inv-count').innerText = inventory.length; let grid = document.getElementById('inv-grid'); grid.innerHTML = '';
    // Priority Sort: Favs first, then time
    let filtered = [...inventory].sort((a,b) => (b.fav === a.fav) ? b.time - a.time : (a.fav ? -1 : 1));
    filtered.forEach(item => {
        let base = ITEMS_DB[item.id]; let div = document.createElement('div'); div.className = 'inv-item' + (selectedInvUID === item.uid ? ' selected' : '') + (item.fav ? ' fav' : '');
        div.style.background = `linear-gradient(135deg, rgba(0,0,0,0.8), ${base.color}44)`;
        div.innerHTML = `<div class="fav-star">★</div>${base.svg}`;
        if (base.cat !== 'herr' && base.cat !== 'est') div.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
        else if (base.cat === 'herr') { let durPct = (item.dur / base.maxDur) * 100; div.innerHTML += `<div class="durability-bar" style="width: ${durPct}%; background: ${durPct > 50 ? '#22c55e' : '#ef4444'};"></div>`; }
        div.onclick = () => { selectedInvUID = item.uid; renderInventory(); renderLoreBox(); }; grid.appendChild(div);
    });
    renderLoreBox();
}

function renderLoreBox() {
    let content = document.getElementById('lore-box-content'); let actions = document.getElementById('lore-actions');
    if(!selectedInvUID) { content.innerHTML = '<p style="color:#94a3b8; text-align:center; margin-top:50%;">Selecciona un ítem</p>'; actions.style.display = 'none'; return; }
    let item = inventory.find(i => i.uid === selectedInvUID); if(!item) { selectedInvUID = null; renderLoreBox(); return; }
    let base = ITEMS_DB[item.id];
    let rarityText = base.rarity.charAt(0).toUpperCase() + base.rarity.slice(1);
    content.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height:100px; background:rgba(0,0,0,0.5); border-radius:10px; margin-bottom:15px; border:1px solid ${base.color}; box-shadow: inset 0 0 20px ${base.color}44;">
            <div style="width:70px; height:70px;">${base.svg}</div>
        </div>
        <h2 style="color:white; margin:0;">${base.name}</h2>
        <span class="rarity-${base.rarity}" style="font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">${rarityText} - ${base.cat}</span>
        <div style="margin-top:15px; color:#cbd5e1; font-size:14px; line-height:1.5;">${base.desc}</div>
        ${base.cat === 'herr' ? `<div style="margin-top:10px; color:#ef4444; font-size:12px;">Durabilidad: ${item.dur}/${base.maxDur}</div>` : ''}
    `;
    actions.style.display = 'flex';
}

function equipToHotbar(slotIndex) { if (!selectedInvUID) return; hotbar[slotIndex] = selectedInvUID; renderHotbarUI(); updateActionButton(); }
function toggleFavorite() { let item = inventory.find(i=>i.uid === selectedInvUID); if(item) { item.fav = !item.fav; renderInventory(); } }
function dropSelectedItem() { if(selectedInvUID) { removeItemByUID(selectedInvUID, 1); renderInventory(); AudioSys.play('pop'); } }

function renderHotbarUI() {
    for (let i = 0; i < 3; i++) {
        let slotEl = document.getElementById('slot-' + i); let item = inventory.find(x => x.uid === hotbar[i]);
        slotEl.innerHTML = ''; 
        if (item) {
            let base = ITEMS_DB[item.id]; slotEl.style.background = `linear-gradient(135deg, rgba(0,0,0,0.8), ${base.color}66)`;
            slotEl.innerHTML = base.svg;
            if (base.cat !== 'herr' && base.cat !== 'est') slotEl.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
        } else { slotEl.style.background = 'rgba(0,0,0,0.5)'; }
    }
}

function setCraftTab(tab, el) { currentCraftTab = tab; document.querySelectorAll('#craft-tabs .tab').forEach(t=>t.classList.remove('active')); el.classList.add('active'); renderCrafting(currentStation); }
function renderCrafting(station) {
    let grid = document.getElementById('craft-grid'); grid.innerHTML = ''; 
    let search = document.getElementById('craft-search').value.toLowerCase();
    let availOnly = document.getElementById('craft-available-only').checked;

    let validRecipes = RECIPES.filter(r => r.station === station && (currentCraftTab === 'todo' || r.cat === currentCraftTab));
    let processed = validRecipes.map(r => {
        let canAfford = true;
        for (let reqId in r.req) { let count = inventory.filter(i => i.id === reqId).reduce((a,b)=>a+b.qty, 0); if(count < r.req[reqId]) canAfford = false; }
        return { ...r, canAfford };
    });

    if(availOnly) processed = processed.filter(r => r.canAfford);
    if(search) processed = processed.filter(r => ITEMS_DB[r.id].name.toLowerCase().includes(search));

    // Sort by afford, then alphabetically
    processed.sort((a,b) => {
        if(a.canAfford && !b.canAfford) return -1; if(!a.canAfford && b.canAfford) return 1;
        return ITEMS_DB[a.id].name.localeCompare(ITEMS_DB[b.id].name);
    });

    processed.forEach(r => {
        let base = ITEMS_DB[r.id]; let reqText = Object.keys(r.req).map(k => `${r.req[k]} ${ITEMS_DB[k].name}`).join(', ');
        let btn = document.createElement('button'); btn.className = 'btn btn-primary'; btn.style.display = 'flex'; btn.style.alignItems = 'center'; btn.style.gap = '15px'; btn.style.textAlign = 'left';
        let iconHtml = `<div style="width:50px;height:50px;flex-shrink:0;background:rgba(0,0,0,0.3);border-radius:8px;padding:5px;">${base.svg}</div>`;
        if (!r.canAfford) { btn.style.opacity = '0.5'; btn.style.background = '#1e293b'; btn.innerHTML = `${iconHtml} <div style="flex:1;"><b>${base.name}</b><br><small style="color:#fca5a5;">Falta: ${reqText}</small></div>`; } 
        else { btn.innerHTML = `${iconHtml} <div style="flex:1;"><b>${base.name}</b><br><small style="color:#a7f3d0;">Req: ${reqText}</small></div>`; }
        btn.onclick = () => {
            if(!r.canAfford) return showNotification("Materiales insuficientes.");
            if(inventory.length >= MAX_SLOTS && !inventory.find(i=>i.id===r.id && i.qty < MAX_STACK)) return showNotification("Inventario lleno.");
            for (let reqId in r.req) removeItemByName(reqId, r.req[reqId]); 
            giveItem(r.id, 1); showNotification("Crafteaste: " + base.name); logEvent("Crafteaste " + base.name, 'action'); AudioSys.play('build'); renderCrafting(station); renderHotbarUI();
        };
        grid.appendChild(btn);
    });
}
function updateStatsUI(stats) {
    document.getElementById('bar-hp').style.width = Math.max(0, stats.hp) + '%';
    document.getElementById('bar-energy').style.width = Math.max(0, stats.energy) + '%';
    document.getElementById('bar-thirst').style.width = Math.max(0, Math.min(100, stats.thirst)) + '%';
    document.getElementById('bar-hunger').style.width = Math.max(0, Math.min(100, stats.hunger)) + '%';
}
function showNotification(msg) {
    let box = document.getElementById('notifications'); let el = document.createElement('div'); el.className = 'notif'; el.innerText = msg; box.appendChild(el);
    setTimeout(() => { if(el.parentNode) el.remove(); }, 3000);
}
