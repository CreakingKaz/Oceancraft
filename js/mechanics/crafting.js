const Crafting = {
    canCraft(recipe) {
        for (let itemId in recipe.req) {
            if (!Inventory.hasItem(itemId, recipe.req[itemId])) return false;
        }
        return true;
    },

    craft(recipeId) {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return;

        if (this.canCraft(recipe)) {
            for (let itemId in recipe.req) {
                Inventory.removeItem(itemId, recipe.req[itemId]);
            }
            Inventory.addItem(recipe.id, 1);
            UI.addLog(`Fabricaste: ${recipe.name}`, true);
            this.renderMenu();
        } else {
            UI.addLog("Faltan materiales.");
        }
    },

    renderMenu() {
        const list = document.getElementById('crafting-list');
        if (!list) return;
        list.innerHTML = ''; 

        RECIPES.forEach(recipe => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'craft-item';
            
            // Genera el texto del coste sumando iconos y nombres
            let costText = Object.entries(recipe.req)
                                 .map(([id, qty]) => `${qty} ${ITEMS_DB[id].name}`)
                                 .join(' + ');
            
            const canCraft = this.canCraft(recipe);
            
            itemDiv.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:30px; height:30px;">${ITEMS_DB[recipe.id].svg}</div>
                    <div>
                        <strong style="color:white;">${recipe.name}</strong><br>
                        <span class="craft-cost" style="font-size:10px; color:#feca57;">${costText}</span>
                    </div>
                </div>
                <button class="btn-craft" 
                        style="background: ${canCraft ? '#1dd1a1' : '#ff4757'}" 
                        onclick="Crafting.craft('${recipe.id}')">
                    ${canCraft ? 'Fabricar' : 'Faltan'}
                </button>
            `;
            list.appendChild(itemDiv);
        });
    }
};