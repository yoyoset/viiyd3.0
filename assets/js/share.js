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

  /* 原生分享：手机（及支持 Web Share 的桌面浏览器）直接唤起系统分享面板，
     里面就有 Instagram / 微信 / 小红书，而且能带上链接。IG 网页版无法预填
     文案，复制再粘贴走不通，所以这条才是 IG 的正路。不支持时退回复制文案。 */
  window.shareNative = function () {
    if (!shareData) return;
    var text = shareData.native || '';
    var url = shareData.link || '';
    var payload = { title: shareData.title || document.title, text: text, url: url };
    if (navigator.share) {
      try { navigator.share(payload).catch(function () {}); }
      catch (e) { doCopy(text ? text + '\n\n' + url : url); }
    } else {
      doCopy(text ? text + '\n\n' + url : url);
    }
  };

  /* Facebook 有网页分享框，直接跳转；文案同时复制一份，若分享框不带文案可自行粘贴。 */
  window.shareFb = function () {
    if (!shareData) return;
    if (shareData.fb) doCopy(shareData.fb);
    var u = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareData.link || '');
    window.open(u, '_blank', 'noopener');
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
      link: trigger.getAttribute('data-share-link') || '',
      native: trigger.getAttribute('data-share-native') || '',
      title: trigger.getAttribute('data-share-title') || ''
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
