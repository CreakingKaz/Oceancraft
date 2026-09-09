let islands = [];
let weather = { current: 'CLEAR', target: 'CLEAR', progress: 1.0, fogDensity: 0 };
const WEATHER_COLORS = { 'CLEAR': { top: [2, 132, 199], bottom: [12, 74, 110] }, 'STORM': { top: [7, 89, 133], bottom: [8, 47, 73] }, 'FOG': { top: [100, 116, 139], bottom: [71, 85, 105] } };
let curTop = [...WEATHER_COLORS['CLEAR'].top], curBot = [...WEATHER_COLORS['CLEAR'].bottom];
let oceanPhase = 0;

function generateWorld() {
    islands = [];
    for (let i = 0; i < 30; i++) {
        let ix = (Math.random() - 0.5) * 15000;
        let iy = (Math.random() - 0.5) * 15000;
        if (Math.abs(ix) < 1000 && Math.abs(iy) < 1000) continue; 
        
        let radius = 250 + Math.random() * 400;
        let points = [];
        for (let j = 0; j < 16; j++) {
            let angle = (j / 16) * Math.PI * 2;
            let r = radius * (0.7 + Math.random() * 0.3);
            points.push({ x: ix + Math.cos(angle) * r, y: iy + Math.sin(angle) * r });
        }
        islands.push({ x: ix, y: iy, radius: radius, points: points });
    }
}

function lerpColor(c1, c2, t) { return [ Math.round(c1[0] + (c2[0]-c1[0])*t), Math.round(c1[1] + (c2[1]-c1[1])*t), Math.round(c1[2] + (c2[2]-c1[2])*t) ]; }

function updateWorldEnvironment(difficulty) {
    if(Math.random() < 0.0005) { 
        let weathers = ['CLEAR', 'STORM', 'FOG']; 
        weather.target = weathers[Math.floor(Math.random()*weathers.length)]; 
        if(difficulty === 'peaceful' && weather.target === 'STORM') weather.target = 'CLEAR'; 
        weather.progress = 0; 
    }
    if (weather.progress < 1.0) { 
        weather.progress += 0.002; 
        curTop = lerpColor(curTop, WEATHER_COLORS[weather.target].top, weather.progress); 
        curBot = lerpColor(curBot, WEATHER_COLORS[weather.target].bottom, weather.progress); 
        weather.fogDensity += (weather.target === 'FOG' ? 0.005 : -0.005); 
        weather.fogDensity = Math.max(0, Math.min(0.7, weather.fogDensity)); 
    } else { 
        weather.current = weather.target; 
    }
    oceanPhase += weather.current === 'STORM' ? 0.08 : 0.04; 
}

function drawOceanBackground(ctx, canvas, camera) {
    let grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, canvas.width);
    grad.addColorStop(0, `rgb(${curTop[0]},${curTop[1]},${curTop[2]})`); 
    grad.addColorStop(1, `rgb(${curBot[0]},${curBot[1]},${curBot[2]})`); 
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save(); 
    ctx.translate(canvas.width / 2, canvas.height / 2); 
    ctx.scale(camera.zoom, camera.zoom); 
    ctx.translate(-camera.x, -camera.y);
    
    ctx.strokeStyle = `rgba(255,255,255,${weather.current === 'STORM' ? 0.15 : 0.05})`; 
    ctx.lineWidth = 2;
    
    // CULLING: Solo procesa las olas visibles en la cámara en lugar de un área masiva, elimina el 90% del lag.
    let startX = Math.floor(camera.x - (canvas.width/camera.zoom)/2 - 100);
    let endX = Math.floor(camera.x + (canvas.width/camera.zoom)/2 + 100);
    let startY = Math.floor(camera.y - (canvas.height/camera.zoom)/2 - 100);
    let endY = Math.floor(camera.y + (canvas.height/camera.zoom)/2 + 100);
    
    for(let i = startY - (startY%100); i < endY; i += 100) { 
        ctx.beginPath(); 
        for(let j = startX - (startX%50); j < endX; j += 50) {
            ctx.lineTo(j, i + Math.sin((j + oceanPhase * 150)*0.01)*20); 
        }
        ctx.stroke(); 
    }
}

function drawIslands(ctx) {
    islands.forEach(isl => {
        ctx.fillStyle = '#fde047'; ctx.beginPath(); 
        isl.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.fill();
        ctx.fillStyle = '#4ade80'; ctx.beginPath(); 
        isl.points.forEach((p, i) => { 
            let ix = isl.x + (p.x - isl.x) * 0.75; let iy = isl.y + (p.y - isl.y) * 0.75; 
            i === 0 ? ctx.moveTo(ix, iy) : ctx.lineTo(ix, iy); 
        }); ctx.fill();
    });
}