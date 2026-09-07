// js/ui.js

let selectedSlot = 0;
let currentInvTab = 'todo';
let selectedInvUID = null;

// Abrir y cerrar menús
function toggleMenu(menuId) {
    let menu = document.getElementById(menuId);
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        if(menuId === 'inventory-modal') renderInventory();
    } else {
        menu.classList.add('hidden');
    }
}

// Seleccionar un slot del Hotbar (0, 1 o 2)
function selectSlot(index) {
    document.querySelectorAll('.hotbar-slot').forEach(el => el.classList.remove('selected'));
    document.getElementById('slot-' + index).classList.add('selected');
    selectedSlot = index;
    updateActionButton();
}

function updateActionButton() {
    let btn = document.getElementById('action-btn');
    let uid = hotbar[selectedSlot];
    let item = inventory.find(i => i.uid === uid);

    if (!item) {
        btn.innerText = "Buscar a mano";
    } else {
        let base = ITEMS_DB[item.id];
        btn.innerText = base.action || ("Usar " + base.name);
    }
}

// Renderizar Inventario
function setInvTab(tab) {
    currentInvTab = tab;
    renderInventory();
}

function renderInventory() {
    document.getElementById('inv-count').innerText = inventory.length;
    let grid = document.getElementById('inv-grid');
    grid.innerHTML = '';

    let filtered = inventory.filter(i => currentInvTab === 'todo' || ITEMS_DB[i.id].cat === currentInvTab);

    filtered.forEach(item => {
        let base = ITEMS_DB[item.id];
        let div = document.createElement('div');
        div.className = 'inv-item';
        div.style.background = base.color;
        div.innerText = base.symbol;
        
        if (base.cat !== 'herr') {
            div.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
        } else {
            let durPct = (item.dur / base.maxDur) * 100;
            div.innerHTML += `<div class="durability-bar" style="width: ${durPct}%"></div>`;
        }

        div.onclick = () => showLore(item, base);
        grid.appendChild(div);
    });
}

function showLore(item, base) {
    selectedInvUID = item.uid;
    document.getElementById('lore-text').innerHTML = `<strong>${base.name}</strong><br>${base.desc}`;
    
    let actions = document.getElementById('lore-actions');
    actions.innerHTML = `
        <button class="btn" onclick="equipToHotbar(0)">Eq. 1</button>
        <button class="btn" onclick="equipToHotbar(1)">Eq. 2</button>
        <button class="btn" onclick="equipToHotbar(2)">Eq. 3</button>
    `;
}

function equipToHotbar(slotIndex) {
    if (!selectedInvUID) return;
    hotbar[slotIndex] = selectedInvUID;
    renderHotbarUI();
    updateActionButton();
}

function renderHotbarUI() {
    for (let i = 0; i < 3; i++) {
        let slotEl = document.getElementById('slot-' + i);
        let uid = hotbar[i];
        let item = inventory.find(x => x.uid === uid);
        
        slotEl.innerHTML = ''; // Limpiar
        
        if (item) {
            let base = ITEMS_DB[item.id];
            slotEl.style.background = base.color;
            slotEl.innerText = base.symbol;
            
            if (base.cat !== 'herr') {
                slotEl.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
            } else {
                let durPct = (item.dur / base.maxDur) * 100;
                slotEl.innerHTML += `<div class="durability-bar" style="width: ${durPct}%"></div>`;
            }
        } else {
            slotEl.style.background = 'rgba(34, 34, 34, var(--ui-opacity))';
        }
    }
}