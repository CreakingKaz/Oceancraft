
// ESTILO TERRARIA: El Canvas se empieza a dibujar INMEDIATAMENTE detrás del Splash.
document.addEventListener("DOMContentLoaded", () => {
    gameState = 'MENU';
    requestAnimationFrame(gameLoop); // Empieza a dibujar el océano de fondo al instante

    // Retraso de 2 segundos para Star Studios, luego desvanece
    setTimeout(() => {
        let splash = document.getElementById('splash-screen');
        splash.style.opacity = '0';
        
        setTimeout(() => {
            splash.classList.add('hidden');
            document.getElementById('menu-layer').classList.remove('hidden');
            updatePreview(); // Inicializar el preview
        }, 1500); // 1.5s de fade out
    }, 2000); 
});

function showMenuPanel(panelId) {
    document.querySelectorAll('.menu-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(panelId).classList.remove('hidden');
    if (panelId === 'continue-panel') updateSaveSlots();
}

// SISTEMA DE COSMÉTICOS: Previsualización en Tiempo Real
function updatePreview() {
    let color = document.getElementById('player-color').value;
    let icon = document.getElementById('player-icon').value || "";
    let preview = document.getElementById('player-preview');
    
    preview.style.background = color;
    preview.innerText = icon.substring(0, 1).toUpperCase();
}

function updateSaveSlots() {
    for (let i = 1; i <= 3; i++) {
        let saveStr = localStorage.getItem('oceancraft_s' + i);
        let infoDiv = document.getElementById('slot-' + i + '-info');
        
        if (saveStr) {
            let data = JSON.parse(saveStr);
            let playTime = data.playTime ? Math.floor(data.playTime / 60) : 0;
            let wName = data.worldConfig?.name || `Mundo ${i}`;
            infoDiv.innerHTML = `<strong style="color:#00d2d3; font-size:16px;">${wName}</strong><br>
                                 <span style="color:#ccc;">Días: ${data.time?.d || 1} | ${playTime} min</span>`;
        } else {
            infoDiv.innerHTML = `<em style="color:#666; font-size:16px;">Slot Vacío</em>`;
        }
    }
}

// ARREGLO DEL BUG CRÍTICO DE CREACIÓN
function createNewGame() {
    let wName = document.getElementById('world-name').value || "Mi Mundo";
    let diff = document.getElementById('world-diff').value;
    let freq = document.getElementById('world-freq').value;
    let color = document.getElementById('player-color').value;
    let icon = document.getElementById('player-icon').value || "K";
    
    let config = {
        name: wName,
        diff: parseFloat(diff),
        freq: freq,
        color: color,
        icon: icon.substring(0, 1).toUpperCase()
    };

    let slotToUse = 1;
    for (let i = 1; i <= 3; i++) {
        if (!localStorage.getItem('oceancraft_s' + i)) { slotToUse = i; break; }
    }
    
    startGame(slotToUse, true, config);
}

function loadGame(slotIndex) {
    let saveStr = localStorage.getItem('oceancraft_s' + slotIndex);
    if (!saveStr) {
        alert("Slot vacío. ¡Crea un Nuevo Juego!");
        showMenuPanel('new-game-panel');
        return;
    }
    startGame(slotIndex, false, null);
}
