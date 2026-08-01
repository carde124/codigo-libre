(function(){
  'use strict';

  var STORAGE_KEY = 'codigolibre_cookie_notice_dismissed';
  var banner = document.getElementById('cookieBanner');
  var acceptBtn = document.getElementById('cookieAccept');
  if (!banner || !acceptBtn) return;

  var alreadyDismissed = false;
  try { alreadyDismissed = localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { /* storage unavailable, always show */ }

  if (!alreadyDismissed){
    banner.hidden = false;
  }

  acceptBtn.addEventListener('click', function(){
    banner.hidden = true;
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
  });
})();
