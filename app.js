import { SHOP, CATEGORIES, ITEMS, SET, MONEY } from './menu.js';
import { sfx, speak, unlockAudio, settings, saveSettings } from './sound.js';

// ---------- ちょっとした道具 ----------
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const yen = n => n.toLocaleString('ja-JP');
const COUNT = ['', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'];
const countWord = n => COUNT[n] || `${n}こ`;
const SIZE_NAME = { S: 'エス', M: 'エム', L: 'エル' };
const ORDER_KEY = 'isshin.orderNo';

const byId = Object.fromEntries(ITEMS.map(i => [i.id, i]));

// ---------- 状態 ----------
const state = {
  cat: CATEGORIES[0].id,
  cart: [],        // { key, name, emoji, detail, price, qty, speech }
  received: [],    // うけとった おかね [1000, 100, ...]
  eat: 'in',
  orderNo: loadOrderNo(),
  lastOrder: null,
};

function loadOrderNo() {
  try { return parseInt(localStorage.getItem(ORDER_KEY), 10) || 1; } catch { return 1; }
}
function saveOrderNo() {
  try { localStorage.setItem(ORDER_KEY, String(state.orderNo)); } catch { /* ignore */ }
}

const cartTotal = () => state.cart.reduce((s, l) => s + l.price * l.qty, 0);
const receivedSum = () => state.received.reduce((s, v) => s + v, 0);

// ---------- 画面きりかえ ----------
function show(id) {
  $$('.screen').forEach(s => { s.hidden = s.id !== id; });
  $('#header').hidden = id === 'start';
  $('#header-no').textContent = id === 'receipt' && state.lastOrder ? state.lastOrder.no : state.orderNo;
}

// ---------- メニュー ----------
const setName = burger => `${burger.name.replace(/(?<!ハン)バーガー$/, '')}セット`;

function setPrice(burger) {
  const side = byId[SET.sideId];
  const drinkPrice = ITEMS.find(i => i.sizes)?.sizes[SET.drinkSize] ?? 0;
  return burger.price + side.price + drinkPrice - SET.discount;
}

function renderTabs() {
  $('#tabs').innerHTML = CATEGORIES.map(c => `
    <button class="btn tab ${c.id === state.cat ? 'active' : ''}" data-cat="${c.id}" style="--c:${c.color}">
      <span class="tab-emoji">${c.emoji}</span>${c.name}
    </button>`).join('');
}

function renderItems() {
  const cat = CATEGORIES.find(c => c.id === state.cat);
  let cards;
  if (state.cat === 'set') {
    cards = ITEMS.filter(i => i.cat === 'burger').map(b => ({
      action: 'set', id: b.id,
      emoji: `${b.emoji}🍟🥤`, name: setName(b),
      price: `${yen(setPrice(b))}えん`, badge: `${SET.discount}えん おとく`,
    }));
  } else {
    cards = ITEMS.filter(i => i.cat === state.cat).map(i => ({
      action: i.sizes ? 'size' : 'add', id: i.id, emoji: i.emoji, name: i.name,
      price: i.sizes ? `${yen(Math.min(...Object.values(i.sizes)))}えん〜` : `${yen(i.price)}えん`,
    }));
  }
  $('#items').style.setProperty('--c', cat.color);
  $('#items').innerHTML = cards.map(c => `
    <button class="btn item" data-action="${c.action}" data-id="${c.id}">
      ${c.badge ? `<span class="badge">${c.badge}</span>` : ''}
      <span class="item-emoji ${[...c.emoji].length > 2 ? 'multi' : ''}">${c.emoji}</span>
      <span class="item-name ${c.name.length > 9 ? 'xlong' : c.name.length > 7 ? 'long' : ''}">${c.name}</span>
      <span class="item-price">${c.price}</span>
    </button>`).join('');
}

// ---------- ちゅうもん（カート） ----------
function addLine(line, fromEl) {
  let target = state.cart.find(l => l.key === line.key);
  if (target) target.qty += 1;
  else { target = { ...line, qty: 1 }; state.cart.push(target); }
  sfx.pi();
  speak(`${target.speech || target.name}、${countWord(target.qty)}！`);
  renderCart(target.key);
  if (fromEl) flyEmoji(line.emoji, fromEl);
}

function renderCart(bumpKey) {
  const cart = $('#cart');
  if (state.cart.length === 0) {
    cart.innerHTML = `<li class="cart-empty">👂<br>おきゃくさまの<br>ちゅうもんを きいてね</li>`;
  } else {
    cart.innerHTML = state.cart.map((l, i) => `
      <li class="cart-line ${l.key === bumpKey ? 'bump' : ''}" data-index="${i}">
        <span class="cl-emoji n${Math.min([...l.emoji].length, 3)}">${l.emoji}</span>
        <span class="cl-main">
          <span class="cl-name">${l.name}</span>
          ${l.detail ? `<span class="cl-detail">${l.detail}</span>` : ''}
        </span>
        <span class="cl-price">${yen(l.price)}えん × ${l.qty}</span>
        <span class="cl-qty">
          <button class="btn qty" data-op="minus" aria-label="へらす">−</button>
          <b>${l.qty}</b>
          <button class="btn qty" data-op="plus" aria-label="ふやす">＋</button>
        </span>
      </li>`).join('');
    const bumped = cart.querySelector('.bump');
    bumped?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  const total = cartTotal();
  const totalEl = $('#cart-total');
  totalEl.textContent = yen(total);
  totalEl.classList.remove('pulse'); void totalEl.offsetWidth; totalEl.classList.add('pulse');
  $('#btn-checkout').disabled = state.cart.length === 0;
}

function changeQty(index, delta) {
  const line = state.cart[index];
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) {
    state.cart.splice(index, 1);
    sfx.pop();
    speak(`${line.speech || line.name}、とりけし`);
  } else if (delta > 0) {
    sfx.pi();
    speak(`${line.speech || line.name}、${countWord(line.qty)}！`);
  } else {
    sfx.pop();
    speak(`${line.speech || line.name}、${countWord(line.qty)}`);
  }
  renderCart(line.qty > 0 ? line.key : null);
}

// ---------- ポップアップ ----------
function openModal(html) {
  $('#modal-box').innerHTML = html;
  $('#modal').hidden = false;
  return $('#modal-box');
}
function closeModal() {
  $('#modal').hidden = true;
  $('#modal-box').innerHTML = '';
}

function confirmModal(message, onYes) {
  const box = openModal(`
    <p class="modal-title">${message}</p>
    <div class="modal-row">
      <button class="btn btn-sub" data-ans="no">いいえ</button>
      <button class="btn btn-main" data-ans="yes">はい</button>
    </div>`);
  box.onclick = e => {
    const b = e.target.closest('[data-ans]');
    if (!b) return;
    closeModal();
    if (b.dataset.ans === 'yes') onYes();
  };
}

// ドリンクの サイズを えらぶ
function chooseSize(item, onPick) {
  const sizes = Object.entries(item.sizes);
  const box = openModal(`
    <p class="modal-title">${item.emoji} ${item.name}<br><small>サイズは どれに しますか？</small></p>
    <div class="size-row">
      ${sizes.map(([s, p], i) => `
        <button class="btn size" data-size="${s}">
          <span class="size-cup" style="font-size:${48 + i * 22}px">${item.emoji}</span>
          <b>${s}</b><span>${yen(p)}えん</span>
        </button>`).join('')}
    </div>
    <button class="btn btn-sub modal-cancel">やめる</button>`);
  speak('サイズは どれに しますか？');
  box.onclick = e => {
    if (e.target.closest('.modal-cancel')) { sfx.tap(); closeModal(); return; }
    const b = e.target.closest('[data-size]');
    if (!b) return;
    const btnRect = b.getBoundingClientRect();
    closeModal();
    onPick(b.dataset.size, btnRect);
  };
}

// セットの ドリンクを えらぶ
function chooseSetDrink(burger, onPick) {
  const drinks = ITEMS.filter(i => i.cat === 'drink');
  const box = openModal(`
    <p class="modal-title">${burger.emoji}🍟 ${setName(burger)}<br>
      <small>ドリンクは どれに しますか？</small></p>
    <div class="size-row">
      ${drinks.map(d => `
        <button class="btn size" data-drink="${d.id}">
          <span class="size-cup" style="font-size:64px">${d.emoji}</span>
          <span>${d.name}</span>
        </button>`).join('')}
    </div>
    <button class="btn btn-sub modal-cancel">やめる</button>`);
  speak('ドリンクは どれに しますか？');
  box.onclick = e => {
    if (e.target.closest('.modal-cancel')) { sfx.tap(); closeModal(); return; }
    const b = e.target.closest('[data-drink]');
    if (!b) return;
    const rect = b.getBoundingClientRect();
    closeModal();
    onPick(byId[b.dataset.drink], rect);
  };
}

function onItemTap(btn) {
  const { action, id } = btn.dataset;
  const item = byId[id];
  if (action === 'add') {
    addLine({ key: id, name: item.name, emoji: item.emoji, price: item.price }, btn);
  } else if (action === 'size') {
    sfx.tap();
    chooseSize(item, (size, rect) => {
      addLine({
        key: `${id}-${size}`, name: `${item.name} ${size}`, emoji: item.emoji,
        price: item.sizes[size], speech: `${item.name} ${SIZE_NAME[size]}サイズ`,
      }, rect);
    });
  } else if (action === 'set') {
    sfx.tap();
    chooseSetDrink(item, (drink, rect) => {
      const name = setName(item);
      addLine({
        key: `set-${id}-${drink.id}`, name, emoji: `${item.emoji}🍟`,
        detail: `${byId[SET.sideId].name}・${drink.name} ${SET.drinkSize}`,
        price: setPrice(item), speech: `${name}、ドリンクは ${drink.name}`,
      }, rect);
    });
  }
}

// ---------- アニメーション ----------
function flyEmoji(emoji, from) {
  const src = from instanceof Element ? from.getBoundingClientRect() : from;
  const dst = $('#cart').getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'flyer';
  el.textContent = emoji;
  const x0 = src.left + src.width / 2, y0 = src.top + src.height / 2;
  const x1 = dst.left + dst.width / 2, y1 = dst.top + Math.min(dst.height - 40, 120);
  el.style.left = `${x0}px`;
  el.style.top = `${y0}px`;
  $('#fx-layer').appendChild(el);
  const anim = el.animate([
    { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', opacity: 1 },
    { transform: `translate(calc(-50% + ${(x1 - x0) / 2}px), calc(-50% + ${(y1 - y0) / 2 - 120}px)) scale(1.4) rotate(180deg)`, opacity: 1 },
    { transform: `translate(calc(-50% + ${x1 - x0}px), calc(-50% + ${y1 - y0}px)) scale(0.4) rotate(360deg)`, opacity: 0.2 },
  ], { duration: 650, easing: 'ease-in-out' });
  anim.onfinish = () => el.remove();
}

function confetti() {
  const layer = $('#fx-layer');
  const colors = ['#e63b2e', '#ffc93c', '#2fa4e7', '#3cb371', '#e85a9b', '#ff8a3d'];
  const pieces = ['🍔', '🍟', '⭐', '🎉'];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('div');
    const isEmoji = i % 9 === 0;
    p.className = isEmoji ? 'confetti emoji' : 'confetti';
    if (isEmoji) p.textContent = pieces[i % pieces.length];
    else p.style.background = colors[i % colors.length];
    p.style.left = `${Math.random() * 100}vw`;
    const drift = (Math.random() - 0.5) * 300;
    const dur = 1800 + Math.random() * 1600;
    layer.appendChild(p);
    p.animate([
      { transform: 'translate(0,-10vh) rotate(0deg)' },
      { transform: `translate(${drift}px,110vh) rotate(${Math.random() * 1080}deg)` },
    ], { duration: dur, delay: Math.random() * 400, easing: 'cubic-bezier(.3,.6,.6,1)', fill: 'backwards' })
      .onfinish = () => p.remove();
  }
}

// ---------- おかいけい ----------
function moneyHTML(v, extra = '') {
  return `<span class="money m${v} ${extra}" data-v="${v}">${yen(v)}</span>`;
}

function breakdown(amount) {
  const result = [];
  for (const v of MONEY) {
    while (amount >= v) { result.push(v); amount -= v; }
  }
  return result;
}

function goCheckout() {
  state.received = [];
  show('checkout');
  $('#pay-total').textContent = yen(cartTotal());
  renderEat();
  renderPay();
  sfx.tap();
  speak(`ごうけい ${cartTotal()}円 です`);
}

function renderEat() {
  $$('#eat-toggle .eat').forEach(b => b.classList.toggle('active', b.dataset.eat === state.eat));
}

function renderPay(lastAdded) {
  const total = cartTotal();
  const sum = receivedSum();
  $('#recv-sum').textContent = yen(sum);
  $('#money-tray').innerHTML = state.received.length
    ? state.received.map((v, i) => moneyHTML(v, i === state.received.length - 1 && lastAdded ? 'drop' : '')).join('')
    : '<span class="tray-empty">ここに おかねが ならぶよ</span>';

  const status = $('#pay-status');
  const coins = $('#change-coins');
  if (sum < total) {
    status.className = 'pay-status short';
    status.innerHTML = sum === 0 ? 'おかねを もらってね' : `あと <b>${yen(total - sum)}</b> えん`;
    coins.innerHTML = '';
    $('#btn-complete').disabled = true;
  } else if (sum === total) {
    status.className = 'pay-status just';
    status.innerHTML = '🎯 ぴったり！ おつりは なし';
    coins.innerHTML = '';
    $('#btn-complete').disabled = false;
  } else {
    const change = sum - total;
    status.className = 'pay-status change';
    status.innerHTML = `おつり <b>${yen(change)}</b> えん`;
    coins.innerHTML = `<span class="change-label">おきゃくさまに かえす おかね：</span>` +
      breakdown(change).map(v => moneyHTML(v)).join('');
    $('#btn-complete').disabled = false;
  }
  $('#btn-undo-money').disabled = state.received.length === 0;
}

function speakPay() {
  const total = cartTotal();
  const sum = receivedSum();
  if (sum < total) speak(`${yen(sum)}円 おあずかり。あと ${total - sum}円`);
  else if (sum === total) speak('ぴったり です！');
  else speak(`${sum}円 おあずかり。おつりは ${sum - total}円 です`);
}

function addMoney(v) {
  state.received.push(v);
  v >= 1000 ? sfx.bill() : sfx.coin();
  renderPay(true);
  speakPay();
}

function undoMoney(index = state.received.length - 1) {
  if (index < 0) return;
  state.received.splice(index, 1);
  sfx.pop();
  renderPay();
  speakPay();
}

function completeOrder() {
  const total = cartTotal();
  const sum = receivedSum();
  if (sum < total) { sfx.boo(); return; }
  state.lastOrder = {
    no: state.orderNo,
    date: new Date(),
    lines: state.cart.map(l => ({ ...l })),
    total, received: sum, change: sum - total, eat: state.eat,
  };
  state.orderNo += 1;
  saveOrderNo();
  showReceipt();
}

// ---------- レシート ----------
function showReceipt() {
  const o = state.lastOrder;
  const d = o.date;
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  $('#paper').innerHTML = `
    <div class="rc-shop">🍔 ${SHOP.name}</div>
    <div class="rc-sub">${SHOP.catchCopy}</div>
    <div class="rc-meta"><span>${dateStr}</span><span>${o.eat === 'in' ? 'おみせで たべる' : 'おもちかえり'}</span></div>
    <div class="rc-no">ちゅうもん ばんごう <b>${o.no}</b></div>
    <hr>
    ${o.lines.map(l => `
      <div class="rc-line">
        <span>${l.emoji} ${l.name}${l.qty > 1 ? ` ×${l.qty}` : ''}${l.detail ? `<small>${l.detail}</small>` : ''}</span>
        <span>${yen(l.price * l.qty)}えん</span>
      </div>`).join('')}
    <hr>
    <div class="rc-line big"><span>ごうけい</span><span>${yen(o.total)}えん</span></div>
    <div class="rc-line"><span>おあずかり</span><span>${yen(o.received)}えん</span></div>
    <div class="rc-line"><span>おつり</span><span>${yen(o.change)}えん</span></div>
    <hr>
    <div class="rc-thanks">ありがとうございました！<br>また きてね 😊</div>
    <div class="rc-barcode"></div>`;
  $('#rc-no').textContent = o.no;
  show('receipt');
  const paper = $('#paper');
  paper.classList.remove('print'); void paper.offsetWidth; paper.classList.add('print');
  sfx.chin();
  setTimeout(() => sfx.fanfare(), 700);
  confetti();
  speak(`ありがとうございました！ ${o.no}ばんで おまちください。`);
}

function nextCustomer() {
  state.cart = [];
  state.received = [];
  state.eat = 'in';
  state.cat = CATEGORIES[0].id;
  renderTabs();
  renderItems();
  renderCart();
  show('register');
  sfx.tap();
  speak('いらっしゃいませ！');
}

// ---------- せってい（ながおしで ひらく） ----------
function openSettings() {
  const box = openModal(`
    <p class="modal-title">⚙️ せってい <small>(おとなの かた むけ)</small></p>
    <div class="setting-list">
      <label class="setting"><input type="checkbox" id="set-sound" ${settings.sound ? 'checked' : ''}> こうかおん（ピッ・チーン）</label>
      <label class="setting"><input type="checkbox" id="set-voice" ${settings.voice ? 'checked' : ''}> よみあげ（こえ）</label>
      <div class="setting">つぎの ちゅうもん ばんごう： <b id="set-no">${state.orderNo}</b>
        <button class="btn btn-sub small" id="set-reset">1に もどす</button></div>
    </div>
    <button class="btn btn-main modal-cancel">とじる</button>`);
  box.onclick = e => {
    if (e.target.id === 'set-reset') {
      state.orderNo = 1; saveOrderNo();
      $('#set-no').textContent = 1;
      $('#header-no').textContent = 1;
    }
    if (e.target.closest('.modal-cancel')) closeModal();
  };
  box.onchange = e => {
    if (e.target.id === 'set-sound') settings.sound = e.target.checked;
    if (e.target.id === 'set-voice') settings.voice = e.target.checked;
    saveSettings();
  };
}

function setupLongPress(el, ms, fn) {
  let timer = null;
  const start = e => {
    e.preventDefault();
    el.classList.add('pressing');
    timer = setTimeout(() => { el.classList.remove('pressing'); fn(); }, ms);
  };
  const cancel = () => { clearTimeout(timer); el.classList.remove('pressing'); };
  el.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => el.addEventListener(t, cancel));
  el.addEventListener('contextmenu', e => e.preventDefault());
}

