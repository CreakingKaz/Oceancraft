const Assets = {
    images: {},
    svgData: {
        balsa: `
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
                <rect width="200" height="200" fill="#8B4513"/>
                <line x1="40" y1="0" x2="40" y2="200" stroke="#5C2E0B" stroke-width="4"/>
                <line x1="80" y1="0" x2="80" y2="200" stroke="#5C2E0B" stroke-width="4"/>
                <line x1="120" y1="0" x2="120" y2="200" stroke="#5C2E0B" stroke-width="4"/>
                <line x1="160" y1="0" x2="160" y2="200" stroke="#5C2E0B" stroke-width="4"/>
            </svg>`,
        jugador: `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                <!-- Personaje circular visto desde arriba -->
                <circle cx="16" cy="16" r="14" fill="#f1c40f" stroke="#2c3e50" stroke-width="3"/>
                <circle cx="16" cy="16" r="6" fill="#e67e22"/>
            </svg>`,
        mesa: `
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                <rect width="40" height="40" fill="#7f8c8d" stroke="#2c3e50" stroke-width="4"/>
                <circle cx="20" cy="20" r="10" fill="#bdc3c7"/>
            </svg>`
    },

    async loadAll() {
        await this.loadSVG('balsa', this.svgData.balsa);
        await this.loadSVG('jugador', this.svgData.jugador);
        await this.loadSVG('mesa', this.svgData.mesa);
        console.log("Assets vectoriales generados por IA cargados.");
    },

    loadSVG(name, svgString) {
        return new Promise((resolve) => {
            const img = new Image();
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            img.onload = () => { this.images[name] = img; resolve(); };
            img.src = URL.createObjectURL(blob);
        });
    }
};