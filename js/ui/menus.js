const Menus = {
    init() {
        const overlay = document.getElementById('menu-overlay');
        const invMenu = document.getElementById('inventory-menu');
        const opcMenu = document.getElementById('options-menu');
        const craftMenu = document.getElementById('crafting-menu'); // Conectado!

        // Abrir Opciones
        document.getElementById('btn-opc').addEventListener('click', () => {
            overlay.classList.remove('hidden');
            opcMenu.classList.remove('hidden');
            Engine.isRunning = false;
        });

        // Abrir Inventario
        document.getElementById('btn-inv').addEventListener('click', () => {
            overlay.classList.remove('hidden');
            invMenu.classList.remove('hidden');
        });

        // Abrir Menú de Crafteo
        document.getElementById('btn-crafting').addEventListener('click', () => {
            overlay.classList.remove('hidden');
            craftMenu.classList.remove('hidden');
            Crafting.renderMenu(); // Esto dibuja los botones actualizados
        });

        // Cerrar todos los menús
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', () => {
                overlay.classList.add('hidden');
                invMenu.classList.add('hidden');
                opcMenu.classList.add('hidden');
                craftMenu.classList.add('hidden'); // Ocultar también crafteo
                Engine.isRunning = true;
            });
        });
    }
};