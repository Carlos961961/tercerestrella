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
    .discount-banner{background:#C0A24A;color:#1A1A2E;text-align:center;padding:7px 16px;font-size:13px;font-weight:600;letter-spacing:0.04em;font-family:'Inter',sans-serif;position:fixed;top:0;left:0;right:0;z-index:1001;line-height:1.3;}
    .discount-banner span{color:#1A1A2E;font-weight:800;}
    @media(max-width:600px){.discount-banner{font-size:11px;letter-spacing:0.01em;padding:6px 12px;}}
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

    /* Social proof toast */
    .sp-toast{position:fixed;bottom:80px;left:16px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px 14px;box-shadow:0 4px 20px rgba(0,0,0,0.12);font-size:13px;color:#1A1A2E;z-index:8000;max-width:260px;display:flex;align-items:center;gap:10px;transform:translateX(calc(-100% - 16px));transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);line-height:1.4;pointer-events:none;}
    .sp-toast.visible{transform:translateX(0);}
    .sp-toast-icon{font-size:20px;flex-shrink:0;}
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
    t.style.background = '';
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2500);
  }
  function showTalleError() {
    var t = document.getElementById('cart-toast');
    if (!t) return;
    t.textContent = '⚠ Seleccioná un talle para continuar';
    t.style.background = '#dc2626';
    t.classList.add('show');
    clearTimeout(t._et);
    t._et = setTimeout(function() { t.classList.remove('show'); t.style.background = ''; }, 2500);
  }
  window.showTalleError = showTalleError;

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

    // Product upsell: suggest Nacional Niño when Tailandesa in cart but no Niño
    var hasTaillandesa = cart.some(function(it){ return it.id === 'tailandesa-premium'; });
    var hasNino = cart.some(function(it){ return it.id === 'nacional-nino'; });
    if (hasTaillandesa && !hasNino) {
      html += '<div class="cart-upsell" style="display:flex;align-items:center;gap:10px;text-align:left;">' +
        '<img src="assets/nacional-nino/02-modelo-frente.webp" style="width:40px;height:40px;border-radius:6px;object-fit:contain;background:#f5f5f5;flex-shrink:0;" />' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:12px;font-weight:700;color:#166534;">¿Para el/la nene también?</div>' +
          '<div style="font-size:11px;color:#888;margin-top:1px;">Camiseta Nacional Niño · $27.000</div>' +
        '</div>' +
        '<a href="nacional-nino.html" style="flex-shrink:0;background:#0A3D7C;color:#fff;font-family:\'Oswald\',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;padding:6px 10px;border-radius:7px;text-decoration:none;white-space:nowrap;">VER →</a>' +
      '</div>';
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
    fhtml += '<button class="cart-btn-transf" onclick="abrirCheckoutCarrito()">FINALIZAR COMPRA — ' + formatPrice(totalTransf) + '</button>';
    fhtml += '<p class="cart-methods">Con tarjeta vía MercadoPago: ' + formatPrice(totalMP) + ' · Elegís al pagar</p>';
    footerEl.innerHTML = fhtml;
  }

  // ===== ADD TO CART FROM PRODUCT PAGES =====
  window.agregarAlCarrito = function(productoId) {
    var talleBtn = document.querySelector('.size-btn.selected');
    if (!talleBtn) {
      showTalleError();
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
    banner.innerHTML = 'Llevá 2 → <span>5% OFF</span> · Llevá 3+ → <span>10% OFF</span> · Llevá 6+ → <span>15% OFF</span>';
    nav.parentNode.insertBefore(banner, nav);
    function adjustNav() {
      var h = banner.offsetHeight;
      nav.style.setProperty('top', h + 'px', 'important');
      var mob = document.querySelector('.mobile-menu');
      if (mob) mob.style.setProperty('top', h + 'px', 'important');
      var bc = document.querySelector('.breadcrumb');
      if (bc) bc.style.setProperty('padding-top', (h + nav.offsetHeight) + 'px', 'important');
    }
    setTimeout(adjustNav, 0);
    window.addEventListener('resize', adjustNav);
  }

  // ===== COOKIE BANNER =====
  function showCookieBanner() {
    if (localStorage.getItem('te_cookies') === '1') return;
    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = 'Usamos cookies para mejorar tu experiencia. <a href="privacidad.html">Más info</a> <button class="cookie-btn" onclick="this.parentElement.remove();localStorage.setItem(\'te_cookies\',\'1\')">ACEPTAR</button>';
    document.body.appendChild(banner);
  }

  // ===== CART CHECKOUT OVERLAY =====
  var _cco = {};

  function _fldHtml(id, type, label, placeholder, mb) {
    return '<div style="margin-bottom:' + (mb || '8px') + '"><label style="font-size:12px;font-weight:600;color:#1A1A2E;display:block;margin-bottom:3px;">' + label + '</label>' +
      '<input id="' + id + '" type="' + type + '" required placeholder="' + placeholder + '" style="width:100%;padding:9px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;" /></div>';
  }

  window.abrirCheckoutCarrito = function() {
    var cart = getCart();
    if (!cart.length) return;
    closeDrawer();

    var d = getDiscountInfo();
    var totalTransf = getTotal();
    var totalMP = getMPTotal();
    _cco = { cart: cart, d: d, totalTransf: totalTransf, totalMP: totalMP, cupon: '', formData: {} };

    var existing = document.getElementById('cco-overlay');
    if (existing) existing.remove();

    var itemsHtml = cart.map(function(it) {
      return '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f5f5f5;">' +
        '<img src="' + it.img + '" style="width:36px;height:36px;border-radius:5px;object-fit:contain;background:#f5f5f5;flex-shrink:0;" />' +
        '<div style="flex:1;font-size:13px;"><strong>' + it.nombre + '</strong> · Talle ' + it.talle + '</div>' +
        '<div style="font-family:\'Oswald\',sans-serif;font-size:14px;font-weight:700;">' + formatPrice(it.precio) + '</div>' +
      '</div>';
    }).join('');
    if (d) {
      itemsHtml += '<div style="display:flex;justify-content:space-between;font-size:12px;color:#15803d;font-weight:600;padding:5px 0;">' +
        '<span>Descuento ' + d.pct + '% OFF</span><span>-' + formatPrice(getSubtotal() - totalTransf) + '</span></div>';
    }

    var ov = document.createElement('div');
    ov.id = 'cco-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
    ov.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:20px;max-width:520px;width:100%;position:relative;max-height:92vh;overflow-y:auto;margin:auto;">' +
        '<button onclick="document.getElementById(\'cco-overlay\').remove()" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:22px;cursor:pointer;color:#666;z-index:1;">✕</button>' +

        '<div id="cco-step-form">' +
          '<h3 style="font-family:\'Oswald\',sans-serif;font-size:22px;color:#1A1A2E;margin-bottom:4px;">Completá tu pedido</h3>' +
          '<p style="font-size:13px;color:#888;margin-bottom:10px;">' + cart.length + (cart.length === 1 ? ' prenda' : ' prendas') + ' en tu carrito</p>' +

          '<div style="margin-bottom:12px;border:1px solid #f0f0f0;border-radius:8px;padding:6px 12px;">' + itemsHtml + '</div>' +

          '<div style="display:flex;border:1.5px solid #e0e7ff;border-radius:10px;overflow:hidden;margin-bottom:12px;">' +
            '<div style="flex:1;padding:10px;text-align:center;background:#f8f9ff;">' +
              '<div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Transferencia</div>' +
              '<div style="font-family:\'Oswald\',sans-serif;font-size:18px;font-weight:700;color:#15803d;">' + formatPrice(totalTransf) + '</div>' +
              '<div style="font-size:10px;color:#888;margin-top:1px;">precio especial</div>' +
            '</div>' +
            '<div style="width:1px;background:#e0e7ff;"></div>' +
            '<div style="flex:1;padding:10px;text-align:center;background:#f8f9ff;">' +
              '<div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">MercadoPago</div>' +
              '<div style="font-family:\'Oswald\',sans-serif;font-size:18px;font-weight:700;color:#009ee3;">' + formatPrice(totalMP) + '</div>' +
              '<div style="font-size:10px;color:#888;margin-top:1px;">tarjeta / cuotas</div>' +
            '</div>' +
          '</div>' +

          _fldHtml('cco-nombre', 'text', 'Nombre completo', 'Juan García') +
          _fldHtml('cco-direccion', 'text', 'Dirección', 'Av. Corrientes 1234, piso 2') +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">' +
            _fldHtml('cco-localidad', 'text', 'Localidad', 'Buenos Aires', '0') +
            _fldHtml('cco-provincia', 'text', 'Provincia', 'CABA', '0') +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">' +
            _fldHtml('cco-cp', 'text', 'Código postal', '1043', '0') +
            _fldHtml('cco-wsp', 'tel', 'WhatsApp', '11 1234-5678', '0') +
          '</div>' +
          _fldHtml('cco-email', 'email', 'Email', 'tu@email.com') +

          '<div style="margin-bottom:12px;">' +
            '<a href="#" id="cco-cupon-toggle" onclick="document.getElementById(\'cco-cupon-wrap\').style.display=\'block\';this.style.display=\'none\';return false;" style="font-size:12px;color:#888;text-decoration:none;">+ Tengo un código de descuento</a>' +
            '<div id="cco-cupon-wrap" style="display:none;margin-top:6px;">' +
              '<div style="display:flex;gap:8px;">' +
                '<input id="cco-cupon" type="text" placeholder="Ej: HINCHA10" style="flex:1;padding:9px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none;text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()" />' +
                '<button type="button" onclick="aplicarCuponCarrito()" style="padding:9px 14px;background:#f0f0f0;border:1.5px solid #ddd;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;color:#1A1A2E;">Aplicar</button>' +
              '</div>' +
              '<p id="cco-cupon-msg" style="display:none;font-size:12px;margin-top:4px;"></p>' +
            '</div>' +
          '</div>' +

          '<div style="display:flex;flex-wrap:wrap;gap:4px 10px;margin-bottom:10px;padding:8px 12px;background:#f9fafb;border-radius:10px;border:1px solid #f0f0f0;font-size:11px;color:#555;">' +
            '<span>🔒 Compra segura</span><span style="color:#ddd;">·</span><span>📦 Gratis en CABA</span><span style="color:#ddd;">·</span><span>⭐ Camisetas vendidas en todo el país</span>' +
          '</div>' +

          '<div style="border-top:1px solid #f0f0f0;margin-bottom:12px;"></div>' +
          '<p style="font-size:12px;font-weight:600;color:#888;text-align:center;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em;">¿Cómo querés pagar?</p>' +

          '<button id="cco-btn-transf" type="button" onclick="pagarTransferenciaCarrito()" style="width:100%;padding:13px;background:#15803d;color:#fff;border:none;border-radius:10px;font-family:\'Oswald\',sans-serif;font-weight:700;font-size:15px;letter-spacing:0.07em;cursor:pointer;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px;">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;flex-shrink:0;"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>' +
            'TRANSFERENCIA — ' + formatPrice(totalTransf) +
          '</button>' +
          '<button id="cco-btn-mp" type="button" onclick="pagarMPCarrito()" style="width:100%;padding:13px;background:#009ee3;color:#fff;border:none;border-radius:10px;font-family:\'Oswald\',sans-serif;font-weight:700;font-size:15px;letter-spacing:0.07em;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;flex-shrink:0;"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' +
            'MERCADOPAGO — ' + formatPrice(totalMP) + ' · tarjeta/cuotas' +
          '</button>' +
          '<p style="font-size:11px;color:#aaa;text-align:center;margin-top:6px;">Pago procesado por MercadoPago.</p>' +
        '</div>' +

        '<div id="cco-step-transfer" style="display:none;">' +
          '<div style="text-align:center;margin-bottom:20px;">' +
            '<div style="width:52px;height:52px;background:#f0fdf4;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2.5" style="width:26px;height:26px;"><path d="M20 6L9 17l-5-5"/></svg>' +
            '</div>' +
            '<h3 style="font-family:\'Oswald\',sans-serif;font-size:22px;color:#1A1A2E;margin-bottom:4px;">¡Casi listo!</h3>' +
            '<p style="font-size:13px;color:#666;">Hacé la transferencia y mandanos el comprobante por WhatsApp.</p>' +
          '</div>' +
          '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px;margin-bottom:18px;text-align:center;">' +
            '<p style="font-size:11px;color:#166534;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Alias de destino</p>' +
            '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:6px;">' +
              '<span style="font-family:\'Oswald\',sans-serif;font-size:22px;font-weight:700;color:#15803d;letter-spacing:0.04em;">tercerestrella.mp</span>' +
              '<button onclick="copiarAliasCarrito()" style="background:#15803d;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">COPIAR</button>' +
            '</div>' +
            '<p id="cco-alias-copiado" style="display:none;color:#15803d;font-size:12px;font-weight:600;">✓ ¡Alias copiado!</p>' +
            '<p style="font-size:14px;color:#166534;margin-top:8px;">Monto exacto: <strong style="font-size:20px;">' + formatPrice(totalTransf) + '</strong></p>' +
          '</div>' +
          '<button onclick="enviarComprobanteCarrito()" style="width:100%;padding:14px;background:#15803d;color:#fff;border:none;border-radius:10px;font-family:\'Oswald\',sans-serif;font-weight:700;font-size:15px;letter-spacing:0.07em;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;flex-shrink:0;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.998 0C5.372 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.824L.044 23.339a.75.75 0 00.918.918l5.516-1.48A11.942 11.942 0 0011.998 24C18.625 24 24 18.627 24 12S18.625 0 11.998 0zm0 21.75a9.696 9.696 0 01-4.951-1.354l-.355-.211-3.676.986.99-3.614-.231-.372A9.699 9.699 0 012.25 12c0-5.375 4.374-9.75 9.748-9.75S21.75 6.625 21.75 12s-4.376 9.75-9.752 9.75z"/></svg>' +
            'YA TRANSFERÍ — ENVIAR COMPROBANTE' +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(ov);
    ov.addEventListener('click', function(e) { if (e.target === ov) ov.remove(); });

    if (typeof gtag === 'function') {
      gtag('event', 'begin_checkout', { currency: 'ARS', value: totalTransf,
        items: cart.map(function(it) { return { item_id: it.id, item_name: it.nombre, item_variant: it.talle, price: it.precio, quantity: 1 }; }) });
    }
  };

  window.aplicarCuponCarrito = function() {
    var val = (document.getElementById('cco-cupon').value || '').trim().toUpperCase();
    var msg = document.getElementById('cco-cupon-msg');
    msg.style.display = 'block';
    if (val === 'HINCHA10') {
      _cco.cupon = val;
      msg.style.color = '#1a7a3a';
      msg.textContent = '✓ 10% de descuento aplicado con MercadoPago';
    } else if (!val) {
      _cco.cupon = '';
      msg.style.display = 'none';
    } else {
      _cco.cupon = '';
      msg.style.color = '#c0392b';
      msg.textContent = '✗ Código inválido';
    }
  };

  function validarFormCCO() {
    var ids = ['cco-nombre','cco-direccion','cco-localidad','cco-provincia','cco-cp','cco-wsp','cco-email'];
    var ok = true;
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (!el.value.trim()) { el.style.borderColor = '#dc2626'; ok = false; }
      else el.style.borderColor = '#ddd';
    });
    return ok;
  }

  window.pagarTransferenciaCarrito = async function() {
    if (!validarFormCCO()) return;
    var btn = document.getElementById('cco-btn-transf');
    btn.disabled = true; btn.querySelector('svg').remove(); btn.textContent = 'Registrando...';
    var f = {
      nombre:  document.getElementById('cco-nombre').value.trim(),
      email:   document.getElementById('cco-email').value.trim(),
      wsp:     document.getElementById('cco-wsp').value.trim(),
      dir:     document.getElementById('cco-direccion').value.trim(),
      loc:     document.getElementById('cco-localidad').value.trim(),
      prov:    document.getElementById('cco-provincia').value.trim(),
      cp:      document.getElementById('cco-cp').value.trim()
    };
    _cco.formData = f;
    if (typeof gtag === 'function') {
      gtag('event', 'click_transferencia', { currency: 'ARS', value: _cco.totalTransf,
        items: _cco.cart.map(function(it) { return { item_id: it.id, item_name: it.nombre, item_variant: it.talle }; }) });
    }
    try {
      await fetch('/api/transferencia', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: f.nombre, email: f.email, whatsapp: f.wsp, producto: 'carrito',
          talle: _cco.cart.map(function(it) { return it.nombre + ' T' + it.talle; }).join(', ') })
      });
    } catch(_) {}
    document.getElementById('cco-step-form').style.display = 'none';
    document.getElementById('cco-step-transfer').style.display = 'block';
    btn.disabled = false;
  };

  window.pagarMPCarrito = async function() {
    if (!validarFormCCO()) return;
    var btn = document.getElementById('cco-btn-mp');
    btn.disabled = true; btn.textContent = 'Procesando...';
    if (typeof gtag === 'function') {
      gtag('event', 'click_mercadopago', { currency: 'ARS', value: _cco.totalMP,
        items: _cco.cart.map(function(it) { return { item_id: it.id, item_name: it.nombre, item_variant: it.talle }; }) });
    }
    try {
      var res = await fetch('/api/crear-preferencia-carrito', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: _cco.cart.map(function(it) { return { id: it.id, talle: it.talle }; }),
          descuento: _cco.d ? _cco.d.pct : 0, cupon: _cco.cupon || '',
          nombre:   document.getElementById('cco-nombre').value.trim(),
          email:    document.getElementById('cco-email').value.trim(),
          whatsapp: document.getElementById('cco-wsp').value.trim()
        })
      });
      var data = await res.json();
      if (data.init_point) { window.carrito.clear(); window.location.href = data.init_point; return; }
    } catch(_) {}
    btn.disabled = false;
    btn.textContent = 'MERCADOPAGO — ' + formatPrice(_cco.totalMP) + ' · tarjeta/cuotas';
    alert('Hubo un error. Intentá de nuevo o pagá por transferencia.');
  };

  window.copiarAliasCarrito = function() {
    navigator.clipboard.writeText('tercerestrella.mp').then(function() {
      if (typeof gtag === 'function') gtag('event', 'copy_alias', { method: 'clipboard', page: 'carrito' });
      var el = document.getElementById('cco-alias-copiado');
      el.style.display = 'block';
      setTimeout(function() { el.style.display = 'none'; }, 2000);
    });
  };

  window.enviarComprobanteCarrito = function() {
    var f = _cco.formData || {};
    if (typeof gtag === 'function') gtag('event', 'lead_whatsapp', { currency: 'ARS', value: _cco.totalTransf, item_name: 'carrito' });
    var itemsTxt = _cco.cart.map(function(it) { return '• ' + it.nombre + ' — Talle ' + it.talle; }).join('\n');
    var msg = encodeURIComponent(
      'Hola, vengo de TercerEstrella. Acabo de transferir ' + formatPrice(_cco.totalTransf) + ' al alias tercerestrella.mp.\n\n' +
      '📦 Pedido:\n' + itemsTxt + '\n\n' +
      '👤 Datos:\n• Nombre: ' + f.nombre + '\n• Email: ' + f.email + '\n• WhatsApp: ' + f.wsp + '\n\n' +
      '🏠 Dirección:\n• ' + f.dir + '\n• ' + f.loc + ', ' + f.prov + ' (CP: ' + f.cp + ')\n\nAdjunto el comprobante.'
    );
    window.open('https://wa.me/5491134652868?text=' + msg, '_blank');
    document.getElementById('cco-overlay').remove();
    window.carrito.clear();
  };

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', function() {
    createDrawer();
    insertBanner();
    updateBadge();
    renderDrawer();
    showCookieBanner();
  });

  // ===== SOCIAL PROOF TOAST =====
  (function() {
    var SETS = [
      [
        { icon:'🛒', name:'Martín',    city:'Rosario',        talle:'L'   },
        { icon:'⭐', name:'Sofía',     city:'Palermo',        talle:'S'   },
        { icon:'🛒', name:'Diego',     city:'Córdoba',        talle:'XL'  },
        { icon:'⭐', name:'Valentina', city:'La Plata',       talle:'M'   },
      ],
      [
        { icon:'🛒', name:'Pablo',     city:'Mar del Plata',  talle:'L'   },
        { icon:'⭐', name:'Lucía',     city:'Mendoza',        talle:'XS'  },
        { icon:'🛒', name:'Rodrigo',   city:'CABA',           talle:'XXL' },
        { icon:'⭐', name:'Camila',    city:'Tucumán',        talle:'M'   },
      ],
      [
        { icon:'🛒', name:'Facundo',   city:'Neuquén',        talle:'XL'  },
        { icon:'⭐', name:'Florencia', city:'Salta',          talle:'S'   },
        { icon:'🛒', name:'Nicolás',   city:'Santa Fe',       talle:'L'   },
        { icon:'⭐', name:'Romina',    city:'Bahía Blanca',   talle:'M'   },
      ],
    ];

    // Pick set by day-of-year, entry by 2-hour block within the day
    var now  = new Date();
    var doy  = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    var set  = SETS[doy % 3];
    var slot = Math.floor(now.getHours() / 2) % 4; // changes every 2 hrs

    // "hace X hs" varies by minutes elapsed within the 2-hour block (1–3 hs)
    var minsInBlock = now.getMinutes() + (now.getHours() % 2) * 60;
    var hrsAgo = minsInBlock < 30 ? 1 : minsInBlock < 80 ? 2 : 3;

    var sp = document.createElement('div');
    sp.className = 'sp-toast';
    sp.innerHTML = '<div class="sp-toast-icon"></div><div class="sp-toast-body" style="line-height:1.4;"></div>';
    document.body.appendChild(sp);

    // Within the session, cycle through the 4 entries starting at the active slot
    var shown = 0;
    function showNext() {
      var ev = set[(slot + shown) % 4];
      sp.querySelector('.sp-toast-icon').textContent = ev.icon;
      sp.querySelector('.sp-toast-body').innerHTML =
        '<strong>' + ev.name + ' de ' + ev.city + '</strong><br>' +
        '<span style="color:#666;font-size:11px;">compró talle ' + ev.talle + ' hace ' + hrsAgo + ' hs</span>';
      sp.classList.add('visible');
      shown++;
      setTimeout(function() { sp.classList.remove('visible'); }, 4500);
    }

    setTimeout(function() {
      showNext();
      setInterval(showNext, 45000);
    }, 10000);
  })();

})();
