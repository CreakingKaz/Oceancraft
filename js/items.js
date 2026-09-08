const MAX_SLOTS = 30;
const MAX_STACK = 3;

const ITEMS_DB = {
    'madera': { name: 'Madera', cat: 'mat', color: '#8B4513', symbol: '▤', desc: 'Madera para construir.' },
    'plastico': { name: 'Plástico', cat: 'mat', color: '#bdc3c7', symbol: '▤', desc: 'Basura resistente.' },
    'hojas': { name: 'Hojas', cat: 'mat', color: '#2ecc71', symbol: '▤', desc: 'Hojas de palma.' },
    'cuerda': { name: 'Cuerda', cat: 'mat', color: '#f1c40f', symbol: '▤', desc: 'Hecha de hojas.' },
    'chatarra': { name: 'Chatarra', cat: 'mat', color: '#7f8c8d', symbol: '▤', desc: 'Metal oxidado.' },
    'municion': { name: 'Bala', cat: 'mat', color: '#f39c12', symbol: '▤', desc: 'Munición para armas de fuego.' },
    
    'gancho_t1': { name: 'Gancho Plástico', cat: 'herr', color: '#7f8c8d', symbol: '⚒', dur: 10, maxDur: 10, desc: 'Atrapa objetos cercanos.', action: 'Lanzar Gancho' },
    'martillo': { name: 'Martillo', cat: 'herr', color: '#e67e22', symbol: '⚒', dur: 30, maxDur: 30, desc: 'Interactúa con mesas y las desarma.', action: 'Modo Construir' },
    'espada_madera': { name: 'Espada de Madera', cat: 'herr', color: '#d35400', symbol: '⚔', dur: 20, maxDur: 20, desc: 'Arma cuerpo a cuerpo básica.', action: 'Atacar', isWeapon: true, dmg: 10 },
    'pistola': { name: 'Pistola Naufraga', cat: 'herr', color: '#34495e', symbol: '🔫', dur: 15, maxDur: 15, desc: 'Arma a distancia.', action: 'Disparar', isWeapon: true, isRanged: true, ammo: 0, maxAmmo: 6, dmg: 25 },
    
    'papa': { name: 'Papa Cruda', cat: 'com', color: '#e1b12c', symbol: '♨', desc: 'Comida básica.', val: {h: 15, s: 2} },
    
    'mesa_trabajo': { name: 'Mesa Trabajo', cat: 'est', color: '#5c2e0b', symbol: '⌂', desc: 'Desbloquea crafteos.', action: 'Colocar Mesa' },
    'cofre': { name: 'Cofre Pequeño', cat: 'est', color: '#d35400', symbol: '⌂', desc: 'Guarda hasta 5 objetos.', action: 'Colocar Cofre', hasInventory: true },
    'vela': { name: 'Vela', cat: 'est', color: '#ecf0f1', symbol: '⌂', desc: 'Permite mover la balsa por el océano.', action: 'Colocar Vela' }
};

const RECIPES = [
    { id: 'cuerda', req: {hojas: 2} },
    { id: 'gancho_t1', req: {plastico: 2, cuerda: 1} },
    { id: 'martillo', req: {madera: 2, cuerda: 1, chatarra: 1} },
    { id: 'espada_madera', req: {madera: 2, cuerda: 1} },
    { id: 'mesa_trabajo', req: {madera: 4, plastico: 2} },
    { id: 'cofre', req: {madera: 3, chatarra: 1} },
    { id: 'vela', req: {madera: 2, hojas: 5, cuerda: 2} }
];

let game = {
    slot: 1, diff: 1,
    time: { d: 1, h: 8, acts: 0 },
    stats: { hp: 100, h: 100, s: 100, su: 100 },
    inv: [],
    hotbar: [null, null, null],
    structures: [], 
    playerConfig: { icon: 'Kaz', color: '#e74c3c' }
};

function getUID() { return Math.random().toString(36).substr(2, 9); }

function giveItem(id, qty = 1) {
    let base = ITEMS_DB[id];
    let remaining = qty;
    if (base.cat === 'herr') {
        for (let i = 0; i < qty; i++) {
            if (game.inv.length < MAX_SLOTS) {
                let newItem = { id: id, qty: 1, uid: getUID(), dur: base.dur };
                if(base.isRanged) newItem.ammo = 0;
                game.inv.push(newItem);
            }
        }
        return;
    }
    for (let item of game.inv) {
        if (item.id === id && item.qty < MAX_STACK) {
            let take = Math.min(MAX_STACK - item.qty, remaining);
            item.qty += take; remaining -= take;
            if (remaining <= 0) return;
        }
    }
    while (remaining > 0 && game.inv.length < MAX_SLOTS) {
        let take = Math.min(MAX_STACK, remaining);
        game.inv.push({ id: id, qty: take, uid: getUID() });
        remaining -= take;
    }
}

function removeItem(uid, qty) {
    let idx = game.inv.findIndex(i => i.uid === uid);
    if(idx === -1) return;
    game.inv[idx].qty -= qty;
    if(game.inv[idx].qty <= 0) {
        game.inv.splice(idx, 1);
        game.hotbar = game.hotbar.map(u => u === uid ? null : u);
    }
}
function countItem(id) { return game.inv.filter(i => i.id === id).reduce((acc, curr) => acc + curr.qty, 0); }

