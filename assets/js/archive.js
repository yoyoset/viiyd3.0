/* VIIYD 4.0 · 作品档案页：筛选 + 视图切换
 *
 * 设计约定（PLAN §8）：
 * - 列表由 Hugo 构建期直出全量 DOM，本文件只做显隐。**JS 失效时页面仍是完整的作品列表。**
 * - chip 上的计数是构建期算好的，这里不重算 —— 计数反映的是总量，不是当前筛选结果。
 * - 筛选状态写进 URL query，用 replaceState，刷新与分享都能还原。
 * - 分批显示（规格 §8.5）：一次露 12 条，「加载更多」再放 12 条。
 *   **全部 56 条都在 DOM 里**，只是被 hidden 藏着 —— 所以 JS 失效时是完整列表，
 *   而不是只剩 12 条。图片本来就带 loading="lazy"，没露出来的不会产生请求。
 */
(function () {
  'use strict';

  var root = document.querySelector('[data-view-panel]');
  if (!root) return;                       // 不在档案页

  var panels  = document.querySelectorAll('[data-view-panel]');
  var chips   = document.querySelectorAll('.chip[data-filter]');
  var empty   = document.querySelector('[data-empty]');
  var clears  = document.querySelectorAll('[data-filter-clear]');
  var elSys   = document.querySelector('[data-status-system]');
  var elCount = document.querySelector('[data-status-count]');

  var LABEL_ALL_SYS  = elSys  ? elSys.textContent  : '';

  var state = { system: 'all' };

  var PAGE = 12;
  var shownLimit = PAGE;
  var moreBtn = document.querySelector('[data-load-more]');
  var moreCount = document.querySelector('[data-load-more-count]');

  /* ── 筛选 ── */
  function apply() {
    var shown = 0, matched = 0;
    panels.forEach(function (panel) {
      var seen = 0;
      [].slice.call(panel.querySelectorAll('[data-system]')).forEach(function (item) {
        var ok = (state.system === 'all' || item.dataset.system === state.system);
        if (ok) seen++;
        /* 匹配但超出当前批次的也藏起来 —— 这是「加载更多」的实现方式 */
        item.hidden = !ok || seen > shownLimit;
        if (ok && panel === visiblePanel()) { matched++; if (seen <= shownLimit) shown++; }
      });
    });

    if (moreBtn) {
      var rest = matched - shown;
      moreBtn.hidden = rest <= 0;
      if (moreCount) moreCount.textContent = rest;
    }

    chips.forEach(function (chip) {
      var on = state[chip.dataset.filter] === chip.dataset.value;
      var isAll = chip.dataset.value === 'all';
      chip.classList.toggle('is-selected', on && !isAll);
      chip.classList.toggle('is-all-active', on && isAll);
      /* 选中态不能只体现在 class 上 —— 读屏用户听不出哪个筛选生效 */
      chip.setAttribute('aria-pressed', String(on));
    });

    var filtering = state.system !== 'all';
    if (elSys)   elSys.textContent   = state.system === 'all' ? LABEL_ALL_SYS  : labelOf('system', state.system);
    if (elCount) elCount.textContent = matched;
    clears.forEach(function (b) { b.hidden = !filtering; });
    if (empty) empty.hidden = shown !== 0;

    writeURL(filtering);
  }

  function visiblePanel() {
    for (var i = 0; i < panels.length; i++) if (!panels[i].hidden) return panels[i];
    return panels[0];
  }

  function labelOf(dim, value) {
    var chip = document.querySelector('.chip[data-filter="' + dim + '"][data-value="' + value + '"]');
    if (!chip) return value;
    var c = chip.querySelector('.count');
    return chip.textContent.replace(c ? c.textContent : '', '').trim();
  }

  function writeURL(filtering) {
    if (!window.history || !history.replaceState) return;
    var p = new URLSearchParams(window.location.search);
    state.system === 'all' ? p.delete('system') : p.set('system', state.system);
    p.delete('tier');   /* 4.0.1 去掉等级维度后，把旧链接里的 tier 参数一并清掉 */
    var q = p.toString();
    history.replaceState(null, '', window.location.pathname + (q ? '?' + q : ''));
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      state[chip.dataset.filter] = chip.dataset.value;
      shownLimit = PAGE;          /* 换筛选条件后回到第一批 */
      apply();
    });
  });

  if (moreBtn) {
    moreBtn.addEventListener('click', function () { shownLimit += PAGE; apply(); });
  }

  clears.forEach(function (b) {
    b.addEventListener('click', function () { state.system = 'all'; apply(); });
  });

  /* ── 视图切换（PLAN §2-F）——
     偏好存 localStorage：有人要图，有人要密度，不替用户选。 */
  var VIEW_KEY = 'viiyd_archive_view';
  var toggles  = document.querySelectorAll('[data-view]');

  function setView(view, persist) {
    panels.forEach(function (p) { p.hidden = p.dataset.viewPanel !== view; });
    toggles.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === view)); });
    if (persist) { try { localStorage.setItem(VIEW_KEY, view); } catch (e) { /* 隐私模式下忽略 */ } }
  }

  toggles.forEach(function (b) {
    b.addEventListener('click', function () { setView(b.dataset.view, true); apply(); });
  });

  /* ── 首屏还原：先视图偏好，再 URL 筛选 ── */
  var saved = null;
  try { saved = localStorage.getItem(VIEW_KEY); } catch (e) { /* 同上 */ }
  if (saved) setView(saved, false);

  /* URL 参数只认真实存在的 chip 值。别人改乱了就当没写 ——
     否则状态行会把垃圾原样回显（安全，但难看），而且用户看到的是一个
     永远筛不出东西的死页面，不如直接当作未筛选。 */
  function valid(dim, v) {
    /* CSS.escape 在极旧内核上可能不存在 —— 不守卫会 TypeError 打断整个文件，
       筛选、视图切换、加载更多全部失效（列表本身是直出的，还看得见）。 */
    var esc = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(v) : null;
    if (esc === null) { if (!/^[\w .一-鿿-]+$/.test(v)) return false; esc = v; }
    return !!document.querySelector('.chip[data-filter="' + dim + '"][data-value="' + esc + '"]');
  }
  var q = new URLSearchParams(window.location.search);
  var qs = q.get('system');
  if (qs && valid('system', qs)) state.system = qs;
  apply();
})();
