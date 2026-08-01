(function(){
  'use strict';

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) document.documentElement.classList.add('reduced-motion');

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- loader ---------- */
  var loader = document.getElementById('loader');
  function hideLoader(){
    if (!loader) return;
    loader.classList.add('is-hidden');
    setTimeout(function(){ loader.remove(); }, 1000);
  }
  window.addEventListener('load', function(){ setTimeout(hideLoader, 300); });
  // safety net in case load event is delayed by a slow asset
  setTimeout(hideLoader, 6000);

  /* ---------- header scroll state ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll(){
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  function closeNav(){
    if (!mainNav) return;
    mainNav.classList.remove('is-open');
    mainNav.style.setProperty('--nav-x', '100%');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  if (navToggle && mainNav){
    navToggle.addEventListener('click', function(){
      var isOpen = mainNav.classList.toggle('is-open');
      mainNav.style.setProperty('--nav-x', isOpen ? '0%' : '100%');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', closeNav);
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ---------- smooth scroll (Lenis) ---------- */
  if (!prefersReduced && typeof Lenis === 'function'){
    try {
      var lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
      window.__lenis = lenis;

      // Single animation driver only. Running lenis.raf() from two clocks at
      // once (native rAF ms timestamps + GSAP ticker seconds) previously fed
      // it inconsistent deltas and froze animatedScroll at 0 forever.
      if (window.gsap && window.gsap.ticker){
        gsap.ticker.add(function(time){ lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        (function loop(time){ lenis.raf(time); requestAnimationFrame(loop); })(0);
      }

      if (window.ScrollTrigger){
        lenis.on('scroll', ScrollTrigger.update);
      }
    } catch (e) { /* Lenis unavailable, native scroll still works */ }
  }

  /* anchor links respect the fixed header offset */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (window.__lenis) {
        window.__lenis.scrollTo(target, { offset: -20 });
      } else {
        target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });
})();
