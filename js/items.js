const MAX_SLOTS = 15;
const MAX_STACK = 3;

const ITEMS_DB = {
    // Mat
    'madera': { cat: 'mat', name: 'Madera', desc: 'Sólida y húmeda.', color: '#8B4513', svg: '<svg viewBox="0 0 100 100"><rect x="20" y="40" width="60" height="20" fill="#654321"/></svg>' },
    'plastico': { cat: 'mat', name: 'Plástico', desc: 'Basura útil.', color: '#3498db', svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" fill="#2980b9"/></svg>' },
    'hojas': { cat: 'mat', name: 'Hojas', desc: 'Material trenzable.', color: '#2ecc71', svg: '<svg viewBox="0 0 100 100"><path d="M50 20 Q80 50 50 80 Q20 50 50 20" fill="#27ae60"/></svg>' },
    'arena': { cat: 'mat', name: 'Arena', desc: 'Para vidrio.', color: '#f1c40f', svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" fill="#f39c12"/></svg>' },
    'chatarra': { cat: 'mat', name: 'Chatarra', desc: 'Metal oxidado.', color: '#95a5a6', svg: '<svg viewBox="0 0 100 100"><polygon points="30,30 70,40 60,70 20,60" fill="#7f8c8d"/></svg>' },
    'algas': { cat: 'mat', name: 'Algas', desc: 'Pegajoso.', color: '#1abc9c', svg: '<svg viewBox="0 0 100 100"><path d="M40 90 Q50 50 40 10 Q60 50 60 90" stroke="#1abc9c" stroke-width="10" fill="none"/></svg>' },
    // Com
    'papa': { cat: 'com', name: 'Papa Cruda', desc: 'Sana poco.', color: '#d35400', svg: '<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="20" ry="15" fill="#e67e22"/></svg>', val: { h: 10, tox: 5 } },
    'agua_salada': { cat: 'com', name: 'Agua Salada', desc: 'No la bebas.', color: '#2980b9', svg: '<svg viewBox="0 0 100 100"><rect x="40" y="30" width="20" height="40" fill="#3498db"/><rect x="40" y="40" width="20" height="30" fill="#2980b9"/></svg>', val: { w: 5, tox: 25 } },
    // Herr
    'botella_vacia': { cat: 'herr', name: 'Botella Vacía', desc: 'Recoge agua.', color: '#bdc3c7', svg: '<svg viewBox="0 0 100 100"><rect x="40" y="30" width="20" height="40" fill="rgba(255,255,255,0.5)"/></svg>', maxDur: 1, buildType: 'tool' },
    'gancho_t1': { cat: 'herr', name: 'Gancho Plástico', desc: 'Alcance: 300px.', color: '#34495e', svg: '<svg viewBox="0 0 100 100"><path d="M50 80 L50 40 Q70 40 70 60 L60 60" stroke="#2c3e50" stroke-width="8" fill="none"/></svg>', maxDur: 30, range: 300, speed: 5 },
    'martillo': { cat: 'herr', name: 'Martillo', desc: 'Construye y destruye.', color: '#7f8c8d', svg: '<svg viewBox="0 0 100 100"><rect x="45" y="40" width="10" height="50" fill="#8e44ad"/><rect x="30" y="20" width="40" height="20" fill="#2c3e50"/></svg>', maxDur: 50, buildType: 'tool' },
    // Est
    'cimiento': { cat: 'est', name: 'Cimiento', desc: 'Expande tu balsa.', color: '#b45309', svg: '<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="#b45309" stroke="#78350f" stroke-width="5"/></svg>', buildType: 'floor' },
    'mesa_trabajo': { cat: 'est', name: 'Mesa Trabajo', desc: 'Crafteos avanzados.', color: '#d35400', svg: '<svg viewBox="0 0 100 100"><rect x="20" y="30" width="60" height="40" fill="#d35400"/><rect x="25" y="70" width="10" height="20" fill="#8B4513"/><rect x="65" y="70" width="10" height="20" fill="#8B4513"/></svg>', buildType: 'prop' },
    'horno': { cat: 'est', name: 'Horno', desc: 'Cocina.', color: '#7f8c8d', svg: '<svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#7f8c8d"/><rect x="35" y="50" width="30" height="20" fill="#c0392b"/></svg>', buildType: 'prop' }
};

const RECIPES = [
    { id: 'gancho_t1', cat: 'herr', station: 'basic', req: { plastico: 2, madera: 2 } },
    { id: 'cimiento', cat: 'est', station: 'basic', req: { madera: 2, plastico: 1 } },
    { id: 'mesa_trabajo', cat: 'est', station: 'basic', req: { madera: 3, chatarra: 1 } },
    { id: 'martillo', cat: 'herr', station: 'basic', req: { madera: 2, hojas: 2 } },
    { id: 'horno', cat: 'est', station: 'mesa_trabajo', req: { arena: 3, chatarra: 2 } }
];

let inventory = [];
let hotbar = [null, null, null];
let itemsGatheredTotal = 0;

function giveItem(id, qty = 1) {
    let givenCount = 0;
    while(qty > 0) {
        let existing = inventory.find(i => i.id === id && i.qty < MAX_STACK);
        if (existing) {
            existing.qty++; qty--; givenCount++;
        } else if (inventory.length < MAX_SLOTS) {
            let base = ITEMS_DB[id];
            inventory.push({ id, qty: 1, uid: Date.now() + Math.random().toString(), fav: false, dur: base.maxDur || null });
            qty--; givenCount++;
        } else {
            showNotification("Inventario lleno!"); break;
        }
    }
    
    if (givenCount > 0) {
        itemsGatheredTotal += givenCount;
        showLootNotification(`+${givenCount} ${ITEMS_DB[id].name}`, ITEMS_DB[id].color);
        if(typeof renderInventory === 'function') renderInventory();
        if(typeof renderHotbarUI === 'function') renderHotbarUI();
        return true;
    }
    return false;
}

function removeItem(uid, qty) {
    let item = inventory.find(i => i.uid === uid);
    if (!item) return;
    item.qty -= qty;
    if (item.qty <= 0) {
        inventory = inventory.filter(i => i.uid !== uid);
        let hIdx = hotbar.indexOf(uid);
        if (hIdx !== -1) { hotbar[hIdx] = null; document.getElementById('slot-'+hIdx).innerHTML = ''; }
    }
    if(typeof renderInventory === 'function') renderInventory();
    if(typeof renderHotbarUI === 'function') renderHotbarUI();
}

function removeItemByName(id, qty) {
    let items = inventory.filter(i => i.id === id);
    for (let item of items) {
        if (qty <= 0) break;
        let take = Math.min(item.qty, qty);
        removeItem(item.uid, take);
        qty -= take;
    }
}