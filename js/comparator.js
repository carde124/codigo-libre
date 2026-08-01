(function(){
  'use strict';

  var comparator = document.getElementById('comparator');
  if (!comparator) return;
  var afterLayer = document.getElementById('comparatorAfter');
  var handle = document.getElementById('comparatorHandle');
  var dragging = false;

  function setPosition(pct){
    pct = Math.min(100, Math.max(0, pct));
    afterLayer.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
    handle.style.left = pct + '%';
    comparator.setAttribute('aria-valuenow', Math.round(pct));
  }

  function pctFromEvent(clientX){
    var rect = comparator.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  comparator.addEventListener('pointerdown', function(e){
    dragging = true;
    comparator.setPointerCapture(e.pointerId);
    setPosition(pctFromEvent(e.clientX));
  });
  comparator.addEventListener('pointermove', function(e){
    if (!dragging) return;
    setPosition(pctFromEvent(e.clientX));
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function(evt){
    comparator.addEventListener(evt, function(){ dragging = false; });
  });

  comparator.addEventListener('keydown', function(e){
    var current = parseFloat(comparator.getAttribute('aria-valuenow')) || 50;
    if (e.key === 'ArrowLeft'){ setPosition(current - 5); e.preventDefault(); }
    if (e.key === 'ArrowRight'){ setPosition(current + 5); e.preventDefault(); }
    if (e.key === 'Home'){ setPosition(0); e.preventDefault(); }
    if (e.key === 'End'){ setPosition(100); e.preventDefault(); }
  });

  setPosition(50);
})();
