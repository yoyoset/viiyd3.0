/* VIIYD 4.0 · 作品页分享面板
 *
 * 每个作品页自带一份 #share-backdrop（layouts/partials/share-panel.html），
 * 内容由 [data-share-open] 触发器的 data-share-* 属性提供 —— 文案在构建期
 * 由 Hugo 模板算好（work/single.html），这里只管「打开面板、复制到剪贴板」。
 *
 * 复制与降级逻辑照抄 lightbox.js 的 handleShare/legacyCopy：微信内置浏览器里
 * navigator.clipboard 常为 undefined（非安全上下文/旧内核），不守卫会静默失败。
 */
(function () {
  'use strict';

  var shareData = null;

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); shareToast(true); }
    catch (e) { shareToast(false); }
    document.body.removeChild(ta);
  }

  function doCopy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { shareToast(true); },
                                                function () { legacyCopy(text); });
    } else { legacyCopy(text); }
  }

  function shareToast(ok) {
    var old = document.getElementById('share-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.id = 'share-toast';
    t.textContent = ok ? (window.__shareCopyOk || 'Copied') : (window.__shareCopyFail || 'Copy failed');
    t.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);' +
      'background:rgba(14,17,19,.95);color:#fff;padding:12px 20px;font-family:sans-serif;' +
      'font-size:13px;z-index:1200;border:1px solid rgba(255,255,255,.15);';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  window.shareCopy = function (channel) {
    if (!shareData) return;
    var text = shareData[channel];
    if (!text) return;
    doCopy(text);
  };

  window.shareClose = function () {
    var el = document.getElementById('share-backdrop');
    if (!el) return;
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
  };

  function toggleBtn(panel, channel, has) {
    var btn = panel.querySelector('[data-share-channel="' + channel + '"]');
    if (btn) btn.hidden = !has;
  }

  function openPanel(trigger) {
    var panel = document.getElementById('share-backdrop');
    if (!panel) return;
    shareData = {
      xhs: trigger.getAttribute('data-share-xhs') || '',
      moments: trigger.getAttribute('data-share-moments') || '',
      ig: trigger.getAttribute('data-share-ig') || '',
      fb: trigger.getAttribute('data-share-fb') || '',
      link: trigger.getAttribute('data-share-link') || ''
    };
    toggleBtn(panel, 'xhs', !!shareData.xhs);
    toggleBtn(panel, 'moments', !!shareData.moments);
    toggleBtn(panel, 'ig', !!shareData.ig);
    toggleBtn(panel, 'fb', !!shareData.fb);
    panel.style.display = 'block';
    panel.setAttribute('aria-hidden', 'false');
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-share-open]');
    if (!trigger) return;
    e.preventDefault();
    openPanel(trigger);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.shareClose();
  });
})();
