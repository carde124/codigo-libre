(function(){
  'use strict';

  var video = document.getElementById('premiumLoopVideo');
  if (!video) return;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return; // poster image stays, no motion, no autoplay

  if ('IntersectionObserver' in window){
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          video.play().catch(function(){});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.25 });
    observer.observe(video);
  } else {
    video.play().catch(function(){});
  }
})();
