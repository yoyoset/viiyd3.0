/* VIIYD 4.0 · 询价入口统一绑定
 *
 * 规格 §13：三个入口（导航询价 / 详情页同款询价 / 服务页估算器）指向同一个浮层实例，
 * 不做第二套表单。每个入口带来源标记，用于判断哪个位置在带客。
 *
 * PLAN §2-C 的偏离说明：交接包写「不做第二套表单」，但现站表单是已跑通的
 * Worker → D1 → Telegram 链路，且英文站没有微信、必须有表单兜底。
 * 折中是「同一浮层的第二状态」——浮层默认 QR 态（ZH）或表单态（EN），不是两个浮层。
 *
 * 用事件委托：新增入口只要写 data-wechat-open="<来源>"，不必再改这里。
 */
(function () {
  'use strict';

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-wechat-open]');
    if (!trigger) return;
    e.preventDefault();

    var from = trigger.getAttribute('data-wechat-open') || 'unknown';

    /* 来源写进 URL query，不新开页面 —— 微信内置浏览器里开新窗口体验很差（规格 §17） */
    if (window.history && history.replaceState) {
      var p = new URLSearchParams(window.location.search);
      p.set('from', from);
      history.replaceState(null, '', window.location.pathname + '?' + p.toString());
    }

    if (typeof window.openCommissionModal === 'function') {
      window.openCommissionModal();
    }
  });
})();
