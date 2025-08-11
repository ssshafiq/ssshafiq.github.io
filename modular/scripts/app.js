/* GSAP-driven interactions and Awwwards-esque microinteractions */
(function () {
  gsap.defaults({ overwrite: 'auto', force3D: true });
  const prefersReduced = document.documentElement.classList.contains('prefers-reduced-motion');
  const animationRefs = { orbitTween: null, nodeFloatTween: null, linkPulseTween: null, blobTweens: [], flipTl: null };

  // Year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Custom cursor
  const cursor = document.getElementById('cursor');
  let cursorX = -100, cursorY = -100;
  const moveCursor = (e) => {
    cursorX = e.clientX; cursorY = e.clientY;
    cursor.style.setProperty('--x', cursorX + 'px');
    cursor.style.setProperty('--y', cursorY + 'px');
    cursor.firstElementChild && (cursor.firstElementChild.style.left = cursorX + 'px');
    cursor.firstElementChild && (cursor.firstElementChild.style.top = cursorY + 'px');
  };
  window.addEventListener('pointermove', moveCursor, { passive: true });
  let hideTimer;
  window.addEventListener('pointermove', () => {
    document.body.classList.remove('cursor--hidden');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => document.body.classList.add('cursor--hidden'), 1500);
  });

  // Smooth anchor scrolling
  document.querySelectorAll('[data-scrollto]')
    .forEach((a) => a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (!target) return;
      if (window.gsap) {
        gsap.to(window, { duration: 0.8, scrollTo: target, ease: 'power3.out' });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }));

  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, MotionPathPlugin);

  // Split titles into lines for staggered reveal
  function splitLines(element) {
    const text = element.textContent.trim();
    element.setAttribute('aria-label', text);
    element.innerHTML = '';
    const words = text.split(' ');
    const line = document.createElement('span');
    line.className = 'line';
    let currentLine = document.createElement('span');
    currentLine.className = 'line__inner';
    element.appendChild(line);
    line.appendChild(currentLine);
    words.forEach((w, i) => {
      const word = document.createElement('span');
      word.className = 'word';
      word.textContent = w + (i !== words.length - 1 ? ' ' : '');
      currentLine.appendChild(word);
    });
  }

  document.querySelectorAll('[data-split]').forEach(splitLines);

  // Hero intro timeline
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('.nav .brand, .nav .nav-links li, .nav .nav-cta .btn', {
      y: -16, opacity: 0, stagger: 0.06, duration: 0.6
    })
    .from('#hero .eyebrow', { y: 18, opacity: 0, duration: 0.6 }, '-=0.3')
    .from('#hero .hero__title .word', { y: 40, opacity: 0, stagger: 0.02, duration: 0.6 }, '-=0.2')
    .from('#hero .hero__subtitle', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
    .from('#hero .hero__ctas .btn', { y: 18, opacity: 0, stagger: 0.08, duration: 0.5 }, '-=0.4');

  // Floating blobs parallax
  animationRefs.blobTweens = gsap.utils.toArray('.blob').map((el, i) =>
    gsap.to(el, {
      duration: 12 + i * 2,
      y: 30 + i * 10,
      x: i % 2 ? 20 : -20,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  );

  // Grid parallax on scroll
  gsap.to('.hero__bg .grid', {
    yPercent: -10,
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // Neural network visualization: generate nodes and links
  (function initNeuralViz() {
    const svg = document.querySelector('.hero__nn');
    if (!svg) return;
    const root = svg.querySelector('#nn');
    const linksGroup = svg.querySelector('.hero__nn .links');
    const layers = Array.from(svg.querySelectorAll('.hero__nn .layer'));
    const nodeCounts = [6, 4, 3, 2];
    const xGap = 180;
    const yGap = 70;
    const baseX = 40;
    const baseY = 80;

    const nodes = [];
    layers.forEach((layerEl, li) => {
      const count = nodeCounts[li] || 3;
      const cx = baseX + li * xGap;
      const totalHeight = (count - 1) * yGap;
      for (let i = 0; i < count; i++) {
        const cy = baseY + i * yGap - totalHeight / 2;
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        node.setAttribute('class', `node ${li >= 1 && li <= 2 ? 'node--accent' : ''}`);
        node.setAttribute('cx', String(cx));
        node.setAttribute('cy', String(cy));
        node.setAttribute('r', String(6));
        layerEl.appendChild(node);
        nodes.push({ li, i, cx, cy, el: node });
      }
    });

    // Create links between layers
    function createLinks() {
      linksGroup.innerHTML = '';
      const linkEls = [];
      for (let li = 0; li < nodeCounts.length - 1; li++) {
        const fromLayer = svg.querySelector(`.layer--${li}`);
        const toLayer = svg.querySelector(`.layer--${li + 1}`);
        const fromNodes = Array.from(fromLayer.querySelectorAll('circle'));
        const toNodes = Array.from(toLayer.querySelectorAll('circle'));
        fromNodes.forEach((fn) => {
          toNodes.forEach((tn) => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'link');
            line.setAttribute('x1', fn.getAttribute('cx'));
            line.setAttribute('y1', fn.getAttribute('cy'));
            line.setAttribute('x2', tn.getAttribute('cx'));
            line.setAttribute('y2', tn.getAttribute('cy'));
            line.setAttribute('stroke-width', '1.2');
            line.setAttribute('opacity', '0');
            linksGroup.appendChild(line);
            linkEls.push(line);
          });
        });
      }
      return linkEls;
    }
    const linkEls = createLinks();

    // Intro and split animation
    const nnTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    nnTl
      // Fade in links subtly
      .to(linkEls, { opacity: 0.35, duration: 1.0, stagger: { each: 0.0025, from: 'random' } }, 0)
      // Pulse data flow: animate stroke and draw effect
      .fromTo(linkEls, { strokeDasharray: 220, strokeDashoffset: 220 }, {
        strokeDashoffset: 0,
        duration: 1.6,
        stagger: { each: 0.0025, from: 0 },
        ease: 'power1.inOut'
      }, 0.1)
      // Slight float for nodes
      .fromTo('.hero__nn .node', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.8, stagger: { each: 0.02, from: 'random' } }, 0.2)
      // Subnetwork split: move hidden layers apart and glow
      .to('.hero__nn .layer--1', { x: -16, duration: 0.8 }, 1.0)
      .to('.hero__nn .layer--2', { x: 16, duration: 0.8 }, 1.0)
      .to('.hero__nn .clusterGlow', { opacity: 1, duration: 0.8, stagger: 0.1 }, 1.0);

  // Subtle perpetual motion
    animationRefs.nodeFloatTween = gsap.to('.hero__nn .node', {
      duration: 3,
      y: (i) => Math.sin(i) * 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    animationRefs.linkPulseTween = gsap.to('.hero__nn .link', {
      opacity: 0.2,
      duration: 2.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: { each: 0.002, from: 'random' }
    });

    // Respect reduced motion
    if (prefersReduced) {
      gsap.globalTimeline.timeScale(0.001);
    }
  })();

  // Reveal on scroll (skip .no-fade)
  gsap.utils.toArray('[data-reveal]:not(.no-fade)')
    .forEach((el) => {
      const type = el.getAttribute('data-reveal');
      const from = type === 'scale' ? { opacity: 0, scale: 0.96 } : { opacity: 0, y: 24 };
      gsap.fromTo(el, from, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 80%' }
      });
    });

  // Rotating orbit graphic (store tween to pause when off-screen)
  animationRefs.orbitTween = gsap.to('.hero__orbit .orbit-group', {
    rotate: 360,
    transformOrigin: '50% 50%',
    ease: 'none',
    repeat: -1,
    duration: 24
  });

  // Continuous flip text animation
  (function flipWords() {
    const el = document.querySelector('.hero__flip .flip-word');
    if (!el) return;
    const wordsAttr = el.getAttribute('data-words');
    let words = [];
    try { words = JSON.parse(wordsAttr || '[]'); } catch { words = []; }
    if (!Array.isArray(words) || words.length === 0) words = [el.textContent.trim()];
    let index = 0;
    el.innerHTML = '';
    el.style.position = 'relative';
    const currentSpan = document.createElement('span');
    const nextSpan = document.createElement('span');
    currentSpan.textContent = words[0];
    nextSpan.textContent = words[1 % words.length];
    Object.assign(currentSpan.style, { position: 'relative', display: 'inline-block' });
    Object.assign(nextSpan.style, { position: 'absolute', left: '0', top: '0', display: 'inline-block' });
    el.appendChild(currentSpan);
    el.appendChild(nextSpan);
    gsap.set(currentSpan, { rotateX: 0, transformOrigin: '50% 100%' });
    gsap.set(nextSpan, { rotateX: -90, transformOrigin: '50% 100%' });

    animationRefs.flipTl = gsap.timeline({
      repeat: -1,
      repeatDelay: 0.6,
      onRepeat: () => {
        index = (index + 1) % words.length;
        currentSpan.textContent = words[index];
        nextSpan.textContent = words[(index + 1) % words.length];
        gsap.set(currentSpan, { rotateX: 0 });
        gsap.set(nextSpan, { rotateX: -90 });
      }
    });
    animationRefs.flipTl
      .to(currentSpan, { rotateX: 90, duration: 0.36, ease: 'power2.in' }, 0)
      .to(nextSpan, { rotateX: 0, duration: 0.46, ease: 'power2.out' }, 0.22);
  })();

  // Keep hero animations always running (no pause on scroll off-screen)

  // Reduce tween creation on pointer moves: use quickTo
  // Magnetic buttons
  document.querySelectorAll('.is-magnetic').forEach((btn) => {
    const bounds = () => btn.getBoundingClientRect();
    const qx = gsap.quickTo(btn, 'x', { duration: 0.3, ease: 'power3.out' });
    const qy = gsap.quickTo(btn, 'y', { duration: 0.3, ease: 'power3.out' });
    btn.addEventListener('mousemove', (e) => {
      const b = bounds();
      const relX = e.clientX - (b.left + b.width / 2);
      const relY = e.clientY - (b.top + b.height / 2);
      qx(relX * 0.3);
      qy(relY * 0.3);
    });
    btn.addEventListener('mouseleave', () => { qx(0); qy(0); });
  });

  // Tilt cards using quickTo
  gsap.utils.toArray('.tilt').forEach((card) => {
    const b = () => card.getBoundingClientRect();
    const rX = gsap.quickTo(card, 'rotateX', { duration: 0.3 });
    const rY = gsap.quickTo(card, 'rotateY', { duration: 0.3 });
    card.addEventListener('mousemove', (e) => {
      const r = b();
      const relX = (e.clientX - r.left) / r.width;
      const relY = (e.clientY - r.top) / r.height;
      rX((0.5 - relY) * 10);
      rY((relX - 0.5) * 10);
    });
    card.addEventListener('mouseleave', () => { rX(0); rY(0); });
  });

  // Tab visibility: pause heavy animations when hidden
  document.addEventListener('visibilitychange', () => {
    const pauseAll = document.hidden;
    const method = pauseAll ? 'pause' : 'play';
    animationRefs.orbitTween && animationRefs.orbitTween[method]();
    animationRefs.nodeFloatTween && animationRefs.nodeFloatTween[method]();
    animationRefs.linkPulseTween && animationRefs.linkPulseTween[method]();
    animationRefs.flipTl && animationRefs.flipTl[method]();
    animationRefs.blobTweens.forEach(t => t[method]());
  });

  // Counter up (runs once)
  document.querySelectorAll('[data-counter]').forEach((el) => {
    const target = Number(el.getAttribute('data-target') || '0');
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.fromTo(el, { innerText: 0 }, {
          innerText: target,
          duration: 1.2,
          snap: { innerText: 1 },
          ease: 'power1.out'
        });
      }
    });
  });

  // Removed duplicate older magnetic and tilt implementations to prevent extra tweens

  // Horizontal scroll section (lighter: no pinning; simple scrub xPercent)
  const hTrack = document.querySelector('[data-hscroll] .h-track');
  if (hTrack) {
    const section = document.querySelector('#modules');
    const getMaxX = () => Math.max(0, hTrack.scrollWidth - window.innerWidth);
    gsap.fromTo(hTrack, { x: 0 }, {
      x: () => -getMaxX(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.4
      }
    });
    window.addEventListener('resize', () => ScrollTrigger.refresh());
  }
})();


