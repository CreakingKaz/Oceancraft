// js/engine.js
// Motor mínimo del juego: mantiene las funciones globales que usa la interfaz.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameStarted = false;
let playerIcon = '⛵';
let playerColor = '#e74c3c';
let cameraZoom = 1;
let lastTime = 0;
let elapsed = 0;

const raft = { x: 0.5, y: 0.58, width: 150, height: 78 };
const floatingItems = [
    { x: 0.14, y: 0.30, id: 'madera', phase: 0.2 },
    { x: 0.82, y: 0.44, id: 'plastico', phase: 1.8 },
    { x: 0.30, y: 0.76, id: 'hojas', phase: 3.5 },
    { x: 0.70, y: 0.18, id: 'madera', phase: 4.6 }
];

function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function startGame() {
    if (gameStarted) return;

    const iconInput = document.getElementById('player-icon');
    const colorInput = document.getElementById('player-color');

    playerIcon = iconInput.value.trim() || '⛵';
    playerColor = colorInput.value;
    gameStarted = true;

    // Equipo inicial para que el jugador pueda probar la hotbar al comenzar.
    giveItem('gancho_t1');
    giveItem('madera', 2);
    hotbar[0] = inventory[0].uid;

    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    resizeCanvas();
    renderHotbarUI();
    updateActionButton();
}

function zoomIn() {
    cameraZoom = Math.min(1.5, cameraZoom + 0.1);
}

function zoomOut() {
    cameraZoom = Math.max(0.7, cameraZoom - 0.1);
}

function updateUIOpacity() {
    const opacity = document.getElementById('opacity-slider').value;
    document.documentElement.style.setProperty('--ui-opacity', opacity);
}

function doAction() {
    if (!gameStarted) return;

    const found = ['madera', 'plastico', 'hojas'];
    const itemId = found[Math.floor(Math.random() * found.length)];
    giveItem(itemId);

    // Actualizar las vistas que pueden estar abiertas.
    renderHotbarUI();
    updateActionButton();
    const inventoryModal = document.getElementById('inventory-modal');
    if (!inventoryModal.classList.contains('hidden')) renderInventory();
}

function drawOcean(width, height, time) {
    const ocean = ctx.createLinearGradient(0, 0, 0, height);
    ocean.addColorStop(0, '#0b88c9');
    ocean.addColorStop(1, '#073b5c');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 2;
    for (let y = 30; y < height; y += 34) {
        ctx.beginPath();
        for (let x = -20; x < width + 25; x += 24) {
            const waveY = y + Math.sin((x / 42) + time * 1.2 + y) * 4;
            if (x === -20) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
    }
}

function drawFloatingItem(item, width, height, time) {
    const base = ITEMS_DB[item.id];
    const x = item.x * width;
    const y = item.y * height + Math.sin(time * 1.8 + item.phase) * 7;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time + item.phase) * 0.12);
    ctx.fillStyle = base.color;
    ctx.fillRect(-15, -7, 30, 14);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-15, -7, 30, 14);
    ctx.restore();
}

function drawRaft(width, height, time) {
    const scale = cameraZoom;
    const x = raft.x * width;
    const y = raft.y * height + Math.sin(time * 1.8) * 5;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(-raft.width / 2, -raft.height / 2, raft.width, raft.height);
    ctx.strokeStyle = '#54331a';
    ctx.lineWidth = 4;
    ctx.strokeRect(-raft.width / 2, -raft.height / 2, raft.width, raft.height);

    ctx.strokeStyle = '#5f3a1c';
    ctx.lineWidth = 3;
    for (let plank = -60; plank <= 60; plank += 30) {
        ctx.beginPath();
        ctx.moveTo(plank, -raft.height / 2);
        ctx.lineTo(plank, raft.height / 2);
        ctx.stroke();
    }

    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(0, -8, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '25px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(playerIcon, 0, -8);
    ctx.restore();
}

function draw(time) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.clearRect(0, 0, width, height);
    drawOcean(width, height, time);

    if (!gameStarted) return;
    floatingItems.forEach(item => drawFloatingItem(item, width, height, time));
    drawRaft(width, height, time);
}

function gameLoop(timestamp) {
    const delta = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    elapsed += delta;
    draw(elapsed);
    requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
requestAnimationFrame(gameLoop);