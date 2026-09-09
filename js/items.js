const MAX_SLOTS = 50;
const MAX_STACK = 20;

function genSVG(type, c1, c2, c3='') {
    const base = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"';
    if(type==='plank') return `<svg ${base}><rect x="15" y="30" width="70" height="40" rx="5" fill="${c1}"/><line x1="20" y1="40" x2="80" y2="40" stroke="${c2}" stroke-width="3"/><line x1="20" y1="55" x2="80" y2="55" stroke="${c2}" stroke-width="3"/></svg>`;
    if(type==='ore') return `<svg ${base}><circle cx="50" cy="50" r="30" fill="#78716c"/><circle cx="40" cy="40" r="8" fill="${c1}"/><circle cx="60" cy="55" r="6" fill="${c1}"/></svg>`;
    if(type==='leaf') return `<svg ${base}><path d="M50 10 C90 30 90 70 50 90 C10 70 10 30 50 10" fill="${c1}"/><line x1="50" y1="15" x2="50" y2="85" stroke="${c2}" stroke-width="3"/></svg>`;
    if(type==='fish') return `<svg ${base}><ellipse cx="50" cy="50" rx="30" ry="15" fill="${c1}"/><polygon points="20,50 5,40 5,60" fill="${c2}"/><circle cx="70" cy="45" r="3" fill="#000"/></svg>`;
    if(type==='hook') return `<svg ${base}><path d="M30 20 L70 20 L50 40 Z" fill="${c1}"/><rect x="45" y="40" width="10" height="50" fill="${c2}"/></svg>`;
    if(type==='foundation') return `<svg ${base}><rect x="10" y="10" width="80" height="80" fill="${c1}" stroke="${c2}" stroke-width="5"/></svg>`;
    return `<svg ${base}><circle cx="50" cy="50" r="25" fill="${c1}"/></svg>`;
}

const ITEMS_DB = {
    'madera': { name: 'Madera', cat: 'mat', color: '#8B4513', svg: genSVG('plank', '#a1662f', '#784414') },
    'plastico': { name: 'Plástico', cat: 'mat', color: '#cbd5e1', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="30,20 70,20 85,50 70,80 30,80 15,50" fill="#cbd5e1" stroke="#94a3b8" stroke-width="4"/></svg>` },
    'hojas': { name: 'Hojas', cat: 'mat', color: '#22c55e', svg: genSVG('leaf', '#22c55e', '#166534') },
    'cuerda': { name: 'Cuerda', cat: 'mat', color: '#eab308', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#eab308" stroke-width="12" stroke-dasharray="10 5"/></svg>` },
    'chatarra': { name: 'Chatarra', cat: 'mat', color: '#94a3b8', svg: genSVG('ore', '#94a3b8', '') },
    
    'papa': { name: 'Papa Cruda', cat: 'com', color: '#eab308', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#d97706"/></svg>` },
    
    'gancho_t1': { name: 'Gancho Plástico', cat: 'herr', color: '#64748b', svg: genSVG('hook', '#94a3b8', '#8B4513') },
    'martillo': { name: 'Martillo', cat: 'herr', color: '#d97706', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="40" y="30" width="20" height="60" fill="#8B4513" rx="5"/><rect x="25" y="10" width="50" height="25" fill="#94a3b8" rx="3"/></svg>` },
    
    'cimiento_madera': { name: 'Cimiento Madera', cat: 'est', color: '#8B4513', svg: genSVG('foundation', '#8B4513', '#5c2e0b'), buildType: 'floor' },
    'mesa_trabajo': { name: 'Mesa de Trabajo', cat: 'est', color: '#5c2e0b', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="20" width="80" height="60" fill="#78350f" rx="5"/><rect x="20" y="30" width="60" height="40" fill="#b45309"/><line x1="30" y1="50" x2="70" y2="50" stroke="#fcd34d" stroke-width="4"/></svg>`, buildType: 'prop' }
};

const RECIPES = [
    { id: 'cuerda', name: 'Cuerda', req: { hojas: 2 }, station: 'basic' },
    { id: 'martillo', name: 'Martillo', req: { madera: 2, cuerda: 1 }, station: 'basic' },
    { id: 'gancho_t1', name: 'Gancho Plástico', req: { plastico: 3, cuerda: 2 }, station: 'basic' },
    { id: 'cimiento_madera', name: 'Cimiento Madera', req: { madera: 3, plastico: 1 }, station: 'basic' },
    { id: 'mesa_trabajo', name: 'Mesa de Trabajo', req: { madera: 4, plastico: 2 }, station: 'basic' }
];