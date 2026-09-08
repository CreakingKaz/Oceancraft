const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameStarted = false;
let animationStarted = false;
let lastFrame = 0;
let elapsed = 0;
let selectedTheme = 'dark';
let camera = { x: 0, y: 0, zoom: 1.22 };
let player = { x: 0, y: 0, targetX: 0, targetY: 0, speed: 92, icon: '⛵', color: '#e74c3c', moving: false };
let world = createWorld();
let floatingItems = [];
const raft = { columns: 3, rows: 3, tile: 52 };

function createWorld() {
    return {
        day: 1,
        hour: 8,
        actions: 0,
        stats: { hunger: 100, thirst: 100, energy: 100 },
        history: [],
        visualMode: 'auto',
        statFormat: 'bar',
        spawnTimer: 0
    };
}

function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function startGame(isNew) {
    if (gameStarted) return;
    if (isNew === false) {
        if (!loadGame()) {
            document.getElementById('menu-message').textContent = 'Aún no hay una partida guardada.';
            return;
        }
    } else {
        resetGame();
    }

    gameStarted = true;
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    resizeCanvas();
    ensureFloatingItems();
    updateHUD();
    renderHotbarUI();
    renderHistory();
    updateContinueButton();

    if (!animationStarted) {
        animationStarted = true;
        requestAnimationFrame(gameLoop);
    }
}

function continueGame() {
    startGame(false);
}

function resetGame() {
    world = createWorld();
    inventory = [];
    hotbar = [null, null, null];
    floatingItems = [];
    camera = { x: 0, y: 0, zoom: 1.22 };
    player = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        speed: 92,
        icon: document.getElementById('player-icon').value.trim() || '⛵',
        color: document.getElementById('player-color').value,
        moving: false
    };
    giveItem('gancho_t1', 1);
    giveItem('madera', 2);
    giveItem('plastico', 2);
    giveItem('hojas', 2);
    hotbar[0] = inventory[0].uid;
    addHistory('Comenzó la aventura.');
}

function saveGame(silent) {
    if (!gameStarted) return;
    const save = {
        world: world,
        inventory: inventory,
        hotbar: hotbar,
        player: player,
        camera: { zoom: camera.zoom }
    };
    localStorage.setItem('oceancraft-save', JSON.stringify(save));
    updateContinueButton();
    if (!silent) notify('Partida guardada.');
}

function loadGame() {
    const raw = localStorage.getItem('oceancraft-save');
    if (!raw) return false;
    try {
        const save = JSON.parse(raw);
        world = Object.assign(createWorld(), save.world || {});
        world.stats = Object.assign({ hunger: 100, thirst: 100, energy: 100 }, world.stats || {});
        world.history = Array.isArray(world.history) ? world.history : [];
        inventory = Array.isArray(save.inventory) ? save.inventory : [];
        hotbar = Array.isArray(save.hotbar) ? save.hotbar : [null, null, null];
        while (hotbar.length < 3) hotbar.push(null);
        player = Object.assign(player, save.player || {});
        camera.zoom = save.camera && save.camera.zoom ? save.camera.zoom : 1.22;
        return true;
    } catch (error) {
        return false;
    }
}

