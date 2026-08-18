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

// ---------- Multimodal fusion diagram (SVG connectors) ----------
(function () {
  var diagram = document.querySelector('.diagram');
  var svg = document.querySelector('.diagram-svg');
  var nodes = document.querySelectorAll('.dnode[data-caption]');
  var captionEl = document.querySelector('.diagram-caption');
  if (!diagram || !svg || !nodes.length || !captionEl) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var sourceKeys = ['vr', 'mri', 'eeg', 'neuro'];

  function centerRight(el, containerRect) {
    var r = el.getBoundingClientRect();
    return { x: r.right - containerRect.left, y: r.top + r.height / 2 - containerRect.top };
  }
  function centerLeft(el, containerRect) {
    var r = el.getBoundingClientRect();
    return { x: r.left - containerRect.left, y: r.top + r.height / 2 - containerRect.top };
  }

  function drawLines() {
    if (window.innerWidth <= 640) { svg.innerHTML = ''; return; }
    var containerRect = diagram.getBoundingClientRect();
    var fusionEl = diagram.querySelector('.dnode[data-key="fusion"]');
    var decisionEl = diagram.querySelector('.dnode[data-key="decision"]');
    if (!fusionEl || !decisionEl) return;

    svg.setAttribute('width', containerRect.width);
    svg.setAttribute('height', containerRect.height);
    svg.innerHTML = '';

    var fusionIn = centerLeft(fusionEl, containerRect);
    var fusionOut = centerRight(fusionEl, containerRect);
    var decisionIn = centerLeft(decisionEl, containerRect);

    sourceKeys.forEach(function (key) {
      var el = diagram.querySelector('.dnode[data-key="' + key + '"]');
      if (!el) return;
      var start = centerRight(el, containerRect);
      var midX = (start.x + fusionIn.x) / 2;
      var d = 'M ' + start.x + ' ' + start.y + ' C ' + midX + ' ' + start.y + ' ' + midX + ' ' + fusionIn.y + ' ' + fusionIn.x + ' ' + fusionIn.y;
      var path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('data-source', key);
      svg.appendChild(path);
    });

    var midX2 = (fusionOut.x + decisionIn.x) / 2;
    var mainD = 'M ' + fusionOut.x + ' ' + fusionOut.y + ' C ' + midX2 + ' ' + fusionOut.y + ' ' + midX2 + ' ' + decisionIn.y + ' ' + decisionIn.x + ' ' + decisionIn.y;
    var mainPath = document.createElementNS(SVGNS, 'path');
    mainPath.setAttribute('d', mainD);
    mainPath.setAttribute('data-source', 'fusion-decision');
    mainPath.classList.add('dline-main');
    svg.appendChild(mainPath);

    highlight(currentKeys);
  }

  var currentKeys = [sourceKeys[0], 'fusion-decision'];

  function highlight(keys) {
    currentKeys = keys;
    svg.querySelectorAll('path').forEach(function (p) {
      p.classList.toggle('active', keys.indexOf(p.getAttribute('data-source')) !== -1);
    });
  }

  function activate(node) {
    var key = node.getAttribute('data-key');
    nodes.forEach(function (n) { n.classList.remove('active'); });
    node.classList.add('active');
    captionEl.innerHTML = node.getAttribute('data-caption');

    if (key === 'fusion' || key === 'decision') {
      highlight(sourceKeys.concat(['fusion-decision']));
    } else {
      highlight([key, 'fusion-decision']);
    }
  }

  nodes.forEach(function (node) {
    node.addEventListener('mouseenter', function () { activate(node); });
    node.addEventListener('focus', function () { activate(node); });
    node.addEventListener('click', function () { activate(node); });
  });

  activate(nodes[0]);
  drawLines();
  window.addEventListener('load', drawLines);
  // Redraw once more after the section's fade-in transition finishes, in
  // case the reveal animation shifted its final layout position.
  setTimeout(drawLines, 700);
  setTimeout(drawLines, 1400);

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawLines, 150);
  });
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
