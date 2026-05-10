(function () {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

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
})();