// ---------- イベント ----------
function init() {
  $$('[data-shop-name]').forEach(el => { el.textContent = SHOP.name; });
  $$('[data-shop-catch]').forEach(el => { el.textContent = SHOP.catchCopy; });
  document.title = `${SHOP.name} レジ`;

  renderTabs();
  renderItems();
  renderCart();
  $('#money-buttons').innerHTML = MONEY.map(v => `
    <button class="btn money-btn" data-money="${v}">${moneyHTML(v)}<span class="money-cap">${yen(v)}えん</span></button>`).join('');

  $('#btn-open').addEventListener('click', () => {
    unlockAudio();
    show('register');
    sfx.chin();
    speak(`${SHOP.yomi}、かいてん です！ いらっしゃいませ！`);
  });

  $('#header').addEventListener('click', e => {
    const p = e.target.closest('[data-say]');
    if (p) { sfx.tap(); speak(p.dataset.say); }
  });
  setupLongPress($('#btn-gear'), 800, openSettings);

  $('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b || b.dataset.cat === state.cat) return;
    state.cat = b.dataset.cat;
    sfx.tap();
    renderTabs();
    renderItems();
  });

  $('#items').addEventListener('click', e => {
    const b = e.target.closest('.item');
    if (b) onItemTap(b);
  });

  $('#cart').addEventListener('click', e => {
    const b = e.target.closest('[data-op]');
    if (!b) return;
    const index = Number(b.closest('[data-index]').dataset.index);
    changeQty(index, b.dataset.op === 'plus' ? 1 : -1);
  });

  $('#btn-clear').addEventListener('click', () => {
    if (state.cart.length === 0) return;
    sfx.tap();
    confirmModal('ちゅうもんを ぜんぶ けしますか？', () => {
      state.cart = [];
      sfx.pop();
      renderCart();
      speak('ちゅうもんを けしました');
    });
  });

  $('#btn-checkout').addEventListener('click', () => {
    if (state.cart.length) goCheckout();
  });

  $('#btn-back').addEventListener('click', () => {
    sfx.tap();
    state.received = [];
    show('register');
  });

  $('#eat-toggle').addEventListener('click', e => {
    const b = e.target.closest('[data-eat]');
    if (!b) return;
    state.eat = b.dataset.eat;
    sfx.tap();
    renderEat();
    speak(state.eat === 'in' ? 'おみせで おめしあがりですね' : 'おもちかえりですね');
  });

  $('#money-buttons').addEventListener('click', e => {
    const b = e.target.closest('[data-money]');
    if (b) addMoney(Number(b.dataset.money));
  });
  $('#money-tray').addEventListener('click', e => {
    const m = e.target.closest('.money');
    if (!m) return;
    undoMoney([...m.parentNode.children].indexOf(m));
  });
  $('#btn-undo-money').addEventListener('click', () => undoMoney());
  $('#btn-complete').addEventListener('click', completeOrder);
  $('#btn-next').addEventListener('click', nextCustomer);

  $('#modal').addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });

  // ピンチでの拡大を防ぐ（iPad Safari。ダブルタップは CSS の touch-action で防止）
  document.addEventListener('gesturestart', e => e.preventDefault());

  show('start');
}

init();

// テスト用に 一部を 公開
window.__isshin = { state, breakdown, cartTotal, receivedSum };
