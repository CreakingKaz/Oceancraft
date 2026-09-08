const MAX_SLOTS = 15;
const MAX_STACK = 3;

function genSVG(type, c1, c2, c3='') {
    const base = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"';
    if(type==='plank') return `<svg ${base}><rect x="15" y="30" width="70" height="40" rx="5" fill="${c1}"/><line x1="20" y1="40" x2="80" y2="40" stroke="${c2}" stroke-width="3"/><line x1="20" y1="55" x2="80" y2="55" stroke="${c2}" stroke-width="3"/></svg>`;
    if(type==='ore') return `<svg ${base}><circle cx="50" cy="50" r="30" fill="#78716c"/><circle cx="40" cy="40" r="8" fill="${c1}"/><circle cx="60" cy="55" r="6" fill="${c1}"/></svg>`;
    if(type==='leaf') return `<svg ${base}><path d="M50 10 C90 30 90 70 50 90 C10 70 10 30 50 10" fill="${c1}"/><line x1="50" y1="15" x2="50" y2="85" stroke="${c2}" stroke-width="3"/></svg>`;
    if(type==='hook') return `<svg ${base}><path d="M30 20 L70 20 L50 40 Z" fill="${c1}"/><rect x="45" y="40" width="10" height="50" fill="${c2}"/></svg>`;
    if(type==='bottle') return `<svg ${base}><rect x="40" y="20" width="20" height="15" fill="#94a3b8"/><rect x="35" y="35" width="30" height="55" rx="10" fill="rgba(224, 242, 254, 0.6)" stroke="#bae6fd" stroke-width="3"/><rect x="35" y="50" width="30" height="40" rx="10" fill="${c1}"/></svg>`;
    if(type==='chest') return `<svg ${base}><rect x="15" y="30" width="70" height="50" fill="${c1}" rx="5"/><rect x="15" y="30" width="70" height="20" fill="${c2}" rx="5"/><rect x="45" y="45" width="10" height="10" fill="#fbbf24"/></svg>`;
    if(type==='foundation') return `<svg ${base}><rect x="10" y="10" width="80" height="80" fill="${c1}" stroke="${c2}" stroke-width="5"/></svg>`;
    return `<svg ${base}><circle cx="50" cy="50" r="25" fill="${c1}"/></svg>`;
}

