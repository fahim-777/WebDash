(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // ---------- Theme toggle ----------
  const getTheme = () => (root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  const applyTheme = (t) => {
    if (t === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
  };
  const setStored = (t) => { try { localStorage.setItem('theme', t); } catch (e) {} };

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = getTheme() === 'light' ? 'dark' : 'light';
      applyTheme(next);
      setStored(next);
      btn.setAttribute('aria-label', next === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    });
  });

  // Sync with system theme changes only if the user hasn't picked one explicitly.
  try {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    mql.addEventListener && mql.addEventListener('change', (e) => {
      let stored = null;
      try { stored = localStorage.getItem('theme'); } catch (e2) {}
      if (!stored) applyTheme(e.matches ? 'light' : 'dark');
    });
  } catch (e) {}

  // ---------- Nav ----------
  const nav = document.querySelector('[data-nav]');
  if (nav) {
    const toggle = nav.querySelector('[data-nav-toggle]');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    const onScroll = () => {
      if (window.scrollY > 4) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    nav.querySelectorAll('.nav-mobile a').forEach((a) => {
      a.addEventListener('click', () => nav.classList.remove('is-open'));
    });
  }

  // ---------- Scroll reveal ----------
  const reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length && 'IntersectionObserver' in window && !reduced) {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    reveals.forEach((el) => obs.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // ---------- Count up ----------
  const counts = document.querySelectorAll('[data-count]');
  if (counts.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target;
          const target = parseFloat(el.dataset.count);
          const dec = parseInt(el.dataset.dec || '0', 10);
          if (reduced) {
            el.textContent = target.toFixed(dec);
            obs.unobserve(el);
            continue;
          }
          const dur = parseInt(el.dataset.dur || '1400', 10);
          const start = performance.now();
          const step = (now) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = (target * eased).toFixed(dec);
            if (t < 1) requestAnimationFrame(step);
            else el.textContent = target.toFixed(dec);
          };
          requestAnimationFrame(step);
          obs.unobserve(el);
        }
      },
      { threshold: 0.45 }
    );
    counts.forEach((el) => obs.observe(el));
  }

  // ---------- Lighthouse gauges ----------
  const gauges = document.querySelectorAll('[data-gauge]');
  if (gauges.length) {
    const C = 2 * Math.PI * 24; // radius 24
    const animate = (el) => {
      const score = Math.max(0, Math.min(100, parseInt(el.dataset.gauge, 10)));
      const fill = el.querySelector('.gauge-fill');
      if (!fill) return;
      const offset = C * (1 - score / 100);
      fill.style.strokeDasharray = String(C);
      fill.style.strokeDashoffset = String(C);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        fill.style.strokeDashoffset = reduced ? String(offset) : String(offset);
      }));
    };
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); }
          }
        },
        { threshold: 0.4 }
      );
      gauges.forEach((el) => obs.observe(el));
    } else {
      gauges.forEach(animate);
    }
  }

  // ---------- Compare bars ----------
  const bars = document.querySelectorAll('[data-compare]');
  if (bars.length) {
    const fill = (el) => {
      const v = parseFloat(el.dataset.compare);
      const max = parseFloat(el.dataset.compareMax || '6');
      const pct = Math.max(0, Math.min(100, (v / max) * 100));
      const f = el.querySelector('.compare-fill');
      if (f) requestAnimationFrame(() => { f.style.width = pct + '%'; });
    };
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) { fill(e.target); obs.unobserve(e.target); }
          }
        },
        { threshold: 0.35 }
      );
      bars.forEach((el) => obs.observe(el));
    } else {
      bars.forEach(fill);
    }
  }

  // ---------- Pointer glow ----------
  const glows = document.querySelectorAll('.glow');
  if (glows.length && window.matchMedia('(pointer: fine)').matches) {
    let raf = 0;
    let lastEvent = null;
    const handle = () => {
      raf = 0;
      if (!lastEvent) return;
      const e = lastEvent;
      glows.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (
          e.clientX < r.left - 100 || e.clientX > r.right + 100 ||
          e.clientY < r.top  - 100 || e.clientY > r.bottom + 100
        ) return;
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top)  / r.height) * 100;
        el.style.setProperty('--mx', x + '%');
        el.style.setProperty('--my', y + '%');
      });
    };
    window.addEventListener('mousemove', (e) => {
      lastEvent = e;
      if (!raf) raf = requestAnimationFrame(handle);
    }, { passive: true });
  }
})();
