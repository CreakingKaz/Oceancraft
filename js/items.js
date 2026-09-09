// Base de datos de objetos (Estructura base para el futuro inventario)
const ItemDatabase = {
    madera: { 
        id: 1, 
        name: "Tabla de madera", 
        type: "material" 
    },
    plastico: { 
        id: 2, 
        name: "Chatarra plástica", 
        type: "material" 
    },
    pescado_crudo: { 
        id: 3, 
        name: "Pescado crudo", 
        type: "food", 
        hungerValue: 15,
        healthPenalty: 5 
    },
    pescado_cocinado: { 
        id: 4, 
        name: "Pescado cocinado", 
        type: "food", 
        hungerValue: 40 
    },
    agua_dulce: { 
        id: 5, 
        name: "Vaso de agua dulce", 
        type: "drink", 
        thirstValue: 50 
    }
};