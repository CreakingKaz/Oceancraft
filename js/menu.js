
// Lógica de transición de menús y guardados
document.addEventListener("DOMContentLoaded", () => {
    // 1. Pantalla de carga Star Studios
    setTimeout(() => {
        let splash = document.getElementById('splash-screen');
        splash.style.opacity = '0';
        
        setTimeout(() => {
            splash.classList.add('hidden');
            // Mostrar Menú y activar animación del fondo
            document.getElementById('menu-layer').classList.remove('hidden');
            gameState = 'MENU';
            requestAnimationFrame(gameLoop); // Inicia el motor gráfico en modo fondo
        }, 1000); // tiempo de fade-out
    }, 2500); // tiempo visible de la marca
});

function showMenuPanel(panelId) {
    document.querySelectorAll('.menu-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(panelId).classList.remove('hidden');
    
    if (panelId === 'continue-panel') {
        updateSaveSlots();
    }
}

function updateSaveSlots() {
    for (let i = 1; i <= 3; i++) {
        let saveStr = localStorage.getItem('oceancraft_s' + i);
        let infoDiv = document.getElementById('slot-' + i + '-info');
        
        if (saveStr) {
            let data = JSON.parse(saveStr);
            let playTime = data.playTime ? Math.floor(data.playTime / 60) : 0; // en minutos
            let wName = data.worldConfig?.name || `Mundo ${i}`;
            infoDiv.innerHTML = `<strong style="color:#f1c40f">${wName}</strong><br>
                                 Días: ${data.time.d} | Jugado: ${playTime} min<br>
                                 <span style="font-size:11px; color:#aaa;">Última vez: ${data.lastSaved || 'Desconocido'}</span>`;
        } else {
            infoDiv.innerHTML = `<em style="color:#888;">Slot Vacío</em>`;
        }
    }
}

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
        icon: icon
    };

    // Buscar primer slot vacío o sobreescribir el 1
    let slotToUse = 1;
    for (let i = 1; i <= 3; i++) {
        if (!localStorage.getItem('oceancraft_s' + i)) { slotToUse = i; break; }
    }
    
    startGame(slotToUse, true, config);
}

function loadGame(slotIndex) {
    let saveStr = localStorage.getItem('oceancraft_s' + slotIndex);
    if (!saveStr) {
        alert("Este slot está vacío. ¡Crea un Nuevo Juego!");
        showMenuPanel('new-game-panel');
        return;
    }
    startGame(slotIndex, false, null);
}
