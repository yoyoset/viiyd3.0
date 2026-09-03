/* VIIYD 4.0 · EIU 估算器 —— 规格 §9.5
 *
 * 只输出 EIU，**不换算金额**（规格 B5：最后一步仍需联系，这是有意的摩擦）。
 * 公式：EIU 总量 = Σ(数量 × 体型倍数) × 等级系数，向上取整。
 * 系数全部来自 data/pricing.yaml，本文件不写死任何数字。
 */
(function () {
  'use strict';

  var box = document.querySelector('.estimator');
  if (!box) return;

  var rowsWrap  = box.querySelector('[data-est-rows]');
  var addBtn    = box.querySelector('[data-est-add]');
  var out       = box.querySelector('[data-est-out]');
  var batchHint = box.querySelector('[data-est-batch]');
  var threshold = parseFloat(box.dataset.batchThreshold) || Infinity;

  function tierCoef() {
    var on = box.querySelector('[data-est-tier].is-selected');
    return on ? parseFloat(on.dataset.estTier) : 1;
  }

  function recalc() {
    var volume = 0;
    [].slice.call(rowsWrap.querySelectorAll('.est-row')).forEach(function (row) {
      var mult = parseFloat(row.querySelector('[data-est-size]').value) || 0;
      /* 夹到 [0, 9999]：input 上的 min/max 挡不住手输与粘贴，
         实测输 -5 会算出「-9 EIU」，输 99999 会算出六位数 —— 两种都毁可信度。 */
      var qty  = parseInt(row.querySelector('[data-est-qty]').value, 10) || 0;
      qty = Math.min(Math.max(qty, 0), 9999);
      volume += mult * qty;
    });
    var eiu = Math.max(0, Math.ceil(volume * tierCoef()));
    out.textContent = eiu;
    /* 超过阈值提示分批交付（规格 §18）—— 大单反而更需要先聊排期 */
    if (batchHint) batchHint.hidden = eiu <= threshold;
  }

  /* 等级四格是单选。模板上标了 role="radiogroup"/role="radio"，
     **那就必须实现 radiogroup 该有的键盘行为** —— 方向键切换 + roving tabindex。
     只标角色不实现行为比不标更糟：读屏会告诉用户「单选按钮 2/4」，
     用户按方向键却没反应。 */
  var tiers = [].slice.call(box.querySelectorAll('[data-est-tier]'));

  function select(btn, focus) {
    tiers.forEach(function (o) {
      var on = o === btn;
      o.classList.toggle('is-selected', on);
      o.setAttribute('aria-checked', String(on));
      /* roving tabindex：整组只有选中项进 Tab 序列，Tab 一次即跳过整组 */
      o.setAttribute('tabindex', on ? '0' : '-1');
    });
    if (focus) btn.focus();
    recalc();
  }

  tiers.forEach(function (b, i) {
    b.addEventListener('click', function () { select(b, false); });
    b.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (d) { e.preventDefault(); select(tiers[(i + d + tiers.length) % tiers.length], true); }
      else if (e.key === 'Home')  { e.preventDefault(); select(tiers[0], true); }
      else if (e.key === 'End')   { e.preventDefault(); select(tiers[tiers.length - 1], true); }
    });
  });

  /* 初始 roving tabindex —— 模板里默认选中的是第二档 */
  var initial = box.querySelector('[data-est-tier].is-selected') || tiers[0];
  if (initial) select(initial, false);

  /* 增行：克隆首行而不是拼字符串，选项与 aria 标签自动跟着 pricing.yaml 走 */
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      var clone = rowsWrap.querySelector('.est-row').cloneNode(true);
      clone.querySelector('[data-est-qty]').value = 1;
      rowsWrap.appendChild(clone);
      recalc();
    });
  }

  rowsWrap.addEventListener('input',  recalc);
  rowsWrap.addEventListener('change', recalc);
  recalc();
})();
