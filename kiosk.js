/* Web version of the Virtual Kiosk Test (demo only, not a diagnostic tool) */
(function () {
  var host = document.getElementById('kioskDemo');
  if (!host) return;
  var screen = host.querySelector('.kiosk-screen');
  var body = screen.querySelector('.ks-body');
  var stepLbl = screen.querySelector('.ks-step');
  var bar = screen.querySelector('.ks-progress i');
  var result = document.getElementById('kioskResult');
  var hideMission = document.getElementById('hideMission');
  var mission = document.getElementById('kioskMission');

  function T(en, ko) { return '<span class="en">' + en + '</span><span class="ko">' + ko + '</span>'; }

  var BURGERS = [
    ['Bulgogi', '불고기버거'], ['Cheese', '치즈버거'], ['Shrimp', '새우버거', 1], ['Chicken', '치킨버거'],
    ['Hanwoo beef', '한우버거'], ['Double', '더블버거'], ['Teriyaki', '데리버거'], ['Bacon', '베이컨버거']
  ];
  var SIDES = [
    ['French fries', '감자튀김', 0, '🍟'], ['Cheese sticks', '치즈스틱', 1, '🧀'], ['Nuggets', '치킨너겟', 0, '🍗'],
    ['Corn salad', '콘샐러드', 0, '🥗'], ['Onion rings', '어니언링', 0, '🧅'], ['Fried shrimp', '새우튀김', 0, '🍤']
  ];
  var DRINKS = [
    ['Cider', '사이다', 0, '🥤'], ['Orange juice', '오렌지주스', 0, '🧃'], ['Coca-Cola', '코카콜라', 1, '🥤'],
    ['Americano', '아메리카노', 0, '☕'], ['Milkshake', '밀크쉐이크', 0, '🥛'], ['Iced tea', '아이스티', 0, '🧋']
  ];
  var PIN = '6289';

  var S; // session state
  function reset() {
    S = { step: 0, t0: 0, errors: 0, path: 0, last: null, moveTime: 0, lastT: 0,
          dwellCorrect: 0, dwellAll: 0, hoverEl: null, hoverT: 0, pin: '', cart: [], touch: false, perStep: [] };
    result.hidden = true;
  }

  // pointer tracking (proxy for hand movement + gaze dwell)
  screen.addEventListener('pointermove', function (e) {
    if (!S || !S.t0 || S.step >= 7) return;
    if (e.pointerType === 'touch') S.touch = true;
    var now = performance.now();
    if (S.last) {
      var dx = e.clientX - S.last[0], dy = e.clientY - S.last[1], d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0.5) { S.path += d; S.moveTime += Math.min(now - S.lastT, 100); }
    }
    S.last = [e.clientX, e.clientY]; S.lastT = now;
  });
  screen.addEventListener('pointerover', function (e) {
    var it = e.target.closest('.ks-item'); closeDwell();
    if (it && S && S.t0) { S.hoverEl = it; S.hoverT = performance.now(); }
  });
  screen.addEventListener('pointerout', function (e) {
    var it = e.target.closest('.ks-item'); if (it && it === S.hoverEl) closeDwell();
  });
  function closeDwell() {
    if (S && S.hoverEl) {
      var d = performance.now() - S.hoverT; S.dwellAll += d;
      if (S.hoverEl.getAttribute('data-ok') === '1') S.dwellCorrect += d;
      S.hoverEl = null;
    }
  }

  var STEPS = 6;
  function setHead(i) {
    stepLbl.innerHTML = i === 0 ? T('Start', '시작') : (i > STEPS ? T('End', '종료') : T('Step ' + i + ' / ' + STEPS, i + ' / ' + STEPS + ' 단계'));
    bar.style.width = (Math.min(i, STEPS) / STEPS * 100) + '%';
  }
  function cartLine() {
    return S.cart.length ? '<div class="ks-cart">' + T('Order: ', '주문 내역: ') + S.cart.join(' · ') + '</div>' : '';
  }
  function grid(items, cls, emoDefault) {
    return '<div class="ks-grid ' + (cls || '') + '">' + items.map(function (it) {
      return '<button type="button" class="ks-item" data-ok="' + (it[2] ? 1 : 0) + '" data-name="' + it[1] + '"><span class="emo">' + (it[3] || emoDefault) + '</span>' + T(it[0], it[1]) + '<span class="price">' + (it[4] || '₩' + (4 + Math.floor(Math.random() * 4)) + ',' + ['000', '500'][Math.floor(Math.random() * 2)]) + '</span></button>';
    }).join('') + '</div>';
  }

  function render() {
    closeDwell();
    var i = S.step; setHead(i);
    var h = '';
    if (i === 0) {
      h = '<div class="ks-prompt">' + T('Press start to begin your order.', '주문을 시작하려면 시작 버튼을 눌러주세요.') + '</div><button type="button" class="ks-start" data-act="start">' + T('Start', '시작') + '</button>';
    } else if (i === 1) {
      h = '<div class="ks-prompt">' + T('Where will you eat?', '식사하실 장소를 선택해 주세요.') + '</div>' +
        '<div class="ks-grid">' +
        '<button type="button" class="ks-item big" data-ok="1" data-name="매장"><span class="emo">🍽️</span>' + T('Eat in', '매장에서 식사') + '</button>' +
        '<button type="button" class="ks-item big" data-ok="0" data-name="포장"><span class="emo">🛍️</span>' + T('Take out', '테이크아웃') + '</button></div>';
    } else if (i === 2) {
      h = '<div class="ks-prompt">' + T('① Choose a burger', '① 햄버거 메뉴를 선택해 주세요.') + '</div>' + grid(BURGERS, 'g4', '🍔') + cartLine();
    } else if (i === 3) {
      h = '<div class="ks-prompt">' + T('② Choose a side', '② 사이드 메뉴를 선택해 주세요.') + '</div>' + grid(SIDES, '', '🍟') + cartLine();
    } else if (i === 4) {
      h = '<div class="ks-prompt">' + T('③ Choose a drink', '③ 음료 메뉴를 선택해 주세요.') + '</div>' + grid(DRINKS, '', '🥤') + cartLine();
    } else if (i === 5) {
      h = '<div class="ks-prompt">' + T('Check your order and choose a payment method.', '주문을 확인하시고 결제 방법을 선택해 주세요.') + '</div>' + cartLine() +
        '<div class="ks-grid">' +
        '<button type="button" class="ks-item big" data-ok="0" data-name="모바일 상품권"><span class="emo">📱</span>' + T('Mobile voucher', '모바일 상품권') + '</button>' +
        '<button type="button" class="ks-item big" data-ok="1" data-name="카드 결제"><span class="emo">💳</span>' + T('Card', '카드 결제') + '</button></div>';
    } else if (i === 6) {
      var dots = ''; for (var k = 0; k < 4; k++) dots += '<span>' + (S.pin[k] ? '•' : '') + '</span>';
      h = '<div class="ks-prompt">' + T('Enter your card PIN, then press OK.', '결제 비밀번호를 입력한 후 확인을 눌러주세요.') + '</div>' +
        '<div class="ks-pin">' + dots + '</div><div class="ks-keys">' +
        [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return '<button type="button" class="ks-key" data-key="' + n + '">' + n + '</button>'; }).join('') +
        '<button type="button" class="ks-key fn" data-key="clr">' + T('Clear', '전체삭제') + '</button>' +
        '<button type="button" class="ks-key" data-key="0">0</button>' +
        '<button type="button" class="ks-key fn" data-key="ok">' + T('OK', '확인') + '</button></div>';
    } else {
      h = '<div class="ks-end"><div class="emo">🎉</div><h4>' + T('Thank you!', '수고하셨습니다.') + '</h4><p style="font-size:.85rem;color:#6a7280">' + T('Your results are shown next to the kiosk.', '결과는 키오스크 옆에 표시됩니다.') + '</p>' +
        '<button type="button" class="ks-item" data-act="again" style="margin-top:10px">' + T('Try again', '다시 하기') + '</button></div>';
    }
    if (i >= 1 && i <= 6 && hideMission && hideMission.checked) {
      h += '<div class="ks-hidden-mission">' + T('Mission hidden — order from memory.', '미션이 숨겨져 있어요. 기억해서 주문하세요.') + '</div>';
    }
    body.innerHTML = h;
  }

  function wrong(el) {
    S.errors++; el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong');
  }

  body.addEventListener('click', function (e) {
    var act = e.target.closest('[data-act]');
    if (act && act.getAttribute('data-act') === 'start') { S.t0 = performance.now(); S.step = 1; render(); applyMission(); return; }
    if (act && act.getAttribute('data-act') === 'again') { reset(); render(); applyMission(); return; }
    var key = e.target.closest('.ks-key');
    if (key && S.step === 6) {
      var k = key.getAttribute('data-key');
      if (k === 'clr') S.pin = '';
      else if (k === 'ok') {
        if (S.pin === PIN) { finish(); return; }
        S.pin = ''; wrong(key);
      } else if (S.pin.length < 4) S.pin += k;
      var spans = body.querySelectorAll('.ks-pin span');
      spans.forEach(function (sp, idx) { sp.textContent = S.pin[idx] ? '•' : ''; });
      return;
    }
    var it = e.target.closest('.ks-item');
    if (!it || !S.t0) return;
    if (it.getAttribute('data-ok') === '1') {
      if (S.step >= 2 && S.step <= 4) S.cart.push(it.getAttribute('data-name'));
      S.step++; render();
    } else wrong(it);
  });

  function applyMission() {
    if (!mission) return;
    mission.style.filter = (hideMission && hideMission.checked && S.t0 && S.step < 7) ? 'blur(6px)' : '';
  }
  if (hideMission) hideMission.addEventListener('change', function () { applyMission(); if (S.t0) render(); });

  // published group means (Park et al., 2024, JMIR 26:e54538; Kim et al., 2023, JMIR 25:e48093)
  var REF = { time: [39.48, 105.39], err: [1.73, 4.0], fix: [56.0, 43.7] };
  function gauge(v, hc, mci, lowerBetter) {
    var lo = Math.min(hc, mci), hi = Math.max(hc, mci), span = hi - lo;
    var pos = (v - (lo - span * 0.5)) / (span * 2) * 100;
    if (!lowerBetter) pos = 100 - pos;
    pos = Math.max(2, Math.min(98, pos));
    return '<div class="gauge"><i style="left:' + pos + '%"></i></div><div class="gauge-labels"><span>' +
      T('HC', '정상') + '</span><span>' + T('MCI', 'MCI') + '</span></div>';
  }
  function finish() {
    closeDwell();
    var secs = (performance.now() - S.t0) / 1000;
    S.step = 7; render(); applyMission();
    var speed = S.moveTime > 0 ? S.path / (S.moveTime / 1000) : 0;
    var fix = S.dwellAll > 300 && !S.touch ? (S.dwellCorrect / S.dwellAll * 100) : null;
    var html = '<div class="res-grid">' +
      '<div class="res"><span>' + T('Time to completion', '과제 완료 시간') + '</span><b>' + secs.toFixed(1) + ' s</b>' + gauge(secs, REF.time[0], REF.time[1], true) +
      '<span class="ref">' + T('Published: HC 39.5 s · MCI 105.4 s', '논문 보고: 정상 39.5초 · MCI 105.4초') + '</span></div>' +
      '<div class="res"><span>' + T('Number of errors', '오류 수') + '</span><b>' + S.errors + '</b>' + gauge(S.errors, REF.err[0], REF.err[1], true) +
      '<span class="ref">' + T('Published: HC 1.7 · MCI 4.0', '논문 보고: 정상 1.7 · MCI 4.0') + '</span></div>' +
      '<div class="res"><span>' + T('Pointer speed (proxy for hand speed)', '포인터 속도 (손 움직임 속도 대용)') + '</span><b>' + Math.round(speed) + ' px/s</b>' +
      '<span class="ref">' + T('VR measures the controller in m/s (HC 0.23 · MCI 0.17).', 'VR에서는 컨트롤러 속도를 m/s로 측정해요 (정상 0.23 · MCI 0.17).') + '</span></div>' +
      '<div class="res"><span>' + T('Dwell on correct items (proxy for gaze)', '정답 항목 체류 비율 (시선 대용)') + '</span><b>' + (fix == null ? 'n/a' : fix.toFixed(0) + '%') + '</b>' +
      (fix == null ? '<span class="ref">' + T('Needs a mouse — touch screens have no hover.', '마우스가 필요해요. 터치 화면은 hover가 없어요.') + '</span>' :
        gauge(fix, REF.fix[0], REF.fix[1], false) + '<span class="ref">' + T('Eye tracking in VR: HC 56% · MCI 43.7%', 'VR 시선 추적: 정상 56% · MCI 43.7%') + '</span>') + '</div>' +
      '</div><p class="widget-note">' + T('A browser demo of the task design only. It is not a screening or diagnostic test: the real test runs in VR with eye and hand tracking, and its results come from a trained model, not these cut-offs.',
        '과제 설계를 체험하기 위한 웹 데모예요. 선별·진단 검사가 아니에요. 실제 검사는 VR에서 시선·손 추적으로 진행되고, 결과는 이런 기준값이 아니라 학습된 모델로 판정해요.') + '</p>';
    result.innerHTML = html; result.hidden = false;
  }

  document.addEventListener('langchange', function () { /* both languages are in the DOM */ });
  reset(); render();
})();
