/* VIIYD 4.0 · 横滚轨道箭头（首页「最近交付」）
 *
 * ≤768 时 .home-recent 变成两行横滚。触屏能滑，但没有任何视觉提示，
 * 用户不知道右边还有 —— 加一对箭头当 affordance，同时给非触屏窄窗一个点法。
 * 桌面是网格（无溢出），CSS 里直接把箭头 display:none，这里的显隐逻辑也算不出溢出。
 */
(function () {
  'use strict';

  var rails = document.querySelectorAll('[data-rail]');

  Array.prototype.forEach.call(rails, function (rail) {
    var wrap = rail.parentNode;
    var prev = wrap.querySelector('[data-rail-prev]');
    var next = wrap.querySelector('[data-rail-next]');
    if (!prev || !next) return;

    function step() {
      /* 一屏翻一屏，留 40px 重叠，让用户看得出是同一条轨道 */
      return Math.max(rail.clientWidth - 40, 120);
    }

    function sync() {
      var max = rail.scrollWidth - rail.clientWidth;
      if (max <= 4) { prev.hidden = true; next.hidden = true; return; }
      prev.hidden = rail.scrollLeft <= 4;
      next.hidden = rail.scrollLeft >= max - 4;
    }

    prev.addEventListener('click', function () {
      rail.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    next.addEventListener('click', function () {
      rail.scrollBy({ left: step(), behavior: 'smooth' });
    });

    rail.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });
})();
