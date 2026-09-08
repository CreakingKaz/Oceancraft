const MAX_SLOTS = 15;
const MAX_STACK = 3;

// Procedural SVG Generator for 50+ items to save bandwidth and memory
function genSVG(type, c1, c2, c3='') {
    const base = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"';
    if(type==='plank') return `<svg ${base}><rect x="15" y="30" width="70" height="40" rx="5" fill="${c1}"/><line x1="20" y1="40" x2="80" y2="40" stroke="${c2}" stroke-width="3"/><line x1="20" y1="55" x2="80" y2="55" stroke="${c2}" stroke-width="3"/></svg>`;
    if(type==='ingot') return `<svg ${base}><rect x="20" y="35" width="60" height="30" fill="${c1}" rx="5"/><polygon points="20,35 30,25 70,25 80,35" fill="${c2}"/></svg>`;
    if(type==='ore') return `<svg ${base}><circle cx="50" cy="50" r="30" fill="#78716c"/><circle cx="40" cy="40" r="8" fill="${c1}"/><circle cx="60" cy="55" r="6" fill="${c1}"/></svg>`;
    if(type==='leaf') return `<svg ${base}><path d="M50 10 C90 30 90 70 50 90 C10 70 10 30 50 10" fill="${c1}"/><line x1="50" y1="15" x2="50" y2="85" stroke="${c2}" stroke-width="3"/></svg>`;
    if(type==='fish') return `<svg ${base}><ellipse cx="50" cy="50" rx="30" ry="15" fill="${c1}"/><polygon points="20,50 5,40 5,60" fill="${c2}"/><circle cx="70" cy="45" r="3" fill="#000"/></svg>`;
    if(type==='hook') return `<svg ${base}><path d="M30 20 L70 20 L50 40 Z" fill="${c1}"/><rect x="45" y="40" width="10" height="50" fill="${c2}"/></svg>`;
    if(type==='sword') return `<svg ${base}><rect x="45" y="20" width="10" height="50" fill="${c1}"/><rect x="35" y="70" width="30" height="8" fill="${c2}"/><rect x="45" y="78" width="10" height="15" fill="#8B4513"/></svg>`;
    if(type==='bottle') return `<svg ${base}><rect x="40" y="20" width="20" height="15" fill="#94a3b8"/><rect x="35" y="35" width="30" height="55" rx="10" fill="rgba(224, 242, 254, 0.6)" stroke="#bae6fd" stroke-width="3"/><rect x="35" y="50" width="30" height="40" rx="10" fill="${c1}"/></svg>`;
    if(type==='chest') return `<svg ${base}><rect x="15" y="30" width="70" height="50" fill="${c1}" rx="5"/><rect x="15" y="30" width="70" height="20" fill="${c2}" rx="5"/><rect x="45" y="45" width="10" height="10" fill="#fbbf24"/></svg>`;
    if(type==='foundation') return `<svg ${base}><rect x="10" y="10" width="80" height="80" fill="${c1}" stroke="${c2}" stroke-width="5"/></svg>`;
    return `<svg ${base}><circle cx="50" cy="50" r="25" fill="${c1}"/></svg>`;
}

