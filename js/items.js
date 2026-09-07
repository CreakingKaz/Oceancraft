// js/items.js

const MAX_SLOTS = 30;
const MAX_STACK = 3;

// Base de Datos de Objetos
const ITEMS_DB = {
    'madera': { name: 'Madera', cat: 'mat', color: '#8B4513', symbol: '▤', desc: 'Madera flotante, útil para construir.' },
    'plastico': { name: 'Plástico', cat: 'mat', color: '#bdc3c7', symbol: '▤', desc: 'Basura del océano. Muy resistente.' },
    'hojas': { name: 'Hojas', cat: 'mat', color: '#2ecc71', symbol: '▤', desc: 'Hojas de palma para hacer cuerdas.' },
    
    'gancho_t1': { name: 'Gancho Plástico', cat: 'herr', color: '#7f8c8d', symbol: '⚒', dur: 10, maxDur: 10, desc: 'Atrapa objetos cercanos.', action: 'Lanzar Gancho' },
    'martillo': { name: 'Martillo', cat: 'herr', color: '#e67e22', symbol: '⚒', dur: 30, maxDur: 30, desc: 'Sirve para colocar y quitar estructuras.' },
    
    'papa': { name: 'Papa Cruda', cat: 'com', color: '#e1b12c', symbol: '♨', desc: 'Comida básica de barril.', val: {h: 15, s: 2} }
};

// Variables Globales del Jugador
let inventory = []; // Guardará objetos: { id: 'madera', qty: 2, uid: 'xyz123' }
let hotbar = [null, null, null]; // Guardará los UIDs de los objetos equipados

// Generador de ID único para que cada herramienta sea independiente
function getUID() { return Math.random().toString(36).substr(2, 9); }

// Función Maestra para dar objetos
function giveItem(id, qty = 1) {
    let base = ITEMS_DB[id];
    let remaining = qty;

    // Si es herramienta (no se stackea)
    if (base.cat === 'herr') {
        for (let i = 0; i < qty; i++) {
            if (inventory.length < MAX_SLOTS) {
                inventory.push({ id: id, qty: 1, uid: getUID(), dur: base.dur });
            }
        }
        return;
    }

    // Buscar si ya tenemos un stack incompleto
    for (let item of inventory) {
        if (item.id === id && item.qty < MAX_STACK) {
            let space = MAX_STACK - item.qty;
            let take = Math.min(space, remaining);
            item.qty += take;
            remaining -= take;
            if (remaining <= 0) return;
        }
    }

    // Crear nuevos stacks si sobra
    while (remaining > 0 && inventory.length < MAX_SLOTS) {
        let take = Math.min(MAX_STACK, remaining);
        inventory.push({ id: id, qty: take, uid: getUID() });
        remaining -= take;
    }
}