const UI = {
    init() {
        // Elimino los eventos de la mesa que te molestaban, ahora el log es limpio.
        
        // Botones base
        document.getElementById('btn-eat').addEventListener('click', () => {
            if (World.stats.hunger < 100) {
                World.stats.hunger = Math.min(100, World.stats.hunger + 20);
                this.addLog("Has consumido comida.");
            }
        });

        // Eventos aleatorios (clima)
        setInterval(() => {
            if(Math.random() < 0.1) this.addLog("Ha comenzado a llover...", true);
        }, 30000);
    },

    update() {
        // Actualizar Reloj
        let hours = Math.floor(World.timeOfDay / 60).toString().padStart(2, '0');
        let minutes = Math.floor(World.timeOfDay % 60).toString().padStart(2, '0');
        document.getElementById('time-display').innerText = `Día ${World.day} - ${hours}:${minutes}`;

        // Actualizar el ancho de las barras de estadísticas (0% a 100%)
        document.getElementById('bar-health').style.width = World.stats.health + '%';
        document.getElementById('bar-energy').style.width = World.stats.energy + '%';
        document.getElementById('bar-thirst').style.width = World.stats.thirst + '%';
        document.getElementById('bar-hunger').style.width = World.stats.hunger + '%';
        document.getElementById('bar-toxicity').style.width = World.stats.toxicity + '%';
    },

    // Sistema de Log rediseñado con Timestamps
    addLog(text, isMajorEvent = false) {
        const log = document.getElementById('event-log');
        const msg = document.createElement('div');
        msg.className = 'log-msg';
        
        // Obtener la hora del juego al momento del suceso
        let h = Math.floor(World.timeOfDay / 60).toString().padStart(2, '0');
        let m = Math.floor(World.timeOfDay % 60).toString().padStart(2, '0');
        
        msg.innerHTML = `<span class="log-time">[${h}:${m}]</span> ${text}`;
        
        // Si es un evento mayor (nuevo día, clima), resaltarlo
        if (isMajorEvent) msg.style.color = "#feca57";

        log.appendChild(msg);
        
        // Mantener solo los últimos 5 mensajes para que no desborde el panel
        if (log.children.length > 5) {
            log.removeChild(log.firstChild);
        }
    }
};