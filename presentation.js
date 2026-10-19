/* Navigation remains functional even when animation libraries or motion are disabled. */
(() => {
  const links = [...document.querySelectorAll('.case-nav a')];
  const targets = links.map((link) => document.querySelector(link.getAttribute('href')));
  const header = document.querySelector('.site-header');
  let ticking = false;
  const settleAnchor = (target, replace = false) => {
    if (!target) return;
    const hash = `#${target.id}`;
    history[replace ? 'replaceState' : 'pushState'](null, '', hash);
    const align = () => {
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const delta = target.getBoundingClientRect().top - headerHeight - 20;
      if (Math.abs(delta) > 1) window.scrollTo({ top: window.scrollY + delta, behavior: 'auto' });
    };
    align();
    [0, 120, 320].forEach((delay) => window.setTimeout(align, delay));
  };
  links.forEach((link, index) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      settleAnchor(targets[index]);
    });
  });
  const update = () => {
    let active = -1;
    targets.forEach((target, index) => {
      if (target && target.getBoundingClientRect().top <= window.innerHeight * 0.35) active = index;
    });
    links.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', () => {
    if (location.hash) settleAnchor(document.querySelector(location.hash), true);
  }, { once: true });
  update();
})();

/* V2 presentation layer: content.js remains untouched and can populate [data-content-slot] later. */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;
  document.documentElement.classList.add('has-gsap');

  const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTimeline
    .from('.hero-eyebrow', { autoAlpha: 0, y: 16, duration: 0.5 })
    .from('.hero-title', { autoAlpha: 0, y: 34, duration: 0.8 }, '>-0.05')
    .from('.hero-claim', { autoAlpha: 0, y: 24, duration: 0.65 }, '>-0.18')
    .from('.hero-prompt', { autoAlpha: 0, y: 18, duration: 0.55 }, '>-0.16')
    .from('.hero-description', { autoAlpha: 0, y: 18, duration: 0.6 }, '>-0.16')
    .from('.hero-qr', { autoAlpha: 0, y: 18, duration: 0.55 }, '>-0.18')
    .from('.phone-stage', { autoAlpha: 0, x: 72, y: 24, scale: 0.97, rotate: 2, duration: 0.9 }, '<0.05')
    .call(() => gsap.to('.phone-mockup', { y: -8, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));

  // Core Flow is initialized independently below, including reduced-motion support.

  const originSection = document.querySelector('.origin');
  if (originSection && window.matchMedia('(min-width: 701px)').matches) {
    const originScenes = gsap.utils.toArray('.origin-scene', originSection);
    let activeOriginScene = -1;
    const setOriginScene = (index, immediate = false) => {
      if (index === activeOriginScene && !immediate) return;
      originScenes.forEach((scene, sceneIndex) => {
        const isActive = sceneIndex === index;
        scene.classList.toggle('is-active', isActive);
        if (isActive) gsap.fromTo(scene, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: immediate ? 0 : 0.52, ease: 'power3.out', overwrite: true });
        else gsap.to(scene, { autoAlpha: 0, y: -18, duration: immediate ? 0 : 0.38, ease: 'power2.in', overwrite: true });
      });
      activeOriginScene = index;
    };
    setOriginScene(0, true);
    ScrollTrigger.create({
      id: 'origin-story',
      trigger: originSection,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => setOriginScene(Math.min(originScenes.length - 1, Math.floor(self.progress * originScenes.length)))
    });
  }

  const scenarioItems = gsap.utils.toArray('.scenario-path li');
  scenarioItems.forEach((item, index) => {
    ScrollTrigger.create({
      id: `scenario-step-${index + 1}`,
      trigger: item,
      start: 'top 62%',
      end: 'bottom 38%',
      onEnter: () => scenarioItems.forEach((entry, entryIndex) => entry.classList.toggle('is-active', entryIndex === index)),
      onEnterBack: () => scenarioItems.forEach((entry, entryIndex) => entry.classList.toggle('is-active', entryIndex === index))
    });
  });
  if (scenarioItems[0]) scenarioItems[0].classList.add('is-active');

  const walletGroupsSection = document.querySelector('.wallet-groups');
  if (walletGroupsSection) {
    const walletFrame = walletGroupsSection.querySelector('.wallet-groups-frame');
    const walletSteps = gsap.utils.toArray('.wallet-step', walletGroupsSection);
    const walletScreens = gsap.utils.toArray('.wallet-screen', walletGroupsSection);
    const walletCaption = walletGroupsSection.querySelector('.wallet-media-caption');
    const walletScenes = [
      { step: 0, screen: 'list', caption: '我的钱包小组' },
      { step: 1, screen: 'list', caption: '固定熟人关系' },
      { step: 2, screen: 'detail', caption: '进入已有的钱包小组' },
      { step: 2, screen: 'invite', caption: '辅助状态：邀请熟人加入' },
      { step: 2, screen: 'create', caption: '在组内继续发起申请' },
      { step: 3, screen: 'pending', caption: '持续出现的待审批申请' },
      { step: 3, screen: 'activity', caption: '月度状态与最近记录' },
      { step: 4, screen: 'approval', caption: '多人给意见，申请人做决定' }
    ];
    let activeWalletStep = -1;
    let activeWalletScreen = '';
    const setWalletScene = (sceneIndex, immediate = false) => {
      const scene = walletScenes[sceneIndex];
      if (!scene) return;
      const index = scene.step;
      const previousStep = walletSteps[activeWalletStep];
      const nextStep = walletSteps[index];
      if (previousStep && previousStep !== nextStep) {
        previousStep.classList.remove('is-active');
        gsap.to(previousStep, { autoAlpha: 0, y: -16, duration: immediate ? 0 : 0.4, ease: 'power2.in', overwrite: true });
      }
      if (index !== activeWalletStep || immediate) {
        walletSteps.forEach((step, stepIndex) => {
          step.classList.toggle('is-active', stepIndex === index);
          if (stepIndex !== index && step !== previousStep) gsap.set(step, { autoAlpha: 0, y: 0 });
        });
        gsap.fromTo(nextStep, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: immediate ? 0 : 0.5, ease: 'power3.out', overwrite: true });
      }
      if (scene.screen !== activeWalletScreen || immediate) {
        walletScreens.forEach((screen) => {
          const isActive = screen.dataset.walletScreen === scene.screen;
          screen.classList.toggle('is-active', isActive);
          if (isActive) gsap.fromTo(screen, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: immediate ? 0 : 0.5, ease: 'power3.out', overwrite: true });
          else gsap.to(screen, { autoAlpha: 0, y: -16, duration: immediate ? 0 : 0.45, ease: 'power2.in', overwrite: true });
        });
        activeWalletScreen = scene.screen;
      }
      if (walletCaption) walletCaption.textContent = scene.caption;
      activeWalletStep = index;
    };

    setWalletScene(0, true);
    ScrollTrigger.create({
      trigger: walletFrame,
      start: 'top top',
      end: '+=700%',
      pin: true,
      pinSpacing: true,
      invalidateOnRefresh: true,
      scrub: 0.7,
      anticipatePin: 1,
      onEnter: () => gsap.set(walletFrame, { autoAlpha: 1 }),
      onEnterBack: () => gsap.set(walletFrame, { autoAlpha: 1 }),
      onLeave: () => gsap.set(walletFrame, { autoAlpha: 0 }),
      onUpdate: (self) => setWalletScene(Math.min(walletScenes.length - 1, Math.floor(self.progress * walletScenes.length)))
    });
  }

  const feedbackStory = document.querySelector('.feedback-story');
  if (feedbackStory && window.matchMedia('(min-width: 701px)').matches) {
    const feedbackCases = gsap.utils.toArray('.feedback-case', feedbackStory);
    const feedbackMedia = gsap.utils.toArray('[data-feedback-media]', feedbackStory);
    const feedbackCaption = feedbackStory.querySelector('.feedback-media-caption');
    let activeFeedbackCase = -1;
    const setFeedbackCase = (index, immediate = false) => {
      if (index === activeFeedbackCase && !immediate) return;
      feedbackCases.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === index));
      feedbackMedia.forEach((image) => {
        const isActive = Number(image.dataset.feedbackMedia) === index;
        image.classList.toggle('is-active', isActive);
        if (isActive) gsap.fromTo(image, { autoAlpha: 0, scale: 0.97, y: 14 }, { autoAlpha: 1, scale: 1, y: 0, duration: immediate ? 0 : 0.5, ease: 'power3.out', overwrite: true });
        else gsap.to(image, { autoAlpha: 0, scale: 0.97, y: -12, duration: immediate ? 0 : 0.4, ease: 'power2.in', overwrite: true });
      });
      if (feedbackCaption) feedbackCaption.textContent = feedbackCases[index].dataset.feedbackCaption;
      activeFeedbackCase = index;
    };
    feedbackCases.forEach((item, index) => {
      ScrollTrigger.create({
        id: `feedback-case-${index + 1}`,
        trigger: item,
        start: 'top 58%',
        end: 'bottom 42%',
        onEnter: () => setFeedbackCase(index),
        onEnterBack: () => setFeedbackCase(index)
      });
    });
    setFeedbackCase(0, true);
  }

  const liveDataSection = document.querySelector('.live-product-data');
  if (liveDataSection) {
    const liveFrame = liveDataSection.querySelector('.live-product-frame');
    const liveStates = gsap.utils.toArray('.live-state');
    const usageMetrics = gsap.utils.toArray('.live-number-sequence > p');
    const groupMetrics = gsap.utils.toArray('.group-number-sequence > p');
    let activeLiveState = -1;

    const formatLiveCount = (value, decimals, suffix = '') => {
      const normalized = decimals ? Math.round(value * 10) / 10 : Math.round(value);
      return normalized.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    };
    const countUp = (element) => {
      if (element.dataset.counted === 'true') return;
      element.dataset.counted = 'true';
      const target = Number(element.dataset.count);
      const decimals = Number.isInteger(target) ? 0 : 1;
      const value = { current: 0 };
      element.textContent = formatLiveCount(0, decimals, element.dataset.suffix || '');
      gsap.to(value, {
        current: target,
        duration: decimals ? 1.35 : 1.55,
        ease: 'power2.out',
        onUpdate: () => { element.textContent = formatLiveCount(value.current, decimals, element.dataset.suffix || ''); }
      });
    };
    const revealLiveMetric = (metric) => {
      if (!metric || metric.dataset.revealed === 'true') return;
      metric.dataset.revealed = 'true';
      gsap.fromTo(metric, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.42, ease: 'power3.out', overwrite: true });
      metric.querySelectorAll('.live-count').forEach(countUp);
    };
    const updateLiveMetrics = (progress) => {
      if (progress < 0.25) {
        const lastVisible = Math.min(usageMetrics.length - 1, Math.floor((progress / 0.25) * usageMetrics.length));
        usageMetrics.slice(0, lastVisible + 1).forEach(revealLiveMetric);
      }
      if (progress >= 0.5 && progress < 0.75) {
        const lastVisible = Math.min(groupMetrics.length - 1, Math.floor(((progress - 0.5) / 0.25) * groupMetrics.length));
        groupMetrics.slice(0, lastVisible + 1).forEach(revealLiveMetric);
      }
    };
    const setLiveState = (index, immediate = false) => {
      if (index === activeLiveState && !immediate) return;
      const previous = liveStates[activeLiveState];
      const next = liveStates[index];
      if (previous && previous !== next) {
        previous.classList.remove('is-active');
        gsap.to(previous, { autoAlpha: 0, y: -30, duration: immediate ? 0 : 0.35, ease: 'power2.in', overwrite: true });
      }
      liveStates.forEach((state, stateIndex) => {
        if (stateIndex !== index && state !== previous) gsap.set(state, { autoAlpha: 0, y: 0 });
      });
      next.classList.add('is-active');
      gsap.fromTo(next, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: immediate ? 0 : 0.48, ease: 'power3.out', overwrite: true });
      if (index === 1) next.querySelectorAll('.live-count').forEach(countUp);
      activeLiveState = index;
    };

    setLiveState(0, true);
    ScrollTrigger.create({
      trigger: liveFrame,
      start: 'top top',
      end: '+=360%',
      pin: true,
      pinSpacing: true,
      invalidateOnRefresh: true,
      scrub: 0.8,
      anticipatePin: 1,
      onUpdate: (self) => {
        setLiveState(Math.min(3, Math.floor(self.progress * 4)));
        updateLiveMetrics(self.progress);
      }
    });
    updateLiveMetrics(0);
  }

  const tryItSection = document.querySelector('.try-it');
  if (tryItSection) {
    const tryItCopy = tryItSection.querySelector('.try-it-copy');
    const tryItQr = tryItSection.querySelector('.try-it-qr-wrap');
    const tryItActions = gsap.utils.toArray('.try-it-actions li', tryItSection);
    const tryItTimeline = gsap.timeline({
      scrollTrigger: { trigger: tryItSection, start: 'top 68%', once: true },
      defaults: { ease: 'power3.out', overwrite: true }
    });
    tryItTimeline
      .from(tryItCopy, { autoAlpha: 0, y: 50, duration: 0.7 })
      .from(tryItQr, { autoAlpha: 0, scale: 0.92, duration: 0.62 }, '<0.12')
      .from(tryItActions, { autoAlpha: 0, y: 18, duration: 0.42, stagger: 0.12 }, '<0.2');
  }

  gsap.utils.toArray('.reveal').forEach((element) => {
    gsap.from(element, {
      opacity: 0,
      y: 28,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: { trigger: element, start: 'top 86%', once: true }
    });
  });

  gsap.utils.toArray('.slide').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: ({ isActive }) => section.classList.toggle('is-current', isActive)
    });
  });
})();

