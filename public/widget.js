/* PourHub Quote Request Widget Loader */
(function () {
  if (window.__pourhubWidgetLoaded) return;
  window.__pourhubWidgetLoaded = true;

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();

  var business = script.getAttribute('data-business') || '';
  var color = script.getAttribute('data-color') || '#f97316';
  var label = script.getAttribute('data-label') || 'Request a Quote';
  var origin = (function () {
    try { return new URL(script.src).origin; } catch (e) { return 'https://pourhub.com.au'; }
  })();

  if (!business) {
    console.warn('[PourHub Widget] Missing data-business attribute');
    return;
  }

  // Floating button
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.setAttribute('aria-label', label);
  btn.style.cssText = [
    'position:fixed', 'bottom:24px', 'right:24px', 'z-index:2147483646',
    'padding:14px 22px', 'border:none', 'border-radius:999px',
    'background:' + color, 'color:#fff', 'font-size:15px', 'font-weight:600',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
    'cursor:pointer', 'box-shadow:0 6px 20px rgba(0,0,0,0.18)',
    'transition:transform 0.15s ease'
  ].join(';');
  btn.onmouseenter = function () { btn.style.transform = 'translateY(-2px)'; };
  btn.onmouseleave = function () { btn.style.transform = 'translateY(0)'; };

  // Backdrop
  var backdrop = document.createElement('div');
  backdrop.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2147483647',
    'background:rgba(0,0,0,0.55)', 'display:none',
    'align-items:center', 'justify-content:center', 'padding:16px'
  ].join(';');

  // Iframe container
  var box = document.createElement('div');
  box.style.cssText = [
    'position:relative', 'width:100%', 'max-width:560px',
    'height:min(90vh,720px)', 'background:transparent'
  ].join(';');

  // Close button
  var close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.innerHTML = '&times;';
  close.style.cssText = [
    'position:absolute', 'top:-12px', 'right:-12px', 'z-index:1',
    'width:32px', 'height:32px', 'border-radius:999px', 'border:none',
    'background:#fff', 'color:#18181b', 'font-size:22px', 'line-height:1',
    'cursor:pointer', 'box-shadow:0 2px 8px rgba(0,0,0,0.2)'
  ].join(';');

  // Iframe
  var iframe = document.createElement('iframe');
  var src = origin + '/embed/quote-request?business=' + encodeURIComponent(business) +
            '&color=' + encodeURIComponent(color);
  iframe.src = src;
  iframe.title = 'Request a Quote';
  iframe.style.cssText = [
    'width:100%', 'height:100%', 'border:none', 'border-radius:12px',
    'background:#fff', 'box-shadow:0 20px 60px rgba(0,0,0,0.3)'
  ].join(';');

  function open() { backdrop.style.display = 'flex'; }
  function closeModal() { backdrop.style.display = 'none'; }

  btn.onclick = open;
  close.onclick = closeModal;
  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  box.appendChild(iframe);
  box.appendChild(close);
  backdrop.appendChild(box);

  function mount() {
    document.body.appendChild(btn);
    document.body.appendChild(backdrop);
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount);
  }
})();
