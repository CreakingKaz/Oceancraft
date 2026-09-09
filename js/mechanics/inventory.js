const Inventory = {
    slots: [null, null, null],
    
    init() {
        this.updateUI();
    },
    
    addItem(item) {
        // Enviar log al texto derecho
        UI.addLootLog(`+1 ${item.name}`);

        // Buscar el primer cuadrado rojo vacío
        const emptySlotIndex = this.slots.findIndex(slot => slot === null);
        
        if (emptySlotIndex !== -1) {
            this.slots[emptySlotIndex] = item;
            this.updateUI();
        } else {
            UI.addActionLog("¡Inventario Lleno!");
        }
    },

    updateUI() {
        const slotElements = document.querySelectorAll('.slot');
        this.slots.forEach((item, index) => {
            if (item) {
                // Configurar el estilo para mostrar el item adentro del cuadro rojo
                slotElements[index].innerText = item.name.substring(0, 3).toUpperCase(); 
                slotElements[index].style.color = "white";
                slotElements[index].style.display = "flex";
                slotElements[index].style.alignItems = "center";
                slotElements[index].style.justifyContent = "center";
                slotElements[index].style.fontSize = "12px";
                slotElements[index].style.backgroundColor = "#e67e22"; // Color madera
            }
        });
    }
};