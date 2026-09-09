const UI = {
    elements: {},

    init() {
        // Capturar elementos del HTML
        this.elements.health = document.getElementById('health-val');
        this.elements.hunger = document.getElementById('hunger-val');
        this.elements.thirst = document.getElementById('thirst-val');

        // Asignar eventos a los botones
        document.getElementById('btn-save').addEventListener('click', () => {
            alert("Partida Guardada (El sistema de localStorage irá aquí)");
        });

        document.getElementById('btn-options').addEventListener('click', () => {
            alert("Menú de opciones. Para pausar el juego cambia Engine.isRunning a false.");
        });

        // Ocultar el cartel de "haz clic" cuando se hace clic
        document.body.addEventListener('click', () => {
            const prompt = document.getElementById('click-prompt');
            if (prompt) prompt.style.display = 'none';
        }, { once: true });
    },

    update() {
        // Actualizar textos redondeando los valores
        this.elements.health.innerText = Math.floor(World.stats.health);
        this.elements.hunger.innerText = Math.floor(World.stats.hunger);
        this.elements.thirst.innerText = Math.floor(World.stats.thirst);
    }
};