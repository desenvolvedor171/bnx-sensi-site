let cart = [];

function money(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function addToCart(name, price) {
  cart.push({name, price});
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

function checkout() {
  if (!cart.length) {
    alert('Adicione um produto ao carrinho primeiro.');
    return;
  }
  const pix = '00020126330014BR.GOV.BCB.PIX0111702093876025204000053039865802BR5935LUENDERSON BERNARDO ROBERTO BARBOSA6008URUCANIA62070503***63043DB5';
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const modal = document.createElement('div');
  modal.className = 'pix-modal';
  modal.innerHTML = `
    <div class="pix-box">
      <button class="pix-close" onclick="this.closest('.pix-modal').remove()">×</button>
      <span>PIX</span>
      <h2>Finalize seu pagamento</h2>
      <p>Total: <strong>${money(total)}</strong></p>
      <img src="assets/pix-bnx-sensi.png" alt="QR Code Pix">
      <p class="pix-label">Pix Copia e Cola</p>
      <textarea id="pixCode" readonly>${pix}</textarea>
      <button class="copy-pix" onclick="navigator.clipboard.writeText(document.getElementById('pixCode').value); this.textContent='Copiado!'">Copiar código</button>
      <small>Chave Pix: 702.093.876-02<br>Recebedor: LUENDERSON BERNARDO ROBERTO BARBOSA — URUCANIA</small>
    </div>`;
  document.body.appendChild(modal);
}
