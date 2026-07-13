/* ===== CARRITO DE COMPRAS — TercerEstrella ===== */
(function() {
  'use strict';

  var STORAGE_KEY = 'te_carrito';
  var DESCUENTOS = [
    { min: 6, pct: 15, label: '6+ prendas' },
    { min: 3, pct: 10, label: '3–5 prendas' },
    { min: 2, pct: 5,  label: '2 prendas' }
  ];

  // ===== CSS =====
  var css = document.createElement('style');
  css.textContent = `
    /* Cart icon in navbar */
    .cart-icon-btn{position:relative;background:none;border:none;cursor:pointer;padding:6px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.85);transition:color 200ms;}
    .cart-icon-btn:hover{color:#fff;}
    .cart-icon-btn svg{width:22px;height:22px;}
    .cart-badge{position:absolute;top:-2px;right:-4px;background:#C0A24A;color:#1A1A2E;font-family:'Oswald',sans-serif;font-size:10px;font-weight:700;min-width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;transition:transform 150ms;}
    .cart-badge.bump{animation:cart-bump 300ms ease;}
    .cart-badge:empty{display:none;}
    @keyframes cart-bump{0%{transform:scale(1)}50%{transform:scale(1.4)}100%{transform:scale(1)}}

    /* Discount banner — top strip above nav */
    .discount-banner{background:#C0A24A;color:#1A1A2E;text-align:center;padding:8px 40px 8px 16px;font-size:13px;font-weight:600;letter-spacing:0.04em;font-family:'Inter',sans-serif;position:fixed;top:0;left:0;right:0;z-index:1001;}
    .discount-banner span{color:#1A1A2E;font-weight:800;}
    .discount-banner-close{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(26,26,46,0.5);font-size:14px;cursor:pointer;padding:4px;line-height:1;}
    .discount-banner-close:hover{color:#1A1A2E;}
    .discount-banner ~ .nav{top:28px !important;}
    .discount-banner ~ .nav ~ .breadcrumb{padding-top:116px !important;}
    .discount-banner ~ .nav ~ .mobile-menu{top:28px !important;}

    /* Overlay */
    .cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:4999;opacity:0;pointer-events:none;transition:opacity 300ms;}
    .cart-overlay.open{opacity:1;pointer-events:auto;}

    /* Drawer */
    .cart-drawer{position:fixed;top:0;right:0;bottom:0;width:420px;max-width:92vw;background:#fff;z-index:5000;transform:translateX(100%);transition:transform 350ms cubic-bezier(0.16,1,0.3,1);display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(0,0,0,0.15);}
    .cart-drawer.open{transform:translateX(0);}

    .cart-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #eee;}
    .cart-header h3{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1A1A2E;display:flex;align-items:center;gap:8px;}
    .cart-header-count{background:#1A1A2E;color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;}
    .cart-close{background:none;border:none;font-size:22px;cursor:pointer;color:#999;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background 200ms;}
    .cart-close:hover{background:#f0f0f0;}

    /* Items */
    .cart-items{flex:1;overflow-y:auto;padding:16px 24px;}
    .cart-empty{text-align:center;padding:60px 20px;color:#999;}
    .cart-empty svg{width:48px;height:48px;color:#ddd;margin-bottom:12px;}
    .cart-empty p{font-size:14px;margin-bottom:4px;}
    .cart-empty small{font-size:12px;color:#bbb;}

    .cart-item{display:flex;gap:14px;padding:16px 0;border-bottom:1px solid #f5f5f5;position:relative;}
    .cart-item-img{width:72px;height:72px;border-radius:8px;overflow:hidden;background:#f5f5f5;flex-shrink:0;}
    .cart-item-img img{width:100%;height:100%;object-fit:contain;}
    .cart-item-info{flex:1;min-width:0;}
    .cart-item-name{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;color:#1A1A2E;margin-bottom:2px;}
    .cart-item-talle{font-size:12px;color:#888;margin-bottom:6px;}
    .cart-item-price{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#1A1A2E;}
    .cart-item-remove{position:absolute;top:16px;right:0;background:none;border:none;font-size:16px;cursor:pointer;color:#ccc;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:color 200ms,background 200ms;}
    .cart-item-remove:hover{color:#ef4444;background:#fef2f2;}

    /* Upsell */
    .cart-upsell{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;margin:12px 0;font-size:12px;color:#166534;font-weight:600;text-align:center;}
    .cart-upsell.gold{background:#fffbeb;border-color:#fde68a;color:#92400e;}

    /* Footer */
    .cart-footer{border-top:1px solid #eee;padding:20px 24px;background:#fafafa;}
    .cart-summary-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:13px;color:#666;}
    .cart-summary-row.discount{color:#15803d;font-weight:600;}
    .cart-summary-row.total{font-size:18px;font-weight:700;color:#1A1A2E;margin-bottom:16px;padding-top:10px;border-top:1px solid #eee;margin-top:8px;}
    .cart-summary-row.total span:last-child{font-family:'Oswald',sans-serif;font-size:22px;}
    .cart-btn-transf{width:100%;padding:14px;border:none;border-radius:10px;font-family:'Oswald',sans-serif;font-weight:700;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;margin-bottom:8px;background:#C0A24A;color:#1A1A2E;transition:background 180ms;}
    .cart-btn-transf:hover{background:#b09140;}
    .cart-btn-mp{width:100%;padding:14px;border:2px solid #ddd;border-radius:10px;font-family:'Oswald',sans-serif;font-weight:700;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;background:#fff;color:#1A1A2E;transition:background 180ms,border-color 180ms;}
    .cart-btn-mp:hover{background:#f9fafb;border-color:#bbb;}
    .cart-methods{font-size:11px;color:#999;text-align:center;margin-top:8px;}

    /* Cookie banner */
    .cookie-banner{position:fixed;bottom:0;left:0;right:0;background:#1A1A2E;color:rgba(255,255,255,0.85);padding:14px 24px;display:flex;align-items:center;justify-content:center;gap:16px;font-size:13px;z-index:5000;box-shadow:0 -2px 16px rgba(0,0,0,0.2);}
    .cookie-banner a{color:#C0A24A;text-decoration:underline;}
    .cookie-btn{background:#C0A24A;color:#1A1A2E;border:none;padding:8px 20px;border-radius:6px;font-family:'Oswald',sans-serif;font-weight:700;font-size:12px;letter-spacing:0.08em;cursor:pointer;white-space:nowrap;}
    @media(max-width:600px){.cookie-banner{flex-direction:column;text-align:center;gap:10px;padding:16px;}}

    /* Add-to-cart button on product pages */
    .btn-add-cart{width:100%;height:52px;border:2px solid #C0A24A;background:transparent;color:#C0A24A;font-family:'Oswald',sans-serif;font-weight:700;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;border-radius:10px;cursor:pointer;transition:background 180ms,color 180ms,transform 150ms;display:flex;align-items:center;justify-content:center;gap:10px;}
    .btn-add-cart:hover{background:#C0A24A;color:#1A1A2E;transform:scale(1.01);}
    .btn-add-cart svg{width:20px;height:20px;}

    /* Toast for "agregado" */
    .cart-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:#1A1A2E;color:#fff;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:600;z-index:6000;opacity:0;pointer-events:none;transition:opacity 300ms,transform 300ms;box-shadow:0 4px 20px rgba(0,0,0,0.2);}
    .cart-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
  `;
  document.head.appendChild(css);

  // ===== HELPERS =====
  function getCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch(_) { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }
  function getItemCount() {
    return getCart().length;
  }
  function getSubtotal() {
    return getCart().reduce(function(sum, item) { return sum + item.precio; }, 0);
  }
  function getDiscountInfo() {
    var count = getItemCount();
    for (var i = 0; i < DESCUENTOS.length; i++) {
      if (count >= DESCUENTOS[i].min) return DESCUENTOS[i];
    }
    return null;
  }
  function getTotal() {
    var sub = getSubtotal();
    var d = getDiscountInfo();
    return d ? Math.round(sub * (1 - d.pct / 100)) : sub;
  }
  function getMPTotal() {
    var cart = getCart();
    var sub = cart.reduce(function(sum, item) { return sum + (item.precioMP || item.precio); }, 0);
    var d = getDiscountInfo();
    return d ? Math.round(sub * (1 - d.pct / 100)) : sub;
  }
  function formatPrice(n) {
    return '$' + n.toLocaleString('es-AR');
  }

  // ===== PRODUCT DATA =====
  var PRODUCTOS = {
    'tailandesa-premium': { nombre: 'Tailandesa Premium', precio: 50000, precioMP: 55000, img: 'assets/tailandesa/01-frontal.webp' },
    'nacional-adulto':    { nombre: 'Nacional Adulto',    precio: 32000, precioMP: 35000, img: 'assets/nacional-adulto/01-detalle.webp' },
    'nacional-nino':      { nombre: 'Nacional Niño',      precio: 27000, precioMP: 30000, img: 'assets/nacional-nino/02-modelo-frente.webp' }
  };

  // Fix image paths if we're in a subpage
  function imgPath(rel) {
    if (window.location.pathname.indexOf('/') === window.location.pathname.lastIndexOf('/')) return rel;
    return rel;
  }

  // ===== PUBLIC API =====
  window.carrito = {
    add: function(productoId, talle) {
      var p = PRODUCTOS[productoId];
      if (!p) return;
      var cart = getCart();
      cart.push({ id: productoId, nombre: p.nombre, talle: talle, precio: p.precio, precioMP: p.precioMP, img: p.img });
      saveCart(cart);
      if (typeof gtag === 'function') gtag('event', 'add_to_cart', { currency: 'ARS', value: p.precio, items: [{ item_id: productoId, item_name: p.nombre, item_variant: talle, price: p.precio, quantity: 1 }] });
      updateBadge();
      renderDrawer();
      openDrawer();
      showToast(p.nombre + ' — Talle ' + talle);
    },
    remove: function(index) {
      var cart = getCart();
      cart.splice(index, 1);
      saveCart(cart);
      updateBadge();
      renderDrawer();
    },
    clear: function() {
      saveCart([]);
      updateBadge();
      renderDrawer();
    }
  };

  // ===== BADGE =====
  function updateBadge() {
    var badges = document.querySelectorAll('.cart-badge');
    var count = getItemCount();
    badges.forEach(function(b) {
      b.textContent = count > 0 ? count : '';
      if (count > 0) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    });
  }

  // ===== DRAWER =====
  function createDrawer() {
    // Overlay
    var overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    overlay.id = 'cart-overlay';
    overlay.onclick = closeDrawer;
    document.body.appendChild(overlay);

    // Drawer
    var drawer = document.createElement('div');
    drawer.className = 'cart-drawer';
    drawer.id = 'cart-drawer';
    drawer.innerHTML = '<div class="cart-header"><h3>Tu carrito <span class="cart-header-count" id="cart-header-count"></span></h3><button class="cart-close" onclick="document.getElementById(\'cart-overlay\').click()">✕</button></div><div class="cart-items" id="cart-items"></div><div class="cart-footer" id="cart-footer"></div>';
    document.body.appendChild(drawer);

    // Toast
    var toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.id = 'cart-toast';
    document.body.appendChild(toast);
  }

  function openDrawer() {
    document.getElementById('cart-overlay').classList.add('open');
    document.getElementById('cart-drawer').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    document.getElementById('cart-overlay').classList.remove('open');
    document.getElementById('cart-drawer').classList.remove('open');
    document.body.style.overflow = '';
  }
  window.abrirCarrito = openDrawer;
  window.cerrarCarrito = closeDrawer;

  function showToast(msg) {
    var t = document.getElementById('cart-toast');
    t.textContent = '✓ ' + msg + ' agregado';
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2500);
  }

  function renderDrawer() {
    var cart = getCart();
    var itemsEl = document.getElementById('cart-items');
    var footerEl = document.getElementById('cart-footer');
    var countEl = document.getElementById('cart-header-count');

    countEl.textContent = cart.length > 0 ? cart.length : '';

    if (cart.length === 0) {
      itemsEl.innerHTML = '<div class="cart-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg><p>Tu carrito está vacío</p><small>Agregá camisetas para comenzar</small></div>';
      footerEl.innerHTML = '';
      return;
    }

    // Items
    var html = '';
    cart.forEach(function(item, i) {
      html += '<div class="cart-item">' +
        '<div class="cart-item-img"><img src="' + item.img + '" alt="' + item.nombre + '"></div>' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + item.nombre + '</div>' +
          '<div class="cart-item-talle">Talle: ' + item.talle + '</div>' +
          '<div class="cart-item-price">' + formatPrice(item.precio) + '</div>' +
        '</div>' +
        '<button class="cart-item-remove" onclick="carrito.remove(' + i + ')" title="Quitar">✕</button>' +
      '</div>';
    });

    // Upsell message
    var count = cart.length;
    var d = getDiscountInfo();
    if (count === 1) {
      html += '<div class="cart-upsell">Agregá 1 más y obtené <strong>5% OFF</strong> en tu compra</div>';
    } else if (count >= 2 && count < 3) {
      html += '<div class="cart-upsell gold">✓ 5% OFF aplicado · Agregá 1 más para <strong>10% OFF</strong></div>';
    } else if (count >= 3 && count < 6) {
      html += '<div class="cart-upsell gold">✓ 10% OFF aplicado · Con 6+ prendas obtenés <strong>15% OFF</strong></div>';
    } else if (count >= 6) {
      html += '<div class="cart-upsell gold">✓ 15% OFF aplicado — ¡máximo descuento!</div>';
    }

    itemsEl.innerHTML = html;

    // Footer
    var subtotal = getSubtotal();
    var totalTransf = getTotal();
    var totalMP = getMPTotal();
    var fhtml = '';
    fhtml += '<div class="cart-summary-row"><span>Subtotal (' + count + ' ' + (count === 1 ? 'prenda' : 'prendas') + ')</span><span>' + formatPrice(subtotal) + '</span></div>';
    if (d) {
      var ahorro = subtotal - totalTransf;
      fhtml += '<div class="cart-summary-row discount"><span>Descuento ' + d.label + ' (' + d.pct + '%)</span><span>-' + formatPrice(ahorro) + '</span></div>';
    }
    fhtml += '<div class="cart-summary-row total"><span>Total transferencia</span><span>' + formatPrice(totalTransf) + '</span></div>';
    fhtml += '<button class="cart-btn-transf" onclick="window.location.href=\'checkout.html\'">FINALIZAR COMPRA — ' + formatPrice(totalTransf) + '</button>';
    fhtml += '<p class="cart-methods">Con tarjeta vía MercadoPago: ' + formatPrice(totalMP) + ' · Elegís al pagar</p>';
    footerEl.innerHTML = fhtml;
  }

  // ===== ADD TO CART FROM PRODUCT PAGES =====
  window.agregarAlCarrito = function(productoId) {
    var talleBtn = document.querySelector('.size-btn.selected');
    if (!talleBtn) {
      alert('Por favor elegí un talle antes de agregar al carrito.');
      return;
    }
    carrito.add(productoId, talleBtn.textContent.trim());
  };

  // ===== DISCOUNT BANNER =====
  function insertBanner() {
    var nav = document.querySelector('.nav') || document.querySelector('.navbar');
    if (!nav) return;
    var banner = document.createElement('div');
    banner.className = 'discount-banner';
    banner.innerHTML = 'Llevá 2 → <span>5% OFF</span> · Llevá 3+ → <span>10% OFF</span> · Llevá 6+ → <span>15% OFF</span><button class="discount-banner-close" onclick="this.parentElement.remove()">✕</button>';
    nav.parentNode.insertBefore(banner, nav);
  }

  // ===== COOKIE BANNER =====
  function showCookieBanner() {
    if (localStorage.getItem('te_cookies') === '1') return;
    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = 'Usamos cookies para mejorar tu experiencia. <a href="privacidad.html">Más info</a> <button class="cookie-btn" onclick="this.parentElement.remove();localStorage.setItem(\'te_cookies\',\'1\')">ACEPTAR</button>';
    document.body.appendChild(banner);
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', function() {
    createDrawer();
    insertBanner();
    updateBadge();
    renderDrawer();
    showCookieBanner();
  });

})();
