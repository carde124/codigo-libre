(function(){
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var video = document.getElementById('heroVideo');
  var fallback = document.getElementById('heroFallback');
  var heroPin = document.querySelector('.hero-pin');
  var scrollCue = document.getElementById('scrollCue');
  var loadingBadge = document.getElementById('heroLoadingBadge');
  var heroEls = document.querySelectorAll('[data-hero-el]');

  function revealCopy(){
    if (window.gsap){
      gsap.to(heroEls, {
        opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12, delay: 0.3
      });
      gsap.to(scrollCue, { opacity: 1, duration: 1, delay: 1.1 });
    } else {
      heroEls.forEach(function(el){ el.style.opacity = 1; el.style.transform = 'none'; });
      if (scrollCue) scrollCue.style.opacity = 1;
    }
  }

  function useStaticFallback(){
    if (video) video.hidden = true;
    if (fallback) fallback.hidden = false;
    if (loadingBadge) loadingBadge.remove();
    if (heroPin) heroPin.style.height = prefersReduced ? 'auto' : '';
  }

  /* ---------- reduced motion: static hero, no scrubbing ---------- */
  if (prefersReduced){
    useStaticFallback();
    revealCopy();
    return;
  }

  if (!video){
    revealCopy();
    return;
  }

  /* pick a lighter source on small/slow viewports */
  var isMobile = window.matchMedia('(max-width: 760px)').matches;
  if (isMobile){
    var mp4Source = video.querySelector('source[type="video/mp4"]');
    if (mp4Source) mp4Source.setAttribute('src', 'assets/hero/video/hero-mobile-720p.mp4');
  }

  var videoReady = false;
  var failed = false;

  video.addEventListener('loadedmetadata', function(){
    videoReady = true;
    if (loadingBadge) loadingBadge.remove();
  }, { once: true });

  video.addEventListener('error', function(){
    failed = true;
    useStaticFallback();
    revealCopy();
  });

  // safety timeout: if video can't start in time, fall back so the page never looks broken
  var readyTimeout = setTimeout(function(){
    if (!videoReady && !failed) { failed = true; useStaticFallback(); revealCopy(); }
  }, 8000);

  video.load();
  video.play().catch(function(){ /* autoplay may be blocked; scroll-scrub still drives currentTime */ });

  video.addEventListener('loadedmetadata', function onMeta(){
    clearTimeout(readyTimeout);
    if (failed) return;

    revealCopy();
    video.pause();

    var duration = video.duration || 8;
    var targetTime = 0;
    var currentTime = 0;
    var rafId = null;

    function tick(){
      currentTime += (targetTime - currentTime) * 0.14;
      if (Math.abs(targetTime - currentTime) < 0.01) currentTime = targetTime;
      try { video.currentTime = currentTime; } catch (e) {}
      if (Math.abs(targetTime - currentTime) > 0.002){
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    function requestTick(){
      if (rafId === null) rafId = requestAnimationFrame(tick);
    }

    if (window.gsap && window.ScrollTrigger){
      gsap.registerPlugin(ScrollTrigger);

      ScrollTrigger.create({
        trigger: heroPin,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: function(self){
          targetTime = self.progress * duration;
          requestTick();
          if (scrollCue) scrollCue.style.opacity = self.progress > 0.02 ? 0 : 1;
        }
      });

      gsap.to('.hero-copy', {
        opacity: 0,
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: heroPin,
          start: '18% top',
          end: '46% top',
          scrub: true
        }
      });
    } else {
      // no GSAP available: plain scroll-linked fallback
      window.addEventListener('scroll', function(){
        var rect = heroPin.getBoundingClientRect();
        var total = heroPin.offsetHeight - window.innerHeight;
        var progress = Math.min(1, Math.max(0, -rect.top / total));
        targetTime = progress * duration;
        requestTick();
      }, { passive: true });
    }
  }, { once: true });
})();