function updateContinueButton() {
    const button = document.getElementById('continue-btn');
    if (button) button.disabled = !localStorage.getItem('oceancraft-save');
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function isNight() {
    if (world.visualMode === 'day') return false;
    if (world.visualMode === 'night') return true;
    return world.hour < 6 || world.hour >= 18;
}

function advanceAction(cost) {
    const actionCost = cost || { hunger: 3, thirst: 4, energy: 2 };
    world.stats.hunger = clamp(world.stats.hunger - (actionCost.hunger || 0), 0, 100);
    world.stats.thirst = clamp(world.stats.thirst - (actionCost.thirst || 0), 0, 100);
    world.stats.energy = clamp(world.stats.energy - (actionCost.energy || 0), 0, 100);
    world.actions += 1;

    if (world.actions >= 4) {
        world.actions = 0;
        world.hour += 1;
        if (world.hour >= 24) {
            world.hour = 0;
            world.day += 1;
        }
    }

    if (world.stats.hunger === 0 || world.stats.thirst === 0) {
        notify('Estás en peligro: necesitas comida o agua.');
        addHistory('Las necesidades son críticas.');
    }

    updateHUD();
    saveGame(true);
}

function updateHUD() {
    if (!gameStarted) return;
    document.getElementById('ui-clock').textContent = 'Día ' + world.day + ' · ' + String(world.hour).padStart(2, '0') + ':00';
    updateStat('hunger', world.stats.hunger);
    updateStat('thirst', world.stats.thirst);
    updateStat('energy', world.stats.energy);
}

function updateStat(name, value) {
    const label = document.getElementById('stat-' + name);
    const bar = document.getElementById('bar-' + name);
    const track = bar.parentElement;
    label.textContent = Math.floor(value) + '%';
    bar.style.width = value + '%';
    track.style.display = world.statFormat === 'percent' ? 'none' : 'block';
}

function setStatFormat(format) {
    world.statFormat = format;
    updateHUD();
    saveGame(true);
}

function setVisualMode(mode) {
    world.visualMode = mode;
    notify(mode === 'auto' ? 'Ciclo de día y noche activado.' : 'Estilo visual actualizado.');
    saveGame(true);
}

function setTheme(theme) {
    selectedTheme = theme;
    document.body.className = 'theme-' + theme;
    notify('Tema de interfaz: ' + theme + '.');
}

function zoomIn() {
    camera.zoom = clamp(camera.zoom + 0.15, 0.65, 2.2);
}

function zoomOut() {
    camera.zoom = clamp(camera.zoom - 0.15, 0.65, 2.2);
}

function updateUIOpacity() {
    const value = document.getElementById('opacity-slider').value;
    document.documentElement.style.setProperty('--ui-opacity', value);
}

function addHistory(message) {
    world.history.push(message);
    if (world.history.length > 5) world.history.shift();
    renderHistory();
}

function renderHistory() {
    const box = document.getElementById('history-log');
    if (!box) return;
    box.innerHTML = world.history.slice().reverse().map(function(entry) {
        return '<div>' + entry + '</div>';
    }).join('');
}

function notify(message) {
    const box = document.getElementById('notifications');
    if (!box) return;
    const entry = document.createElement('div');
    entry.className = 'notification';
    entry.textContent = message;
    box.appendChild(entry);
    setTimeout(function() { entry.remove(); }, 3600);
}

function getRaftBounds() {
    const width = raft.columns * raft.tile;
    const height = raft.rows * raft.tile;
    return { left: -width / 2, right: width / 2, top: -height / 2, bottom: height / 2 };
}

function ensureFloatingItems() {
    if (floatingItems.length) return;
    const starters = [
        { id: 'madera', x: 280, y: -120, speed: 23, size: 23 },
        { id: 'plastico', x: 420, y: 65, speed: 27, size: 19 },
        { id: 'hojas', x: 540, y: -10, speed: 21, size: 22 },
        { id: 'barrel', x: 680, y: 125, speed: 18, size: 35 }
    ];
    floatingItems = starters;
}

function spawnFloatingItem() {
    const width = canvas.clientWidth / camera.zoom;
    const height = canvas.clientHeight / camera.zoom;
    const barrel = Math.random() < 0.13;
    const pool = ['madera', 'plastico', 'hojas', 'chatarra', 'alga', 'papa', 'coco'];
    floatingItems.push({
        id: barrel ? 'barrel' : pool[Math.floor(Math.random() * pool.length)],
        x: camera.x + width / 2 + 85,
        y: camera.y + (Math.random() - 0.5) * height * 0.72,
        speed: 17 + Math.random() * 18,
        size: barrel ? 36 : 18 + Math.random() * 11,
        phase: Math.random() * Math.PI * 2
    });
}

function updateFloatingItems(delta) {
    world.spawnTimer += delta;
    const interval = isNight() ? 3.5 : 2.15;
    if (world.spawnTimer > interval) {
        world.spawnTimer = 0;
        if (!isNight() || Math.random() > 0.45) spawnFloatingItem();
    }

    const leftLimit = camera.x - (canvas.clientWidth / camera.zoom) / 2 - 110;
    floatingItems = floatingItems.filter(function(item) {
        item.x -= item.speed * delta;
        return item.x > leftLimit;
    });
}

function nearestFloating(range) {
    let closest = null;
    let closestDistance = Infinity;
    floatingItems.forEach(function(item) {
        const distance = Math.hypot(item.x - player.x, item.y - player.y);
        if (distance <= range && distance < closestDistance) {
            closest = item;
            closestDistance = distance;
        }
    });
    return closest;
}

function collectFloating(item, byTool) {
    const index = floatingItems.indexOf(item);
    if (index === -1) return;
    floatingItems.splice(index, 1);

    if (item.id === 'barrel') {
        const barrelLoot = { madera: 2, hojas: 1, papa: 1 };
        if (Math.random() > 0.5) barrelLoot.chatarra = 1;
        const received = [];
        Object.keys(barrelLoot).forEach(function(id) {
            const amount = giveItem(id, barrelLoot[id]);
            if (amount) received.push('+' + amount + ' ' + ITEMS_DB[id].name);
        });
        notify('Barril: ' + received.join(' · '));
        addHistory('Abriste un barril.');
    } else {
        const received = giveItem(item.id, 1);
        if (received) {
            notify('+1 ' + ITEMS_DB[item.id].name);
            addHistory('Recogiste ' + ITEMS_DB[item.id].name + '.');
        } else {
            notify('Inventario lleno: el objeto se perdió.');
        }
    }

    advanceAction(byTool ? { hunger: 3, thirst: 4, energy: 2 } : { hunger: 2, thirst: 3, energy: 1 });
    renderInventory();
    renderHotbarUI();
}

function doPrimaryAction() {
    if (!gameStarted) return;
    const item = getItemByUID(hotbar[selectedSlot]);
    if (!item) {
        searchOcean();
        return;
    }

    const base = ITEMS_DB[item.id];
    if (base.cat === 'com') {
        consumeFood(item.uid);
        return;
    }

    if (base.cat !== 'herr') {
        searchOcean();
        return;
    }

    if (item.id.indexOf('gancho') === 0 || item.id === 'red_atrapa') {
        const target = nearestFloating(base.range || 240);
        if (target) {
            collectFloating(target, true);
            damageTool(item, 1);
        } else {
            advanceAction({ hunger: 3, thirst: 4, energy: 2 });
            damageTool(item, 1);
            notify('No hay objetos al alcance.');
            addHistory('El gancho volvió vacío.');
        }
    } else if (item.id === 'cana') {
        advanceAction({ hunger: 2, thirst: 4, energy: 2 });
        damageTool(item, 1);
        if (Math.random() > 0.42) {
            giveItem('pez_crudo', 1);
            notify('+1 Pez crudo');
            addHistory('Pescaste un pez.');
        } else {
            notify('El pez escapó.');
            addHistory('No hubo pesca.');
        }
    } else if (item.id === 'vaso') {
        advanceAction({ hunger: 1, thirst: 2, energy: 1 });
        damageTool(item, 1);
        giveItem('agua_sucia', 1);
        notify('+1 Agua salada');
        addHistory('Recogiste agua salada.');
    }

    renderInventory();
    renderHotbarUI();
}

function searchOcean() {
    advanceAction({ hunger: 3, thirst: 5, energy: 2 });
    if (Math.random() < 0.66) {
        const pool = ['madera', 'plastico', 'hojas', 'alga'];
        const id = pool[Math.floor(Math.random() * pool.length)];
        if (giveItem(id, 1)) {
            notify('+1 ' + ITEMS_DB[id].name);
            addHistory('Buscaste y encontraste ' + ITEMS_DB[id].name + '.');
        }
    } else {
        notify('Buscaste entre las olas, pero no encontraste nada.');
        addHistory('La búsqueda no dio resultados.');
    }
    renderInventory();
    renderHotbarUI();
}

function damageTool(item, amount) {
    item.dur -= amount;
    if (item.dur <= 0) {
        const name = ITEMS_DB[item.id].name;
        removeItemByUID(item.uid, 1);
        notify('Se rompió: ' + name + '.');
        addHistory('Se rompió ' + name + '.');
    }
}

function consumeFood(uid) {
    const item = getItemByUID(uid);
    if (!item || ITEMS_DB[item.id].cat !== 'com') return;
    const base = ITEMS_DB[item.id];
    world.stats.hunger = clamp(world.stats.hunger + base.val.hunger, 0, 100);
    world.stats.thirst = clamp(world.stats.thirst + base.val.thirst, 0, 100);
    removeItemByUID(uid, 1);
    notify('Consumiste ' + base.name + '.');
    addHistory('Consumiste ' + base.name + '.');
    updateHUD();
    renderInventory();
    renderHotbarUI();
    saveGame(true);
}

function sleepAction() {
    if (!gameStarted) return;
    world.hour += 8;
    while (world.hour >= 24) {
        world.hour -= 24;
        world.day += 1;
    }
    world.stats.hunger = clamp(world.stats.hunger - 8, 0, 100);
    world.stats.thirst = clamp(world.stats.thirst - 12, 0, 100);
    world.stats.energy = 100;
    world.actions = 0;
    notify('Dormiste y recuperaste energía.');
    addHistory('Dormiste hasta las ' + String(world.hour).padStart(2, '0') + ':00.');
    updateHUD();
    saveGame(true);
}

function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (clientX - rect.left - rect.width / 2) / camera.zoom + camera.x,
        y: (clientY - rect.top - rect.height / 2) / camera.zoom + camera.y
    };
}