/* Direct feedback evidence: one full-height image at a time, with an optional calm auto-advance. */
(() => {
  const carousels = [...document.querySelectorAll('.direct-feedback-carousel')];
  if (!carousels.length) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  carousels.forEach((carousel) => {
    const slides = [...carousel.querySelectorAll('[data-direct-feedback-slide]')];
    const buttons = [...carousel.querySelectorAll('[data-direct-feedback-page]')];
    let page = 0;
    let timer;
    const show = (index) => {
      page = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === page;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      buttons.forEach((button) => button.setAttribute('aria-current', String(Number(button.dataset.directFeedbackPage) === page)));
    };
    const stop = () => clearInterval(timer);
    const start = () => {
      stop();
      if (!reduceMotion.matches) timer = setInterval(() => show(page + 1), 4600);
    };
    buttons.forEach((button) => button.addEventListener('click', () => { show(Number(button.dataset.directFeedbackPage)); start(); }));
    carousel.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      show(page + (event.key === 'ArrowRight' ? 1 : -1));
      start();
    });
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);
    show(0);
    start();
  });
})();

/* Core Flow uses CSS sticky only; screenshots share one synchronized state. */
(() => {
 const root=document.querySelector('#core-features'), steps=[...root.querySelectorAll('.cf-step')], media=[...root.querySelectorAll('.cf-media')], phone=root.querySelector('.cf-phone');
 const desktop=matchMedia('(min-width:901px)'), motion=matchMedia('(prefers-reduced-motion:reduce)');
 const carousel=root.querySelector('.cf-carousel'), track=carousel.querySelector('.cf-track');
 let page=0, pointer=null, start=0, delta=0, active=-1, trigger;
 function slide(index) {
  page=Math.max(0,Math.min(1,index));
  track.style.transition=motion.matches?'none':'transform .42s ease';
  track.style.transform='translateX('+(-page*50)+'%)';
  carousel.querySelectorAll('[data-cf-page]').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.cfPage)===page)));
 }
 carousel.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>slide(b.hasAttribute('data-cf-page')?Number(b.dataset.cfPage):page+Number(b.dataset.cfDirection))));
 carousel.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();slide(page+(e.key==='ArrowRight'?1:-1));}});
 carousel.addEventListener('pointerdown',e=>{if(e.target.closest('button')||!e.isPrimary||e.button!==0)return;pointer=e.pointerId;start=e.clientX;delta=0;carousel.setPointerCapture(pointer);track.style.transition='none';});
 carousel.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;delta=e.clientX-start;const dx=(page===0&&delta>0)||(page===1&&delta<0)?delta*.18:delta;track.style.transform='translateX(calc('+(-page*50)+'% + '+dx+'px))';});
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>carousel.addEventListener(type,e=>{if(pointer!==e.pointerId)return;pointer=null;slide(page+(type==='pointerup'&&Math.abs(delta)>40?(delta<0?1:-1):0));}));
 function sync(immediate=false){
  let index=0;steps.forEach((s,i)=>{if(s.getBoundingClientRect().top<=innerHeight*.5)index=i;});
  if(index===active&&!immediate)return;active=index;
  steps.forEach((s,i)=>s.classList.toggle('is-active',i===index));
  media.forEach((m,i)=>{
   const yes=i===index;m.classList.toggle('is-active',yes);m.inert=!yes;m.setAttribute('aria-hidden',String(!yes));gsap.killTweensOf(m);
   if(immediate||motion.matches)gsap.set(m,{autoAlpha:yes?1:0,y:0});
   else if(yes)gsap.fromTo(m,{autoAlpha:0,y:20},{autoAlpha:1,y:0,duration:.45,ease:'power2.out',overwrite:true});
   else gsap.to(m,{autoAlpha:0,y:-20,duration:.35,ease:'power2.out',overwrite:true});
  });
 }
 function setup(){
  if(trigger){trigger.kill();trigger=null;}
  const enabled=desktop.matches&&window.gsap&&window.ScrollTrigger;
  root.classList.toggle('cf-desktop',!!enabled);
  media.forEach((m,i)=>{if(window.gsap){gsap.killTweensOf(m);gsap.set(m,{clearProps:'all'});}m.inert=false;m.removeAttribute('aria-hidden');(enabled?phone:steps[i].querySelector('.cf-media-slot')).append(m);});
  if(!enabled)return;
  gsap.registerPlugin(ScrollTrigger);active=-1;sync(true);
  trigger=ScrollTrigger.create({id:'core-flow-sync',trigger:root.querySelector('.cf-story'),start:'top bottom',end:'bottom top',onUpdate:()=>sync(),onRefresh:()=>sync(true)});
  ScrollTrigger.refresh();
 }
 desktop.addEventListener('change',setup);motion.addEventListener('change',setup);
 window.addEventListener('pageshow',()=>{if(root.classList.contains('cf-desktop'))sync(true);});
 slide(0);setup();
})();

