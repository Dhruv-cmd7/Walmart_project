// Cart utility functions using localStorage
const CART_KEY = 'walmart_cart';
const SAVED_KEY = 'walmart_saved';
const COUPON_KEY = 'walmart_coupon';
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