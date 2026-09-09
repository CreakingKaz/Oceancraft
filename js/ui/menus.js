const Menus = {
    init() {
        const overlay = document.getElementById('menu-overlay');
        const invMenu = document.getElementById('inventory-menu');
        const opcMenu = document.getElementById('options-menu');

        // Abrir Opciones
        document.getElementById('btn-opc').addEventListener('click', () => {
            overlay.classList.remove('hidden');
            opcMenu.classList.remove('hidden');
            Engine.isRunning = false; // Pausar juego
        });

        // Abrir Inventario
        document.getElementById('btn-inv').addEventListener('click', () => {
            overlay.classList.remove('hidden');
            invMenu.classList.remove('hidden');
        });

        // Cerrar todos los menús
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', () => {
                overlay.classList.add('hidden');
                invMenu.classList.add('hidden');
                opcMenu.classList.add('hidden');
                Engine.isRunning = true; // Reanudar juego
            });
        });
    }
};

// Enganchar inicialización (llama a Menus.init() dentro de Engine.init())
// Solo necesitas añadir Menus.init(); en tu js/core/engine.js justo después de UI.init();