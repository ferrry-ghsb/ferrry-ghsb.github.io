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

// ---------- Hero 3D orb (self-contained — no external library, no WebGL) ----------
// Draws a rotating wireframe icosahedron with plain 2D canvas + hand-rolled
// 3D math. Previously this loaded three.js from a CDN and rendered via
// WebGL; that dependency made the orb silently disappear whenever the CDN
// script failed to load or WebGL was unavailable, with no visible error.
// This version has zero external dependencies and only needs 2D canvas
// support, so it can't fail to load. Intentionally always animates — does
// not check prefers-reduced-motion — per request, so it keeps spinning
// regardless of the visitor's OS motion setting.
(function () {
  var stage = document.querySelector('.avatar-stage');
  if (!stage) return;

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  stage.insertBefore(canvas, stage.firstChild);

  var size = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    size = stage.clientWidth || 220;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function icosahedron(radius) {
    var t = (1 + Math.sqrt(5)) / 2;
    var raw = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];
    var norm = Math.sqrt(1 + t * t);
    var verts = raw.map(function (v) {
      return [v[0] / norm * radius, v[1] / norm * radius, v[2] / norm * radius];
    });
    function dist(a, b) {
      var dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    var minDist = Infinity;
    for (var i = 0; i < verts.length; i++) {
      for (var j = i + 1; j < verts.length; j++) {
        var d = dist(verts[i], verts[j]);
        if (d < minDist) minDist = d;
      }
    }
    var edges = [];
    for (var i2 = 0; i2 < verts.length; i2++) {
      for (var j2 = i2 + 1; j2 < verts.length; j2++) {
        if (Math.abs(dist(verts[i2], verts[j2]) - minDist) < 0.001) {
          edges.push([i2, j2]);
        }
      }
    }
    return { verts: verts, edges: edges };
  }

  var outer = icosahedron(1.5);
  var inner = icosahedron(0.75);

  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  var rgb = isDark ? '108, 191, 164' : '47, 93, 80'; // matches previous 0x6cbfa4 / 0x2f5d50

  var rotOuter = { x: 0, y: 0 };
  var rotInner = { x: 0, y: 0 };
  var focal = 4.2;

  function rotate(v, rx, ry) {
    var x = v[0], y = v[1], z = v[2];
    var cosX = Math.cos(rx), sinX = Math.sin(rx);
    var y1 = y * cosX - z * sinX;
    var z1 = y * sinX + z * cosX;
    var cosY = Math.cos(ry), sinY = Math.sin(ry);
    var x2 = x * cosY + z1 * sinY;
    var z2 = -x * sinY + z1 * cosY;
    return [x2, y1, z2];
  }

  function project(v) {
    var scale = focal / (focal + v[2]);
    return [v[0] * scale, v[1] * scale];
  }

  function drawShape(shape, rot, strokeStyle, lineWidth) {
    var pxPerUnit = (size / 2) / 1.72;
    var pts = shape.verts.map(function (v) { return project(rotate(v, rot.x, rot.y)); });
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    shape.edges.forEach(function (e) {
      var a = pts[e[0]], b = pts[e[1]];
      ctx.moveTo(size / 2 + a[0] * pxPerUnit, size / 2 + a[1] * pxPerUnit);
      ctx.lineTo(size / 2 + b[0] * pxPerUnit, size / 2 + b[1] * pxPerUnit);
    });
    ctx.stroke();
  }

  (function frame() {
    ctx.clearRect(0, 0, size, size);
    rotOuter.y += 0.0035;
    rotOuter.x += 0.0015;
    rotInner.y -= 0.002;
    rotInner.x += 0.001;
    drawShape(inner, rotInner, 'rgba(' + rgb + ', 0.3)', 1);
    drawShape(outer, rotOuter, 'rgba(' + rgb + ', 0.85)', 1.4);
    requestAnimationFrame(frame);
  })();
})();

// ---------- Research Projects carousel: arrows + dot navigation ----------
(function () {
  var track = document.getElementById('projectCarousel');
  if (!track) return;
  var prevBtn = document.querySelector('.carousel-prev');
  var nextBtn = document.querySelector('.carousel-next');
  var dotsWrap = document.getElementById('projectDots');
  var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.querySelectorAll('.dot')) : [];
  var cards = Array.prototype.slice.call(track.querySelectorAll('.project-card'));

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

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      var card = cards[i];
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      dots.forEach(function (d, di) { d.classList.toggle('active', di === i); });
    });
  });

  function updateActiveDot() {
    if (!dots.length || !cards.length) return;
    var trackRect = track.getBoundingClientRect();
    var closest = 0;
    var minDist = Infinity;
    cards.forEach(function (card, i) {
      var dist = Math.abs(card.getBoundingClientRect().left - trackRect.left);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    dots.forEach(function (d, i) { d.classList.toggle('active', i === closest); });
  }
  if (dots.length) {
    track.addEventListener('scroll', function () {
      window.requestAnimationFrame(updateActiveDot);
    }, { passive: true });
    updateActiveDot();
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
