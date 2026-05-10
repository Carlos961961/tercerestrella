// scene3d.js — Hero Three.js scene: golden star + drifting particles
(function () {
  const container = document.getElementById('scene3d');
  if (!container || typeof THREE === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50, container.clientWidth / container.clientHeight, 0.1, 1000
  );
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // --- Particles only (video provides the hero focal element) ---
  const PARTICLE_COUNT = 200;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const speeds = new Float32Array(PARTICLE_COUNT);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    speeds[i] = 0.0003 + Math.random() * 0.0004;

    // mix white and celeste
    if (Math.random() > 0.5) {
      colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
    } else {
      colors[i * 3] = 0.455; colors[i * 3 + 1] = 0.675; colors[i * 3 + 2] = 0.875;
    }
  }
  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  partGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const partMat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const particles = new THREE.Points(partGeo, partMat);
  scene.add(particles);

  // --- Lights ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const point = new THREE.PointLight(0xC0A24A, 1.6, 30);
  point.position.set(4, 5, 5);
  scene.add(point);
  const fill = new THREE.PointLight(0x74ACDF, 0.9, 25);
  fill.position.set(-4, -2, 3);
  scene.add(fill);

  // --- Animate ---
  let rafId = null;
  let isVisible = true;

  function tick() {
    if (!isVisible) { rafId = null; return; }

    if (!reduceMotion) {
      const pos = partGeo.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3 + 1] += speeds[i];
        if (pos[i * 3 + 1] > 5) {
          pos[i * 3 + 1] = -5;
          pos[i * 3] = (Math.random() - 0.5) * 14;
        }
      }
      partGeo.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }
  tick();

  // --- Resize ---
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // --- Pause when offscreen ---
  const heroEl = document.querySelector('.hero');
  if (heroEl && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        isVisible = e.isIntersecting;
        if (isVisible && rafId === null) tick();
      });
    }, { threshold: 0.05 });
    io.observe(heroEl);
  }

})();
