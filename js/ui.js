let selectedSlot = 0;
let currentInvTab = 'todo';
let currentCraftTab = 'todo';
let selectedInvUID = null;
let selectedRecipeID = null;
let openMenuId = null;

function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;

    if (openMenuId && openMenuId !== menuId) {
        document.getElementById(openMenuId).classList.add('hidden');
    }

    const willOpen = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !willOpen);
    openMenuId = willOpen ? menuId : null;

    if (willOpen && menuId === 'inventory-modal') renderInventory();
    if (willOpen && menuId === 'craft-modal') renderCraftMenu();
    if (willOpen && menuId === 'settings-modal') updateHUD();
}

function selectSlot(index) {
    selectedSlot = index;
    document.querySelectorAll('.hotbar-slot').forEach(function(slot) { slot.classList.remove('selected'); });
    const slot = document.getElementById('slot-' + index);
    if (slot) slot.classList.add('selected');
    updateActionButton();
}

function setInvTab(tab) {
    currentInvTab = tab;
    renderInventory();
}

function setCraftTab(tab) {
    currentCraftTab = tab;
    renderCraftMenu();
}

function updateActionButton() {
    const button = document.getElementById('action-btn');
    if (!button) return;
    const item = getItemByUID(hotbar[selectedSlot]);

    if (!item) {
        button.textContent = 'Buscar objetos';
        return;
    }

    const base = ITEMS_DB[item.id];
    if (base.cat === 'herr') button.textContent = base.action;
    else if (base.cat === 'com') button.textContent = 'Consumir';
    else button.textContent = 'Buscar objetos';
}

function durabilityColor(percent) {
    if (percent > 55) return '#41c86d';
    if (percent > 25) return '#e8c94d';
    return '#dc5d5d';
}

function durabilityMarkup(item, base) {
    if (base.cat !== 'herr') return '';
    const percent = Math.max(0, Math.round((item.dur / base.maxDur) * 100));
    return '<div class="item-durability"><div style="width:' + percent + '%;background:' + durabilityColor(percent) + '"></div></div>';
}

function renderHotbarUI() {
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById('slot-' + i);
        if (!slot) continue;
        const item = getItemByUID(hotbar[i]);
        slot.innerHTML = '';
        slot.style.background = 'rgba(10, 19, 27, 0.9)';

        if (!item) continue;
        const base = ITEMS_DB[item.id];
        slot.style.background = base.color;
        slot.innerHTML = '<span>' + base.symbol + '</span>';

        if (base.cat === 'herr') {
            const percent = Math.max(0, Math.round((item.dur / base.maxDur) * 100));
            slot.innerHTML += '<div class="durability-track"><div class="durability-fill" style="width:' + percent + '%;background:' + durabilityColor(percent) + '"></div></div>';
        } else {
            slot.innerHTML += '<span class="slot-qty">x' + item.qty + '</span>';
        }
    }
    updateActionButton();
}

function updateTabState(containerID, currentTab) {
    document.querySelectorAll('#' + containerID + ' .tab').forEach(function(tab) {
        tab.classList.toggle('active', tab.dataset.category === currentTab);
    });
}

function renderInventory() {
    const count = document.getElementById('inv-count');
    const list = document.getElementById('inv-grid');
    if (!list) return;
    if (count) count.textContent = inventory.length;

    updateTabState('inv-tabs', currentInvTab);
    const sortControl = document.getElementById('inv-filter');
    let filtered = inventory.filter(function(item) {
        return currentInvTab === 'todo' || ITEMS_DB[item.id].cat === currentInvTab;
    }).slice();

    if (sortControl && sortControl.value === 'qty') {
        filtered.sort(function(a, b) { return b.qty - a.qty; });
    } else {
        filtered.sort(function(a, b) { return b.obtainedAt - a.obtainedAt; });
    }

    list.innerHTML = '';
    if (!filtered.length) {
        list.innerHTML = '<p class="list-detail">No tienes objetos en esta categoría.</p>';
        return;
    }

    filtered.forEach(function(item) {
        const base = ITEMS_DB[item.id];
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'item-row' + (selectedInvUID === item.uid ? ' selected' : '');
        row.innerHTML = '<span class="list-icon" style="background:' + base.color + '">' + base.symbol + '</span>' +
            '<span class="list-info"><strong class="list-name">' + base.name + '</strong>' +
            '<span class="list-detail">' + (base.cat === 'herr' ? 'Durabilidad: ' + item.dur + '/' + base.maxDur : 'Cantidad: ' + item.qty) + '</span>' +
            durabilityMarkup(item, base) + '</span>';
        row.onclick = function() { showInventoryLore(item.uid); };
        list.appendChild(row);
    });
}

