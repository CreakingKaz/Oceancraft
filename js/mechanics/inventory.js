const Inventory = {
    items: {}, // Ahora guarda cantidades: { 'MADERA': 5, 'PLASTICO': 2 }
    
    init() {
        this.updateUI();
    },
    
    addItem(item) {
        UI.addLog(`+1 ${item.name}`);
        
        // Si no existe en el inventario, lo creamos en 0
        if (!this.items[item.name]) {
            this.items[item.name] = 0;
        }
        
        // Sumar 1
        this.items[item.name]++;
        this.updateUI();
    },

    // Funciones vitales para que el Crafting sepa si podemos fabricar
    hasItem(name, qty) {
        return (this.items[name] || 0) >= qty;
    },

    removeItem(name, qty) {
        if (this.hasItem(name, qty)) {
            this.items[name] -= qty;
            if (this.items[name] <= 0) delete this.items[name]; // Limpiar si llega a 0
            this.updateUI();
        }
    },

    updateUI() {
        // Enlazar el inventario real a los 3 cuadros de la Hotbar
        const slotElements = document.querySelectorAll('.slot');
        const itemKeys = Object.keys(this.items);
        
        for(let i = 0; i < 3; i++) {
            if (itemKeys[i]) {
                const itemName = itemKeys[i];
                const qty = this.items[itemName];
                
                // Mostrar abreviación de 3 letras (Ej: MAD, PLA) y la cantidad
                slotElements[i].innerHTML = `
                    <div style="color:white; font-size:12px; font-weight:bold; text-align:center; margin-top:20px;">
                        ${itemName.substring(0,3)}
                    </div>
                    <span class="slot-qty">x${qty}</span>
                `;
                slotElements[i].style.backgroundColor = "#d35400"; // Color naranja de item
            } else {
                // Casilla vacía
                slotElements[i].innerHTML = '';
                slotElements[i].style.backgroundColor = "#2f3640";
            }
        }
    }
};