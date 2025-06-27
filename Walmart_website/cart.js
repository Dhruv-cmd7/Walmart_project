// Cart utility functions using localStorage
const CART_KEY = 'walmart_cart';
const SAVED_KEY = 'walmart_saved';
const COUPON_KEY = 'walmart_coupon';
const SAVED_ORDERS_KEY = 'walmart_saved_orders';
let lastRemoved = null;
let undoTimeout = null;

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getSaved() {
  return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
}

function saveSaved(saved) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
}

function getSavedOrders() {
  return JSON.parse(localStorage.getItem(SAVED_ORDERS_KEY) || '[]');
}

function saveSavedOrders(orders) {
  localStorage.setItem(SAVED_ORDERS_KEY, JSON.stringify(orders));
}

function addToCart(product) {
  const cart = getCart();
  const idx = cart.findIndex(item => item.id === product.id);
  const price = Number(product.price);
  if (idx > -1) {
    cart[idx].qty += 1;
  } else {
    cart.push({...product, price, qty: 1});
  }
  saveCart(cart);
  updateCartBadge();
}

function removeFromCart(productId) {
  let cart = getCart();
  const idx = cart.findIndex(item => item.id === productId);
  if (idx > -1) {
    lastRemoved = cart[idx];
    cart.splice(idx, 1);
    saveCart(cart);
    updateCartBadge();
    if (undoTimeout) clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => { lastRemoved = null; }, 5000);
  }
}

function updateCartQty(productId, qty) {
  qty = Number(qty);
  const cart = getCart();
  const idx = cart.findIndex(item => item.id === productId);
  if (idx > -1) {
    cart[idx].qty = qty;
    if (cart[idx].qty < 1) cart.splice(idx, 1);
    saveCart(cart);
    updateCartBadge();
  }
}

function updateCartBadge() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = count;
  });
}

function saveForLater(productId) {
  let cart = getCart();
  let saved = getSaved();
  const idx = cart.findIndex(item => item.id === productId);
  if (idx > -1) {
    saved.push(cart[idx]);
    cart.splice(idx, 1);
    saveCart(cart);
    saveSaved(saved);
    updateCartBadge();
  }
}

function moveToCart(productId) {
  let cart = getCart();
  let saved = getSaved();
  const idx = saved.findIndex(item => item.id === productId);
  if (idx > -1) {
    cart.push(saved[idx]);
    saved.splice(idx, 1);
    saveCart(cart);
    saveSaved(saved);
    updateCartBadge();
  }
}

function applyCoupon(code) {
  code = code.trim().toUpperCase();
  if (code === 'SAVE10') {
    localStorage.setItem(COUPON_KEY, JSON.stringify({ code, discount: 0.10 }));
    return { success: true, discount: 0.10 };
  }
  return { success: false };
}

function removeCoupon() {
  localStorage.removeItem(COUPON_KEY);
}

function getCoupon() {
  return JSON.parse(localStorage.getItem(COUPON_KEY) || 'null');
}

function undoRemove() {
  if (lastRemoved) {
    const cart = getCart();
    cart.push(lastRemoved);
    saveCart(cart);
    updateCartBadge();
    lastRemoved = null;
    if (undoTimeout) clearTimeout(undoTimeout);
  }
}

function clearUndo() {
  lastRemoved = null;
  if (undoTimeout) clearTimeout(undoTimeout);
}