function showInventoryLore(uid) {
    const item = getItemByUID(uid);
    if (!item) return;
    selectedInvUID = uid;
    const base = ITEMS_DB[item.id];
    const text = document.getElementById('lore-text');
    const actions = document.getElementById('lore-actions');
    text.innerHTML = '<strong>' + base.name + '</strong><br>' + base.desc;
    actions.innerHTML = '<button class="btn" onclick="equipToHotbar(0)">Equipar 1</button>' +
        '<button class="btn" onclick="equipToHotbar(1)">Equipar 2</button>' +
        '<button class="btn" onclick="equipToHotbar(2)">Equipar 3</button>' +
        (base.cat === 'com' ? '<button class="btn" onclick="consumeSelected()">Consumir</button>' : '') +
        '<button class="btn" onclick="dropSelected()">Tirar</button>';
    renderInventory();
}

function equipToHotbar(slotIndex) {
    if (!selectedInvUID || !getItemByUID(selectedInvUID)) return;
    hotbar[slotIndex] = selectedInvUID;
    notify('Equipado en el espacio ' + (slotIndex + 1) + '.');
    renderHotbarUI();
    saveGame(true);
}

function consumeSelected() {
    if (!selectedInvUID) return;
    consumeFood(selectedInvUID);
    selectedInvUID = null;
    renderInventory();
}

function dropSelected() {
    const item = getItemByUID(selectedInvUID);
    if (!item) return;
    const name = ITEMS_DB[item.id].name;
    removeItemByUID(item.uid, 1);
    selectedInvUID = null;
    addHistory('Tiraste ' + name + '.');
    notify('Tiraste ' + name + '.');
    renderInventory();
    renderHotbarUI();
    saveGame(true);
}

function canCraft(recipe) {
    return Object.keys(recipe.ingredients).every(function(id) {
        return countItem(id) >= recipe.ingredients[id];
    });
}

function recipeRequirements(recipe) {
    return Object.keys(recipe.ingredients).map(function(id) {
        return ITEMS_DB[id].name + ' ' + countItem(id) + '/' + recipe.ingredients[id];
    }).join(' · ');
}

function renderCraftMenu() {
    const list = document.getElementById('craft-list');
    if (!list) return;
    updateTabState('craft-tabs', currentCraftTab);
    const showAll = document.getElementById('show-all-craft').checked;
    const recipes = RECIPES.filter(function(recipe) {
        return currentCraftTab === 'todo' || recipe.cat === currentCraftTab;
    }).filter(function(recipe) {
        return showAll || canCraft(recipe);
    });

    list.innerHTML = '';
    if (!recipes.length) {
        list.innerHTML = '<p class="list-detail">No hay recetas disponibles.</p>';
        return;
    }

    recipes.forEach(function(recipe) {
        const base = ITEMS_DB[recipe.id];
        const available = canCraft(recipe);
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'item-row' + (available ? '' : ' locked') + (selectedRecipeID === recipe.id ? ' selected' : '');
        row.innerHTML = '<span class="list-icon" style="background:' + base.color + '">' + base.symbol + '</span>' +
            '<span class="list-info"><strong class="list-name">' + base.name + '</strong><span class="list-detail">' + recipeRequirements(recipe) + '</span></span>';
        row.onclick = function() { showCraftLore(recipe.id); };
        list.appendChild(row);
    });
}

function showCraftLore(recipeID) {
    const recipe = RECIPES.find(function(entry) { return entry.id === recipeID; });
    if (!recipe) return;
    selectedRecipeID = recipeID;
    const base = ITEMS_DB[recipe.id];
    document.getElementById('craft-lore-text').innerHTML = '<strong>' + base.name + '</strong><br>' + base.desc + '<br><small>' + recipeRequirements(recipe) + '</small>';
    document.getElementById('craft-actions').innerHTML = '<button class="btn btn-primary" ' + (canCraft(recipe) ? '' : 'disabled') + ' onclick="craftSelected()">Craftear</button>';
    renderCraftMenu();
}

function craftSelected() {
    const recipe = RECIPES.find(function(entry) { return entry.id === selectedRecipeID; });
    if (!recipe || !canCraft(recipe)) return;

    Object.keys(recipe.ingredients).forEach(function(id) { consumeItems(id, recipe.ingredients[id]); });
    const added = giveItem(recipe.id, 1);
    if (!added) {
        notify('Inventario lleno.');
        return;
    }

    const name = ITEMS_DB[recipe.id].name;
    addHistory('Crafteaste ' + name + '.');
    notify('Crafteaste ' + name + '.');
    selectedRecipeID = null;
    renderCraftMenu();
    renderInventory();
    renderHotbarUI();
    saveGame(true);
}