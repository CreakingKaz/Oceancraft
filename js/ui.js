let activeModal = null;
let currentInvTab = 'todo';
let currentCraftTab = 'todo';
let selectedInvUID = null;
let selectedSlot = 0;

function toggleMenu(id) {
    if(activeModal && activeModal !== id) document.getElementById(activeModal).classList.add('hidden');
    let el = document.getElementById(id);
    if(el.classList.contains('hidden')) { 
        el.classList.remove('hidden'); activeModal = id; 
        if(id === 'inventory-modal') renderInv(); 
        if(id === 'craft-modal') renderCraft(); 
    } 
    else { el.classList.add('hidden'); activeModal = null; }
}

function setInvTab(tab) { currentInvTab = tab; renderInv(); }
function setCraftTab(tab) { currentCraftTab = tab; renderCraft(); }

function renderInv() {
    document.getElementById('inv-count').innerText = game.inv.length;
    let grid = document.getElementById('inv-grid'); grid.innerHTML = '';
    
    document.querySelectorAll('#inventory-modal .tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`#inventory-modal .tab[onclick*="${currentInvTab}"]`).classList.add('active');
    
    let filtered = game.inv.filter(i => currentInvTab === 'todo' || ITEMS_DB[i.id].cat === currentInvTab);
    filtered.forEach(item => {
        let base = ITEMS_DB[item.id];
        let div = document.createElement('div'); 
        div.className = 'inv-item'; 
        div.style.background = `linear-gradient(135deg, ${base.color}88, rgba(0,0,0,0.6))`; // Degradado estético
        div.innerText = base.symbol;
        
        if(base.cat !== 'herr') div.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
        else div.innerHTML += `<div class="durability-bar" style="width: ${(item.dur/base.maxDur)*100}%"></div>`;
        
        div.onclick = () => {
            selectedInvUID = item.uid; 
            document.getElementById('lore-text').innerHTML = `<strong style="color:${base.color}">${base.name}</strong><br>${base.desc}`;
            document.getElementById('lore-actions').innerHTML = `
                <button class="btn-small" onclick="equip(0)">Eq.1</button> 
                <button class="btn-small" onclick="equip(1)">Eq.2</button> 
                <button class="btn-small" onclick="equip(2)">Eq.3</button>
            `;
        };
        grid.appendChild(div);
    });
}

function equip(slot) { game.hotbar[slot] = selectedInvUID; renderHotbar(); }

function renderCraft() {
    let list = document.getElementById('craft-list'); list.innerHTML = '';
    document.querySelectorAll('#craft-modal .tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`#craft-modal .tab[onclick*="${currentCraftTab}"]`).classList.add('active');

    RECIPES.forEach(rec => {
        let base = ITEMS_DB[rec.id];
        if(currentCraftTab !== 'todo' && base.cat !== currentCraftTab) return;
        
        let canCraft = true; let reqTxt = '';
        for(let k in rec.req) { 
            let has = countItem(k); 
            if(has < rec.req[k]) canCraft = false; 
            reqTxt += `${ITEMS_DB[k].symbol}${has}/${rec.req[k]} `; 
        }
        
        let div = document.createElement('div'); 
        div.style.cssText = `background: rgba(0,0,0,0.4); padding: 12px; margin-bottom: 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 15px; opacity: ${canCraft ? '1' : '0.5'}`;
        div.innerHTML = `
            <div class="inv-item" style="background:${base.color}; width:50px; height:50px; margin:0;">${base.symbol}</div>
            <div><strong style="font-size:16px;">${base.name}</strong><br><span style="font-size:12px; color:#aaa;">${reqTxt}</span></div>
        `;
        div.onclick = () => { 
            document.getElementById('craft-lore-text').innerText = base.desc; 
            document.getElementById('craft-actions').innerHTML = `<button class="btn" ${canCraft?'':'disabled'} onclick="doCraft('${rec.id}')">Fabricar</button>`; 
        };
        list.appendChild(div);
    });
}

function doCraft(id) {
    let rec = RECIPES.find(r => r.id === id);
    for(let k in rec.req) {
        let rem = rec.req[k];
        for (let i = game.inv.length - 1; i >= 0; i--) {
            if (game.inv[i].id === k) { 
                let take = Math.min(game.inv[i].qty, rem); 
                removeItem(game.inv[i].uid, take); rem -= take; 
                if (rem <= 0) break; 
            }
        }
    }
    giveItem(id, 1); advanceTime({h:2, s:2, su:0}); 
    notify("Crafteado: " + ITEMS_DB[id].name); 
    renderCraft(); renderInv(); renderHotbar();
}

function selectSlot(idx) {
    document.querySelectorAll('.hotbar-slot').forEach(el => el.classList.remove('selected'));
    document.getElementById('slot-' + idx).classList.add('selected');
    selectedSlot = idx;
    let uid = game.hotbar[idx];
    let btn = document.getElementById('action-btn');
    if(!uid || !game.inv.find(i => i.uid === uid)) btn.innerText = "Buscar a mano";
    else {
        let item = game.inv.find(i => i.uid === uid);
        let base = ITEMS_DB[item.id];
        if(base.isWeapon && typeof updateCombatBtnText === "function") btn.innerText = updateCombatBtnText(item, base);
        else btn.innerText = base.action || "Usar";
    }
}

function renderHotbar() {
    for(let i=0; i<3; i++) {
        let s = document.getElementById('slot-'+i); s.innerHTML = '';
        let uid = game.hotbar[i]; let item = game.inv.find(x => x.uid === uid);
        if(item) {
            let base = ITEMS_DB[item.id];
            s.style.background = `linear-gradient(135deg, ${base.color}88, rgba(0,0,0,0.6))`; 
            s.innerText = base.symbol;
            if(base.cat !== 'herr') s.innerHTML += `<div class="qty-badge">x${item.qty}</div>`;
            else s.innerHTML += `<div class="durability-bar" style="width: ${(item.dur/base.maxDur)*100}%"></div>`;
        } else s.style.background = 'rgba(0,0,0,var(--ui-opacity))';
    }
    selectSlot(selectedSlot);
}