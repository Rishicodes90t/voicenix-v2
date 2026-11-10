/* Voicenix Studios — progressive enhancement. Content and native audio work without this file. */
(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const revealElements = Array.from(document.querySelectorAll('.reveal'));
  const reduceMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let canAnimateReveals = false;

  try {
    // Mobile navigation.
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('#primary-nav');
    const closeMenu = () => {
      if (!menuToggle || !nav) return;
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    };
    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        const open = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', String(!open));
        menuToggle.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
        nav.classList.toggle('is-open', !open);
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
      document.addEventListener('click', e => {
        if (menuToggle.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target) && !menuToggle.contains(e.target)) closeMenu();
      });
    }

    const year = document.querySelector('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    // Reveal on scroll (fails open without JS).
    if (revealElements.length && 'IntersectionObserver' in window && !reduceMotion) {
      const observer = new IntersectionObserver((entries, o) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); o.unobserve(entry.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
      revealElements.forEach(el => observer.observe(el));
      canAnimateReveals = true;
    } else {
      revealElements.forEach(el => el.classList.add('is-visible'));
    }

    // Scroll progress hairline.
    const bar = document.querySelector('.scroll-progress');
    if (bar) {
      const set = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
      };
      window.addEventListener('scroll', set, { passive: true });
      set();
    }

    // Decorative waveform bars + single-active audio preview.
    const heights = [18, 29, 44, 24, 36, 51, 28, 17, 39, 48, 30, 22, 56, 35, 25, 42, 19, 33, 50, 27, 15, 38, 46, 23, 31, 53, 20, 40, 28, 16, 45, 34, 24, 49, 18, 37, 29, 54, 22, 41, 26, 34, 17, 47, 30, 20];
    document.querySelectorAll('.mini-waveform, .comparison-waveform').forEach(wave => {
      wave.replaceChildren();
      heights.forEach((h, i) => {
        const b = document.createElement('span');
        b.className = 'wave-bar';
        b.style.setProperty('--bar-height', `${h}%`);
        b.style.setProperty('--bar-delay', `${(i % 11) * 0.055}s`);
        wave.appendChild(b);
      });
    });
    const allAudio = Array.from(document.querySelectorAll('audio'));
    allAudio.forEach(audio => {
      const card = audio.closest('.work-card, .compare-card, .player');
      audio.addEventListener('play', () => {
        allAudio.forEach(o => { if (o !== audio && !o.paused) o.pause(); });
        if (card) card.classList.add('is-playing');
      });
      ['pause', 'ended', 'emptied'].forEach(n => audio.addEventListener(n, () => {
        if (card && audio.paused) card.classList.remove('is-playing');
      }));
      audio.addEventListener('timeupdate', () => {
        const wave = card && card.querySelector('.mini-waveform, .comparison-waveform');
        if (!wave || !audio.duration || !Number.isFinite(audio.duration)) return;
        const p = audio.currentTime / audio.duration;
        const bars = wave.querySelectorAll('.wave-bar');
        bars.forEach((b, i) => b.classList.toggle('is-played', i / Math.max(bars.length, 1) <= p));
      });
    });

    // Enquiry form (Contact page).
    const form = document.querySelector('#booking-form');
    if (form) {
      const serviceSelect = document.querySelector('#service');
      const block = document.querySelector('#service-specific-fields');
      const heading = document.querySelector('#service-specific-heading');
      const extras = ['one', 'two', 'three'].map(n => ({ label: document.querySelector(`#extra-${n}-label`), input: document.querySelector(`#extra-${n}`) }));
      const prompts = {
        'Vocal recording': ['Tell us about the session', ['Recording purpose', 'Song, dialogue, podcast…'], ['Approx. session length', 'e.g. 2 hours'], ['Number of performers', 'e.g. 1 vocalist']],
        'Dubbing & localisation': ['A few details for the dubbing brief', ['Language pair', 'e.g. Hindi to Bengali'], ['Episode count', 'e.g. 12 episodes'], ['Approx. duration', 'e.g. 90 minutes total']],
        'Voice-over': ['Help us understand the voice-over', ['Content type', 'Ad, explainer, narration…'], ['Language / tone', 'e.g. Hindi, warm and calm'], ['Approx. script length', 'e.g. 2 minutes']],
        'Music production': ['Tell us about the music', ['Project type', 'Song, score, jingle…'], ['Mood / reference', 'e.g. intimate, cinematic'], ['Expected deliverable', 'e.g. full mix + instrumental']],
        'Audio editing & cleanup': ['Tell us about the source audio', ['Source type', 'Podcast, dialogue, interview…'], ['Approx. duration', 'e.g. 45 minutes'], ['Main issue', 'Noise, clicks, uneven levels…']],
        'Mixing & mastering': ['Tell us about the mix', ['Track / stem count', 'e.g. 24 stems'], ['Source format', 'e.g. WAV, 24-bit'], ['Delivery platform', 'e.g. YouTube, streaming']]
      };
      let last = serviceSelect ? serviceSelect.value : '';
      const update = () => {
        if (!serviceSelect || !block) return;
        if (last !== serviceSelect.value) extras.forEach(f => { if (f.input) f.input.value = ''; });
        last = serviceSelect.value;
        const p = prompts[serviceSelect.value];
        if (!p) { block.hidden = true; return; }
        block.hidden = false;
        if (heading) heading.textContent = p[0];
        p.slice(1).forEach((d, i) => {
          const f = extras[i];
          if (!f || !f.label || !f.input) return;
          f.label.textContent = d[0];
          f.input.placeholder = d[1];
          f.input.setAttribute('aria-label', `${d[0]} (optional)`);
        });
      };
      if (serviceSelect) serviceSelect.addEventListener('change', update);

      // Arrive from a service card or offer button: ?service=...&offer=1
      const params = new URLSearchParams(window.location.search);
      const wanted = params.get('service');
      if (serviceSelect && wanted) {
        const opt = [...serviceSelect.options].find(o => o.value === wanted || o.textContent.trim() === wanted);
        if (opt) serviceSelect.value = opt.value;
      }
      if (params.get('offer') === '1') { const c = document.querySelector('#weekend20'); if (c) c.checked = true; }
      update();

      form.querySelectorAll('input, select, textarea').forEach(c => {
        c.addEventListener('focus', () => body.classList.add('form-focus'));
        c.addEventListener('blur', () => body.classList.remove('form-focus'));
      });

      const status = document.querySelector('#form-status');
      const follow = document.querySelector('#whatsapp-followup');
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const d = new FormData(form);
        const v = k => String(d.get(k) || '').trim();
        const extra = [['one', 'extraOne'], ['two', 'extraTwo'], ['three', 'extraThree']]
          .map(([n, key]) => [document.querySelector(`#extra-${n}-label`)?.textContent || 'Project detail', v(key)])
          .filter(([, val]) => val).map(([l, val]) => `${l}: ${val}`);
        const lines = [
          'Hello Voicenix Studios! I would like to enquire about a project.', '',
          `Name: ${v('name')}`, v('email') ? `Email: ${v('email')}` : null, `Service: ${v('service')}`,
          `Timeline: ${v('deadline') || 'Not decided yet'}`,
          v('prefdate') ? `Preferred date: ${v('prefdate')}` : null,
          v('reflink') ? `Reference: ${v('reflink')}` : null,
          `Weekend offer: ${d.get('weekend20') === 'on' ? 'Yes (WEEKEND20)' : 'Not specified'}`,
          ...extra, '', 'Project details:', v('details')
        ].filter(l => l !== null);
        follow.href = `https://wa.me/919870532587?text=${encodeURIComponent(lines.join('\n'))}`;
        follow.hidden = false;
        status.textContent = 'Your brief is ready. Select the link below to send it to Voicenix on WhatsApp.';
        follow.focus();
      });
    }

    // Copy studio address.
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const text = btn.getAttribute('data-copy') || '';
        const out = document.querySelector('.copy-status');
        let ok = false;
        try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
          try { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); ok = document.execCommand('copy'); t.remove(); } catch (e2) { /* ignore */ }
        }
        if (out) out.textContent = ok ? 'Address copied.' : 'Copy is not available. Please select the address above.';
      });
    });

    if (canAnimateReveals) root.classList.add('js-enabled');
  } catch (error) {
    root.classList.remove('js-enabled');
    revealElements.forEach(el => el.classList.add('is-visible'));
    console.error('Voicenix interaction error:', error);
  }
})();
