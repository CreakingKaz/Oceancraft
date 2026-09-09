const Crafting = {
    // Aquí puedes agregar todas las recetas futuras del juego
    recipes: [
        {
            id: 'tabla_refinada',
            name: 'Tabla Refinada',
            cost: { 'MADERA': 2 },
            result: 'TABLA'
        },
        {
            id: 'cuerda',
            name: 'Cuerda Fuerte',
            cost: { 'PLASTICO': 2 },
            result: 'CUERDA'
        },
        {
            id: 'red_pesca',
            name: 'Red de Pesca',
            cost: { 'CUERDA': 2, 'MADERA': 1 },
            result: 'RED'
        }
    ],

    // Verifica si hay materiales suficientes en el inventario
    canCraft(recipe) {
        for (let item in recipe.cost) {
            if (!Inventory.hasItem(item, recipe.cost[item])) {
                return false;
            }
        }
        return true;
    },

    // Ejecuta la fabricación
    craft(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        if (this.canCraft(recipe)) {
            // 1. Cobrar los materiales
            for (let item in recipe.cost) {
                Inventory.removeItem(item, recipe.cost[item]);
            }
            
            // 2. Dar el resultado
            Inventory.addItem({ name: recipe.result });
            UI.addLog(`Has fabricado: ${recipe.name}`, true);
            
            // 3. Actualizar la ventana visualmente
            this.renderMenu();
        } else {
            UI.addLog("No tienes suficientes materiales.");
        }
    },

    // Dibuja la lista en el HTML
    renderMenu() {
        const list = document.getElementById('crafting-list');
        if (!list) return;
        list.innerHTML = ''; // Limpiar lista vieja

        this.recipes.forEach(recipe => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'craft-item';
            
            // Generar el texto de costo (Ej: "2 MADERA + 1 PLASTICO")
            let costText = Object.entries(recipe.cost)
                                 .map(([item, qty]) => `${qty} ${item}`)
                                 .join(' + ');
            
            const canCraft = this.canCraft(recipe);
            
            // Inyectar el HTML de cada receta
            itemDiv.innerHTML = `
                <div>
                    <strong>${recipe.name}</strong><br>
                    <span class="craft-cost">Costo: ${costText}</span>
                </div>
                <button class="btn-craft" 
                        style="background: ${canCraft ? '#1dd1a1' : '#ff4757'}" 
                        onclick="Crafting.craft('${recipe.id}')">
                    ${canCraft ? 'Fabricar' : 'Faltan Mat.'}
                </button>
            `;
            list.appendChild(itemDiv);
        });
    }
};