function saveCurrentOrder() {
  const cart = getCart();
  if (!cart.length) return false;
  const now = new Date();
  const order = {
    id: 'order_' + now.getTime(),
    name: `Order on ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    date: now.toISOString(),
    items: cart,
    summary: {
      count: cart.reduce((sum, item) => sum + item.qty, 0),
      total: cart.reduce((sum, item) => sum + item.price * item.qty, 0)
    }
  };
  const orders = getSavedOrders();
  orders.unshift(order);
  saveSavedOrders(orders);
  return order;
}

function renderSavedOrders() {
  const orders = getSavedOrders();
  const list = document.getElementById('saved-orders-list');
  if (!orders.length) {
    list.innerHTML = '<div style="color:#888;font-size:1.08rem;">No saved orders yet.</div>';
    return;
  }
  list.innerHTML = orders.map(order => `
    <div class='saved-order-card' style='border:1.5px solid #e5e5e5;border-radius:1.1rem;padding:1.1rem 1.2rem;margin-bottom:1.2rem;box-shadow:0 2px 8px rgba(0,83,226,0.04);'>
      <div style='font-weight:600;font-size:1.08rem;color:#0053e2;'>${order.name}</div>
      <div style='color:#666;font-size:0.98rem;margin:0.2rem 0 0.7rem 0;'>${new Date(order.date).toLocaleString()}</div>
      <div style='font-size:0.97rem;margin-bottom:0.7rem;'>Items: <b>${order.summary.count}</b> &nbsp;|&nbsp; Total: <b>$${order.summary.total.toFixed(2)}</b></div>
      <button class='restore-order-btn' data-order-id='${order.id}' style='background:#0053e2;color:#fff;border:none;padding:0.5rem 1.2rem;border-radius:1.2rem;font-size:1rem;cursor:pointer;margin-right:0.7rem;'>Restore</button>
      <button class='delete-order-btn' data-order-id='${order.id}' style='background:#fff;color:#e00;border:1.2px solid #e00;padding:0.5rem 1.2rem;border-radius:1.2rem;font-size:1rem;cursor:pointer;'>Delete</button>
    </div>
  `).join('');
  // Attach event listeners
  list.querySelectorAll('.restore-order-btn').forEach(btn => {
    btn.onclick = function() {
      const id = this.getAttribute('data-order-id');
      const order = orders.find(o => o.id === id);
      if (order) {
        saveCart(order.items);
        updateCartBadge();
        showSnackbar('Order restored to cart!');
        document.getElementById('saved-orders-modal').style.display = 'none';
        if (typeof renderCart === 'function') renderCart();
      }
    };
  });
  list.querySelectorAll('.delete-order-btn').forEach(btn => {
    btn.onclick = function() {
      const id = this.getAttribute('data-order-id');
      const idx = orders.findIndex(o => o.id === id);
      if (idx > -1) {
        orders.splice(idx, 1);
        saveSavedOrders(orders);
        renderSavedOrders();
        showSnackbar('Saved order deleted.');
      }
    };
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Save Order button
  const saveOrderBtn = document.getElementById('save-order-btn');
  if (saveOrderBtn) {
    saveOrderBtn.onclick = function() {
      const order = saveCurrentOrder();
      if (order) {
        showSnackbar('Order saved for future!','View',()=>{
          document.getElementById('saved-orders-modal').style.display = 'flex';
          renderSavedOrders();
        });
      } else {
        showSnackbar('Cart is empty. Nothing to save.');
      }
    };
  }
  // View Saved Orders button
  const viewSavedOrdersBtn = document.getElementById('view-saved-orders-btn');
  if (viewSavedOrdersBtn) {
    viewSavedOrdersBtn.onclick = function() {
      document.getElementById('saved-orders-modal').style.display = 'flex';
      renderSavedOrders();
    };
  }
  // Close modal
  const closeSavedOrdersBtn = document.getElementById('close-saved-orders');
  if (closeSavedOrdersBtn) {
    closeSavedOrdersBtn.onclick = function() {
      document.getElementById('saved-orders-modal').style.display = 'none';
    };
  }
  // Hide modal on outside click
  const modal = document.getElementById('saved-orders-modal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.style.display = 'none';
    });
  }
});

// Expose globally for inline event handlers
window.cartUtils = {
  getCart,
  saveCart,
  addToCart,
  removeFromCart,
  updateCartQty,
  updateCartBadge,
  getSaved,
  saveForLater,
  moveToCart,
  applyCoupon,
  removeCoupon,
  getCoupon,
  undoRemove,
  clearUndo
};

document.addEventListener('DOMContentLoaded', updateCartBadge);

// --- Modern Cart UI Rendering ---
function renderCart() {
  const cart = getCart();
  const cartItemsDiv = document.getElementById('cart-items');
  const badge = document.getElementById('cart-badge');
  let subtotal = 0;

  if (!cartItemsDiv) return;

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = `<div class="futuristic-card flex flex-col items-center justify-center p-10 text-center">
      <svg fill='none' viewBox='0 0 48 48' width='64' height='64'><circle cx='24' cy='24' r='22' stroke='#e5e7eb' stroke-width='4'/><path d='M16 20h16l-2 10H18l-2-10z' fill='#e5e7eb'/><circle cx='20' cy='36' r='2' fill='#d1d5db'/><circle cx='28' cy='36' r='2' fill='#d1d5db'/></svg>
      <div class='text-xl font-semibold mt-4 mb-2 text-[var(--text-primary)]'>Your cart is empty.</div>
      <a href='index.html' class='checkout-button mt-4' style='max-width:200px;'>Shop Now</a>
    </div>`;
    document.getElementById('order-subtotal').textContent = '$0.00';
    document.getElementById('order-taxes').textContent = '$0.00';
    document.getElementById('order-total').textContent = '$0.00';
    if (badge) badge.textContent = 0;
    return;
  }

  cartItemsDiv.innerHTML = cart.map(item => `
    <div class="futuristic-card flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5" data-id="${item.id}">
      <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-20 sm:size-24 shrink-0 border border-[var(--border-color)]" style="background-image: url('${item.img}');"></div>
      <div class="flex-grow">
        <p class="text-[var(--text-primary)] text-lg font-semibold leading-normal line-clamp-1">${item.name}</p>
        <p class="text-[var(--text-secondary)] text-sm font-normal leading-normal line-clamp-2">${item.details || ''}</p>
        <p class="text-[var(--text-primary)] text-base font-medium mt-1 sm:hidden">$${Number(item.price).toFixed(2)}</p>
      </div>
      <div class="quantity-control flex items-center gap-2 text-[var(--text-primary)] shrink-0 mt-2 sm:mt-0">
        <button class="decrease-qty text-lg font-medium flex h-8 w-8 items-center justify-center rounded-full border bg-gray-50 cursor-pointer">-</button>
        <input aria-label="Quantity" class="qty-input text-base font-medium w-10 p-0 text-center bg-transparent focus:outline-0 focus:ring-0 border-none [appearance:textfield]" type="number" min="1" value="${item.qty}" />
        <button class="increase-qty text-lg font-medium flex h-8 w-8 items-center justify-center rounded-full border bg-gray-50 cursor-pointer">+</button>
      </div>
      <p class="text-[var(--text-primary)] text-base font-semibold ml-auto sm:ml-4 shrink-0 hidden sm:block">$${(item.price * item.qty).toFixed(2)}</p>
      <button aria-label="Remove item" class="remove-item-button ml-auto sm:ml-2 shrink-0 remove-item">
        <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
      </button>
    </div>
  `).join('');

  // Attach event listeners for quantity and remove
  cartItemsDiv.querySelectorAll('.futuristic-card').forEach(card => {
    const id = card.getAttribute('data-id');
    const decreaseBtn = card.querySelector('.decrease-qty');
    const increaseBtn = card.querySelector('.increase-qty');
    const qtyInput = card.querySelector('.qty-input');
    const removeBtn = card.querySelector('.remove-item');

    decreaseBtn.onclick = () => {
      let qty = Number(qtyInput.value);
      if (qty > 1) {
        window.cartUtils.updateCartQty(id, qty - 1);
        renderCart();
      }
    };
    increaseBtn.onclick = () => {
      let qty = Number(qtyInput.value);
      window.cartUtils.updateCartQty(id, qty + 1);
      renderCart();
    };
    qtyInput.onchange = () => {
      let qty = Math.max(1, Number(qtyInput.value));
      window.cartUtils.updateCartQty(id, qty);
      renderCart();
    };
    removeBtn.onclick = () => {
      window.cartUtils.removeFromCart(id);
      renderCart();
    };
  });

  // Update order summary
  subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxes = subtotal * 0.08; // 8% tax
  const total = subtotal + taxes;
  document.getElementById('order-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('order-taxes').textContent = `$${taxes.toFixed(2)}`;
  document.getElementById('order-total').textContent = `$${total.toFixed(2)}`;
  if (badge) badge.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

document.addEventListener('DOMContentLoaded', function() {
  updateCartBadge();
  renderCart();
}); 