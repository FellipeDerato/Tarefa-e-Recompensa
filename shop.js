// shop.js - Loja e Inventário (overlay UI)
// Dependências: app.js deve expor `state`, `updateCoinDisplay()`, `saveState()` and `awardCoins()`

console.log('shop.js executing');
// debug: log clicks inside shop to help trace why handlers don't fire
document.addEventListener('click', function(ev){
  try {
    const card = ev.target.closest && ev.target.closest('.shop-card');
    if (card) console.log('DEBUG document click on shop-card', card.dataset.id, ev.target);
    const inShop = ev.target.closest && ev.target.closest('#shop-overlay');
    if (inShop) console.log('DEBUG document click inside #shop-overlay', ev.target);
  } catch(e){}
});
(function(){
  // simple shop/inventory module
  // simple shop/inventory module - Puxando dinamicamente do itens.js
  const SHOP = new Proxy({}, {
    get: (target, prop) => {
      // Se o itens.js ainda não tiver carregado ou a propriedade não existir, retorna um array vazio
      if (!window.ITENS_DB || !window.ITENS_DB[prop]) return [];
      
      // Força a imagem de cada item a seguir o seu padrão 'media/id.png' automaticamente
      window.ITENS_DB[prop].forEach(item => {
        item.img = `media/${item.id}.png`;
      });
      
      return window.ITENS_DB[prop];
    }
  });

  // Toast helper
  function ensureToastContainer() {
    if (document.getElementById('toast-container')) return;
    const t = document.createElement('div'); t.id = 'toast-container'; document.body.appendChild(t);
  }
  function showToast(msg, type = 'default', timeout = 2800) {
    ensureToastContainer();
    const c = document.getElementById('toast-container');
    const el = document.createElement('div'); el.className = 'toast ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : ''); el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(()=>el.remove(), 300); }, timeout);
  }

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  function openShop() {
    renderShop();
    const overlay = document.getElementById('shop-overlay'); if (overlay) overlay.classList.add('open');
    // start collapsed (grid-only)
    const box = document.getElementById('shop-box'); if (box) box.classList.remove('expanded');
  }
  function closeShop() {
    const overlay = document.getElementById('shop-overlay'); if (overlay) overlay.classList.remove('open');
  }

  function renderShop() {
    const container = document.getElementById('shop-content');
    if (!container) return;
    // layout: description on top, then row of consumables, then row of equipments
    container.innerHTML = '';
    const detail = document.createElement('div'); detail.id = 'shop-detail-box'; detail.className = 'shop-detail';
    detail.innerHTML = '<div id="shop-detail-empty">Selecione um item para ver detalhes</div>';
    container.appendChild(detail);

    // Consumíveis row
    const cTitle = document.createElement('div'); cTitle.className = 'shop-section-title'; cTitle.textContent = 'Consumíveis'; container.appendChild(cTitle);
    const consumableRow = document.createElement('div'); consumableRow.className = 'shop-row';
    SHOP.consumables.forEach(item => consumableRow.appendChild(createItemCard(item, 'consumable')));
    // wrap with arrows
    const cwrap = document.createElement('div'); cwrap.className = 'shop-row-wrap';
    const cleft = document.createElement('button'); cleft.className = 'shop-row-btn'; cleft.innerHTML = '◀';
    const cright = document.createElement('button'); cright.className = 'shop-row-btn'; cright.innerHTML = '▶';
    cwrap.appendChild(cleft); cwrap.appendChild(consumableRow); cwrap.appendChild(cright);
    container.appendChild(cwrap);

    // Equipamentos row
    const eTitle = document.createElement('div'); eTitle.className = 'shop-section-title'; eTitle.textContent = 'Equipamentos'; container.appendChild(eTitle);
    const equipRow = document.createElement('div'); equipRow.className = 'shop-row';
    SHOP.equipments.forEach(item => equipRow.appendChild(createItemCard(item, 'equipment')));
    const ewrap = document.createElement('div'); ewrap.className = 'shop-row-wrap';
    const eleft = document.createElement('button'); eleft.className = 'shop-row-btn'; eleft.innerHTML = '◀';
    const eright = document.createElement('button'); eright.className = 'shop-row-btn'; eright.innerHTML = '▶';
    ewrap.appendChild(eleft); ewrap.appendChild(equipRow); ewrap.appendChild(eright);
    container.appendChild(ewrap);

    // delegation: ensure clicks inside the shop content open the detail (robust against inner elements)
    if (!container._delegationAttached) {
      container._delegationAttached = true;
      container.addEventListener('click', (ev) => {
        try { console.log('container click handler', 'target=', ev.target); } catch(e){}
        // Robust card detection: try closest on target, then event path, then elementFromPoint
        let card = null;
        try {
          if (ev.target && ev.target.closest) card = ev.target.closest('.shop-card');
          if (!card) {
            const path = ev.composedPath ? ev.composedPath() : (ev.path || []);
            for (const el of path) {
              if (el && el.classList && el.classList.contains && el.classList.contains('shop-card')) { card = el; break; }
            }
          }
          if (!card && ev.clientX != null && ev.clientY != null) {
            const el = document.elementFromPoint(ev.clientX, ev.clientY);
            if (el) card = el.closest ? el.closest('.shop-card') : null;
          }
        } catch(e) { console.error('card detection err', e); }
        try { console.log('container click detected card=', card); } catch(e){}
        if (card) {
          const id = card.dataset.id;
          if (id) focusItem(id);
        }
      });
    }

    // attach click handlers (redundant safe-guard)
    $all('.shop-card').forEach(el => el.onclick = () => focusItem(el.dataset.id));

    // add scrolling and drag behavior for rows
    function makeScrollable(row, leftBtn, rightBtn) {
      if (!row) return;
      const step = 220;
      leftBtn.onclick = () => { row.scrollBy({ left: -step, behavior: 'smooth' }); };
      rightBtn.onclick = () => { row.scrollBy({ left: step, behavior: 'smooth' }); };
      // update button states based on scroll
      function updateButtons() {
        const canLeft = row.scrollLeft > 2;
        const canRight = row.scrollLeft + row.clientWidth < row.scrollWidth - 2;
        leftBtn.disabled = !canLeft;
        rightBtn.disabled = !canRight;
        leftBtn.style.opacity = leftBtn.disabled ? '0.35' : '1';
        rightBtn.style.opacity = rightBtn.disabled ? '0.35' : '1';
      }
      row.addEventListener('scroll', updateButtons);
      setTimeout(updateButtons, 20);
      // pointer drag
      let isDown = false, startX, scrollLeft;
      row.addEventListener('pointerdown', (e) => { try { console.log('row pointerdown', e.target, 'pointerId', e.pointerId); } catch(e){} isDown = true; row.setPointerCapture(e.pointerId); startX = e.clientX; scrollLeft = row.scrollLeft; row.style.cursor = 'grabbing'; });
      row.addEventListener('pointermove', (e) => { if (!isDown) return; const dx = e.clientX - startX; row.scrollLeft = scrollLeft - dx; updateButtons(); });
      ['pointerup','pointerleave','pointercancel'].forEach(ev => row.addEventListener(ev, (e) => { isDown = false; try { row.releasePointerCapture(e.pointerId); } catch{} row.style.cursor = 'default'; updateButtons(); }));
    }
    // wire wrappers
    makeScrollable(consumableRow, cleft, cright);
    makeScrollable(equipRow, eleft, eright);

    // (no floating focus — hover handled via subtle CSS shadow)
  }

  function createItemCard(item, type) {
    const div = document.createElement('div');
    div.className = 'shop-card';
    div.dataset.id = item.id;
    div.dataset.type = type;
    const boughtClass = item.bought ? ' bought' : '';
    div.className = 'shop-card' + boughtClass;
    // avoid showing the item name twice when image is missing: keep alt empty
    div.innerHTML = `
      <img src="${item.img}" alt="" class="shop-thumb" />
      <div class="shop-meta"><div class="shop-name">${item.name}</div><div class="shop-price">${item.price} 💰</div></div>
      ${item.bought ? '<div class="bought-badge">Comprado</div>' : ''}
    `;
    // clicking handled via delegation on the container to avoid conflicts with pointer capture
    return div;
  }

  function focusItem(id) {
    console.log('focusItem called with', id);
    const all = SHOP.consumables.concat(SHOP.equipments);
    const item = all.find(i => i.id === id);
    if (!item) return;
    // update selection highlight
    $all('.shop-card').forEach(c => c.classList.toggle('selected', c.dataset.id === id));
    const box = document.getElementById('shop-detail-box');
    // three-column layout: image | info | vertical actions (buy/close)
    box.innerHTML = `
      <div class="inv-detail-row" style="display:flex;gap:12px;align-items:flex-start">
        <div class="inv-detail-img"><img src="${item.img}" class="shop-large" /></div>
        <div class="inv-detail-info" style="flex:1">
          <h3>${item.name}</h3>
          <p class="shop-desc">${item.desc}</p>
        </div>
        <div class="inv-detail-actions" style="display:flex;flex-direction:column;gap:10px;min-width:120px">
        </div>
      </div>
    `;
    const actions = box.querySelector('.inv-detail-actions'); if (!actions) return;
    const buy = document.createElement('button'); buy.className = 'btn-grunge primary'; buy.id = 'shop-buy'; buy.textContent = `Comprar (${item.price} 💰)`;
    if (item.bought) { buy.disabled = true; buy.textContent = 'Comprado'; }
    buy.onclick = () => doBuy(item);
    const closeBtn = document.createElement('button'); closeBtn.className = 'btn-grunge'; closeBtn.id = 'shop-close-detail'; closeBtn.textContent = 'Fechar';
    closeBtn.onclick = () => { box.innerHTML = '<div id="shop-detail-empty">Selecione um item para ver detalhes</div>'; $all('.shop-card').forEach(c => c.classList.remove('selected')); };
    actions.appendChild(buy);
    actions.appendChild(closeBtn);
  }

  function doBuy(item) {
    console.log('doBuy called for', item.id);
    // use global state from app.js
    if (!window.state) { console.log('no window.state'); return; }
    console.log('player coins', window.state.coins, 'price', item.price);
    if (window.state.coins < item.price) { showToast('Moedas insuficientes', 'error'); return; }
    // subtract
    window.state.coins -= item.price;
    if (window.updateCoinDisplay) window.updateCoinDisplay();
    if (window.saveState) window.saveState();

    // visual feedback: pulse the card and coin display
    try {
      const cardEl = document.querySelector('.shop-card[data-id="' + item.id + '"]');
      if (cardEl) {
        cardEl.classList.add('pulse-buy');
        setTimeout(() => cardEl.classList.remove('pulse-buy'), 700);
      }
      const coinEl = document.querySelector('.coin-display'); if (coinEl) { coinEl.classList.add('coin-pulse'); setTimeout(()=>coinEl.classList.remove('coin-pulse'),700); }
    } catch(e) {}

    // consumable: add to inventory but keep focused (user must manually unfocus)
    if (item.id.startsWith('c_')) {
      window.state.inventory = window.state.inventory || { items: [], equipmentSlots: Array(5).fill(null) };
      // if same item exists, increment qty instead of adding duplicate
      const existing = (window.state.inventory.items || []).find(i => i.id === item.id);
      if (existing) {
        existing.qty = (existing.qty || 1) + 1;
      } else {
        window.state.inventory.items.push({ id: item.id, name: item.name, qty: 1, desc: item.desc });
      }
      if (window.saveState) window.saveState();
      renderInventoryGrid();
      // keep focus
      showToast('Comprado: ' + item.name, 'success');
      return;
    }

    // equipment: add to inventory and mark as bought (so can't buy again) and auto-unfocus
    if (item.id.startsWith('e_')) {
      window.state.inventory = window.state.inventory || { items: [], equipmentSlots: Array(5).fill(null) };
      window.state.inventory.items.push({ id: item.id, name: item.name, qty: 1, desc: item.desc, equipped: false });
      // mark bought in shop data
      const eq = SHOP.equipments.find(e => e.id === item.id);
      if (eq) eq.bought = true;
      if (window.saveState) window.saveState();
      renderShop();
      renderInventoryGrid();
      showToast('Equipamento comprado: ' + item.name, 'success');
      // auto unfocus: reset detail area to default and clear selection
      const box = document.getElementById('shop-detail-box'); if (box) box.innerHTML = '<div id="shop-detail-empty">Selecione um item para ver detalhes</div>';
      $all('.shop-card').forEach(c => c.classList.remove('selected'));
      return;
    }
  }

  function openInventory() {
    renderInventoryGrid();
    const overlay = document.getElementById('inv-overlay'); if (overlay) overlay.classList.add('open');
  }
  function closeInventory() { document.getElementById('inv-overlay').classList.remove('open'); }

  function renderInventoryGrid() {
    const cont = document.getElementById('inv-content'); if (!cont) return;
    cont.innerHTML = '';
    window.state.inventory = window.state.inventory || { items: [], equipmentSlots: Array(5).fill(null) };
    const items = window.state.inventory.items || [];

    // detail box at top (same vibe as shop)
    const detail = document.createElement('div'); detail.id = 'inv-detail-box'; detail.className = 'shop-detail';
    detail.innerHTML = '<div id="inv-detail-empty">Clique em um item para ver detalhes</div>';
    cont.appendChild(detail);

    const grid = document.createElement('div'); grid.className = 'inv-grid';
    items.forEach((it, idx) => {
      const s = document.createElement('div'); s.dataset.idx = idx; s.dataset.id = it.id;
      const eqClass = it.equipped ? ' equipped' : '';
      s.className = 'inv-slot' + eqClass;
      s.innerHTML = `
        <div class="inv-slot-inner">
          <img src="${(it.img||'media/placeholder-64.png')}" class="shop-thumb"/>
          <div class="inv-slot-name">${it.name}</div>
        </div>
      `;
      grid.appendChild(s);
    });
    // empty slots
    for (let i=items.length;i<20;i++) { const s = document.createElement('div'); s.className='inv-slot empty'; s.textContent=''; grid.appendChild(s); }

    // equipment area
    const eqArea = document.createElement('div'); eqArea.className = 'inv-eq';
    eqArea.innerHTML = '<h4>Equipamentos</h4>';
    const eqGrid = document.createElement('div'); eqGrid.className='inv-eq-grid';
    for (let i=0;i<5;i++) {
      const cell = document.createElement('div'); cell.className='inv-eq-slot'; const val = window.state.inventory.equipmentSlots[i]; cell.textContent = val? val.name : '+'; eqGrid.appendChild(cell);
    }
    eqArea.appendChild(eqGrid);

    cont.appendChild(grid);
    cont.appendChild(eqArea);

    // delegation for inventory clicks (show detail and actions)
    if (!cont._delegationAttached) {
      cont._delegationAttached = true;
      cont.addEventListener('click', (ev) => {
        try { console.log('inv container click', ev.target); } catch(e){}
        let slot = null;
        try {
          if (ev.target && ev.target.closest) slot = ev.target.closest('.inv-slot');
          if (!slot) {
            const path = ev.composedPath ? ev.composedPath() : (ev.path || []);
            for (const el of path) { if (el && el.classList && el.classList.contains && el.classList.contains('inv-slot')) { slot = el; break; } }
          }
          if (!slot && ev.clientX!=null && ev.clientY!=null) {
            const el = document.elementFromPoint(ev.clientX, ev.clientY); if (el) slot = el.closest ? el.closest('.inv-slot') : null;
          }
        } catch(e) { console.error('inv slot detect err', e); }
        try { console.log('inv click detected slot=', slot); } catch(e){}
        if (slot && slot.dataset && typeof slot.dataset.idx !== 'undefined') {
          focusInvItem(Number(slot.dataset.idx));
        }
      });
    }
  }

  function focusInvItem(idx) {
    console.log('focusInvItem', idx);
    window.state.inventory = window.state.inventory || { items: [], equipmentSlots: Array(5).fill(null) };
    const it = window.state.inventory.items[idx];
    if (!it) return;
    // highlight selection
    document.querySelectorAll('#inv-content .inv-slot').forEach(s => s.classList.toggle('selected', Number(s.dataset.idx) === idx));
    const box = document.getElementById('inv-detail-box'); if (!box) return;
    // three-column layout: image | info (name + desc) | vertical actions
    box.innerHTML = `
      <div class="inv-detail-row" style="display:flex;gap:12px;align-items:flex-start">
        <div class="inv-detail-img"><img src="${it.img || 'media/placeholder-64.png'}" class="shop-large" /></div>
        <div class="inv-detail-info" style="flex:1">
          <h3>${it.name}${it.qty && it.qty>1? ' ('+it.qty+')' : ''}</h3>
          <p class="shop-desc">${it.desc || ''}</p>
        </div>
        <div class="inv-detail-actions" style="display:flex;flex-direction:column;gap:10px;min-width:120px">
        </div>
      </div>
    `;
    const actions = box.querySelector('.inv-detail-actions'); if (!actions) return;
    if (it.id && it.id.startsWith('c_')) {
      const btnConsume = document.createElement('button'); btnConsume.className = 'btn-grunge primary'; btnConsume.id = 'inv-consume'; btnConsume.textContent = 'Consumir';
      btnConsume.onclick = () => consumeItem(idx);
      actions.appendChild(btnConsume);
    }
    if (it.id && it.id.startsWith('e_')) {
      const btnEquip = document.createElement('button'); btnEquip.className = 'btn-grunge primary'; btnEquip.id = 'inv-equip'; btnEquip.textContent = it.equipped ? 'Desequipar' : 'Equipar';
      btnEquip.onclick = () => toggleEquip(idx);
      actions.appendChild(btnEquip);
    }
    const btnClose = document.createElement('button'); btnClose.className = 'btn-grunge'; btnClose.textContent = 'Fechar'; btnClose.onclick = () => { box.innerHTML = '<div id="inv-detail-empty">Clique em um item para ver detalhes</div>'; document.querySelectorAll('#inv-content .inv-slot').forEach(s=>s.classList.remove('selected')); };
    actions.appendChild(btnClose);
  }

  function consumeItem(idx) {
    const inv = window.state.inventory || { items: [], equipmentSlots: Array(5).fill(null) };
    const it = inv.items[idx]; if (!it) return;
    // consume logic: reduce qty or remove
    if (it.qty && it.qty > 1) { it.qty -= 1; showToast('Consumido: ' + it.name, 'success'); }
    else { inv.items.splice(idx, 1); showToast('Consumido: ' + it.name, 'success'); }
    if (window.saveState) window.saveState();
    renderInventoryGrid();
  }

  function toggleEquip(idx) {
    const inv = window.state.inventory || { items: [], equipmentSlots: Array(5).fill(null) };
    const it = inv.items[idx]; if (!it) return;
    // if already equipped, unequip
    if (it.equipped) {
      it.equipped = false;
      for (let i=0;i<inv.equipmentSlots.length;i++) if (inv.equipmentSlots[i] && inv.equipmentSlots[i].id === it.id) inv.equipmentSlots[i] = null;
      showToast('Desequipado: ' + it.name, 'success');
    } else {
      // equip into first empty slot
      let placed = false;
      for (let i=0;i<inv.equipmentSlots.length;i++) {
        if (!inv.equipmentSlots[i]) { inv.equipmentSlots[i] = { id: it.id, name: it.name }; placed = true; break; }
      }
      if (!placed) { // replace slot 0
        inv.equipmentSlots[0] = { id: it.id, name: it.name };
      }
      // mark as equipped
      inv.items.forEach(x => { if (x.id === it.id) x.equipped = true; });
      showToast('Equipado: ' + it.name, 'success');
    }
    if (window.saveState) window.saveState();
    renderInventoryGrid();
  }

  // wire buttons
  window.openShopUI = openShop;
  window.openInvUI = openInventory;

  document.addEventListener('DOMContentLoaded', () => {
    ensureToastContainer();
    const sb = document.getElementById('btn-shop'); if (sb) sb.onclick = openShop;
    const ib = document.getElementById('btn-inv'); if (ib) ib.onclick = openInventory;
    const sclose = document.getElementById('shop-close'); if (sclose) sclose.onclick = closeShop;
    const iclose = document.getElementById('inv-close'); if (iclose) iclose.onclick = closeInventory;
    // Play click sound for main UI and overlay interactions
    document.addEventListener('click', (ev) => {
      try {
        const t = ev.target;
        const tag = (t && t.tagName) ? t.tagName.toUpperCase() : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        // actionable selectors: top bar mini buttons, grunge buttons, item cards/slots, row arrows
        const actionable = (t.closest && (t.closest('.mini-btn') || t.closest('.btn-grunge') || t.closest('.shop-card') || t.closest('.inv-slot') || t.closest('.shop-row-btn') || t.closest('#btn-roleta-storage')));
        if (actionable) {
          try { if (typeof playSfx === 'function') playSfx('botaoBase'); } catch(e){}
        }
      } catch(e) {}
    });
  });
})();