function handleCanvasPointer(event) {
    if (!gameStarted) return;
    const point = screenToWorld(event.clientX, event.clientY);
    const floating = floatingItems.find(function(item) {
        return Math.hypot(point.x - item.x, point.y - item.y) <= item.size + 12;
    });
    if (floating) {
        collectFloating(floating, false);
        return;
    }

    const bounds = getRaftBounds();
    if (point.x < bounds.left || point.x > bounds.right || point.y < bounds.top || point.y > bounds.bottom) return;
    player.targetX = clamp(point.x, bounds.left + 12, bounds.right - 12);
    player.targetY = clamp(point.y, bounds.top + 12, bounds.bottom - 12);
    player.moving = true;
}

function updatePlayer(delta) {
    if (!player.moving) return;
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.hypot(dx, dy);
    const step = player.speed * delta;
    if (distance <= step) {
        player.x = player.targetX;
        player.y = player.targetY;
        player.moving = false;
    } else {
        player.x += dx / distance * step;
        player.y += dy / distance * step;
    }
    camera.x += (player.x - camera.x) * Math.min(1, delta * 4);
    camera.y += (player.y - camera.y) * Math.min(1, delta * 4);
}

function oceanPalette() {
    const night = isNight();
    if (night) return ['#081a35', '#020c1c'];
    if (world.hour >= 16 && world.hour < 18 && world.visualMode === 'auto') return ['#176e9f', '#9a4e49'];
    return ['#0a8ed0', '#075078'];
}

