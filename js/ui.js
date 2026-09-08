let selectedSlot = 0; let currentInvTab = 'todo'; let currentCraftTab = 'todo'; let selectedInvUID = null; let currentStation = 'basic';
function logEvent(msg, type = 'action') {
    let logBox = document.getElementById('history-log'); let entry = document.createElement('div');
    entry.className = `log-entry log-${type}`; let time = document.getElementById('ui-clock').innerText;
    entry.innerText = `[${time}] ${msg}`; logBox.prepend(entry);
    if(logBox.children.length > 25) logBox.lastChild.remove();
}
function toggleMenu(menuId) {
    let menu = document.getElementById(menuId); if (!menu) return; 
    if (menu.classList.contains('hidden')) {
        document.querySelectorAll('.modal-wrapper').forEach(m => m.classList.add('hidden')); menu.classList.remove('hidden');
        if(menuId === 'inventory-modal') renderInventory();
    } else { menu.classList.add('hidden'); }
}
function openCrafting(station) {
    currentStation = station; document.getElementById('craft-title').innerText = station === 'basic' ? 'Crafteo Básico' : (station === 'mesa_trabajo' ? 'Mesa de Trabajo' : 'Horno Fundidor');
    toggleMenu('craft-modal'); renderCrafting(station);
}
function selectSlot(index) {
    document.querySelectorAll('.hotbar-slot').forEach(el => el.classList.remove('selected'));
    document.getElementById('slot-' + index).classList.add('selected'); selectedSlot = index; updateActionButton();
}
function updateActionButton() {
    let btn = document.getElementById('action-btn'); let item = inventory.find(i => i.uid === hotbar[selectedSlot]);
    btn.innerText = item ? (ITEMS_DB[item.id].action || "Usar") : "Interactuar";
}
function setInvTab(tab, element) { currentInvTab = tab; document.querySelectorAll('#inventory-modal .tab').forEach(t => t.classList.remove('active')); element.classList.add('active'); renderInventory(); }
function setCraftTab(tab, element) { currentCraftTab = tab; document.querySelectorAll('#craft-modal .tab').forEach(t => t.classList.remove('active')); element.classList.add('active'); renderCrafting(currentStation); }
function renderInventory() {
    document.getElementById('inv-count').innerText = inventory.length; let grid = document.getElementById('inv-grid'); grid.innerHTML = '';
    let filterVal = document.getElementById('inv-filter').value;
    let filtered = inventory.filter(i => currentInvTab === 'todo' ? true : ITEMS_DB[i.id].cat === currentInvTab);
    if(filterVal === 'recent') filtered.sort((a,b) => b.time - a.time); if(filterVal === 'qty') filtered.sort((a,b) => b.qty - a.qty); if(filterVal === 'az') filtered.sort((a,b) => ITEMS_DB[a.id].name.localeCompare(ITEMS_DB[b.id].name));
    filtered.forEach(item => {
        let base = ITEMS_DB[item.id]; let div = document.createElement('div'); div.className = 'inv-item'; div.style.background = `linear-gradient(135deg, ${base.color}88, ${base.color})`;
        div.innerHTML = base.svg;
        if (base.cat !== 'herr' && base.cat !== 'est') div.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
        else if (base.cat === 'herr') { let durPct = (item.dur / base.maxDur) * 100; div.innerHTML += `<div class="durability-bar" style="width: ${durPct}%; background: ${durPct > 50 ? '#22c55e' : '#ef4444'};"></div>`; }
        div.onclick = () => showLore(item, base); grid.appendChild(div);
    });
}
function showLore(item, base) {
    selectedInvUID = item.uid; document.getElementById('lore-text').innerHTML = `<strong style="color:#fff; font-size:18px;">${base.name}</strong><br><span style="color:#cbd5e1;">${base.desc}</span>`;
    document.getElementById('lore-actions').innerHTML = `<button class="btn btn-text" onclick="equipToHotbar(0)">Eq. 1</button><button class="btn btn-text" onclick="equipToHotbar(1)">Eq. 2</button><button class="btn btn-text" onclick="equipToHotbar(2)">Eq. 3</button>`;
}
function equipToHotbar(slotIndex) { if (!selectedInvUID) return; hotbar[slotIndex] = selectedInvUID; renderHotbarUI(); updateActionButton(); }
function renderHotbarUI() {
    for (let i = 0; i < 3; i++) {
        let slotEl = document.getElementById('slot-' + i); let item = inventory.find(x => x.uid === hotbar[i]);
        slotEl.innerHTML = ''; 
        if (item) {
            let base = ITEMS_DB[item.id]; slotEl.style.background = `linear-gradient(135deg, ${base.color}aa, ${base.color})`;
            slotEl.innerHTML = base.svg;
            if (base.cat !== 'herr' && base.cat !== 'est') slotEl.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
        } else { slotEl.style.background = 'rgba(0,0,0,0.5)'; }
    }
}
function renderCrafting(station) {
    let grid = document.getElementById('craft-grid'); grid.innerHTML = ''; let filterVal = document.getElementById('craft-filter').value;
    let validRecipes = RECIPES.filter(r => r.station === station && (currentCraftTab === 'todo' || r.cat === currentCraftTab));
    let processed = validRecipes.map(r => {
        let canAfford = true;
        for (let reqId in r.req) { let count = inventory.filter(i => i.id === reqId).reduce((a,b)=>a+b.qty, 0); if(count < r.req[reqId]) canAfford = false; }
        return { ...r, canAfford };
    });
    if(filterVal === 'craftable') processed.sort((a,b) => (b.canAfford ? 1 : 0) - (a.canAfford ? 1 : 0));
    processed.forEach(r => {
        let base = ITEMS_DB[r.id]; let reqText = Object.keys(r.req).map(k => `${r.req[k]} ${ITEMS_DB[k].name}`).join(', ');
        let btn = document.createElement('button'); btn.className = 'btn btn-primary'; btn.style.display = 'flex'; btn.style.alignItems = 'center'; btn.style.gap = '10px'; btn.style.textAlign = 'left';
        let iconHtml = `<div style="width:40px;height:40px;flex-shrink:0;">${base.svg}</div>`;
        if (!r.canAfford) { btn.style.opacity = '0.6'; btn.style.background = '#475569'; btn.innerHTML = `${iconHtml} <span><b>${base.name}</b><br><small style="color:#fca5a5;">Falta: ${reqText}</small></span>`; } 
        else { btn.innerHTML = `${iconHtml} <span><b>${base.name}</b><br><small style="color:#a7f3d0;">Req: ${reqText}</small></span>`; }
        btn.onclick = () => {
            if(!r.canAfford) return showNotification("Materiales insuficientes.");
            for (let reqId in r.req) removeItemByName(reqId, r.req[reqId]); giveItem(r.id, 1); showNotification("Crafteaste: " + base.name); logEvent("Crafteaste " + base.name, 'action'); AudioSys.play('build'); renderCrafting(station);
        };
        grid.appendChild(btn);
    });
}
function updateStatsUI(stats) {
    document.getElementById('bar-hp').style.width = Math.max(0, stats.hp) + '%';
    document.getElementById('bar-energy').style.width = Math.max(0, stats.energy) + '%';
    document.getElementById('bar-thirst').style.width = Math.max(0, Math.min(100, stats.thirst)) + '%';
    document.getElementById('bar-hunger').style.width = Math.max(0, Math.min(100, stats.hunger)) + '%';
    let toxBar = document.getElementById('bar-tox'); toxBar.style.width = Math.max(0, stats.toxicity) + '%';
    toxBar.style.background = stats.toxicity < 30 ? '#ef4444' : (stats.toxicity < 60 ? '#eab308' : '#2ecc71');
}
function showNotification(msg) {
    let box = document.getElementById('notifications'); let el = document.createElement('div'); el.className = 'notif'; el.innerText = msg; box.appendChild(el);
    setTimeout(() => { if(el.parentNode) el.remove(); }, 3000);
}
function updateUIOpacity() { document.documentElement.style.setProperty('--glass-bg', `rgba(15, 23, 42, ${document.getElementById('opacity-slider').value})`); }
function updateUIScale() { document.documentElement.style.setProperty('--ui-scale', document.getElementById('scale-slider').value); }
