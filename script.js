// ================= Config da loja (edite aqui) =================
const LOJA = {
  CHAT_API: 'https://bnx-sensi-server.onrender.com', // backend do chat na nuvem
  PIX_KEY: '70209387602',
  PIX_NAME: 'LUENDERSON BERNARDO ROBERTO BARBOSA',
  PIX_CITY: 'URUCANIA'
};

let cart = [];

function money(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------- Pix BR Code (EMV) ----------
function tlv(id, value) {
  return id + String(value.length).padStart(2, '0') + value;
}
function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
function sanitizePix(str, max) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().substring(0, max);
}
function buildPixPayload(key, name, city, amount) {
  const gui = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', key);
  let p = tlv('00', '01')
    + tlv('26', gui)
    + tlv('52', '0000')
    + tlv('53', '986')
    + tlv('54', amount.toFixed(2))
    + tlv('58', 'BR')
    + tlv('59', sanitizePix(name, 25))
    + tlv('60', sanitizePix(city, 15))
    + tlv('62', tlv('05', '***'))
    + '6304';
  return p + crc16(p);
}

// ---------- Carrinho ----------
function addToCart(name, price) {
  cart.push({ name, price });
  renderCart();
  document.getElementById('cart').classList.add('open');
  document.getElementById('overlay').classList.add('show');
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  const items = document.getElementById('cartItems');
  const count = document.getElementById('cartCount');
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  count.textContent = cart.length;
  document.getElementById('cartTotal').textContent = money(total);

  if (!cart.length) {
    items.innerHTML = '<p class="empty">Seu carrinho está vazio.</p>';
    return;
  }

  items.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
      <div><strong>${item.name}</strong><br><small>${money(item.price)}</small></div>
      <button class="remove" onclick="removeFromCart(${i})">Remover</button>
    </div>
  `).join('');
}

function toggleCart() {
  document.getElementById('cart').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}

function closeCart() {
  document.getElementById('cart').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// ---------- Checkout / pagamento ----------
function checkout() {
  if (!cart.length) {
    alert('Adicione um produto ao carrinho primeiro.');
    return;
  }
  closeCart();
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const payload = buildPixPayload(LOJA.PIX_KEY, LOJA.PIX_NAME, LOJA.PIX_CITY, total);
  const qr = qrcode(0, 'M');
  qr.addData(payload);
  qr.make();

  const savedName = localStorage.getItem('bnx_name') || '';
  const modal = document.createElement('div');
  modal.className = 'pix-modal';
  modal.id = 'payModal';
  modal.innerHTML = `
    <div class="pix-box">
      <button class="pix-close" onclick="document.getElementById('payModal').remove()">×</button>
      <span>PIX</span>
      <h2>Finalize seu pagamento</h2>
      <p>Total: <strong>${money(total)}</strong></p>
      <p class="pix-receiver">Recebedor: <strong>${LOJA.PIX_NAME}</strong></p>
      <div class="qr-wrap">${qr.createImgTag(5, 0)}</div>
      <p class="pix-label">Pix Copia e Cola</p>
      <textarea id="pixCode" readonly>${payload}</textarea>
      <button class="copy-pix" onclick="copyPix(this)">Copiar código</button>
      <input id="buyerName" class="buyer-name" placeholder="Seu nome ou apelido" value="${savedName}">
      <button class="paid-btn" onclick="confirmPayment()">Já fiz o pagamento ✓</button>
    </div>`;
  document.body.appendChild(modal);
}

function copyPix(btn) {
  const ta = document.getElementById('pixCode');
  const done = () => { btn.textContent = 'Copiado!'; };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ta.value).then(done).catch(() => { ta.select(); document.execCommand('copy'); done(); });
  } else {
    ta.select();
    document.execCommand('copy');
    done();
  }
}

function localOrderCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'BNX-' + s;
}

async function confirmPayment() {
  const nameInput = document.getElementById('buyerName');
  const name = (nameInput.value || '').trim();
  if (!name) {
    alert('Digite seu nome para continuar.');
    nameInput.focus();
    return;
  }
  localStorage.setItem('bnx_name', name);
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const items = cart.map(i => ({ name: i.name, price: i.price }));

  let conv = { id: null, code: localOrderCode() };
  try {
    const r = await fetch(LOJA.CHAT_API + '/api/chat/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerName: name, items, total })
    });
    if (r.ok) conv = await r.json();
  } catch (e) { /* sem backend: segue com código local */ }
  localStorage.setItem('bnx_conv', JSON.stringify(conv));

  const modal = document.getElementById('payModal');
  modal.innerHTML = `
    <div class="pix-box confirm-box">
      <div class="confirm-check">✓</div>
      <h2>Pagamento confirmado!</h2>
      <p>Pedido <strong>${conv.code}</strong> registrado com sucesso.</p>
      <div class="order-summary">
        ${items.map(i => `<div><span>${i.name}</span><span>${money(i.price)}</span></div>`).join('')}
        <div class="order-total"><span>Total</span><span>${money(total)}</span></div>
      </div>
      <p class="muted-sm">Fale com o vendedor no chat para receber seu produto.</p>
      <button class="copy-pix" onclick="document.getElementById('payModal').remove(); openChat();">Abrir chat com o vendedor 💬</button>
    </div>`;

  cart = [];
  renderCart();
  setTimeout(openChat, 1200);
}

// ---------- Chat ----------
let chatTimer = null;
let lastMsgId = 0;

function getConv() {
  try { return JSON.parse(localStorage.getItem('bnx_conv') || 'null'); } catch (e) { return null; }
}

function ensureChatUI() {
  if (document.getElementById('chatDrawer')) return;
  const fab = document.createElement('div');
  fab.id = 'chatFab';
  fab.className = 'chat-fab';
  fab.textContent = '💬';
  fab.onclick = toggleChat;
  const drawer = document.createElement('aside');
  drawer.id = 'chatDrawer';
  drawer.className = 'chat-drawer';
  drawer.innerHTML = `
    <div class="chat-head">
      <div><h2>Chat da loja</h2><small id="chatOrder"></small></div>
      <button onclick="toggleChat()">×</button>
    </div>
    <div id="chatMsgs" class="chat-msgs"></div>
    <div class="chat-input">
      <input id="chatText" placeholder="Digite sua mensagem..." autocomplete="off">
      <button onclick="sendChat()">➤</button>
    </div>`;
  document.body.appendChild(fab);
  document.body.appendChild(drawer);
  document.getElementById('chatText').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendChat();
  });
}

function toggleChat() {
  ensureChatUI();
  const d = document.getElementById('chatDrawer');
  d.classList.toggle('open');
  if (d.classList.contains('open')) {
    lastMsgId = 0;
    document.getElementById('chatMsgs').innerHTML = '';
    loadChat();
    chatTimer = setInterval(loadChat, 3000);
  } else if (chatTimer) {
    clearInterval(chatTimer);
    chatTimer = null;
  }
}

function openChat() {
  ensureChatUI();
  const d = document.getElementById('chatDrawer');
  if (!d.classList.contains('open')) toggleChat();
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function loadChat() {
  const conv = getConv();
  const box = document.getElementById('chatMsgs');
  if (!conv || !conv.id) {
    box.innerHTML = '<p class="empty">Finalize uma compra para conversar com o vendedor.</p>';
    return;
  }
  document.getElementById('chatOrder').textContent = 'Pedido ' + conv.code;
  try {
    const r = await fetch(`${LOJA.CHAT_API}/api/chat/${conv.id}/messages?code=${encodeURIComponent(conv.code)}&since=${lastMsgId}`);
    if (!r.ok) return;
    const msgs = await r.json();
    for (const m of msgs) {
      lastMsgId = Math.max(lastMsgId, m.id);
      const div = document.createElement('div');
      div.className = 'msg ' + (m.sender === 'client' ? 'mine' : 'theirs');
      div.innerHTML = `<span>${esc(m.text)}</span>`;
      box.appendChild(div);
    }
    if (msgs.length) box.scrollTop = box.scrollHeight;
  } catch (e) { /* backend fora: tenta de novo no próximo ciclo */ }
}

async function sendChat() {
  const conv = getConv();
  const input = document.getElementById('chatText');
  const text = (input.value || '').trim();
  if (!text) return;
  if (!conv || !conv.id) {
    alert('Finalize uma compra para conversar com o vendedor.');
    return;
  }
  input.value = '';
  try {
    await fetch(`${LOJA.CHAT_API}/api/chat/${conv.id}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: conv.code, text })
    });
    loadChat();
  } catch (e) {
    alert('Não foi possível enviar. Tente novamente.');
  }
}

ensureChatUI();
