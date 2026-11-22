/* Yuwon Kim — site script (v20) */
(function () {
  var root = document.documentElement;
  function lang() { return root.getAttribute('data-lang') === 'ko' ? 'ko' : 'en'; }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }


  // ---------- image fallback ----------
  var FALLBACK = 'img/placeholder.svg';
  function fix(img) {
    if (!img || img.dataset.fallback) return;
    img.dataset.fallback = '1';
    var chip = img.closest('.logo-chip');
    if (chip) { chip.style.display = 'none'; return; }
    img.src = FALLBACK; img.classList.add('is-fallback');
    if (!img.alt) img.alt = '';
  }
  document.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG') fix(e.target); }, true);
  document.querySelectorAll('img').forEach(function (img) { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fix(img); });

  // ---------- theme ----------
  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next); store('theme', next);
      document.dispatchEvent(new CustomEvent('themechange'));
    });
  });

  // ---------- language ----------
  function applyTitle() {
    var t = root.getAttribute('data-title-' + lang());
    if (t) document.title = t;
    root.setAttribute('lang', lang() === 'ko' ? 'ko' : 'en');
  }
  document.querySelectorAll('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      var l = b.getAttribute('data-set-lang');
      root.setAttribute('data-lang', l); store('lang', l); applyTitle();
      document.dispatchEvent(new CustomEvent('langchange'));
    });
  });
  applyTitle();

  // ---------- mobile menu ----------
  var mb = document.querySelector('.menu-btn'), links = document.querySelector('.topnav-links');
  if (mb && links) mb.addEventListener('click', function () { links.classList.toggle('open'); });

  // ---------- reveal ----------
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }
  setTimeout(function () { items.forEach(function (el) { el.classList.add('is-visible'); }); }, 1400);

  // ---------- count-up ----------
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count')), dec = (el.getAttribute('data-count').split('.')[1] || '').length;
    var suffix = el.getAttribute('data-suffix') || '';
    var start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1100, 1), v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  // ---------- publication filters ----------
  var groups = document.querySelectorAll('[data-filter-group]');
  if (groups.length) {
    var state = { type: 'all', year: 'all' };
    var params = new URLSearchParams(location.search);
    if (params.get('type')) state.type = params.get('type');
    function applyFilter() {
      var shown = 0;
      document.querySelectorAll('.pub-item').forEach(function (li) {
        var ok = (state.type === 'all' || li.dataset.type === state.type) && (state.year === 'all' || li.dataset.year === state.year);
        li.classList.toggle('hidden', !ok); if (ok) shown++;
      });
      document.querySelectorAll('.pub-group').forEach(function (g) {
        g.style.display = g.querySelector('.pub-item:not(.hidden)') ? '' : 'none';
      });
      var empty = document.querySelector('.filter-empty'); if (empty) empty.style.display = shown ? 'none' : 'block';
      groups.forEach(function (g) {
        var key = g.getAttribute('data-filter-group');
        g.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.filter === state[key]); });
      });
    }
    groups.forEach(function (g) {
      g.addEventListener('click', function (e) {
        var b = e.target.closest('.filter-btn'); if (!b) return;
        state[g.getAttribute('data-filter-group')] = b.dataset.filter; applyFilter();
      });
    });
    applyFilter();
  }

  // ---------- bar charts ----------
  document.querySelectorAll('.bar-chart').forEach(function (box) {
    var cfg = JSON.parse(box.getAttribute('data-chart'));
    var seg = box.querySelector('.seg'), bars = box.querySelector('.bars'), note = box.querySelector('.metric-note');
    var cur = 0;
    function render() {
      var m = cfg.metrics[cur], L = lang();
      var vals = cfg.series.map(function (s) { return s.v[cur]; });
      var max = m.max || Math.max.apply(null, vals.filter(function (v) { return v != null; })) * 1.08;
      var min = m.min || 0;
      var best = m.lowerBetter ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
      var worst = m.lowerBetter ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
      bars.innerHTML = '';
      cfg.series.forEach(function (s, i) {
        var v = s.v[cur]; if (v == null) return;
        var row = document.createElement('div');
        row.className = 'bar-row' + (v === best ? ' best' : '') + (cfg.markWorst && v === worst ? ' worst' : '');
        row.innerHTML = '<span class="lbl">' + (s[L] || s.en) + '</span><div class="bar-track"><div class="bar-fill"></div></div><span class="val">' + v + (m.unit || '') + '</span>';
        bars.appendChild(row);
        var w = Math.max(2, (v - min) / (max - min) * 100);
        requestAnimationFrame(function () { requestAnimationFrame(function () { row.querySelector('.bar-fill').style.width = w + '%'; }); });
      });
      if (note) note.textContent = (m['note_' + L] || '');
      if (seg) seg.querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('on', i === cur); });
    }
    if (seg) {
      cfg.metrics.forEach(function (m, i) {
        var b = document.createElement('button'); b.type = 'button';
        b.innerHTML = '<span class="en">' + m.en + '</span><span class="ko">' + m.ko + '</span>';
        b.addEventListener('click', function () { cur = i; render(); });
        seg.appendChild(b);
      });
    }
    var drawn = false;
    function first() { if (!drawn) { drawn = true; render(); } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { first(); o.disconnect(); } }, { threshold: .2 }).observe(box);
    } else first();
    document.addEventListener('langchange', function () { if (drawn) render(); });
  });

  // ---------- VEEM modality toggles ----------
  var veem = document.getElementById('veemSim');
  if (veem) {
    var boxes = veem.querySelectorAll('input[type=checkbox]');
    function upd() {
      var have = []; boxes.forEach(function (b) { if (b.checked) have.push(b.value); });
      var all = have.length === boxes.length;
      veem.querySelectorAll('[data-state]').forEach(function (el) {
        var s = el.getAttribute('data-state');
        el.style.display = (s === 'full' && all) || (s === 'partial' && !all && have.length) || (s === 'none' && !have.length) ? '' : 'none';
      });
      veem.querySelectorAll('.have-list').forEach(function (el) { el.textContent = have.length ? have.join(' + ') : '—'; });
      veem.querySelectorAll('.miss-list').forEach(function (el) {
        var miss = []; boxes.forEach(function (b) { if (!b.checked) miss.push(b.value); }); el.textContent = miss.join(' + ') || '—';
      });
    }
    boxes.forEach(function (b) { b.addEventListener('change', upd); }); upd();
  }

  // ---------- hero network canvas ----------
  var stage = document.getElementById('heroCanvas');
  if (stage && stage.getContext) {
    var ctx = stage.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var layers = [
      [{ t: 'VR task' }, { t: 'Eye tracking' }, { t: 'Hand motion' }, { t: 'EEG' }, { t: 'MRI' }, { t: 'Clinical tests' }],
      [{ t: 'Data fusion', big: 1 }, { t: 'Missing data', big: 1 }],
      [{ t: 'Knowledge graph', big: 1 }],
      [{ t: 'LLM reasoning', big: 1 }],
      [{ t: 'Explainable|report', big: 1, hot: 1 }]
    ];
    var nodes = [], edges = [], parts = [];
    function layout() {
      var r = stage.getBoundingClientRect(); W = r.width; H = r.height;
      stage.width = W * dpr; stage.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = []; edges = [];
      var padY = H * 0.12, xs = [0.24, 0.43, 0.6, 0.75, 0.9];
      layers.forEach(function (L, li) {
        var x = W * xs[li];
        L.forEach(function (n, ni) {
          var y = L.length === 1 ? H * 0.47 : padY + (H * 0.84 - padY) * (ni / (L.length - 1));
          if (li === 1) y = H * (0.3 + 0.34 * ni);
          nodes.push({ x: x, y: y, t: n.t, big: n.big, hot: n.hot, layer: li, ni: ni, ph: Math.random() * 6.28 });
        });
      });
      var byLayer = function (l) { return nodes.filter(function (n) { return n.layer === l; }); };
      for (var l = 0; l < layers.length - 1; l++) {
        byLayer(l).forEach(function (a) { byLayer(l + 1).forEach(function (b) { edges.push([a, b]); }); });
      }
    }
    function col(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
    function curve(a, b, t) {
      var mx = (a.x + b.x) / 2;
      var x = Math.pow(1 - t, 3) * a.x + 3 * Math.pow(1 - t, 2) * t * mx + 3 * (1 - t) * t * t * mx + t * t * t * b.x;
      var y = Math.pow(1 - t, 3) * a.y + 3 * Math.pow(1 - t, 2) * t * a.y + 3 * (1 - t) * t * t * b.y + t * t * t * b.y;
      return [x, y];
    }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function frame(ts) {
      var accent = col('--accent'), hot = col('--hot'), line = col('--line'), ink = col('--ink'), faint = col('--ink-faint'), card = col('--card-bg');
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      edges.forEach(function (e) {
        ctx.strokeStyle = line; ctx.beginPath();
        var a = e[0], b = e[1], mx = (a.x + b.x) / 2;
        ctx.moveTo(a.x, a.y); ctx.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y); ctx.stroke();
      });
      if (!reduce && Math.random() < 0.22 && parts.length < 60) {
        var e0 = edges.filter(function (e) { return e[0].layer === 0; });
        var pick = e0[Math.floor(Math.random() * e0.length)];
        parts.push({ e: pick, t: 0, sp: 0.006 + Math.random() * 0.006 });
      }
      parts = parts.filter(function (p) {
        p.t += p.sp;
        if (p.t >= 1) {
          var nxt = edges.filter(function (e) { return e[0] === p.e[1]; });
          if (!nxt.length) return false;
          p.e = nxt[Math.floor(Math.random() * nxt.length)]; p.t = 0;
        }
        var pt = curve(p.e[0], p.e[1], p.t);
        ctx.fillStyle = p.e[1].hot ? hot : accent; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(pt[0], pt[1], 2.4, 0, 6.29); ctx.fill(); ctx.globalAlpha = 1;
        return true;
      });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      nodes.forEach(function (n) {
        var pulse = reduce ? 0 : Math.sin(ts / 700 + n.ph) * 1.5;
        var r = (n.big ? 9 : 6) + pulse;
        ctx.fillStyle = card; ctx.beginPath(); ctx.arc(n.x, n.y, r + 4, 0, 6.29); ctx.fill();
        ctx.fillStyle = n.hot ? hot : accent; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.29); ctx.fill();
        ctx.font = (n.big ? '700 ' : '600 ') + (W < 420 ? 10 : 12) + 'px ' + getComputedStyle(document.body).fontFamily;
        ctx.fillStyle = n.big ? ink : faint;
        if (n.layer === 0) { ctx.textAlign = 'right'; ctx.fillText(n.t, n.x - 14, n.y); ctx.textAlign = 'center'; }
        else {
          var lines = n.t.split('|'), up = (n.layer === 1 && n.ni === 0) || n.layer === 3;
          lines.forEach(function (ln, k) {
            var yy = up ? n.y - 22 - (lines.length - 1 - k) * 15 : n.y + 24 + k * 15;
            ctx.fillText(ln, n.x, yy);
          });
        }
      });
      requestAnimationFrame(frame);
    }
    layout(); window.addEventListener('resize', layout); requestAnimationFrame(frame);
  }
})();
