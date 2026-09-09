const Inventory = {
    items: {}, 
    
    init() { this.updateUI(); },
    
    addItem(idOrObj, qty = 1) {
        let id = typeof idOrObj === 'object' ? (idOrObj.type || idOrObj.name.toLowerCase()) : idOrObj;
        if(!ITEMS_DB[id]) id = 'madera'; // Prevención de errores si agarras algo viejo

        UI.addLog(`+${qty} ${ITEMS_DB[id].name}`);
        if (!this.items[id]) this.items[id] = 0;
        this.items[id] += qty;
        this.updateUI();
    },

    hasItem(id, qty) { return (this.items[id] || 0) >= qty; },

    removeItem(id, qty) {
        if (this.hasItem(id, qty)) {
            this.items[id] -= qty;
            if (this.items[id] <= 0) delete this.items[id];
            this.updateUI();
        }
    },

    updateUI() {
        const slotElements = document.querySelectorAll('.slot');
        const itemKeys = Object.keys(this.items);
        
        for(let i = 0; i < 3; i++) {
            if (itemKeys[i]) {
                const id = itemKeys[i];
                const qty = this.items[id];
                
                // Dibuja el gráfico generado por IA en el cuadrado
                slotElements[i].innerHTML = `
                    <div style="width: 100%; height: 100%; padding: 10px; display:flex; justify-content:center; align-items:center;">
                        ${ITEMS_DB[id].svg}
                    </div>
                    <span class="slot-qty">x${qty}</span>
                `;
                slotElements[i].style.backgroundColor = "rgba(0,0,0,0.5)"; 
            } else {
                slotElements[i].innerHTML = '';
            }
        }
    }
};