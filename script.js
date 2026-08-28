// ---------- Theme toggle ----------
(function () {
  var btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();

// ---------- Email reveal toggle ----------
(function () {
  var btn = document.getElementById('emailToggle');
  var reveal = document.getElementById('emailReveal');
  if (!btn || !reveal) return;
  btn.addEventListener('click', function () {
    var open = reveal.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();

// ---------- Scroll reveal ----------
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  items.forEach(function (el) { io.observe(el); });

  // Safety net: if anything is still unrevealed shortly after load (slow
  // observer callback, unusual viewport, etc.), reveal it anyway so content
  // never gets stuck invisible.
  setTimeout(function () {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }, 1200);
})();

// ---------- Hero 3D orb (three.js, loaded from cdnjs) ----------
(function () {
  var stage = document.querySelector('.avatar-stage');
  if (!stage || typeof THREE === 'undefined') return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    var size = stage.clientWidth || 160;
    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.insertBefore(renderer.domElement, stage.firstChild);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.2;

    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var color = isDark ? 0x6cbfa4 : 0x2f5d50;

    var geometry = new THREE.IcosahedronGeometry(1.5, 1);
    var edges = new THREE.EdgesGeometry(geometry);
    var material = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.7 });
    var wire = new THREE.LineSegments(edges, material);
    scene.add(wire);

    var innerGeo = new THREE.IcosahedronGeometry(0.75, 0);
    var innerMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.12, wireframe: true });
    var inner = new THREE.Mesh(innerGeo, innerMat);
    scene.add(inner);

    function render() {
      renderer.render(scene, camera);
    }

    if (reduceMotion) {
      wire.rotation.set(0.4, 0.6, 0);
      inner.rotation.set(0.2, 0.3, 0);
      render();
    } else {
      (function animate() {
        wire.rotation.y += 0.0035;
        wire.rotation.x += 0.0015;
        inner.rotation.y -= 0.002;
        inner.rotation.x += 0.001;
        render();
        requestAnimationFrame(animate);
      })();
    }
  } catch (e) {
    // WebGL unavailable — the static avatar circle already renders underneath.
  }
})();

// ---------- Research Projects carousel arrows ----------
(function () {
  var track = document.getElementById('projectCarousel');
  if (!track) return;
  var prevBtn = document.querySelector('.carousel-prev');
  var nextBtn = document.querySelector('.carousel-next');

  function step() {
    var card = track.querySelector('.project-card');
    return card ? card.getBoundingClientRect().width + 16 : 300;
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -step(), behavior: 'smooth' });
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: step(), behavior: 'smooth' });
    });
  }
})();

// ---------- Publications filter ----------
(function () {
  var bar = document.querySelector('.filter-bar');
  if (!bar) return;

  var state = { type: 'all', year: 'all' };
  var groups = bar.querySelectorAll('.filter-group');
  var items = document.querySelectorAll('[data-type][data-year]');
  var pubGroups = document.querySelectorAll('.pub-group');
  var emptyMsg = document.querySelector('.filter-empty');

  function apply() {
    var visibleCount = 0;
    items.forEach(function (item) {
      var matchType = state.type === 'all' || item.getAttribute('data-type') === state.type;
      var matchYear = state.year === 'all' || item.getAttribute('data-year') === state.year;
      var show = matchType && matchYear;
      item.classList.toggle('is-hidden', !show);
      if (show) visibleCount++;
    });
    pubGroups.forEach(function (group) {
      var visible = group.querySelectorAll('[data-type][data-year]:not(.is-hidden)').length;
      group.classList.toggle('is-empty', visible === 0);
    });
    if (emptyMsg) emptyMsg.classList.toggle('is-visible', visibleCount === 0);
  }

  groups.forEach(function (group) {
    var key = group.getAttribute('data-filter-group');
    var buttons = group.querySelectorAll('.filter-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state[key] = btn.getAttribute('data-filter');
        apply();
      });
    });
  });

  apply();
})();
