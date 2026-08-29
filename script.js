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
