/* Homepage motion:
   1. .reveal elements fade + rise as they enter view (IntersectionObserver)
   2. the hero photo drifts up and dims as it scrolls out of view

   Both bail out — leaving the page fully visible and static — when the
   visitor asked for reduced motion or the browser lacks IntersectionObserver.
   head.html also clears .js-reveal on a timeout if this file never loads. */
(function () {
  window.__viiydReveal = true;

  var root = document.documentElement;
  var still = !('IntersectionObserver' in window) ||
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (still) {
    root.classList.remove('js-reveal');
    return;
  }

  /* ── 1. reveal on enter ─────────────────────────────────────────── */
  var items = document.querySelectorAll('.reveal');
  if (items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    items.forEach(function (el) {
      /* stagger by position among reveal siblings, so grids cascade */
      var siblings = el.parentNode.querySelectorAll('.reveal');
      el.style.setProperty('--reveal-i', Math.min(
        Array.prototype.indexOf.call(siblings, el), 6));
      io.observe(el);
    });
  }

  /* ── 2. hero drift ──────────────────────────────────────────────── */
  var hero = document.querySelector('.hero-figure');
  if (!hero) return;

  var ticking = false;

  function drift() {
    ticking = false;
    var box = hero.getBoundingClientRect();
    if (box.bottom <= 0 || box.top >= window.innerHeight) return;
    /* 0 while the photo sits in place, ramping to 1 as its top edge
       travels from the top of the viewport to one photo-height above it */
    var past = Math.min(Math.max(-box.top, 0) / Math.max(box.height, 1), 1);
    hero.style.setProperty('--hero-drift', past.toFixed(3));
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(drift);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  drift();
})();