const ITEMS_DB = {
    'madera': { name: 'Madera', cat: 'mat', rarity: 'comun', color: '#8B4513', desc: 'Madera flotante común.', svg: genSVG('plank', '#a1662f', '#784414') },
    'plastico': { name: 'Plástico', cat: 'mat', rarity: 'comun', color: '#cbd5e1', desc: 'Basura del viejo mundo.', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="30,20 70,20 85,50 70,80 30,80 15,50" fill="#cbd5e1" stroke="#94a3b8" stroke-width="4"/></svg>` },
    'hojas': { name: 'Hojas', cat: 'mat', rarity: 'comun', color: '#22c55e', desc: 'Útiles para crear cuerdas.', svg: genSVG('leaf', '#22c55e', '#166534') },
    'cuerda': { name: 'Cuerda', cat: 'mat', rarity: 'poco', color: '#eab308', desc: 'Soga firme.', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#eab308" stroke-width="12" stroke-dasharray="10 5"/></svg>` },
    'chatarra': { name: 'Chatarra', cat: 'mat', rarity: 'comun', color: '#94a3b8', desc: 'Metal oxidado.', svg: genSVG('ore', '#94a3b8', '') },
    
    'papa': { name: 'Papa Cruda', cat: 'com', rarity: 'comun', color: '#eab308', desc: 'Restaura hambre, intoxica.', val: {h: 15, tox: -25}, action: 'Comer', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#d97706"/></svg>` },
    'botella_vacia': { name: 'Botella Vacía', cat: 'herr', rarity: 'poco', color: '#bae6fd', dur: 1, maxDur: 1, desc: 'Úsala en el océano para llenarla.', action: 'Equipar', svg: genSVG('bottle', 'transparent', '') },
    'agua_salada': { name: 'Agua Salada', cat: 'com', rarity: 'comun', color: '#38bdf8', desc: 'Deshidrata más de lo que ayuda.', val: {w: -20, tox: -30}, action: 'Beber', svg: genSVG('bottle', '#38bdf8', '') },

    'gancho_t1': { name: 'Gancho Plástico', cat: 'herr', rarity: 'poco', color: '#64748b', dur: 20, maxDur: 20, desc: 'Atrapa objetos en línea recta.', action: 'Equipar', svg: genSVG('hook', '#94a3b8', '#8B4513'), range: 300, speed: 6 },
    'martillo': { name: 'Martillo', cat: 'herr', rarity: 'poco', color: '#d97706', dur: 40, maxDur: 40, desc: 'Obligatorio para construir/destruir.', action: 'Equipar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="40" y="30" width="20" height="60" fill="#8B4513" rx="5"/><rect x="25" y="10" width="50" height="25" fill="#94a3b8" rx="3"/></svg>` },
    'espada_basica': { name: 'Espada de Chatarra', cat: 'herr', rarity: 'poco', color: '#94a3b8', dur: 30, maxDur: 30, desc: 'Defensa básica.', action: 'Equipar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="45" y="20" width="10" height="50" fill="#94a3b8"/><rect x="35" y="70" width="30" height="8" fill="#475569"/><rect x="45" y="78" width="10" height="15" fill="#8B4513"/></svg>`, dmg: 15 },

    'cimiento_madera': { name: 'Cimiento Madera', cat: 'est', rarity: 'comun', color: '#8B4513', desc: 'Expande balsa. Resiste 3 golpes.', action: 'Construir', svg: genSVG('foundation', '#8B4513', '#5c2e0b'), buildType: 'floor', hp: 3 },
    'cimiento_plastico': { name: 'Cimiento Plástico', cat: 'est', rarity: 'poco', color: '#cbd5e1', desc: 'Expande balsa. Resiste 5 golpes.', action: 'Construir', svg: genSVG('foundation', '#cbd5e1', '#94a3b8'), buildType: 'floor', hp: 5 },
    'mesa_trabajo': { name: 'Mesa de Trabajo', cat: 'est', rarity: 'raro', color: '#5c2e0b', desc: 'Desbloquea crafteos avanzados.', action: 'Colocar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="20" width="80" height="60" fill="#78350f" rx="5"/><rect x="20" y="30" width="60" height="40" fill="#b45309"/><line x1="30" y1="50" x2="70" y2="50" stroke="#fcd34d" stroke-width="4"/></svg>`, buildType: 'prop' },
    'cofre_pequeno': { name: 'Cofre Pequeño', cat: 'est', rarity: 'raro', color: '#78350f', desc: 'Guarda 5 ítems.', action: 'Colocar', svg: genSVG('chest', '#8B4513', '#5c2e0b'), buildType: 'prop' }
};

const RECIPES = [
    { id: 'cuerda', req: { hojas: 2 }, station: 'basic', cat: 'mat' },
    { id: 'botella_vacia', req: { plastico: 2 }, station: 'basic', cat: 'herr' },
    { id: 'martillo', req: { madera: 2, cuerda: 1 }, station: 'basic', cat: 'herr' },
    { id: 'gancho_t1', req: { plastico: 3, cuerda: 2 }, station: 'basic', cat: 'herr' },
    { id: 'mesa_trabajo', req: { madera: 4, plastico: 2 }, station: 'basic', cat: 'est' },
    
    // Foundations moved to Mesa de Trabajo
    { id: 'cimiento_madera', req: { madera: 3, plastico: 1 }, station: 'mesa_trabajo', cat: 'est' },
    { id: 'cimiento_plastico', req: { plastico: 4 }, station: 'mesa_trabajo', cat: 'est' },
    { id: 'cofre_pequeno', req: { madera: 4, chatarra: 1 }, station: 'mesa_trabajo', cat: 'est' },
    { id: 'espada_basica', req: { chatarra: 3, madera: 1 }, station: 'mesa_trabajo', cat: 'herr' }
];

let inventory = [];
let hotbar = [null, null, null];
let timestampCounter = 0;

function getUID() { return Math.random().toString(36).substr(2, 9); }
function giveItem(id, qty = 1) {
    if(!ITEMS_DB[id]) return false;
    let base = ITEMS_DB[id]; let remaining = qty; timestampCounter++;
    if (base.cat === 'herr' || base.cat === 'est') {
        for (let i = 0; i < qty; i++) { 
            if (inventory.length < MAX_SLOTS) inventory.push({ id: id, qty: 1, uid: getUID(), dur: base.dur, time: timestampCounter, fav: false }); 
            else return false;
        }
        return true;
    }
    for (let item of inventory) {
        if (item.id === id && item.qty < MAX_STACK) {
            let take = Math.min(MAX_STACK - item.qty, remaining);
            item.qty += take; item.time = timestampCounter; remaining -= take;
            if (remaining <= 0) return true;
        }
    }
    while (remaining > 0) {
        if(inventory.length >= MAX_SLOTS) return false;
        let take = Math.min(MAX_STACK, remaining);
        inventory.push({ id: id, qty: take, uid: getUID(), time: timestampCounter, fav: false });
        remaining -= take;
    }
    return true;
}
function removeItemByUID(uid, qty) {
    let index = inventory.findIndex(i => i.uid === uid);
    if (index !== -1) {
        inventory[index].qty -= qty;
        if (inventory[index].qty <= 0) {
            inventory.splice(index, 1);
            for(let i=0; i<3; i++) { if(hotbar[i] === uid) hotbar[i] = null; }
            if(typeof selectedInvUID !== 'undefined' && selectedInvUID === uid) {
                selectedInvUID = null; renderLoreBox();
            }
        }
    }
    if(typeof renderInventory === 'function') renderInventory();
    if(typeof renderHotbarUI === 'function') renderHotbarUI();
}
function removeItemByName(id, qty) {
    let remaining = qty;
    for (let i = inventory.length - 1; i >= 0; i--) {
        if (inventory[i].id === id) {
            let take = Math.min(inventory[i].qty, remaining); inventory[i].qty -= take; remaining -= take;
            if (inventory[i].qty <= 0) { 
                let uid = inventory[i].uid; inventory.splice(i, 1); 
                for(let h=0; h<3; h++) { if(hotbar[h] === uid) hotbar[h] = null; } 
                if(typeof selectedInvUID !== 'undefined' && selectedInvUID === uid) selectedInvUID = null;
            }
            if (remaining <= 0) break;
        }
    }
    if(typeof renderInventory === 'function') renderInventory();
    if(typeof renderHotbarUI === 'function') renderHotbarUI();
}