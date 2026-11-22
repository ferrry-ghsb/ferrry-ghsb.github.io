/* Virtual Kiosk Test — browser demo on the study's own screens.
 *
 * The screen panels (kiosk/panel0N-en.webp), their label layout and card geometry
 * (kiosk/kiosk-layout.js), the hit-area measurements below and the English order
 * clip are from Bogyeom Park's demo (github.com/BogyeomPark/bogyeompark.github.io),
 * used with permission. This file adds Korean, and reports in this site's style.
 *
 * Flow as in the study: the order is heard once, then start → where to eat →
 * burger / side / drink → order check + payment → PIN → end. A wrong item is
 * ordered and counted, and the task moves on. Measures time to completion and
 * number of errors; hand speed and scanpath need the VR hardware. */
(function () {
  var stage = document.getElementById('kiosk-stage');
  if (!stage) return;
  var root = document.documentElement;
  var result = document.getElementById('kioskResult');
  var caption = document.getElementById('kiosk-caption');
  var BASE = 'kiosk/';
  function L() { return root.getAttribute('data-lang') === 'ko' ? 'ko' : 'en'; }
  function T(en, ko) { return '<span class="en">' + en + '</span><span class="ko">' + ko + '</span>'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  var COL = [[3.23, 23.93], [27.46, 48.16], [51.63, 72.33], [75.83, 96.53]];
  var TILE_R = 2.9, CARD_R = 6.54, KEY_R = 5.65;
  var BACK = { x: 62.89, y: 2.71, w: 33.2, h: 4.16 };
  var PIN = '6289';
  function box(c, top, bottom) { return { x: COL[c][0], w: COL[c][1] - COL[c][0], y: top, h: bottom - top }; }
  var back = { label: '이전 화면', area: BACK, back: true, r: 4.2 };

  var STEPS = [
    { panel: 'panel01', en: 'Touch the Start button to begin your order.', ko: '주문을 시작하려면 시작 버튼을 눌러 주세요.',
      hits: [{ label: 'Start', area: { x: 16.7, y: 46.2, w: 67.3, h: 33.6 }, round: true }] },
    { panel: 'panel02', en: 'Where will you eat?', ko: '식사하실 장소를 선택해 주세요.', target: '매장', hits: [
      { label: '매장', area: { x: 2.91, y: 47.76, w: 45.15, h: 30.14 }, r: CARD_R },
      { label: '포장', area: { x: 51.29, y: 47.76, w: 45.15, h: 30.14 }, r: CARD_R }] },
    { panel: 'panel03', en: 'Choose a burger.', ko: '햄버거 메뉴를 선택해 주세요.', target: '새우버거', hits: [back,
      { label: '소고기버거', area: box(0, 32.12, 43.43), r: TILE_R }, { label: '치즈버거', area: box(1, 32.12, 43.43), r: TILE_R },
      { label: '치킨버거', area: box(2, 32.12, 43.43), r: TILE_R }, { label: '마늘버거', area: box(3, 32.12, 43.43), r: TILE_R },
      { label: '불고기버거', area: box(0, 46.14, 57.45), r: TILE_R }, { label: '양파버거', area: box(1, 46.14, 57.45), r: TILE_R },
      { label: '새우버거', area: box(2, 46.14, 57.45), r: TILE_R }, { label: '토마토버거', area: box(3, 46.14, 57.45), r: TILE_R }] },
    { panel: 'panel04', en: 'Choose a side.', ko: '사이드 메뉴를 선택해 주세요.', target: '치즈스틱', hits: [back,
      { label: '감자튀김', area: box(0, 45.94, 57.21), r: TILE_R }, { label: '치즈스틱', area: box(1, 45.94, 57.21), r: TILE_R },
      { label: '스트링 치즈', area: box(2, 45.94, 57.21), r: TILE_R }, { label: '해시브라운', area: box(3, 45.94, 57.21), r: TILE_R },
      { label: '치킨 랩', area: box(0, 59.96, 71.23), r: TILE_R }, { label: '사과 파이', area: box(1, 59.96, 71.23), r: TILE_R },
      { label: '핫케이크', area: box(2, 59.96, 71.23), r: TILE_R }, { label: '치킨 너겟', area: box(3, 59.96, 71.23), r: TILE_R }] },
    { panel: 'panel05', en: 'Choose a drink.', ko: '음료 메뉴를 선택해 주세요.', target: '코카콜라', hits: [back,
      { label: '코카콜라', area: box(0, 59.47, 70.70), r: TILE_R }, { label: '사이다', area: box(1, 59.47, 70.70), r: TILE_R },
      { label: '환타 오렌지', area: box(2, 59.47, 70.70), r: TILE_R }, { label: '생수', area: box(3, 59.47, 70.70), r: TILE_R },
      { label: '바닐라 쉐이크', area: box(0, 73.41, 84.72), r: TILE_R }, { label: '초코 쉐이크', area: box(1, 73.41, 84.72), r: TILE_R },
      { label: '딸기 쉐이크', area: box(2, 73.41, 84.72), r: TILE_R }, { label: '우유', area: box(3, 73.41, 84.72), r: TILE_R }] },
    { panel: 'panel06', en: 'Check your order, then choose a payment method.', ko: '주문을 확인하시고 결제 방법을 선택해 주세요.', target: '카드 결제', hits: [back,
      { label: '카드 결제', area: { x: 3.23, y: 56.61, w: 45.15, h: 30.14 }, r: CARD_R },
      { label: '모바일 상품권', area: { x: 51.62, y: 56.24, w: 45.07, h: 30.14 }, r: CARD_R }] },
    { panel: 'panel07', en: 'Enter your four-digit number.', ko: '결제 비밀번호를 입력해 주세요.', keypad: true }
  ];
  var KEY_X = [6.46, 37.48, 68.58], KEY_W = 24.98, KEY_Y = [21.74, 35.64, 49.54, 63.47], KEY_H = 12.24;
  var KEYS = [['1', 0, 0], ['2', 1, 0], ['3', 2, 0], ['4', 0, 1], ['5', 1, 1], ['6', 2, 1], ['7', 0, 2], ['8', 1, 2], ['9', 2, 2], ['clear', 0, 3], ['0', 1, 3], ['ok', 2, 3]];
  var CODE_BOX = [[7.7, 23.4], [30.9, 46.7], [54.1, 69.9], [77.3, 93.1]], CODE_Y = 80.3, CODE_H = 8.2;

  var EN = { '이전 화면': 'Back', '매장': 'Eat in', '포장': 'Take out', '카드 결제': 'Card', '모바일 상품권': 'Mobile voucher',
    '소고기버거': 'Beef Burger', '치즈버거': 'Cheese Burger', '치킨버거': 'Chicken Burger', '마늘버거': 'Garlic Burger', '불고기버거': 'Bulgogi Burger',
    '양파버거': 'Onion Burger', '새우버거': 'Shrimp Burger', '토마토버거': 'Tomato Burger', '감자튀김': 'Fries', '치즈스틱': 'Cheese Sticks',
    '스트링 치즈': 'String Cheese', '해시브라운': 'Hash Brown', '치킨 랩': 'Chicken Wrap', '사과 파이': 'Apple Pie', '핫케이크': 'Hotcake',
    '치킨 너겟': 'Chicken Nuggets', '코카콜라': 'Coca-Cola', '사이다': 'Cider', '환타 오렌지': 'Fanta Orange', '생수': 'Water',
    '바닐라 쉐이크': 'Vanilla Shake', '초코 쉐이크': 'Choco Shake', '딸기 쉐이크': 'Berry Shake', '우유': 'Milk' };
  var KO_NAME = { '매장': '매장에서 식사', '포장': '포장' };
  function nm(k) { return T(esc(EN[k] || k), esc(KO_NAME[k] || k)); }
  // Korean for the English drawn on the screens (same position and size).
  var KO = { 'To start your order,|press the START button.': '주문을 시작하려면|시작버튼을 눌러주세요.', 'START': '시작',
    'Where will you be|eating today?': '식사하실 장소를|선택해 주세요.', 'Eat in': '매장에서 식사', 'Take out': '포장', 'Back': '이전 화면',
    'Choose a BURGER.': '햄버거 메뉴를 선택해 주세요.', 'Choose a SIDE.': '사이드 메뉴를 선택해 주세요.', 'Choose a DRINK.': '음료 메뉴를 선택해 주세요.',
    'Check your order.': '주문을 확인하세요.', 'Choose how to pay.': '결제 방법을 선택해 주세요.', 'Card': '카드 결제', 'Mobile voucher': '모바일 상품권',
    'DELETE': '지우기', 'OK': '확인', 'Thank you.': '수고하셨습니다.' };
  Object.keys(EN).forEach(function (k) { if (!KO[EN[k]]) KO[EN[k]] = k; });

  var LAYOUT = window.KIOSK_EN || {}, CARDS = window.KIOSK_CARDS || { items: {}, slots: {} };
  function layer(panel) {
    return (LAYOUT[panel] || []).map(function (i) {
      var en = i.t.join('|'), ko = (KO[en] || en).split('|');
      return '<span class="kiosk-lbl" style="left:' + i.x + '%;top:' + i.y + '%;width:' + i.w + '%;height:' + i.h + '%;color:' + i.c +
        ';font-size:' + i.s + 'cqw;text-align:' + i.a + (i.r ? ';border-radius:' + i.r + 'cqw' : '') + '">' +
        T(i.t.map(esc).join('<br>'), ko.map(esc).join('<br>')) + '</span>';
    }).join('');
  }
  function photoStyle(item) {
    var x = item.photo[0], y = item.photo[1], w = item.photo[2], h = item.photo[3];
    return 'background-image:url(' + BASE + item.p + '-en.webp);background-size:' + (10000 / w).toFixed(2) + '% ' + (10000 / h).toFixed(2) + '%;' +
      'background-position:' + (x / (100 - w) * 100).toFixed(3) + '% ' + (y / (100 - h) * 100).toFixed(3) + '%';
  }
  function cardLayer(panel) {
    return (CARDS.slots[panel] || []).map(function (s) {
      var key = S.chosen[s.src], item = CARDS.items[key]; if (!item) return '';
      function band(a, b) { return 'top:' + a + '%;height:' + (b - a) + '%'; }
      return '<div class="kiosk-card" style="left:' + s.x + '%;top:' + s.y + '%;width:' + s.w + '%;height:' + s.h + '%;background:' + s.cw + ';border-radius:' + s.r + 'cqw">' +
        '<span class="kiosk-card-photo" style="height:' + s.photo + '%;' + photoStyle(item) + '"></span>' +
        '<b style="' + band(s.name[0], s.name[1]) + ';font-size:' + s.ns + 'cqw;color:' + s.nc + '">' + T(esc(item.en), esc(key)) + '</b>' +
        '<i style="' + band(s.price[0], s.price[1]) + ';font-size:' + s.ps + 'cqw;color:' + s.pc + '">' + esc(item.price) + '</i></div>';
    }).join('');
  }

  var PANELS = STEPS.map(function (s) { return s.panel; }).concat('panel08');
  stage.innerHTML = '<div class="kiosk-panel">' +
    PANELS.map(function (p) { return '<img class="kiosk-img" data-panel="' + p + '" alt="" src="' + BASE + p + '-en.webp">'; }).join('') +
    PANELS.map(function (p) { return '<div class="kiosk-lbl-layer" data-panel="' + p + '">' + layer(p) + '</div>'; }).join('') +
    '<div class="kiosk-overlay"></div>' +
    '<button class="kiosk-veil" type="button" hidden><b></b><span></span></button>' +
    '</div>';
  var overlay = stage.querySelector('.kiosk-overlay'), veil = stage.querySelector('.kiosk-veil');
  var imgs = {}, layers = {};
  stage.querySelectorAll('.kiosk-img').forEach(function (im) { imgs[im.getAttribute('data-panel')] = im; });
  stage.querySelectorAll('.kiosk-lbl-layer').forEach(function (d) { layers[d.getAttribute('data-panel')] = d; });
  function show(panel) {
    Object.keys(imgs).forEach(function (p) {
      var on = p === panel; imgs[p].classList.toggle('on', on); layers[p].classList.toggle('on', on);
      imgs[p].setAttribute('aria-hidden', String(!on)); layers[p].setAttribute('aria-hidden', String(!on));
    });
  }

  var S = { step: -1, t0: 0, errors: 0, code: '', chosen: {}, picks: [], heard: false, read: false };

  // ---------- the order, heard once ----------
  var player = new Audio(); player.preload = 'auto';
  var startHit = null;
  function release() { if (startHit) { startHit.disabled = false; startHit.classList.add('ready'); } }
  function lift() { veil.classList.add('off'); veil.disabled = true; release(); }
  function playing() {
    S.heard = true; veil.classList.add('playing');
    veil.querySelector(':scope > b').innerHTML = T('Hold it in memory', '기억해 두세요');
    veil.querySelector(':scope > span').innerHTML = T('It is not repeated.', '다시 들려드리지 않아요.');
  }
  function readInstead() {
    if (S.read) return;
    S.read = true; S.heard = true; veil.classList.add('playing');
    veil.querySelector(':scope > b').innerHTML = T('Read it once', '한 번 읽어 두세요');
    var n = 12, sp = veil.querySelector(':scope > span');
    function txt() { sp.innerHTML = T('Eat in · shrimp burger · cheese sticks · Coca-Cola · card · PIN 6289', '매장 · 새우버거 · 치즈스틱 · 코카콜라 · 카드 결제 · 비밀번호 6289') + '<br><small>' + n + 's</small>'; }
    txt();
    var iv = setInterval(function () { n--; txt(); if (n <= 0) { clearInterval(iv); lift(); } }, 1000);
  }
  function speakFallback() {
    if (!('speechSynthesis' in window)) return readInstead();
    var voices = speechSynthesis.getVoices() || [], lang = L();
    var v = voices.filter(function (x) { return (x.lang || '').toLowerCase().indexOf(lang) === 0; })[0];
    if (voices.length && !v) return readInstead();
    var u = new SpeechSynthesisUtterance(lang === 'ko'
      ? '식사 장소는 매장입니다. 키오스크로 새우버거, 치즈스틱, 코카콜라를 주문해 주세요. 결제 방법은 카드 결제이고, 카드 결제 비밀번호는 6, 2, 8, 9입니다.'
      : 'The place to eat is a restaurant. Please use the kiosk to order a shrimp burger, cheese sticks, and a Coca-Cola. Use a credit card as the payment method, and the card payment password is 6 2 8 9.');
    if (v) u.voice = v; u.lang = lang === 'ko' ? 'ko-KR' : 'en-US'; u.rate = 0.95;
    u.onend = lift; u.onerror = readInstead;
    speechSynthesis.cancel(); speechSynthesis.speak(u); playing();
    setTimeout(function () { if (!speechSynthesis.speaking && !veil.classList.contains('off')) readInstead(); }, 3000);
  }
  veil.addEventListener('click', function () {
    if (S.heard) return;
    player.src = BASE + 'audio/order-' + L() + '.mp3';
    player.onended = lift;
    var p = player.play();
    if (p && p.then) p.then(playing, speakFallback); else speakFallback();
  });

  // ---------- rendering ----------
  function paint(step, extra, silent) {
    var hits = (step.hits || []).map(function (h, i) {
      return '<button class="kiosk-hit' + (h.round ? ' round' : '') + '" type="button" data-i="' + i + '" aria-label="' + esc(EN[h.label] || h.label) + '" style="left:' + h.area.x +
        '%;top:' + h.area.y + '%;width:' + h.area.w + '%;height:' + h.area.h + '%' + (h.r ? ';border-radius:' + h.r + 'cqw' : '') + '"></button>';
    }).join('');
    show(step.panel);
    overlay.innerHTML = hits + cardLayer(step.panel) + (extra || '');
    caption.innerHTML = silent ? '' : T(step.en, step.ko);
  }
  function renderStep() {
    var step = STEPS[S.step];
    if (step.keypad) return renderKeypad();
    paint(step);
    overlay.querySelectorAll('[data-i]').forEach(function (b) {
      b.addEventListener('click', function () {
        var hit = step.hits[Number(b.getAttribute('data-i'))];
        if (hit.back) return goBack();
        if (step.target) {
          S.chosen[step.panel] = hit.label;
          S.picks.push({ panel: step.panel, label: hit.label, right: hit.label === step.target });
          if (hit.label !== step.target) S.errors++;
        }
        S.step++; renderStep();
      });
    });
  }
  function renderKeypad() {
    var step = STEPS[S.step];
    var keys = KEYS.map(function (k) {
      return '<button class="kiosk-hit" type="button" data-k="' + k[0] + '" aria-label="' + k[0] + '" style="left:' + KEY_X[k[1]] + '%;top:' + KEY_Y[k[2]] + '%;width:' + KEY_W + '%;height:' + KEY_H + '%;border-radius:' + KEY_R + 'cqw"></button>';
    }).join('');
    var digits = CODE_BOX.map(function (b, i) {
      return '<span class="kiosk-digit" style="left:' + b[0] + '%;top:' + CODE_Y + '%;width:' + (b[1] - b[0]) + '%;height:' + CODE_H + '%">' +
        (S.code[i] ? (i === S.code.length - 1 ? S.code[i] : '•') : '') + '</span>';
    }).join('');
    paint(step, keys + '<div aria-live="polite">' + digits + '</div>');
    overlay.querySelectorAll('[data-k]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-k');
        if (k === 'clear') S.code = S.code.slice(0, -1);
        else if (k === 'ok') { if (!S.code.length) return; if (S.code !== PIN) S.errors++; return finish(); }
        else if (S.code.length < 4) S.code += k;
        renderKeypad();
      });
    });
  }
  function goBack() { if (S.step <= 1) return; S.step--; renderStep(); }
  function begin() {
    S.step = 1; S.t0 = performance.now(); S.errors = 0; S.code = ''; S.chosen = {}; S.picks = [];
    result.hidden = true; renderStep();
  }
  function renderStart() {
    S.step = 0; S.heard = false; S.read = false;
    paint(STEPS[0], '', true);
    startHit = overlay.querySelector('[data-i]'); startHit.disabled = true;
    startHit.addEventListener('click', begin);
    veil.hidden = false; veil.disabled = false; veil.classList.remove('off', 'playing');
    veil.querySelector(':scope > b').innerHTML = '🔊 ' + T('Listen first', '먼저 듣기');
    veil.querySelector(':scope > span').innerHTML = T('The order is spoken once — press to play it.', '주문 내용은 한 번만 들려드려요. 눌러서 재생하세요.');
  }

  // ---------- results ----------
  var ASKED = { panel02: '매장', panel03: '새우버거', panel04: '치즈스틱', panel05: '코카콜라', panel06: '카드 결제' };
  var ROWS = [['panel02', 'Where to eat', '식사 장소'], ['panel03', 'Burger', '햄버거'], ['panel04', 'Side', '사이드'], ['panel05', 'Drink', '음료'], ['panel06', 'Payment', '결제 방법']];
  // Park et al., 2024, JMIR 26:e54538 — group means (healthy n=22, MCI n=32)
  var HC = { time: 39.48, err: 1.73 }, MCI = { time: 105.39, err: 4 };
  function strip(label, you, youTxt, hc, mci, unit, top) {
    var W = 560, mid = 46, x = function (v) { return 8 + Math.max(0, Math.min(1, v / top)) * (W - 16); };
    function ref(v, en, ko) {
      var px = x(v).toFixed(1);
      return '<line x1="' + px + '" y1="38" x2="' + px + '" y2="54"/><text class="kv-ref" x="' + px + '" y="16"><tspan class="en">' + en + '</tspan><tspan class="ko">' + ko + '</tspan></text>' +
        '<text class="kv-refval" x="' + px + '" y="31">' + v + unit + '</text>';
    }
    return '<figure class="kiosk-place"><figcaption>' + label + '</figcaption><svg viewBox="0 0 ' + W + ' 78" role="img">' +
      '<line class="kv-track" x1="8" y1="' + mid + '" x2="' + (W - 8) + '" y2="' + mid + '"/><g class="kv-tick">' + ref(hc, 'Healthy', '정상군') + ref(mci, 'With MCI', 'MCI군') + '</g>' +
      '<circle class="kv-you" cx="' + x(you).toFixed(1) + '" cy="' + mid + '" r="7"/><text class="kv-youlabel" x="' + x(you).toFixed(1) + '" y="72">' + youTxt + '</text></svg></figure>';
  }
  function finish() {
    var secs = (performance.now() - S.t0) / 1000, errors = S.errors;
    S.step = -1; caption.innerHTML = ''; show('panel08'); overlay.innerHTML = '';
    var rows = ROWS.map(function (r) {
      var ask = ASKED[r[0]], got = S.chosen[r[0]], right = got === ask;
      var first = S.picks.filter(function (p) { return p.panel === r[0] && !p.right; })[0];
      return '<li class="' + (right ? (first ? 'fixed' : '') : 'wrong') + '"><b>' + T(r[1], r[2]) + '</b><span>' + (got ? nm(got) : '—') +
        (right ? '' : ' <i>' + T('asked for ', '요청: ') + nm(ask) + '</i>') +
        (right && first ? ' <i>' + T('first picked ', '처음 선택: ') + nm(first.label) + '</i>' : '') + '</span></li>';
    }).join('') + '<li class="' + (S.code === PIN ? '' : 'wrong') + '"><b>' + T('PIN', '비밀번호') + '</b><span>' + (esc(S.code) || '—') +
      (S.code === PIN ? '' : ' <i>' + T('asked for ', '요청: ') + PIN + '</i>') + '</span></li>';
    result.innerHTML = '<h3>' + T('Your run, against the study', '나의 결과와 연구 평균 비교') + '</h3><div class="kiosk-places">' +
      strip(T('Time to completion', '과제 완료 시간'), secs, secs.toFixed(1) + ' s', HC.time, MCI.time, ' s', Math.max(MCI.time * 1.25, secs * 1.1)) +
      strip(T('Number of errors', '오류 수'), errors, String(errors), HC.err, MCI.err, '', Math.max(6, errors + 1)) + '</div>' +
      '<ol class="kiosk-steps">' + rows + '</ol>' +
      (S.read ? '<p class="widget-note">' + T('You read the order instead of hearing it, so this run is not the same task.', '주문을 듣지 않고 글로 읽었기 때문에, 연구와 같은 조건의 수행은 아니에요.') + '</p>' : '') +
      '<p class="widget-note">' + T('The study\'s other two measures — hand-movement speed and scanpath length — need the headset\'s controller and eye tracker, so a browser cannot take them. These are the two groups\' averages from the study, not a score: a browser cannot screen anyone for anything.',
        '연구의 나머지 두 지표인 손 움직임 속도와 시선 경로 길이는 VR 컨트롤러와 시선 추적기가 있어야 측정할 수 있어요. 위의 값은 연구에 참여한 두 집단의 평균이지 점수가 아니에요. 브라우저 데모로는 어떤 선별도 할 수 없어요.') + '</p>' +
      '<button type="button" class="btn small" data-act="again">' + T('Run it again', '다시 하기') + '</button>';
    result.hidden = false;
    result.querySelector('[data-act="again"]').addEventListener('click', function () { result.hidden = true; renderStart(); stage.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  renderStart();
})();
