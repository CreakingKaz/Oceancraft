const MAX_SLOTS = 30;
const MAX_STACK = 3;

const ITEMS_DB = {
    madera: { name: 'Madera', cat: 'mat', color: '#8b5a2b', symbol: '▤', desc: 'Madera flotante, útil para elaborar herramientas.' },
    plastico: { name: 'Plástico', cat: 'mat', color: '#b8c6cf', symbol: '▤', desc: 'Residuo resistente que flota en el océano.' },
    hojas: { name: 'Hojas', cat: 'mat', color: '#45ad61', symbol: '▤', desc: 'Hojas de palma para trenzar recursos.' },
    cuerda: { name: 'Cuerda', cat: 'mat', color: '#c9a45f', symbol: '▤', desc: 'Fibra trenzada para fabricar equipo.' },
    chatarra: { name: 'Chatarra', cat: 'mat', color: '#72808b', symbol: '▤', desc: 'Metal oxidado rescatado del mar.' },
    piedra: { name: 'Piedra', cat: 'mat', color: '#9da6ad', symbol: '▤', desc: 'Piedra pesada y duradera.' },
    arena: { name: 'Arena', cat: 'mat', color: '#d7bd78', symbol: '▤', desc: 'Arena húmeda acumulada en un frasco.' },
    alga: { name: 'Alga', cat: 'mat', color: '#15765a', symbol: '▤', desc: 'Alga salada que puede convertirse en comida.' },
    cobre: { name: 'Cobre', cat: 'mat', color: '#c9774e', symbol: '▤', desc: 'Metal blando para mejorar herramientas.' },
    clavo: { name: 'Clavos', cat: 'mat', color: '#45505b', symbol: '▤', desc: 'Piezas pequeñas de metal.' },
    tablon: { name: 'Tablón', cat: 'mat', color: '#b96b2f', symbol: '▤', desc: 'Madera reforzada.' },
    arcilla: { name: 'Arcilla', cat: 'mat', color: '#a65b48', symbol: '▤', desc: 'Arcilla húmeda de una caja perdida.' },
    cuero: { name: 'Cuero', cat: 'mat', color: '#7b5435', symbol: '▤', desc: 'Material resistente y flexible.' },
    pluma: { name: 'Pluma', cat: 'mat', color: '#e9edf0', symbol: '▤', desc: 'Ligera pluma de gaviota.' },
    semilla: { name: 'Semilla', cat: 'mat', color: '#806d30', symbol: '▤', desc: 'Una semilla guardada para más adelante.' },

    gancho_t1: { name: 'Gancho plástico', cat: 'herr', color: '#84919a', symbol: '⚒', maxDur: 10, action: 'Lanzar gancho', range: 250, desc: 'Atrae objetos cercanos. Su durabilidad baja con cada lanzamiento.' },
    gancho_t2: { name: 'Gancho de metal', cat: 'herr', color: '#67727a', symbol: '⚒', maxDur: 20, action: 'Gancho fuerte', range: 390, desc: 'Alcanza objetos que están más lejos.' },
    gancho_t3: { name: 'Gancho reforzado', cat: 'herr', color: '#bb7448', symbol: '⚒', maxDur: 35, action: 'Gancho reforzado', range: 560, desc: 'Gancho de largo alcance para recuperar varios objetos.' },
    cana: { name: 'Caña de pescar', cat: 'herr', color: '#b46a37', symbol: '⚒', maxDur: 15, action: 'Pescar', desc: 'Permite intentar pescar comida.' },
    vaso: { name: 'Vaso vacío', cat: 'herr', color: '#dce8ee', symbol: '⚒', maxDur: 12, action: 'Recoger agua', desc: 'Recoge agua salada para usarla después.' },
    red_atrapa: { name: 'Red pequeña', cat: 'herr', color: '#e0e7ea', symbol: '⚒', maxDur: 25, action: 'Usar red', range: 330, desc: 'Recoge un objeto flotante cercano.' },

    pez_crudo: { name: 'Pez crudo', cat: 'com', color: '#ed9db5', symbol: '♨', val: { hunger: 8, thirst: -2 }, desc: 'Comestible, aunque sabe mejor cocinado.' },
    pez_cocido: { name: 'Pez cocido', cat: 'com', color: '#f0d1a3', symbol: '♨', val: { hunger: 28, thirst: -3 }, desc: 'Comida caliente y nutritiva.' },
    papa: { name: 'Papa', cat: 'com', color: '#d9af43', symbol: '♨', val: { hunger: 15, thirst: 1 }, desc: 'Alimento sencillo encontrado en barriles.' },
    remolacha: { name: 'Remolacha', cat: 'com', color: '#b94362', symbol: '♨', val: { hunger: 12, thirst: 2 }, desc: 'Una raíz dulce.' },
    coco: { name: 'Coco', cat: 'com', color: '#745334', symbol: '♨', val: { hunger: 8, thirst: 12 }, desc: 'Aporta algo de comida y agua.' },
    sopa: { name: 'Sopa simple', cat: 'com', color: '#d7a955', symbol: '♨', val: { hunger: 34, thirst: 8 }, desc: 'Una comida reconfortante.' },
    ensalada: { name: 'Ensalada de algas', cat: 'com', color: '#4eac5d', symbol: '♨', val: { hunger: 20, thirst: 8 }, desc: 'Fresca y ligera.' },
    agua_limpia: { name: 'Agua limpia', cat: 'com', color: '#4aafe3', symbol: '♨', val: { hunger: 0, thirst: 35 }, desc: 'Agua potable.' },
    agua_sucia: { name: 'Agua salada', cat: 'com', color: '#387ca5', symbol: '♨', val: { hunger: 0, thirst: -10 }, desc: 'No quita la sed.' }
};

