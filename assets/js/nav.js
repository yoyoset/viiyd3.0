/* VIIYD 4.0 · 移动端导航
 *
 * 桌面端导航项直接平铺，这里只管 ≤768 的抽屉。
 * 顶栏默认不吸顶（吸顶会遮挡照片，handoff §4.1），
 * 但移动端滚过 400px 后吸顶并压到 48px —— 长列表页往回翻时才不用滚到顶。
 */
(function () {
  'use strict';

  var head   = document.querySelector('.site-head');
  var burger = document.querySelector('.site-head__burger');
  var drawer = document.getElementById('site-drawer');
  if (!head) return;

  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = drawer.hidden;
      drawer.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      burger.classList.toggle('is-open', open);
    });

    /* 点抽屉里的链接后自动收起 —— 同页锚点跳转时抽屉挡着内容 */
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        drawer.hidden = true;
        burger.setAttribute('aria-expanded', 'false');
        burger.classList.remove('is-open');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) burger.click();
    });
  }

  /* 滚动吸顶：只在移动端生效，用 rAF 节流避免 scroll 抖动 */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      head.classList.toggle('is-stuck', window.scrollY > 400);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* 图片进入视口淡入 —— handoff §7：只做 opacity，不做位移不做缩放。
   reveal.js（3.0）绑的是 .hero-figure / .reveal，4.0 里这两个类都不存在，已删除。
   这里是它的替代，只有 12 行，够用。 */
(function () {
  'use strict';
  var els = document.querySelectorAll('.fade-in');
  if (!els.length) return;
  /* 不支持 IO 或用户要求减少动效 → 直接全部显示，不留隐藏元素 */
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { rootMargin: '80px' });
  els.forEach(function (el) { io.observe(el); });
})();
