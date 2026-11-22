/* Interactive explorer for the verified VR–MRI–cognition knowledge graph (16 entities, 32 relations) */
(function () {
  var host = document.getElementById('kgExplorer');
  if (!host) return;
  var svg = host.querySelector('svg'), panel = host.querySelector('.kg-panel');
  var NS = 'http://www.w3.org/2000/svg';
  function L() { return document.documentElement.getAttribute('data-lang') === 'ko' ? 'ko' : 'en'; }
  function T(en, ko) { return '<span class="en">' + en + '</span><span class="ko">' + ko + '</span>'; }
  var COLORS = { VR: '#2f6fd0', MRI: '#e2703a', Cognitive: '#1fa37a' };

  fetch('data/kg.json').then(function (r) { return r.json(); }).then(function (kg) {
    var W = 700, H = 500, cols = { MRI: 190, VR: 350, Cognitive: 510 };
    var groups = { MRI: [], VR: [], Cognitive: [] };
    kg.nodes.forEach(function (n) { groups[n.type].push(n); });
    var pos = {};
    Object.keys(groups).forEach(function (t) {
      var g = groups[t], n = g.length;
      g.forEach(function (node, i) {
        var y = t === "VR" ? 100 + i * 100 : 40 + i * (H - 80) / (n - 1);
        pos[node.id] = { x: cols[t], y: y, n: node };
      });
    });
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var gE = document.createElementNS(NS, 'g'), gN = document.createElementNS(NS, 'g');
    svg.appendChild(gE); svg.appendChild(gN);
    var edgeEls = [];
    kg.edges.forEach(function (e) {
      var a = pos[e.s], b = pos[e.t]; if (!a || !b) return;
      var p = document.createElementNS(NS, 'path'), mx = (a.x + b.x) / 2;
      p.setAttribute('d', 'M' + a.x + ',' + a.y + ' C' + mx + ',' + a.y + ' ' + mx + ',' + b.y + ' ' + b.x + ',' + b.y);
      p.setAttribute('class', 'edge ' + (e.r >= 0 ? 'pos' : 'neg'));
      p.setAttribute('stroke-width', (1 + Math.abs(e.r) * 6).toFixed(1));
      gE.appendChild(p); edgeEls.push({ el: p, e: e });
    });
    var nodeEls = {};
    Object.keys(pos).forEach(function (id) {
      var P = pos[id], g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'node'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', P.x); c.setAttribute('cy', P.y); c.setAttribute('r', P.n.type === 'VR' ? 16 : 12);
      c.setAttribute('fill', COLORS[P.n.type]);
      var tx = document.createElementNS(NS, 'text');
      var anchor = P.n.type === 'MRI' ? 'end' : (P.n.type === 'Cognitive' ? 'start' : 'middle');
      tx.setAttribute('text-anchor', anchor);
      tx.setAttribute('x', P.n.type === 'MRI' ? P.x - 20 : (P.n.type === 'Cognitive' ? P.x + 20 : P.x));
      tx.setAttribute('y', P.n.type === 'VR' ? P.y - 24 : P.y + 4);
      g.appendChild(c); g.appendChild(tx); gN.appendChild(g);
      nodeEls[id] = { g: g, tx: tx, n: P.n };
      g.addEventListener('click', function () { select(id); });
      g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(id); } });
      g.addEventListener('mouseenter', function () { if (!sel) highlight(id); });
      g.addEventListener('mouseleave', function () { if (!sel) highlight(null); });
    });
    function labels() { Object.keys(nodeEls).forEach(function (id) { nodeEls[id].tx.textContent = nodeEls[id].n[L()]; }); }
    var sel = null;
    function highlight(id) {
      svg.classList.toggle('focus', !!id);
      Object.keys(nodeEls).forEach(function (k) { nodeEls[k].g.classList.remove('on', 'sel'); });
      edgeEls.forEach(function (x) { x.el.classList.remove('on'); });
      if (!id) return;
      nodeEls[id].g.classList.add('on');
      edgeEls.forEach(function (x) {
        if (x.e.s === id || x.e.t === id) { x.el.classList.add('on'); nodeEls[x.e.s].g.classList.add('on'); nodeEls[x.e.t].g.classList.add('on'); }
      });
    }
    function fmt(v) { return Math.abs(v) < 1 ? v.toFixed(2) : (Math.abs(v) < 10 ? v.toFixed(2) : v.toFixed(1)); }
    function select(id) {
      sel = sel === id ? null : id; highlight(sel);
      if (sel) nodeEls[sel].g.classList.add('sel');
      drawPanel();
    }
    function drawPanel() {
      if (!sel) {
        panel.innerHTML = '<h4>' + T('Click a node', '노드를 클릭해 보세요') + '</h4><p>' +
          T('Each node is a biomarker; each line is a statistically significant correlation reported in our papers and checked by hand against the source. Line width = |r|.',
            '각 노드는 바이오마커이고, 선은 논문에서 보고된 유의한 상관관계예요. 모두 원 논문과 직접 대조해 검증했어요. 선 굵기 = |r|.') + '</p>' +
          '<p>' + T('In the pipeline, a patient\'s values that deviate from healthy controls (|z| ≥ 1.5) become seed nodes, and the connected subgraph is passed to the LLM as evidence.',
            '파이프라인에서는 정상군 대비 크게 벗어난 환자 지표(|z| ≥ 1.5)를 시작 노드로 삼고, 연결된 하위 그래프를 LLM에 근거로 전달해요.') + '</p>';
        return;
      }
      var n = nodeEls[sel].n;
      var rel = kg.edges.filter(function (e) { return e.s === sel || e.t === sel; })
        .sort(function (a, b) { return Math.abs(b.r) - Math.abs(a.r); });
      var html = '<h4>' + T(n.en, n.ko) + '</h4><span class="tag plain">' + n.type + '</span>' +
        '<div class="prof"><div>' + T('Healthy', '정상군') + '<b>' + fmt(n.hc) + '</b>' + n.unit + '</div><div>MCI<b>' + fmt(n.mci) + '</b>' + n.unit + '</div></div>' +
        '<p style="font-size:.78rem;margin:0">' + n.src + '</p>' +
        '<ul>' + rel.map(function (e) {
          var other = nodeEls[e.s === sel ? e.t : e.s].n;
          return '<li><span>' + T(other.en, other.ko) + '</span><span class="r ' + (e.r >= 0 ? 'pos' : 'neg') + '">r = ' + e.r.toFixed(2) + '</span></li>';
        }).join('') + '</ul>';
      panel.innerHTML = html;
    }
    labels(); drawPanel();
    document.addEventListener('langchange', labels);
  }).catch(function () {
    panel.innerHTML = '<p>Could not load the graph data.</p>';
  });
})();