const RECIPES = [
    { id: 'cuerda', cat: 'mat', ingredients: { hojas: 2 } },
    { id: 'tablon', cat: 'mat', ingredients: { madera: 2 } },
    { id: 'clavo', cat: 'mat', ingredients: { chatarra: 1 } },
    { id: 'gancho_t1', cat: 'herr', ingredients: { plastico: 2, cuerda: 1 } },
    { id: 'gancho_t2', cat: 'herr', ingredients: { chatarra: 2, cuerda: 2 } },
    { id: 'gancho_t3', cat: 'herr', ingredients: { cobre: 2, cuerda: 3, plastico: 1 } },
    { id: 'cana', cat: 'herr', ingredients: { madera: 2, cuerda: 2 } },
    { id: 'vaso', cat: 'herr', ingredients: { plastico: 2 } },
    { id: 'red_atrapa', cat: 'herr', ingredients: { cuerda: 3, plastico: 1 } },
    { id: 'sopa', cat: 'com', ingredients: { pez_crudo: 1, papa: 1 } },
    { id: 'ensalada', cat: 'com', ingredients: { alga: 2, remolacha: 1 } }
];

let inventory = [];
let hotbar = [null, null, null];

function getUID() {
    return Math.random().toString(36).slice(2, 11);
}

function stackLimit(base) {
    return base.cat === 'herr' ? 1 : MAX_STACK;
}

function giveItem(id, qty) {
    const base = ITEMS_DB[id];
    let remaining = qty === undefined ? 1 : qty;
    if (!base) return 0;

    for (let i = 0; i < inventory.length && remaining > 0; i++) {
        const item = inventory[i];
        if (item.id !== id || item.qty >= stackLimit(base)) continue;
        const added = Math.min(stackLimit(base) - item.qty, remaining);
        item.qty += added;
        remaining -= added;
    }

    while (remaining > 0 && inventory.length < MAX_SLOTS) {
        const added = Math.min(stackLimit(base), remaining);
        inventory.push({ id: id, qty: added, dur: base.cat === 'herr' ? base.maxDur : null, uid: getUID(), obtainedAt: Date.now() });
        remaining -= added;
    }

    return qty === undefined ? 1 - remaining : qty - remaining;
}

function removeItemByUID(uid, qty) {
    const amount = qty === undefined ? 1 : qty;
    const index = inventory.findIndex(function(item) { return item.uid === uid; });
    if (index === -1) return false;
    const item = inventory[index];
    item.qty -= amount;
    if (item.qty <= 0) {
        inventory.splice(index, 1);
        hotbar = hotbar.map(function(slotUID) { return slotUID === uid ? null : slotUID; });
    }
    return true;
}

function countItem(id) {
    return inventory.filter(function(item) { return item.id === id; }).reduce(function(total, item) { return total + item.qty; }, 0);
}

function consumeItems(id, quantity) {
    let remaining = quantity;
    for (let i = inventory.length - 1; i >= 0 && remaining > 0; i--) {
        if (inventory[i].id !== id) continue;
        const used = Math.min(inventory[i].qty, remaining);
        const uid = inventory[i].uid;
        removeItemByUID(uid, used);
        remaining -= used;
    }
    return remaining === 0;
}

function getItemByUID(uid) {
    return inventory.find(function(item) { return item.uid === uid; }) || null;
}