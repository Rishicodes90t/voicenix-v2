/* Voicenix Studios — progressive enhancement; native audio and content work without this file. */
(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const revealElements = Array.from(document.querySelectorAll('.reveal'));
  const reduceMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let canAnimateReveals = false;

  try {
    // Mobile navigation: close after selection, Escape, or an outside click.
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
      nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
      document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
      document.addEventListener('click', event => {
        if (menuToggle.getAttribute('aria-expanded') === 'true' && !nav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
      });
    }

    // Copyright year.
    const year = document.querySelector('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    // Reveal animation enhancement. Without JS all page content remains visible.
    if (revealElements.length && 'IntersectionObserver' in window && !reduceMotion) {
      const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            currentObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
      revealElements.forEach(element => observer.observe(element));
      canAnimateReveals = true;
    } else {
      revealElements.forEach(element => element.classList.add('is-visible'));
    }

    // Generate small decorative waveform bars. Native audio controls remain usable on their own.
    const waveHeights = [18, 29, 44, 24, 36, 51, 28, 17, 39, 48, 30, 22, 56, 35, 25, 42, 19, 33, 50, 27, 15, 38, 46, 23, 31, 53, 20, 40, 28, 16, 45, 34, 24, 49, 18, 37, 29, 54, 22, 41, 26, 34, 17, 47, 30, 20];
    document.querySelectorAll('.mini-waveform, .comparison-waveform').forEach(wave => {
      wave.replaceChildren();
      waveHeights.forEach((height, index) => {
        const bar = document.createElement('span');
        bar.className = 'wave-bar';
        bar.style.setProperty('--bar-height', `${height}%`);
        bar.style.setProperty('--bar-delay', `${(index % 11) * 0.055}s`);
        wave.appendChild(bar);
      });
    });

    // Play-state animation and single-active-preview behaviour.
    const allAudio = Array.from(document.querySelectorAll('audio'));
    allAudio.forEach(audio => {
      const card = audio.closest('.work-card, .compare-card');
      audio.addEventListener('play', () => {
        allAudio.forEach(other => {
          if (other !== audio && !other.paused) other.pause();
        });
        if (card) card.classList.add('is-playing');
      });
      ['pause', 'ended', 'emptied'].forEach(eventName => audio.addEventListener(eventName, () => {
        if (card && audio.paused) card.classList.remove('is-playing');
      }));
      audio.addEventListener('timeupdate', () => {
        const wave = card && card.querySelector('.mini-waveform, .comparison-waveform');
        if (!wave || !audio.duration || !Number.isFinite(audio.duration)) return;
        const progress = audio.currentTime / audio.duration;
        wave.style.setProperty('--audio-progress', `${Math.round(progress * 100)}%`);
        const bars = wave.querySelectorAll('.wave-bar');
        bars.forEach((bar, index) => bar.classList.toggle('is-played', index / Math.max(bars.length, 1) <= progress));
      });
    });

    // Service-specific questions in the enquiry form.
    const serviceSelect = document.querySelector('#service');
    const specificBlock = document.querySelector('#service-specific-fields');
    const specificHeading = document.querySelector('#service-specific-heading');
    const extraFields = [
      { label: document.querySelector('#extra-one-label'), input: document.querySelector('#extra-one') },
      { label: document.querySelector('#extra-two-label'), input: document.querySelector('#extra-two') },
      { label: document.querySelector('#extra-three-label'), input: document.querySelector('#extra-three') }
    ];
    const servicePrompts = {
      'Vocal recording': { heading: 'Tell us about the session', fields: [
        ['Recording purpose', 'Song, dialogue, podcast…'], ['Approx. session length', 'e.g. 2 hours'], ['Number of performers', 'e.g. 1 vocalist'] ] },
      'Dubbing & localisation': { heading: 'A few details for the dubbing brief', fields: [
        ['Language pair', 'e.g. Hindi to Bengali'], ['Episode count', 'e.g. 12 episodes'], ['Approx. duration', 'e.g. 90 minutes total'] ] },
      'Voice-over': { heading: 'Help us understand the voice-over', fields: [
        ['Content type', 'Ad, explainer, narration…'], ['Language / tone', 'e.g. Hindi, warm and calm'], ['Approx. script length', 'e.g. 2 minutes'] ] },
      'Music production': { heading: 'Tell us about the music', fields: [
        ['Project type', 'Song, score, jingle…'], ['Mood / reference', 'e.g. intimate, cinematic'], ['Expected deliverable', 'e.g. full mix + instrumental'] ] },
      'Audio editing & cleanup': { heading: 'Tell us about the source audio', fields: [
        ['Source type', 'Podcast, dialogue, interview…'], ['Approx. duration', 'e.g. 45 minutes'], ['Main issue', 'Noise, clicks, uneven levels…'] ] },
      'Mixing & mastering': { heading: 'Tell us about the mix', fields: [
        ['Track / stem count', 'e.g. 24 stems'], ['Source format', 'e.g. WAV, 24-bit'], ['Delivery platform', 'e.g. YouTube, streaming'] ] }
    };
    let lastServiceValue = serviceSelect ? serviceSelect.value : '';
    const clearSpecificBlock = () => {
      if (!specificBlock) return;
      specificBlock.hidden = true;
      extraFields.forEach(field => { if (field.input) field.input.value = ''; });
    };
    const updateServiceFields = () => {
      if (!serviceSelect || !specificBlock) return;
      if (lastServiceValue && lastServiceValue !== serviceSelect.value) {
        extraFields.forEach(field => { if (field.input) field.input.value = ''; });
      }
      lastServiceValue = serviceSelect.value;
      const prompt = servicePrompts[serviceSelect.value];
      if (!prompt) { clearSpecificBlock(); return; }
      specificBlock.hidden = false;
      if (specificHeading) specificHeading.textContent = prompt.heading;
      prompt.fields.forEach((definition, index) => {
        const field = extraFields[index];
        if (!field.label || !field.input) return;
        field.label.textContent = definition[0];
        field.input.placeholder = definition[1];
        field.input.setAttribute('aria-label', `${definition[0]} (optional)`);
      });
    };
    if (serviceSelect) {
      serviceSelect.addEventListener('change', updateServiceFields);
      updateServiceFields();
    }

    // Light pointer tilt on service cards (desktop only); mobile keeps natural touch behaviour.
    if (!reduceMotion && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('pointermove', event => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / Math.max(rect.width, 1) - .5;
          const y = (event.clientY - rect.top) / Math.max(rect.height, 1) - .5;
          card.style.setProperty('--tilt-x', `${(x * 2.4).toFixed(2)}deg`);
          card.style.setProperty('--tilt-y', `${(-y * 2.4).toFixed(2)}deg`);
        }, { passive: true });
        card.addEventListener('pointerleave', () => {
          card.style.setProperty('--tilt-x', '0deg');
          card.style.setProperty('--tilt-y', '0deg');
        });
      });
    }

    // Service-card links preselect the service, and weekend CTAs tick the offer checkbox.
    document.querySelectorAll('[data-service-select]').forEach(link => {
      link.addEventListener('click', () => {
        if (!serviceSelect) return;
        const service = link.getAttribute('data-service-select');
        if ([...serviceSelect.options].some(option => option.value === service || option.textContent.trim() === service)) {
          serviceSelect.value = service;
          if (serviceSelect.value !== service) serviceSelect.value = [...serviceSelect.options].find(option => option.textContent.trim() === service)?.value || '';
          updateServiceFields();
        }
      });
    });
    document.querySelectorAll('[data-weekend-offer]').forEach(link => {
      link.addEventListener('click', () => {
        const checkbox = document.querySelector('#weekend20');
        if (checkbox) checkbox.checked = true;
      });
    });

    // Keep navigation's active state aligned with the section currently in view.
    const navLinks = Array.from(document.querySelectorAll('.primary-nav a[href^="#"]'));
    const navTargets = navLinks.map(link => ({ link, target: document.querySelector(link.getAttribute('href')) })).filter(item => item.target);
    if ('IntersectionObserver' in window && navTargets.length) {
      const navObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          navTargets.forEach(({ link, target }) => {
            const active = target === entry.target;
            link.classList.toggle('is-active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
      navTargets.forEach(({ target }) => navObserver.observe(target));
    }

    // Hide the fixed mobile contact bar when the booking form is in view or keyboard is focused.
    const bookingSection = document.querySelector('#booking');
    if (bookingSection && 'IntersectionObserver' in window) {
      const bookingObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => body.classList.toggle('booking-in-view', entry.isIntersecting));
      }, { threshold: 0.18 });
      bookingObserver.observe(bookingSection);
    }
    document.querySelectorAll('#booking-form input, #booking-form select, #booking-form textarea').forEach(control => {
      control.addEventListener('focus', () => body.classList.add('form-focus'));
      control.addEventListener('blur', () => body.classList.remove('form-focus'));
    });

    // Booking form creates a WhatsApp message. No submission is stored on a server.
    const bookingForm = document.querySelector('#booking-form');
    const status = document.querySelector('#form-status');
    const followup = document.querySelector('#whatsapp-followup');
    if (bookingForm && status && followup) {
      bookingForm.addEventListener('submit', event => {
        event.preventDefault();
        if (!bookingForm.reportValidity()) return;
        const data = new FormData(bookingForm);
        const name = String(data.get('name') || '').trim();
        const email = String(data.get('email') || '').trim();
        const service = String(data.get('service') || '').trim();
        const deadline = String(data.get('deadline') || 'Not decided yet').trim();
        const details = String(data.get('details') || '').trim();
        const wantsOffer = data.get('weekend20') === 'on';
        const extra = [
          [document.querySelector('#extra-one-label')?.textContent || 'Project detail', data.get('extraOne')],
          [document.querySelector('#extra-two-label')?.textContent || 'Project detail', data.get('extraTwo')],
          [document.querySelector('#extra-three-label')?.textContent || 'Project detail', data.get('extraThree')]
        ].filter(([, value]) => String(value || '').trim()).map(([label, value]) => `${label}: ${String(value).trim()}`);
        const messageLines = [
          'Hello Voicenix Studios! I would like to enquire about a project.', '',
          `Name: ${name}`, email ? `Email: ${email}` : null, `Service: ${service}`,
          `Timeline: ${deadline}`, `Weekend offer: ${wantsOffer ? 'Yes (WEEKEND20)' : 'Not specified'}`,
          ...extra, '', 'Project details:', details
        ].filter(line => line !== null);
        followup.href = `https://wa.me/919870532587?text=${encodeURIComponent(messageLines.join('\n'))}`;
        followup.hidden = false;
        status.textContent = 'Your brief is ready. Select the link below to send it to Voicenix on WhatsApp.';
        followup.focus();
      });
    }

    if (canAnimateReveals) root.classList.add('js-enabled');
  } catch (error) {
    root.classList.remove('js-enabled');
    revealElements.forEach(element => element.classList.add('is-visible'));
    console.error('Voicenix website interaction error:', error);
  }
})();