function drawOcean(width, height) {
    const colors = oceanPalette();
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const phase = (world.hour / 24) * Math.PI * 2;
    const bodyX = width * (0.84 - phase / (Math.PI * 2) * 0.67);
    const bodyY = 70 + Math.sin(phase) * 35;
    ctx.fillStyle = isNight() ? '#eef4ff' : (world.hour >= 16 && world.visualMode === 'auto' ? '#f29c50' : '#ffe26d');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = isNight() ? 22 : 28;
    ctx.beginPath();
    ctx.arc(bodyX, bodyY, isNight() ? 16 : 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = isNight() ? 'rgba(185, 220, 255, 0.12)' : 'rgba(255, 255, 255, 0.19)';
    ctx.lineWidth = 1.5;
    for (let y = 70; y < height; y += 32) {
        ctx.beginPath();
        for (let x = -20; x < width + 25; x += 22) {
            const wave = y + Math.sin(x / 36 + elapsed * 1.5 + y / 40) * 3;
            if (x === -20) ctx.moveTo(x, wave);
            else ctx.lineTo(x, wave);
        }
        ctx.stroke();
    }
}

function drawRaft() {
    const bounds = getRaftBounds();
    ctx.fillStyle = '#8f5527';
    ctx.strokeStyle = '#4b260e';
    ctx.lineWidth = 2;
    for (let row = 0; row < raft.rows; row++) {
        for (let column = 0; column < raft.columns; column++) {
            const x = bounds.left + column * raft.tile;
            const y = bounds.top + row * raft.tile;
            ctx.fillRect(x, y, raft.tile, raft.tile);
            ctx.strokeRect(x, y, raft.tile, raft.tile);
            ctx.strokeStyle = 'rgba(69, 34, 13, 0.45)';
            ctx.beginPath();
            ctx.moveTo(x + 5, y + raft.tile / 2);
            ctx.lineTo(x + raft.tile - 5, y + raft.tile / 2);
            ctx.stroke();
            ctx.strokeStyle = '#4b260e';
        }
    }
}

function drawFloatingItem(item) {
    const base = ITEMS_DB[item.id];
    const bob = Math.sin(elapsed * 2 + (item.phase || 0)) * 4;
    ctx.save();
    ctx.translate(item.x, item.y + bob);
    ctx.rotate(Math.sin(elapsed + (item.phase || 0)) * 0.12);

    if (item.id === 'barrel') {
        ctx.fillStyle = '#ad442d';
        ctx.fillRect(-item.size / 2, -item.size / 2, item.size, item.size);
        ctx.fillStyle = '#6b271c';
        ctx.fillRect(-item.size / 2, -4, item.size, 8);
        ctx.strokeStyle = '#412018';
        ctx.strokeRect(-item.size / 2, -item.size / 2, item.size, item.size);
        ctx.fillStyle = '#ffe08a';
        ctx.font = '11px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('B', 0, 4);
    } else {
        ctx.fillStyle = base.color;
        ctx.fillRect(-item.size / 2, -item.size / 2, item.size, item.size);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeRect(-item.size / 2, -item.size / 2, item.size, item.size);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(base.symbol, 0, 4);
    }
    ctx.restore();
}

function drawPlayer() {
    if (player.moving) {
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.targetX, player.targetY);
        ctx.strokeStyle = 'rgba(255,255,255,0.72)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffeb75';
        ctx.beginPath();
        ctx.arc(player.targetX, player.targetY, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = player.color;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.icon, player.x, player.y);
}

function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    drawOcean(width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    floatingItems.forEach(drawFloatingItem);
    if (gameStarted) {
        drawRaft();
        drawPlayer();
    }
    ctx.restore();
}

function gameLoop(timestamp) {
    const delta = Math.min((timestamp - lastFrame) / 1000 || 0, 0.05);
    lastFrame = timestamp;
    elapsed += delta;
    if (gameStarted) {
        updatePlayer(delta);
        updateFloatingItems(delta);
    }
    draw();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('pointerdown', handleCanvasPointer);
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
updateContinueButton();
requestAnimationFrame(gameLoop);