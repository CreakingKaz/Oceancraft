
document.addEventListener("DOMContentLoaded", () => {
    try {
        gameState = 'MENU';
        requestAnimationFrame(gameLoop); 
    } catch(e) {
        console.error("Error al arrancar el motor:", e);
    }

    // Temporizadores seguros
    setTimeout(() => {
        let splash = document.getElementById('splash-screen');
        if(splash) splash.style.opacity = '0';
        
        setTimeout(() => {
            if(splash) splash.classList.add('hidden');
            let menu = document.getElementById('menu-layer');
            if(menu) menu.classList.remove('hidden');
            try { updatePreview(); } catch(e) {}
        }, 1500); 
    }, 2000); 
});

function showMenuPanel(panelId) {
    document.querySelectorAll('.menu-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(panelId).classList.remove('hidden');
    if (panelId === 'continue-panel') updateSaveSlots();
}

function updatePreview() {
    let color = document.getElementById('player-color').value;
    let icon = document.getElementById('player-icon').value || "";
    let preview = document.getElementById('player-preview');
    if(preview) {
        preview.style.background = color;
        preview.innerText = icon.substring(0, 1).toUpperCase();
    }
}

function updateSaveSlots() {
    for (let i = 1; i <= 3; i++) {
        let saveStr = localStorage.getItem('oceancraft_s' + i);
        let infoDiv = document.getElementById('slot-' + i + '-info');
        if (!infoDiv) continue;

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

function createNewGame() {
    try {
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
    } catch(e) {
        console.error("Error crítico al crear mundo:", e);
        alert("Ocurrió un error al crear el mundo. Revisa la consola (F12).");
    }
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
