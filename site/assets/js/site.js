/* Halifax Holland Line — front-end behaviour.
   Vanilla JS, no build step, no dependencies. */
(function () {
  'use strict';

  var D = window.HHL || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- helpers ---------------- */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function parseISO(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtDate(s) { var d = parseISO(s); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function fmtDateFull(s) { var d = parseISO(s); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function fmtStamp(isoStr) {
    var d = new Date(isoStr);
    var hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ', ' + hh + ':' + mm;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return '$' + Number(n).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function store(k, v) {
    try {
      if (v === undefined) { var r = localStorage.getItem('hhl.' + k); return r ? JSON.parse(r) : null; }
      localStorage.setItem('hhl.' + k, JSON.stringify(v));
    } catch (e) { return null; }
  }

  function toast(msg) {
    var host = $('.toast-host');
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    host.appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 320); }, 4200);
  }

  /* ---------------- header ---------------- */
  function initHeader() {
    var head = $('.masthead');
    if (head) {
      var onScroll = function () { head.classList.toggle('is-stuck', window.scrollY > 4); };
      onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    }
    $$('.navitem > button').forEach(function (btn) {
      var item = btn.parentNode;
      btn.setAttribute('aria-expanded', 'false');
      var open = function (state) {
        $$('.navitem').forEach(function (o) { if (o !== item) { o.classList.remove('is-open'); var b = $('button', o); if (b) b.setAttribute('aria-expanded', 'false'); } });
        item.classList.toggle('is-open', state);
        btn.setAttribute('aria-expanded', String(state));
      };
      btn.addEventListener('click', function (e) { e.stopPropagation(); open(!item.classList.contains('is-open')); });
      item.addEventListener('mouseenter', function () { if (window.matchMedia('(min-width: 1081px)').matches) open(true); });
      item.addEventListener('mouseleave', function () { if (window.matchMedia('(min-width: 1081px)').matches) open(false); });
      item.addEventListener('keydown', function (e) { if (e.key === 'Escape') { open(false); btn.focus(); } });
    });
    document.addEventListener('click', function () { $$('.navitem.is-open').forEach(function (o) { o.classList.remove('is-open'); var b = $('button', o); if (b) b.setAttribute('aria-expanded', 'false'); }); });

    var tog = $('.navtoggle'), drawer = $('.drawer');
    if (tog && drawer) {
      tog.addEventListener('click', function () {
        var open = drawer.classList.toggle('is-open');
        tog.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
      });
      $$('a', drawer).forEach(function (a) {
        a.addEventListener('click', function () { drawer.classList.remove('is-open'); tog.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) { drawer.classList.remove('is-open'); tog.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; tog.focus(); }
      });
    }
  }

  /* ---------------- reveal + counters ---------------- */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, delay = parseInt(el.getAttribute('data-reveal') || '0', 10);
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(function (e) { io.observe(e); });

    /* Failsafe. Some embedded browsers never deliver intersection callbacks,
       which would leave content permanently invisible. Sweep on scroll too. */
    var ticking = false;
    function sweep() {
      ticking = false;
      var vh = window.innerHeight, remaining = 0;
      els.forEach(function (e) {
        if (e.classList.contains('is-in')) return;
        if (e.getBoundingClientRect().top < vh * 1.15) { e.classList.add('is-in'); io.unobserve(e); }
        else remaining++;
      });
      if (!remaining) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(sweep); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    setTimeout(sweep, 900);
  }

  function initCounters() {
    var els = $$('[data-count]');
    if (!els.length || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.textContent = e.getAttribute('data-count'); }); return; }
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, target = parseFloat(el.getAttribute('data-count'));
        var prefix = el.getAttribute('data-prefix') || '', suffix = el.getAttribute('data-suffix') || '';
        var dec = (el.getAttribute('data-count').split('.')[1] || '').length;
        io.unobserve(el);
        var finalText = prefix + target.toLocaleString('en-CA', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
        if (reduce) { el.textContent = finalText; return; }
        var start = performance.now(), dur = 1100, settled = false;
        function finish() { if (!settled) { settled = true; el.textContent = finalText; } }
        (function step(now) {
          if (settled) return;
          var p = Math.min(1, (now - start) / dur);
          if (p >= 1) { finish(); return; }
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + (target * eased).toLocaleString('en-CA', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
          requestAnimationFrame(step);
        })(start);
        /* Animation frames stop in a background or throttled tab. Without this
           the figure would be left frozen at a wrong, partially counted value. */
        setTimeout(finish, dur + 700);
        document.addEventListener('visibilitychange', function onVis() {
          if (document.visibilityState === 'visible') { finish(); document.removeEventListener('visibilitychange', onVis); }
        });
      });
    }, { threshold: .4 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------------- accordion ---------------- */
  function initAccordion() {
    $$('.acc__btn').forEach(function (btn) {
      var panel = btn.nextElementSibling;
      if (!panel) return;
      var id = panel.id || ('acc-' + Math.random().toString(36).slice(2, 8));
      panel.id = id; btn.setAttribute('aria-controls', id);
      if (btn.getAttribute('aria-expanded') !== 'true') btn.setAttribute('aria-expanded', 'false');
      panel.classList.toggle('is-open', btn.getAttribute('aria-expanded') === 'true');
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.classList.toggle('is-open', !open);
      });
    });
  }

  /* ---------------- misc chrome ---------------- */
  function initChrome() {
    $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });

    var top = $('.totop');
    if (top) {
      var s = function () { top.classList.toggle('is-vis', window.scrollY > 600); };
      s(); window.addEventListener('scroll', s, { passive: true });
      top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }

    var consent = $('.consent');
    if (consent) {
      if (store('consent')) { consent.hidden = true; }
      else { consent.hidden = false; }
      $$('[data-consent]', consent).forEach(function (b) {
        b.addEventListener('click', function () { store('consent', b.getAttribute('data-consent')); consent.hidden = true; });
      });
    }
  }

  /* ---------------- next sailing widgets ---------------- */
  function initNextSailing() {
    $$('[data-next-sailing]').forEach(function (el) {
      var dir = el.getAttribute('data-next-sailing') || 'eastbound';
      var s = D.nextSailing && D.nextSailing(dir);
      if (!s) return;
      var val = $('[data-ns-value]', el), meta = $('[data-ns-meta]', el);
      if (val) val.textContent = fmtDate(s.etd) + ', 06:00';
      if (meta) meta.textContent = s.vessel + ' · voyage ' + s.voyage + ' · arrives ' + fmtDate(s.eta);
    });
  }

  /* ---------------- schedule table ---------------- */
  function initSchedule() {
    var host = $('#schedule-body');
    if (!host) return;
    var all = (D.sailings || []).slice();
    var state = { dir: 'all', q: '', month: 'all', sort: 'etd', asc: true, limit: 12 };

    function statusBadge(st) {
      var cls = 'badge--quiet';
      if (st === 'Booking open') cls = 'badge--ok';
      else if (st === 'Nearly full') cls = 'badge--warn';
      else if (st === 'At sea') cls = '';
      else if (st === 'Closed') cls = 'badge--alert';
      return '<span class="badge ' + cls + ' badge--dot">' + esc(st) + '</span>';
    }

    function filtered() {
      var out = all.filter(function (s) {
        if (state.dir !== 'all' && s.direction !== state.dir) return false;
        if (state.month !== 'all' && s.etd.slice(0, 7) !== state.month) return false;
        if (state.q) {
          var hay = (s.vessel + ' ' + s.voyage + ' ' + s.fromShort + ' ' + s.toShort).toLowerCase();
          if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
        }
        return true;
      });
      out.sort(function (a, b) {
        var k = state.sort, av = a[k], bv = b[k];
        if (k === 'space') { av = a.space; bv = b.space; }
        if (av === bv) return 0;
        return (av < bv ? -1 : 1) * (state.asc ? 1 : -1);
      });
      return out;
    }

    function render() {
      var rows = filtered();
      var shown = rows.slice(0, state.limit);
      host.innerHTML = shown.map(function (s) {
        var low = s.space < 15;
        return '<tr>' +
          '<td><span class="vessel">' + esc(s.vessel) + '</span><br><span class="voy">Voyage ' + esc(s.voyage) + '</span></td>' +
          '<td>' + esc(s.fromShort) + ' <span class="muted">to</span> ' + esc(s.toShort) + '<br><span class="tiny muted">' + esc(s.terminal) + '</span></td>' +
          '<td><b>' + fmtDate(s.etd) + '</b><br><span class="tiny muted">' + fmtDateFull(s.etd) + '</span></td>' +
          '<td><b>' + fmtDate(s.eta) + '</b><br><span class="tiny muted">' + s.transit + ' days at sea</span></td>' +
          '<td><span class="tiny muted">' + fmtDate(s.cutoff) + '</span></td>' +
          '<td><div class="flex items-center gap-1"><span class="meter' + (low ? ' is-low' : '') + '"><i style="width:' + s.space + '%"></i></span><span class="tiny muted">' + s.space + '%</span></div></td>' +
          '<td>' + statusBadge(s.status) + '</td>' +
          '<td style="text-align:right"><a class="link-arrow" href="quote.html?voyage=' + encodeURIComponent(s.voyage) + '">Book</a></td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="8" style="padding:2.4rem;text-align:center" class="muted">No sailings match those filters. Try widening the date range.</td></tr>';

      var meta = $('#schedule-count');
      if (meta) meta.textContent = 'Showing ' + shown.length + ' of ' + rows.length + ' sailings';
      var more = $('#schedule-more');
      if (more) more.hidden = shown.length >= rows.length;
    }

    $$('[data-filter-dir]').forEach(function (c) {
      c.addEventListener('click', function () {
        $$('[data-filter-dir]').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', 'true');
        state.dir = c.getAttribute('data-filter-dir'); state.limit = 12; render();
      });
    });
    var q = $('#schedule-q');
    if (q) q.addEventListener('input', function () { state.q = q.value; state.limit = 12; render(); });
    var m = $('#schedule-month');
    if (m) {
      var months = {};
      all.forEach(function (s) { months[s.etd.slice(0, 7)] = true; });
      Object.keys(months).sort().forEach(function (k) {
        var d = parseISO(k + '-01');
        var o = document.createElement('option'); o.value = k; o.textContent = MONTHS[d.getMonth()] + ' ' + d.getFullYear();
        m.appendChild(o);
      });
      m.addEventListener('change', function () { state.month = m.value; state.limit = 12; render(); });
    }
    $$('[data-sort]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-sort');
        if (state.sort === k) state.asc = !state.asc; else { state.sort = k; state.asc = true; }
        $$('[data-sort]').forEach(function (o) { o.closest('th').removeAttribute('aria-sort'); });
        b.closest('th').setAttribute('aria-sort', state.asc ? 'ascending' : 'descending');
        render();
      });
    });
    var more = $('#schedule-more');
    if (more) more.addEventListener('click', function () { state.limit += 12; render(); });
    render();
  }

  /* ---------------- home schedule preview ---------------- */
  function initSchedulePreview() {
    var host = $('#preview-body');
    if (!host) return;
    var t = D.iso(D.today);
    var rows = (D.sailings || []).filter(function (s) { return s.etd >= t; }).slice(0, 5);
    host.innerHTML = rows.map(function (s) {
      var cls = s.status === 'Booking open' ? 'badge--ok' : (s.status === 'Nearly full' ? 'badge--warn' : 'badge--quiet');
      return '<tr>' +
        '<td><span class="vessel">' + esc(s.vessel) + '</span> <span class="voy">' + esc(s.voyage) + '</span></td>' +
        '<td>' + esc(s.fromShort) + ' <span class="muted">&rarr;</span> ' + esc(s.toShort) + '</td>' +
        '<td><b>' + fmtDate(s.etd) + '</b></td>' +
        '<td>' + fmtDate(s.eta) + '</td>' +
        '<td><span class="badge ' + cls + ' badge--dot">' + esc(s.status) + '</span></td>' +
        '</tr>';
    }).join('');
  }

  /* ---------------- tracking ---------------- */
  function initTracking() {
    var form = $('#track-form');
    var out = $('#track-result');
    if (!form || !out) return;
    var input = $('#track-input');

    function empty(msg, ref) {
      out.innerHTML =
        '<div class="notice notice--warn" role="status">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v5M12 16.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/></svg>' +
        '<div><p><b>No shipment found for ' + esc(ref) + '.</b></p><p class="mb-0">' + msg + '</p></div></div>';
    }

    function render(s) {
      var tone = { active: 'badge--ok', done: 'badge--quiet', pending: 'badge--warn', hold: 'badge--alert' }[s.statusTone] || '';
      var lastDone = -1;
      s.milestones.forEach(function (m, i) { if (m.done) lastDone = i; });

      var html =
        '<article class="card" style="padding:0;overflow:hidden">' +
          '<header style="padding:clamp(20px,2.6vw,30px);border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:1.4rem;flex-wrap:wrap;align-items:flex-start">' +
            '<div>' +
              '<span class="eyebrow" style="margin-bottom:.5rem">Shipment ' + esc(s.ref) + '</span>' +
              '<h2 class="h3" style="margin-bottom:.35rem">' + esc(s.pol.split(',')[0]) + ' to ' + esc(s.pod.split(',')[0]) + '</h2>' +
              '<p class="small muted mb-0">Container <span class="mono">' + esc(s.container) + '</span> · ' + esc(s.type) + ' · ' + esc(s.service) + '</p>' +
            '</div>' +
            '<div style="text-align:right">' +
              '<span class="badge ' + tone + ' badge--dot">' + esc(s.statusLabel) + '</span>' +
              '<p class="small muted mb-0 mt-1">Estimated arrival<br><b style="color:var(--navy-900)">' + fmtDateFull(s.eta) + '</b></p>' +
            '</div>' +
          '</header>' +
          '<div style="padding:clamp(20px,2.6vw,30px);border-bottom:1px solid var(--line)">' +
            '<div class="flex between items-center" style="margin-bottom:.5rem"><span class="tiny muted">' + esc(s.pol) + '</span><span class="tiny muted">' + esc(s.pod) + '</span></div>' +
            '<div class="progressbar" style="margin-bottom:.6rem"><i style="width:' + s.progress + '%"></i></div>' +
            '<p class="tiny muted mb-0">' + s.progress + '% of the voyage complete' +
              (s.position ? ' · last position ' + esc(s.position.lat) + ' ' + esc(s.position.lon) + ' · ' + esc(s.position.speed) + ' on heading ' + esc(s.position.heading) : '') +
            '</p>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1.15fr .85fr">' +
            '<div style="padding:clamp(20px,2.6vw,30px);border-right:1px solid var(--line)">' +
              '<h3 class="h4" style="margin-bottom:1.2rem">Movement history</h3>' +
              '<ol class="timeline">' +
                s.milestones.map(function (m, i) {
                  var cls = m.done ? (i === lastDone ? 'is-done is-current' : 'is-done') : '';
                  return '<li class="' + cls + '"><span class="tl-title">' + esc(m.label) + '</span>' +
                    '<div class="tl-meta">' + esc(m.place) + ' · ' + fmtStamp(m.at) + (m.done ? '' : ' <span class="muted">(scheduled)</span>') + '</div>' +
                    (m.note ? '<div class="tl-note">' + esc(m.note) + '</div>' : '') + '</li>';
                }).join('') +
              '</ol>' +
            '</div>' +
            '<div style="padding:clamp(20px,2.6vw,30px);background:var(--ice-50)">' +
              '<h3 class="h4" style="margin-bottom:1rem">Consignment</h3>' +
              '<div class="speclist" style="grid-template-columns:1fr;margin-top:0">' +
                [['Shipper', s.shipper], ['Consignee', s.consignee], ['Commodity', s.commodity], ['Pieces', s.pieces], ['Gross weight', s.weight],
                 ['Vessel', s.vessel], ['Voyage', s.voyage], ['Departed', fmtDateFull(s.etd)]].map(function (r) {
                  return '<div><span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span></div>';
                }).join('') +
              '</div>' +
              '<h3 class="h4" style="margin:1.8rem 0 1rem">Documents</h3>' +
              '<div class="speclist" style="grid-template-columns:1fr;margin-top:0">' +
                s.documents.map(function (d) {
                  return '<div><span class="k">' + esc(d.name) + '<br><span class="tiny mono">' + esc(d.ref) + '</span></span><span class="v">' + esc(d.status) + '</span></div>';
                }).join('') +
              '</div>' +
              '<a class="btn btn--ghost btn--sm mt-3" href="contact.html">Ask about this shipment</a>' +
            '</div>' +
          '</div>' +
        '</article>';
      out.innerHTML = html;
      if (window.matchMedia('(max-width: 800px)').matches) {
        var g = out.querySelector('div[style*="grid-template-columns:1.15fr"]');
        if (g) { g.style.gridTemplateColumns = '1fr'; }
      }
    }

    function lookup(ref, push) {
      if (!ref) { out.innerHTML = ''; return; }
      var s = D.findShipment(ref);
      out.setAttribute('aria-busy', 'true');
      out.innerHTML = '<div class="notice"><p class="mb-0">Searching the operations system for <span class="mono">' + esc(ref) + '</span>…</p></div>';
      setTimeout(function () {
        out.setAttribute('aria-busy', 'false');
        if (s) { render(s); } else { empty('Check the booking or container number and try again. Numbers look like <span class="mono">HHL-2041</span> or <span class="mono">HHLU2841503</span>.', ref); }
        if (push && window.history && window.history.replaceState) {
          window.history.replaceState({}, '', 'tracking.html?ref=' + encodeURIComponent(ref));
        }
        out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 420);
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); lookup(input.value.trim(), true); });
    $$('[data-demo-ref]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); input.value = b.getAttribute('data-demo-ref'); lookup(input.value, true); });
    });
    var pre = new URLSearchParams(window.location.search).get('ref');
    if (pre) { input.value = pre; lookup(pre, false); }
  }

  /* header + home tracking mini forms redirect to the tracking page */
  function initTrackJump() {
    $$('[data-track-jump]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = $('input', f).value.trim();
        if (!v) { $('input', f).focus(); return; }
        window.location.href = 'tracking.html?ref=' + encodeURIComponent(v);
      });
    });
  }

  /* ---------------- validation ---------------- */
  function validateField(f) {
    var input = $('input, select, textarea', f);
    if (!input) return true;
    var v = (input.value || '').trim();
    var ok = true, msg = '';
    if (input.required && !v) { ok = false; msg = 'This field is required.'; }
    else if (v && input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) { ok = false; msg = 'Enter a valid email address.'; }
    else if (v && input.type === 'tel' && !/^[\d\s+().-]{7,}$/.test(v)) { ok = false; msg = 'Enter a valid phone number.'; }
    else if (input.type === 'checkbox' && input.required && !input.checked) { ok = false; msg = 'Please confirm to continue.'; }
    f.classList.toggle('is-invalid', !ok);
    var err = $('.err', f);
    if (err && msg) err.textContent = msg;
    if (input.type === 'checkbox') {
      ok = !input.required || input.checked;
      f.classList.toggle('is-invalid', !ok);
    }
    return ok;
  }
  function validateScope(scope) {
    var ok = true;
    $$('.field', scope).forEach(function (f) {
      var i = $('input, select, textarea', f);
      if (!i || !i.required) return;
      if (!validateField(f)) ok = false;
    });
    return ok;
  }
  function wireLiveValidation(scope) {
    $$('.field', scope).forEach(function (f) {
      var i = $('input, select, textarea', f);
      if (!i) return;
      i.addEventListener('blur', function () { if (i.required) validateField(f); });
      i.addEventListener('input', function () { if (f.classList.contains('is-invalid')) validateField(f); });
    });
  }

  /* ---------------- quote wizard ---------------- */
  function initWizard() {
    var wiz = $('#quote-wizard');
    if (!wiz) return;
    var steps = $$('.wstep', wiz);
    var navItems = $$('.wizard__nav li');
    var bar = $('#quote-progress i');
    var idx = 0;

    var pre = new URLSearchParams(window.location.search).get('voyage');
    if (pre) { var vn = $('#q-voyage'); if (vn) { vn.value = pre; } }

    function show(i) {
      idx = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, n) { s.classList.toggle('is-active', n === idx); });
      navItems.forEach(function (li, n) {
        li.classList.toggle('is-active', n === idx);
        li.classList.toggle('is-done', n < idx);
      });
      if (bar) bar.style.width = ((idx) / (steps.length - 1) * 100) + '%';
      var h = $('h2, h3', steps[idx]); if (h) h.setAttribute('tabindex', '-1');
      wiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (idx === steps.length - 2) buildReview();
    }

    function collect() {
      var data = {};
      $$('input, select, textarea', wiz).forEach(function (i) {
        if (!i.name) return;
        if (i.type === 'radio') { if (i.checked) data[i.name] = i.getAttribute('data-label') || i.value; }
        else if (i.type === 'checkbox') { data[i.name] = i.checked ? 'Yes' : 'No'; }
        else if (i.value) { data[i.name] = i.value; }
      });
      return data;
    }

    function buildReview() {
      var host = $('#quote-review');
      if (!host) return;
      var d = collect();
      var map = [
        ['Direction', 'direction'], ['Voyage', 'voyage'], ['Origin', 'origin'], ['Destination', 'destination'],
        ['Service', 'service'], ['Load type', 'loadtype'], ['Equipment', 'equipment'], ['Commodity', 'commodity'],
        ['Gross weight', 'weight'], ['Cargo ready', 'ready'], ['Special handling', 'special'],
        ['Company', 'company'], ['Contact', 'name'], ['Email', 'email'], ['Phone', 'phone']
      ];
      host.innerHTML = '<table class="review-table"><tbody>' + map.filter(function (m) { return d[m[1]]; }).map(function (m) {
        return '<tr><th scope="row">' + esc(m[0]) + '</th><td>' + esc(d[m[1]]) + '</td></tr>';
      }).join('') + '</tbody></table>';
    }

    $$('[data-next]', wiz).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!validateScope(steps[idx])) { var bad = $('.is-invalid input, .is-invalid select, .is-invalid textarea', steps[idx]); if (bad) bad.focus(); return; }
        store('quote-draft', collect());
        show(idx + 1);
      });
    });
    $$('[data-prev]', wiz).forEach(function (b) { b.addEventListener('click', function () { show(idx - 1); }); });
    navItems.forEach(function (li, n) {
      li.addEventListener('click', function () { if (n < idx) show(n); });
    });
    wireLiveValidation(wiz);

    var form = $('#quote-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateScope(steps[idx])) return;
      var ref = 'RFQ-' + String(Math.floor(100000 + Math.random() * 899999));
      var d = collect();
      store('quote-draft', null);
      $('#quote-ref').textContent = ref;
      $('#quote-echo').textContent = (d.origin || 'Halifax') + ' to ' + (d.destination || 'Rotterdam') + ', ' + (d.equipment || 'container') + ', ready ' + (d.ready || 'on request');
      show(steps.length - 1);
      toast('Request ' + ref + ' received. Demo only, nothing was sent.');
    });
    show(0);
  }

  /* ---------------- plain forms ---------------- */
  function initForms() {
    $$('form[data-plain]').forEach(function (form) {
      wireLiveValidation(form);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validateScope(form)) { var bad = $('.is-invalid input, .is-invalid select, .is-invalid textarea', form); if (bad) bad.focus(); return; }
        var done = $('[data-form-success]', form.parentNode) || $('#' + form.getAttribute('data-success'));
        if (done) {
          form.hidden = true; done.hidden = false;
          done.setAttribute('tabindex', '-1'); done.focus();
        }
        toast('Message received. This is a demonstration, so nothing was sent.');
      });
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    initHeader(); initReveal(); initCounters(); initAccordion(); initChrome();
    initNextSailing(); initSchedule(); initSchedulePreview();
    initTracking(); initTrackJump(); initWizard(); initForms();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
