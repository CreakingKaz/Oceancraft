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
    document.getElementById('inv-count').innerText = inventory.length; 
    let grid = document.getElementById('inv-grid'); grid.innerHTML = '';
    
    let filterVal = document.getElementById('inv-filter').value;
    let searchVal = document.getElementById('inv-search').value.toLowerCase();
    
    let filtered = inventory.filter(i => {
        let base = ITEMS_DB[i.id];
        let matchesTab = currentInvTab === 'todo' ? true : base.cat === currentInvTab;
        let matchesSearch = base.name.toLowerCase().includes(searchVal);
        return matchesTab && matchesSearch;
    });

    if(filterVal === 'recent') filtered.sort((a,b) => b.time - a.time); 
    if(filterVal === 'qty') filtered.sort((a,b) => b.qty - a.qty); 
    if(filterVal === 'az') filtered.sort((a,b) => ITEMS_DB[a.id].name.localeCompare(ITEMS_DB[b.id].name));
    
    // Favoritos siempre primero
    filtered.sort((a,b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0));

    filtered.forEach(item => {
        let base = ITEMS_DB[item.id]; 
        let div = document.createElement('div'); 
        div.className = 'inv-item'; 
        div.style.background = `linear-gradient(135deg, ${base.color}88, ${base.color})`;
        
        div.innerHTML = base.svg;
        if(item.fav) div.innerHTML += `<div class="fav-badge">★</div>`;

        if (base.cat !== 'herr' && base.cat !== 'est') div.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
        else if (base.cat === 'herr') { 
            let durPct = (item.dur / base.maxDur) * 100; 
            div.innerHTML += `<div class="durability-bar" style="width: ${durPct}%; background: ${durPct > 50 ? '#22c55e' : '#ef4444'};"></div>`; 
        }
        div.onclick = () => showLore(item, base); grid.appendChild(div);
    });
}

function showLore(item, base) {
    selectedInvUID = item.uid; 
    
    // Sistema dinámico de rarezas
    let rarities = {
        'mat': { name: 'Común', bg: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1' },
        'com': { name: 'Orgánico', bg: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' },
        'herr': { name: 'Utilidad', bg: 'rgba(56, 189, 248, 0.2)', color: '#7dd3fc' },
        'est': { name: 'Estructura', bg: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d' }
    };
    let r = rarities[base.cat] || rarities['mat'];

    document.getElementById('lore-text').innerHTML = `
        <div class="rarity-label" style="background: ${r.bg}; color: ${r.color};">${r.name}</div>
        <br><strong style="color:#fff; font-size:20px;">${base.name}</strong>
        <br><span style="color:#94a3b8; font-size: 14px;">${base.desc}</span>
        ${item.dur ? `<br><span style="color:#22c55e; font-size: 12px;">Durabilidad: ${item.dur}/${base.maxDur}</span>` : ''}
    `;

    document.getElementById('lore-actions').innerHTML = `
        <button class="btn btn-text" style="color: ${item.fav ? '#f59e0b' : '#fff'};" onclick="toggleFavorite('${item.uid}')">★ Fav</button>
        <button class="btn btn-text" style="color: #ef4444;" onclick="dropItem('${item.uid}')">Tirar 1</button>
        <button class="btn btn-text" onclick="equipToHotbar(0)">Eq. 1</button>
        <button class="btn btn-text" onclick="equipToHotbar(1)">Eq. 2</button>
        <button class="btn btn-text" onclick="equipToHotbar(2)">Eq. 3</button>
    `;
}

function toggleFavorite(uid) {
    let item = inventory.find(i => i.uid === uid);
    if(item) {
        item.fav = !item.fav;
        renderInventory();
        showLore(item, ITEMS_DB[item.id]); // Actualiza el botón de estrella
    }
}

function dropItem(uid) {
    let item = inventory.find(i => i.uid === uid);
    if(item) {
        let type = item.id;
        removeItem(uid, 1);
        AudioSys.play('splash');
        
        // Spawnear el ítem en el agua físicamente cerca del jugador
        floatingItems.push({ 
            type: type, 
            x: player.x + (Math.random() > 0.5 ? 50 : -50), 
            y: player.y + (Math.random() > 0.5 ? 50 : -50), 
            size: 30, speed: 0.2, bobOffset: Math.random() * Math.PI * 2, caught: false
        });

        // Limpiar lore si se tiró el último
        if(!inventory.find(i => i.uid === uid)) {
            document.getElementById('lore-text').innerHTML = "Selecciona un ítem.";
            document.getElementById('lore-actions').innerHTML = "";
            selectedInvUID = null;
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
        for (let reqId in r.req) { 
            let count = inventory.filter(i => i.id === reqId).reduce((a,b)=>a+b.qty, 0); 
            if(count < r.req[reqId]) canAfford = false; 
        }
        return { ...r, canAfford };
    });

    processed = processed.filter(r => {
        let nameMatch = ITEMS_DB[r.id].name.toLowerCase().includes(searchVal);
        let affordMatch = affordOnly ? r.canAfford : true;
        return nameMatch && affordMatch;
    });

    processed.sort((a,b) => (b.canAfford ? 1 : 0) - (a.canAfford ? 1 : 0));

    processed.forEach(r => {
        let base = ITEMS_DB[r.id]; 
        let reqText = Object.keys(r.req).map(k => `${r.req[k]} ${ITEMS_DB[k].name}`).join(', ');
        
        let btn = document.createElement('button'); 
        btn.className = 'btn btn-primary'; 
        btn.style.display = 'flex'; btn.style.alignItems = 'center'; btn.style.gap = '10px'; btn.style.textAlign = 'left';
        
        let iconHtml = `<div style="width:40px;height:40px;flex-shrink:0;">${base.svg}</div>`;
        
        if (!r.canAfford) { 
            btn.style.opacity = '0.6'; btn.style.background = '#475569'; 
            btn.innerHTML = `${iconHtml} <span><b>${base.name}</b><br><small style="color:#fca5a5;">Falta: ${reqText}</small></span>`; 
        } else { 
            btn.innerHTML = `${iconHtml} <span><b>${base.name}</b><br><small style="color:#a7f3d0;">Req: ${reqText}</small></span>`; 
        }
        
        btn.onclick = () => {
            if(!r.canAfford) return showNotification("Materiales insuficientes.");
            for (let reqId in r.req) removeItemByName(reqId, r.req[reqId]); 
            giveItem(r.id, 1); 
            showNotification("Crafteaste: " + base.name); 
            logEvent("Crafteaste " + base.name, 'action'); 
            AudioSys.play('build'); 
            renderCrafting(station);
        };
        grid.appendChild(btn);
    });
}