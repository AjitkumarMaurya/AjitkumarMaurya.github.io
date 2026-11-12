/* Progressive enhancement for a static GitHub Pages site. No runtime dependencies. */
'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const root = document.documentElement;
root.classList.add('js');

// Keep theme selection available even when browser storage is restricted.
const themeButton = $('.theme-toggle');
function syncTheme() {
  const light = root.dataset.theme === 'light';
  themeButton.setAttribute('aria-pressed', String(light));
  themeButton.setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} theme`);
  $('meta[name="theme-color"]').content = light ? '#f8f9fc' : '#0c0f17';
}
themeButton.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('portfolio-theme', root.dataset.theme); } catch { /* Storage is optional. */ }
  syncTheme();
});
syncTheme();
$('#year').textContent = new Date().getFullYear();

// Mobile navigation, including keyboard dismissal and breakpoint changes.
const menu = $('.menu-toggle');
const nav = $('.nav-links');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open navigation');
  nav.classList.remove('is-open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  nav.classList.toggle('is-open', open);
});
$$('a', nav).forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', event => {
  if (!event.target.closest('.navigation')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
matchMedia('(min-width:821px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

// Failed artwork leaves an explicit visual state rather than a broken image icon.
function watchImage(img) {
  const fail = () => img.classList.add('image-failed');
  img.addEventListener('error', fail);
  img.addEventListener('load', () => img.classList.remove('image-failed'));
  if (img.complete && img.currentSrc && !img.naturalWidth) fail();
}
$$('img[src]').forEach(watchImage);

// Native dialog supplies focus containment, Escape handling and inert background content.
const dialog = $('.image-dialog');
let lastArtwork;
$$('[data-image]').forEach(link => link.addEventListener('click', event => {
  if (typeof dialog.showModal !== 'function') return;
  event.preventDefault();
  lastArtwork = link;
  const image = $('#dialog-image');
  const thumb = $('img', link);
  const error = $('.dialog-error');
  error.hidden = true;
  image.onload = () => { error.hidden = true; image.hidden = false; };
  image.onerror = () => { error.hidden = false; image.hidden = true; };
  image.hidden = false;
  if (thumb) {
    const w = thumb.getAttribute('width');
    const h = thumb.getAttribute('height');
    if (w) image.setAttribute('width', w);
    if (h) image.setAttribute('height', h);
  }
  image.alt = link.dataset.alt || thumb?.alt || link.dataset.caption || 'Application screenshot';
  image.src = link.dataset.image;
  $('#image-caption').textContent = link.dataset.caption || '';
  $('#dialog-original').href = link.href;
  dialog.showModal();
  document.body.classList.add('modal-open');
}));
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const box = dialog.getBoundingClientRect();
  if (
    event.target === dialog &&
    (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)
  ) {
    dialog.close();
  }
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  lastArtwork?.focus({ preventScroll: true });
});

// Respect reduced motion immediately and when the OS preference changes.
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = $('.motion-toggle');
let manuallyPaused = false;
let rotationTimer;
let wordIndex = 0;
const expertise = [
  'Native Android development',
  'Flutter & cross-platform apps',
  'Technical leadership',
  'AI & mobile integrations'
];

function syncMotion() {
  const paused = motionQuery.matches || manuallyPaused;
  root.dataset.motion = paused ? 'off' : 'on';
  motionButton.disabled = motionQuery.matches;
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.textContent = motionQuery.matches ? 'Reduced motion' : manuallyPaused ? 'Resume motion' : 'Pause motion';
  clearInterval(rotationTimer);
  if (!paused) {
    rotationTimer = setInterval(() => {
      if (document.hidden) return;
      const text = $('.rotating-text');
      text.classList.add('changing');
      setTimeout(() => {
        wordIndex = (wordIndex + 1) % expertise.length;
        text.textContent = expertise[wordIndex];
        text.classList.remove('changing');
      }, 220);
    }, 3600);
  }
}
motionButton.addEventListener('click', () => {
  manuallyPaused = !manuallyPaused;
  syncMotion();
});
motionQuery.addEventListener('change', syncMotion);
syncMotion();

function revealVisible() {
  const cutoff = innerHeight + 120;
  $$('[data-reveal]:not(.in-view)').forEach(element => {
    if (element.getBoundingClientRect().top <= cutoff) {
      element.classList.add('in-view');
    }
  });
}

if ('IntersectionObserver' in window) {
  const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      reveals.unobserve(entry.target);
    }
  }), { threshold: 0, rootMargin: '120px 0px 120px 0px' });
  revealVisible();
  $$('[data-reveal]:not(.in-view)').forEach(element => reveals.observe(element));
  root.classList.add('reveal-enabled');
}

// Scroll progress, back-to-top visibility and deterministic section tracking via aria-current.
const trackedSections = $$('main > section[id]');
const sectionLinks = $$('a[href^="#"]', nav);
let scrollPending = false;

function updateActiveSection() {
  let activeId = '';
  const atBottom = scrollY + innerHeight >= root.scrollHeight - 60;
  if (atBottom && trackedSections.length) {
    activeId = trackedSections[trackedSections.length - 1].id;
  } else {
    const triggerY = Math.max(220, innerHeight * 0.35);
    for (const section of trackedSections) {
      if (section.getBoundingClientRect().top <= triggerY) {
        activeId = section.id;
      }
    }
  }
  sectionLinks.forEach(link => {
    if (activeId && link.hash === `#${activeId}`) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function updateScroll() {
  scrollPending = false;
  const max = root.scrollHeight - innerHeight;
  root.style.setProperty('--progress', `${max > 0 ? (scrollY / max) * 100 : 0}%`);
  $('.back-top').classList.toggle('visible', scrollY > 700);
  revealVisible();
  updateActiveSection();
}

addEventListener('scroll', () => {
  if (!scrollPending) {
    scrollPending = true;
    requestAnimationFrame(updateScroll);
  }
}, { passive: true });
addEventListener('resize', updateScroll);
addEventListener('hashchange', updateActiveSection);
updateScroll();

// Copy email action with visible feedback and screen-reader status announcement.
const copyButton = $('.copy-email');
const copyStatus = $('#copy-status');
let copyResetTimer;

async function copyText(value) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(value);
    return;
  }
  const helper = document.createElement('textarea');
  helper.value = value;
  helper.setAttribute('readonly', '');
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  document.body.append(helper);
  helper.select();
  const ok = document.execCommand('copy');
  helper.remove();
  if (!ok) throw new Error('Clipboard unavailable');
}

if (copyButton) {
  const label = $('.copy-label', copyButton);
  const originalLabel = label.textContent;
  copyButton.addEventListener('click', async () => {
    const email = copyButton.dataset.email || 'ajitmauray@gmail.com';
    try {
      await copyText(email);
      clearTimeout(copyResetTimer);
      copyButton.classList.add('is-copied');
      label.textContent = 'Copied';
      if (copyStatus) copyStatus.textContent = `${email} copied to clipboard.`;
      copyResetTimer = setTimeout(() => {
        copyButton.classList.remove('is-copied');
        label.textContent = originalLabel;
        if (copyStatus) copyStatus.textContent = '';
      }, 2200);
    } catch {
      if (copyStatus) copyStatus.textContent = `Copy failed. Use ${email}.`;
    }
  });
}
