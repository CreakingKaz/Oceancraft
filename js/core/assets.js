const Assets = {
    images: {},

    // Generamos las imágenes mediante código SVG puro (Vectorial)
    // Esto cumple la regla de "Todo hecho por IA" sin descargar PNGs.
    svgData: {
        // Modelo de la Balsa (Madera con tablones)
        balsa: `
            <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150">
                <rect width="150" height="150" fill="#8B4513"/>
                <line x1="30" y1="0" x2="30" y2="150" stroke="#5C2E0B" stroke-width="4"/>
                <line x1="60" y1="0" x2="60" y2="150" stroke="#5C2E0B" stroke-width="4"/>
                <line x1="90" y1="0" x2="90" y2="150" stroke="#5C2E0B" stroke-width="4"/>
                <line x1="120" y1="0" x2="120" y2="150" stroke="#5C2E0B" stroke-width="4"/>
                <!-- Detalles de clavos -->
                <circle cx="15" cy="15" r="2" fill="#333"/>
                <circle cx="45" cy="135" r="2" fill="#333"/>
                <circle cx="75" cy="15" r="2" fill="#333"/>
            </svg>`,
        
        // Modelo del Jugador (Personaje bloque)
        jugador: `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                <!-- Cabeza -->
                <rect x="10" y="4" width="12" height="12" fill="#FAD6B1"/>
                <!-- Ojos -->
                <rect x="12" y="8" width="2" height="2" fill="#000"/>
                <rect x="18" y="8" width="2" height="2" fill="#000"/>
                <!-- Cuerpo (Camisa azul) -->
                <rect x="8" y="16" width="16" height="10" fill="#3498DB"/>
                <!-- Piernas -->
                <rect x="10" y="26" width="4" height="6" fill="#1ABC9C"/>
                <rect x="18" y="26" width="4" height="6" fill="#1ABC9C"/>
            </svg>`
    },

    async loadAll() {
        // Cargar balsa
        await this.loadSVG('balsa', this.svgData.balsa);
        // Cargar jugador
        await this.loadSVG('jugador', this.svgData.jugador);
        
        console.log("Assets vectoriales generados por IA cargados.");
    },

    loadSVG(name, svgString) {
        return new Promise((resolve) => {
            const img = new Image();
            // Convertimos el texto SVG en una imagen legible por el navegador
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            img.onload = () => {
                this.images[name] = img;
                resolve();
            };
            img.src = url;
        });
    }
};