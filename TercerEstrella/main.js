// main.js — TercerEstrella interactions

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== Preloader =====
  const preloader = document.querySelector('.preloader');
  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add('is-hidden');
    setTimeout(() => preloader.style.display = 'none', 450);
  }
  window.addEventListener('load', () => setTimeout(hidePreloader, 300));
  setTimeout(hidePreloader, 800); // hard cap

  // ===== Navbar scroll =====
  const nav = document.querySelector('.nav');
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 30) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ===== Mobile menu =====
  const burger = document.querySelector('.nav-burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  burger && burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('is-open');
    const isOpen = mobileMenu.classList.contains('is-open');
    document.body.style.overflow = isOpen ? 'hidden' : '';
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  });
  document.querySelectorAll('.mobile-menu a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });

  // ===== Reveal on scroll =====
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal, .reveal-stagger, section:not(.hero), .trust-row').forEach(el => io.observe(el));
  }

  // ===== Stats counter =====
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
  function animateCount(el, target, duration = 2000) {
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const v = Math.floor(target * easeOutQuart(t));
      el.textContent = v.toLocaleString('es-AR');
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = target.toLocaleString('es-AR');
    }
    requestAnimationFrame(frame);
  }
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          const target = parseInt(el.dataset.count, 10);
          if (reduceMotion) el.textContent = target.toLocaleString('es-AR');
          else animateCount(el, target);
          cio.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => cio.observe(c));
  }

  // ===== FAQ accordion =====
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      // close all
      document.querySelectorAll('.faq-item.is-open').forEach(other => {
        other.classList.remove('is-open');
        other.querySelector('.faq-a').style.maxHeight = '0px';
      });
      if (!open) {
        item.classList.add('is-open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  // ===== Carousel controls =====
  const carousel = document.querySelector('.carousel');
  const prev = document.querySelector('.car-prev');
  const next = document.querySelector('.car-next');
  if (carousel && prev && next) {
    const step = () => carousel.querySelector('.car-item').getBoundingClientRect().width + 20;
    prev.addEventListener('click', () => carousel.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => carousel.scrollBy({ left: step(), behavior: 'smooth' }));
  }

  // ===== Testimonials marquee: arrows nudge + pause =====
  const mTrack = document.querySelector('.marquee-track');
  const mWrap  = document.querySelector('.marquee-wrap');
  if (mTrack && mWrap) {
    const prevBtn = mWrap.querySelector('.marquee-prev');
    const nextBtn = mWrap.querySelector('.marquee-next');
    const marquee = mWrap.querySelector('.marquee');

    // Convert CSS animation to JS-driven for manual control
    let pos = 0;            // current translateX in px (negative = scrolling left)
    let halfWidth = 0;      // width of one full set
    let paused = false;
    let lastT = performance.now();
    const PX_PER_SEC = (() => {
      // 35s per full cycle = travel = halfWidth (we set after measure)
      return null;
    });
    let pxPerSec = 0;

    function measure() {
      // total scrollWidth ~ 2 * halfWidth
      halfWidth = mTrack.scrollWidth / 2;
      pxPerSec = halfWidth / 70; // 70s per cycle
    }
    measure();
    window.addEventListener('resize', measure);
    // re-measure once images load
    mTrack.querySelectorAll('img').forEach(img => {
      if (!img.complete) img.addEventListener('load', measure, { once: true });
    });

    // Disable CSS animation; use rAF
    mTrack.style.animation = 'none';

    function tick(now) {
      const dt = (now - lastT) / 1000;
      lastT = now;
      if (!paused && !reduceMotion) {
        pos -= pxPerSec * dt;
        if (-pos >= halfWidth) pos += halfWidth; // seamless wrap
      }
      mTrack.style.transform = `translate3d(${pos}px, 0, 0)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // hover pause
    marquee.addEventListener('mouseenter', () => { if (!isDragging) paused = true; });
    marquee.addEventListener('mouseleave', () => { if (!isDragging) paused = false; });

    // drag con mouse (desktop)
    let isDragging = false, dragStartX = 0, dragStartPos = 0;
    marquee.style.cursor = 'grab';
    marquee.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartPos = pos;
      paused = true;
      marquee.style.cursor = 'grabbing';
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      pos = dragStartPos + dx;
      while (-pos >= halfWidth) pos += halfWidth;
      while (pos > 0) pos -= halfWidth;
    });
    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      paused = false;
      marquee.style.cursor = 'grab';
    });

    // swipe táctil (mobile)
    let touchStartX = 0, touchStartPos = 0;
    marquee.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartPos = pos;
      paused = true;
    }, { passive: true });
    marquee.addEventListener('touchmove', (e) => {
      const dx = e.touches[0].clientX - touchStartX;
      pos = touchStartPos + dx;
      while (-pos >= halfWidth) pos += halfWidth;
      while (pos > 0) pos -= halfWidth;
    }, { passive: true });
    marquee.addEventListener('touchend', () => {
      paused = false;
    }, { passive: true });

    function nudge(dir) {
      // one card width + gap
      pos += dir * (380 + 24);
      // wrap
      while (-pos >= halfWidth) pos += halfWidth;
      while (pos > 0) pos -= halfWidth;
      mTrack.style.transition = 'transform 500ms cubic-bezier(0.25,0.46,0.45,0.94)';
      mTrack.style.transform = `translate3d(${pos}px, 0, 0)`;
      setTimeout(() => { mTrack.style.transition = ''; }, 520);
    }
    prevBtn && prevBtn.addEventListener('click', () => nudge(+1));
    nextBtn && nextBtn.addEventListener('click', () => nudge(-1));
  }
  const wpp = document.querySelector('.wpp-float');
  if (wpp) setTimeout(() => wpp.classList.add('is-visible'), 3000);

  // ===== Custom cursor =====
  const cursor = document.querySelector('.cursor-dot');
  if (cursor && !reduceMotion) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    function loop() {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
      requestAnimationFrame(loop);
    }
    loop();
    document.querySelectorAll('a, button, .car-item').forEach(el => {
      el.addEventListener('mouseenter', () => { cursor.style.width = '32px'; cursor.style.height = '32px'; cursor.style.background = 'var(--dorado)'; });
      el.addEventListener('mouseleave', () => { cursor.style.width = '12px'; cursor.style.height = '12px'; cursor.style.background = 'var(--celeste)'; });
    });
  }

  // ===== Hero video parallax (20% slower than scroll) =====
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo && !reduceMotion) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY * 0.2;
      heroVideo.style.transform = `translate3d(0, ${y}px, 0) scale(1.1)`;
    }, { passive: true });
    heroVideo.style.transform = 'translate3d(0,0,0) scale(1.1)';
  }

  // ===== Smooth anchor links =====
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length > 1) {
        const t = document.querySelector(id);
        if (t) {
          e.preventDefault();
          t.scrollIntoView ? window.scrollTo({ top: t.offsetTop - 70, behavior: 'smooth' }) : null;
        }
      }
    });
  });
})();