const ITEMS_DB = {
    // Basic Materials
    'madera': { name: 'Madera', cat: 'mat', color: '#8B4513', desc: 'Madera flotante común.', svg: genSVG('plank', '#a1662f', '#784414') },
    'plastico': { name: 'Plástico', cat: 'mat', color: '#cbd5e1', desc: 'Basura del viejo mundo.', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="30,20 70,20 85,50 70,80 30,80 15,50" fill="#cbd5e1" stroke="#94a3b8" stroke-width="4"/></svg>` },
    'hojas': { name: 'Hojas', cat: 'mat', color: '#22c55e', desc: 'Hojas de palma útiles para cuerdas.', svg: genSVG('leaf', '#22c55e', '#166534') },
    'cuerda': { name: 'Cuerda', cat: 'mat', color: '#eab308', desc: 'Soga firme.', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#eab308" stroke-width="12" stroke-dasharray="10 5"/></svg>` },
    'arena': { name: 'Arena', cat: 'mat', color: '#fde047', desc: 'Arena fina, se puede fundir.', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M20 70 Q50 20 80 70 Z" fill="#fde047"/><circle cx="40" cy="60" r="2" fill="#ca8a04"/><circle cx="60" cy="65" r="2" fill="#ca8a04"/></svg>` },
    'chatarra': { name: 'Chatarra', cat: 'mat', color: '#94a3b8', desc: 'Trozos de metal oxidado.', svg: genSVG('ore', '#94a3b8', '') },
    'algas': { name: 'Algas', cat: 'mat', color: '#15803d', desc: 'Plantas marinas pegajosas.', svg: genSVG('leaf', '#15803d', '#14532d') },
    'vidrio': { name: 'Vidrio', cat: 'mat', color: '#bae6fd', desc: 'Cristal frágil.', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="rgba(224, 242, 254, 0.7)" stroke="#bae6fd" stroke-width="4"/></svg>` },
    
    // Ores & Ingots
    'mineral_cobre': { name: 'Mena de Cobre', cat: 'mat', color: '#d97706', desc: 'Cobre en bruto.', svg: genSVG('ore', '#f59e0b', '') },
    'lingote_cobre': { name: 'Lingote de Cobre', cat: 'mat', color: '#f59e0b', desc: 'Metal conductor.', svg: genSVG('ingot', '#d97706', '#f59e0b') },
    'mineral_hierro': { name: 'Mena de Hierro', cat: 'mat', color: '#fca5a5', desc: 'Hierro en bruto.', svg: genSVG('ore', '#fca5a5', '') },
    'lingote_hierro': { name: 'Lingote de Hierro', cat: 'mat', color: '#cbd5e1', desc: 'Metal resistente.', svg: genSVG('ingot', '#94a3b8', '#cbd5e1') },
    'mineral_oro': { name: 'Mena de Oro', cat: 'mat', color: '#fcd34d', desc: 'Oro brillante.', svg: genSVG('ore', '#fcd34d', '') },
    'lingote_oro': { name: 'Lingote de Oro', cat: 'mat', color: '#fbbf24', desc: 'Metal valioso.', svg: genSVG('ingot', '#d97706', '#fbbf24') },
    'mineral_titanio': { name: 'Mena de Titanio', cat: 'mat', color: '#e2e8f0', desc: 'Metal rarísimo.', svg: genSVG('ore', '#e2e8f0', '') },
    'lingote_titanio': { name: 'Lingote Titanio', cat: 'mat', color: '#f1f5f9', desc: 'Inquebrantable.', svg: genSVG('ingot', '#cbd5e1', '#f1f5f9') },

    // Consumables
    'papa': { name: 'Papa Cruda', cat: 'com', color: '#eab308', desc: 'Restaura hambre, intoxica.', val: {h: 15, tox: -25}, action: 'Comer', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#d97706"/></svg>` },
    'pescado_crudo': { name: 'Pescado Crudo', cat: 'com', color: '#60a5fa', desc: 'Mejor cocinarlo.', val: {h: 20, tox: -15}, action: 'Comer', svg: genSVG('fish', '#93c5fd', '#60a5fa') },
    'pescado_cocinado': { name: 'Pescado Cocido', cat: 'com', color: '#b45309', desc: 'Nutritivo y seguro.', val: {h: 40, tox: 5}, action: 'Comer', svg: genSVG('fish', '#b45309', '#92400e') },
    'baya': { name: 'Bayas Rojas', cat: 'com', color: '#ef4444', desc: 'Pequeñas y dulces.', val: {h: 10, w: 5}, action: 'Comer', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="40" cy="40" r="15" fill="#ef4444"/><circle cx="60" cy="60" r="15" fill="#ef4444"/></svg>` },
    'botella_vacia': { name: 'Botella Vacía', cat: 'mat', color: '#bae6fd', desc: 'Contenedor de plástico.', svg: genSVG('bottle', 'transparent', '') },
    'agua_salada': { name: 'Agua Salada', cat: 'com', color: '#38bdf8', desc: 'Te deshidrata más.', val: {w: -20, tox: -30}, action: 'Beber', svg: genSVG('bottle', '#38bdf8', '') },
    'agua_dulce': { name: 'Agua Purificada', cat: 'com', color: '#60a5fa', desc: 'Hidratación pura.', val: {w: 50, tox: 10}, action: 'Beber', svg: genSVG('bottle', '#bfdbfe', '') },

    // Tools & Weapons
    'gancho_t1': { name: 'Gancho Plástico', cat: 'herr', color: '#64748b', dur: 20, maxDur: 20, desc: 'Atrapa objetos lejanos.', action: 'Equipar', svg: genSVG('hook', '#94a3b8', '#8B4513'), range: 250, speed: 5 },
    'gancho_t2': { name: 'Gancho Metálico', cat: 'herr', color: '#cbd5e1', dur: 50, maxDur: 50, desc: 'Más rápido y largo.', action: 'Equipar', svg: genSVG('hook', '#cbd5e1', '#475569'), range: 400, speed: 8 },
    'martillo': { name: 'Martillo', cat: 'herr', color: '#d97706', dur: 40, maxDur: 40, desc: 'Repara y destruye.', action: 'Equipar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="40" y="30" width="20" height="60" fill="#8B4513" rx="5"/><rect x="25" y="10" width="50" height="25" fill="#94a3b8" rx="3"/></svg>` },
    'lanza_madera': { name: 'Lanza Básica', cat: 'herr', color: '#8B4513', dur: 20, maxDur: 20, desc: 'Arma cuerpo a cuerpo.', action: 'Atacar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><line x1="20" y1="80" x2="80" y2="20" stroke="#8B4513" stroke-width="8"/><polygon points="85,15 70,25 75,30" fill="#475569"/></svg>`, dmg: 10 },
    'espada_cobre': { name: 'Espada de Cobre', cat: 'herr', color: '#f59e0b', dur: 40, maxDur: 40, desc: 'Daño moderado.', action: 'Atacar', svg: genSVG('sword', '#f59e0b', '#b45309'), dmg: 25 },
    'espada_hierro': { name: 'Espada de Hierro', cat: 'herr', color: '#cbd5e1', dur: 80, maxDur: 80, desc: 'Daño alto.', action: 'Atacar', svg: genSVG('sword', '#cbd5e1', '#64748b'), dmg: 40 },

    // Structures & Raft Building
    'cimiento_madera': { name: 'Cimiento Madera', cat: 'est', color: '#8B4513', desc: 'Expande la balsa.', action: 'Construir', svg: genSVG('foundation', '#8B4513', '#5c2e0b'), buildType: 'floor' },
    'cimiento_plastico': { name: 'Cimiento Plástico', cat: 'est', color: '#cbd5e1', desc: 'Expande la balsa, resiste tiburones.', action: 'Construir', svg: genSVG('foundation', '#cbd5e1', '#94a3b8'), buildType: 'floor' },
    'mesa_trabajo': { name: 'Mesa de Trabajo', cat: 'est', color: '#5c2e0b', desc: 'Crafteos básicos.', action: 'Colocar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="20" width="80" height="60" fill="#78350f" rx="5"/><rect x="20" y="30" width="60" height="40" fill="#b45309"/><line x1="30" y1="50" x2="70" y2="50" stroke="#fcd34d" stroke-width="4"/></svg>`, buildType: 'prop' },
    'horno': { name: 'Horno Fundidor', cat: 'est', color: '#475569', desc: 'Funde metales.', action: 'Colocar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" fill="#475569" rx="10"/><path d="M40 75 Q50 45 60 75 Z" fill="#ef4444"/></svg>`, buildType: 'prop' },
    'purificador': { name: 'Purificador Agua', cat: 'est', color: '#38bdf8', desc: 'Convierte agua salada.', action: 'Colocar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#bae6fd" rx="10"/><path d="M30 50 Q50 80 70 50 Z" fill="#38bdf8"/></svg>`, buildType: 'prop' },
    'vela_basica': { name: 'Vela Básica', cat: 'est', color: '#f8fafc', desc: 'Controla dirección balsa.', action: 'Colocar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><line x1="50" y1="10" x2="50" y2="90" stroke="#8B4513" stroke-width="6"/><path d="M50 20 Q80 40 50 70 Z" fill="#f8fafc"/></svg>`, buildType: 'prop' },
    'cofre_pequeno': { name: 'Cofre Pequeño', cat: 'est', color: '#78350f', desc: 'Guarda 10 ítems.', action: 'Colocar', svg: genSVG('chest', '#8B4513', '#5c2e0b'), buildType: 'prop' }
};

const RECIPES = [
    { id: 'cuerda', req: { hojas: 2 }, station: 'basic', cat: 'mat' },
    { id: 'botella_vacia', req: { plastico: 2 }, station: 'basic', cat: 'mat' },
    { id: 'martillo', req: { madera: 2, cuerda: 1 }, station: 'basic', cat: 'herr' },
    { id: 'gancho_t1', req: { plastico: 3, cuerda: 2 }, station: 'basic', cat: 'herr' },
    { id: 'cimiento_madera', req: { madera: 3, plastico: 1 }, station: 'basic', cat: 'est' },
    { id: 'mesa_trabajo', req: { madera: 4, plastico: 2 }, station: 'basic', cat: 'est' },
    
    { id: 'horno', req: { plastico: 4, madera: 2, arena: 2 }, station: 'mesa_trabajo', cat: 'est' },
    { id: 'purificador', req: { plastico: 6, chatarra: 2 }, station: 'mesa_trabajo', cat: 'est' },
    { id: 'vela_basica', req: { madera: 4, hojas: 6, cuerda: 3 }, station: 'mesa_trabajo', cat: 'est' },
    { id: 'gancho_t2', req: { chatarra: 3, cuerda: 3 }, station: 'mesa_trabajo', cat: 'herr' },
    { id: 'espada_cobre', req: { lingote_cobre: 3, madera: 1 }, station: 'mesa_trabajo', cat: 'herr' },
    { id: 'cimiento_plastico', req: { plastico: 4 }, station: 'mesa_trabajo', cat: 'est' },

    { id: 'vidrio', req: { arena: 2, madera: 1 }, station: 'horno', cat: 'mat' },
    { id: 'lingote_cobre', req: { mineral_cobre: 2, madera: 1 }, station: 'horno', cat: 'mat' },
    { id: 'lingote_hierro', req: { mineral_hierro: 2, madera: 1 }, station: 'horno', cat: 'mat' },
    { id: 'lingote_oro', req: { mineral_oro: 2, madera: 1 }, station: 'horno', cat: 'mat' },
    { id: 'pescado_cocinado', req: { pescado_crudo: 1, madera: 1 }, station: 'horno', cat: 'com' }
];

let inventory = [];
let hotbar = [null, null, null];
let timestampCounter = 0;
let itemsGatheredTotal = 0;

function getUID() { return Math.random().toString(36).substr(2, 9); }
function giveItem(id, qty = 1) {
    if(!ITEMS_DB[id]) return;
    let base = ITEMS_DB[id]; let remaining = qty; timestampCounter++; itemsGatheredTotal += qty;
    if (base.cat === 'herr' || base.cat === 'est') {
        for (let i = 0; i < qty; i++) { if (inventory.length < MAX_SLOTS) inventory.push({ id: id, qty: 1, uid: getUID(), dur: base.dur, time: timestampCounter }); }
        return;
    }
    for (let item of inventory) {
        if (item.id === id && item.qty < MAX_STACK) {
            let take = Math.min(MAX_STACK - item.qty, remaining);
            item.qty += take; item.time = timestampCounter; remaining -= take;
            if (remaining <= 0) return;
        }
    }
    while (remaining > 0 && inventory.length < MAX_SLOTS) {
        let take = Math.min(MAX_STACK, remaining);
        inventory.push({ id: id, qty: take, uid: getUID(), time: timestampCounter });
        remaining -= take;
    }
}
function removeItem(uid, qty) {
    let index = inventory.findIndex(i => i.uid === uid);
    if (index !== -1) {
        inventory[index].qty -= qty;
        if (inventory[index].qty <= 0) {
            inventory.splice(index, 1);
            for(let i=0; i<3; i++) { if(hotbar[i] === uid) hotbar[i] = null; }
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
            if (inventory[i].qty <= 0) { let uid = inventory[i].uid; inventory.splice(i, 1); for(let h=0; h<3; h++) { if(hotbar[h] === uid) hotbar[h] = null; } }
            if (remaining <= 0) break;
        }
    }
    if(typeof renderInventory === 'function') renderInventory();
    if(typeof renderHotbarUI === 'function') renderHotbarUI();
}