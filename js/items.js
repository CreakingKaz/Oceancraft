const MAX_SLOTS = 50;[cite: 6]
const MAX_STACK = 20;[cite: 6]

// Generador procedural de gráficos vectoriales para ahorrar memoria
function genSVG(type, c1, c2, c3='') {
    const base = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"';
    if(type==='plank') return `<svg ${base}><rect x="15" y="30" width="70" height="40" rx="5" fill="${c1}"/><line x1="20" y1="40" x2="80" y2="40" stroke="${c2}" stroke-width="3"/><line x1="20" y1="55" x2="80" y2="55" stroke="${c2}" stroke-width="3"/></svg>`;[cite: 6]
    if(type==='ore') return `<svg ${base}><circle cx="50" cy="50" r="30" fill="#78716c"/><circle cx="40" cy="40" r="8" fill="${c1}"/><circle cx="60" cy="55" r="6" fill="${c1}"/></svg>`;[cite: 6]
    if(type==='leaf') return `<svg ${base}><path d="M50 10 C90 30 90 70 50 90 C10 70 10 30 50 10" fill="${c1}"/><line x1="50" y1="15" x2="50" y2="85" stroke="${c2}" stroke-width="3"/></svg>`;[cite: 6]
    if(type==='foundation') return `<svg ${base}><rect x="10" y="10" width="80" height="80" fill="${c1}" stroke="${c2}" stroke-width="5"/></svg>`;[cite: 6]
    return `<svg ${base}><circle cx="50" cy="50" r="25" fill="${c1}"/></svg>`;[cite: 6]
}

const ITEMS_DB = {
    // Materiales
    'madera': { name: 'Madera', cat: 'mat', color: '#8B4513', desc: 'Madera flotante común.', svg: genSVG('plank', '#a1662f', '#784414') },[cite: 6]
    'plastico': { name: 'Plástico', cat: 'mat', color: '#cbd5e1', desc: 'Basura del viejo mundo.', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="30,20 70,20 85,50 70,80 30,80 15,50" fill="#cbd5e1" stroke="#94a3b8" stroke-width="4"/></svg>` },[cite: 6]
    'chatarra': { name: 'Chatarra', cat: 'mat', color: '#94a3b8', desc: 'Trozos de metal oxidado.', svg: genSVG('ore', '#94a3b8', '') },[cite: 6]
    
    // Herramientas y Construcción
    'martillo': { name: 'Martillo', cat: 'herr', color: '#d97706', dur: 40, maxDur: 40, desc: 'Repara y destruye.', action: 'Equipar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="40" y="30" width="20" height="60" fill="#8B4513" rx="5"/><rect x="25" y="10" width="50" height="25" fill="#94a3b8" rx="3"/></svg>` },[cite: 6]
    'cimiento_madera': { name: 'Cimiento Madera', cat: 'est', color: '#8B4513', desc: 'Expande la balsa.', action: 'Construir', svg: genSVG('foundation', '#8B4513', '#5c2e0b'), buildType: 'floor' },[cite: 6]
    'mesa_trabajo': { name: 'Mesa de Trabajo', cat: 'est', color: '#5c2e0b', desc: 'Crafteos básicos.', action: 'Colocar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="20" width="80" height="60" fill="#78350f" rx="5"/><rect x="20" y="30" width="60" height="40" fill="#b45309"/><line x1="30" y1="50" x2="70" y2="50" stroke="#fcd34d" stroke-width="4"/></svg>`, buildType: 'prop' }[cite: 6]
};

const RECIPES = [
    { id: 'martillo', req: { madera: 2 }, station: 'basic', cat: 'herr' },[cite: 6]
    { id: 'cimiento_madera', req: { madera: 3, plastico: 1 }, station: 'basic', cat: 'est' },[cite: 6]
    { id: 'mesa_trabajo', req: { madera: 4, plastico: 2 }, station: 'basic', cat: 'est' }[cite: 6]
];