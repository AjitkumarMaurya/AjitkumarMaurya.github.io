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
  document.body.classList.add('theme-transition');
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('portfolio-theme', root.dataset.theme); } catch { /* Storage is optional. */ }
  syncTheme();
  setTimeout(() => document.body.classList.remove('theme-transition'), 300);
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
document.addEventListener('click', event => { if (!event.target.closest('.navigation')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
});
matchMedia('(min-width:651px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

// Failed remote artwork leaves a deliberate, labeled placeholder rather than a broken image.
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
  const error = $('.dialog-error');
  error.hidden = true;
  image.onload = () => { error.hidden = true; image.hidden = false; };
  image.onerror = () => { error.hidden = false; image.hidden = true; };
  image.hidden = false;
  image.alt = link.dataset.caption;
  image.src = link.dataset.image;
  $('#image-caption').textContent = link.dataset.caption;
  $('#dialog-original').href = link.href;
  dialog.showModal();
  document.body.classList.add('modal-open');
}));
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const box = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
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
const expertise = ['Native Android development', 'Flutter & cross-platform apps', 'Technical leadership', 'AI & mobile integrations'];
function syncMotion() {
  const paused = motionQuery.matches || manuallyPaused;
  root.dataset.motion = paused ? 'off' : 'on';
  motionButton.disabled = motionQuery.matches;
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.textContent = motionQuery.matches ? 'Reduced motion' : manuallyPaused ? 'Resume motion' : 'Pause motion';
  clearInterval(rotationTimer);
  if (!paused) rotationTimer = setInterval(() => {
    if (document.hidden) return;
    const text = $('.rotating-text');
    text.classList.add('changing');
    setTimeout(() => { wordIndex = (wordIndex + 1) % expertise.length; text.textContent = expertise[wordIndex]; text.classList.remove('changing'); }, 220);
  }, 3600);
}
motionButton.addEventListener('click', () => { manuallyPaused = !manuallyPaused; syncMotion(); });
motionQuery.addEventListener('change', syncMotion);
syncMotion();
if ('IntersectionObserver' in window) {
  const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); reveals.unobserve(entry.target); }
  }), { threshold: 0.04, rootMargin: '0px 0px 15px 0px' });
  $$('[data-reveal]').forEach(element => reveals.observe(element));
  root.classList.add('reveal-enabled');
  const sections = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    $$('a[href^="#"]', nav).forEach(link => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }), { rootMargin: '-15% 0px -65% 0px' });
  $$('main > section[id]').forEach(section => sections.observe(section));
}
let scrollPending = false;
function updateScroll() {
  scrollPending = false;
  const max = root.scrollHeight - innerHeight;
  root.style.setProperty('--progress', `${max > 0 ? scrollY / max * 100 : 0}%`);
  $('.back-top').classList.toggle('visible', scrollY > 700);
}
addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); } }, { passive: true });
addEventListener('resize', updateScroll);
updateScroll();

// Repository data starts with a local snapshot. Public API failure never removes useful content.
const selectedNames = ['imdbkt', 'news_app_newsapi_io', 'galleryImagePicker', 'flutter_ai_scrapper', 'CountryCodePickerProject', 'SeasonalGreeting'];
const ignoredNames = new Set(['AjitkumarMaurya', 'AjitkumarMaurya.github.io', 'io.github.ajitkumarmaurya', 'maflxe0o1d', 'myco_app_doc', 'maven-repo', 'OSSRH-71813', 'backend']);
const controls = ['repo-search', 'repo-category', 'repo-type', 'repo-language', 'repo-sort'].map(id => document.getElementById(id));
let repositoryData = [];
let curatedData = new Map();
function validRepository(repo) {
  return repo && typeof repo.name === 'string' && typeof repo.html_url === 'string' &&
    /^https:\/\/github\.com\/AjitkumarMaurya\/[A-Za-z0-9_.-]+$/.test(repo.html_url) && repo.private !== true;
}
function category(repo) {
  if (repo.name === 'flutter_ai_scrapper') return 'Experiments';
  if (repo.language === 'Kotlin') return 'Kotlin';
  if (repo.language === 'Dart' || /flutter/i.test(repo.name)) return 'Flutter';
  if (repo.language === 'Java' || /android/i.test(repo.name)) return 'Android';
  return 'Experiments';
}
function useful(repo) {
  const meaningful = typeof repo.description === 'string' && repo.description.trim().length >= 35;
  return !repo.archived && !ignoredNames.has(repo.name) && (selectedNames.includes(repo.name) ||
    (repo.size !== 0 && !!repo.language && meaningful && (repo.fork || ['Kotlin', 'Java', 'Dart'].includes(repo.language))));
}
function makeRepoCard(repo) {
  const article = document.createElement('article');
  article.className = 'repo-card';
  // Only fixed markup enters innerHTML. API strings are assigned through textContent.
  article.innerHTML = '<div class="repo-top"><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#code"/></svg><span></span><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#arrow"/></svg></div><h3><a target="_blank" rel="noopener noreferrer"></a></h3><p></p><div class="repo-meta"><span class="language-dot"></span><span class="repo-language"></span><span class="repo-origin"></span></div>';
  $('.repo-top span', article).textContent = repo.fork ? 'Fork' : category(repo);
  const link = $('h3 a', article);
  link.href = repo.html_url;
  link.textContent = repo.name;
  $('p', article).textContent = curatedData.get(repo.name)?.description || repo.description || 'Explore the source and development history on GitHub.';
  $('.repo-language', article).textContent = repo.language || 'Source code';
  $('.repo-origin', article).textContent = repo.fork ? 'Fork' : 'Original work';
  return article;
}
function renderRepositories() {
  const [search, tech, type, language, sort] = controls;
  const query = search.value.trim().toLowerCase();
  const result = repositoryData.filter(repo => useful(repo) && (type.value === 'all' || (type.value === 'fork' ? repo.fork : !repo.fork)) &&
    (tech.value === 'all' || category(repo) === tech.value) && (language.value === 'all' || repo.language === language.value) &&
    [repo.name, curatedData.get(repo.name)?.description, repo.description, repo.language, category(repo)].filter(Boolean).join(' ').toLowerCase().includes(query));
  result.sort((a, b) => {
    if (sort.value === 'name') return a.name.localeCompare(b.name);
    if (sort.value === 'updated') return (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0);
    if (a.fork !== b.fork) return Number(a.fork) - Number(b.fork);
    const ai = selectedNames.indexOf(a.name), bi = selectedNames.indexOf(b.name);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.name.localeCompare(b.name);
  });
  const fragment = document.createDocumentFragment();
  result.forEach(repo => fragment.append(makeRepoCard(repo)));
  $('#repo-grid').replaceChildren(fragment);
  $('#repo-empty').hidden = result.length > 0;
  $('#repo-count').textContent = `${result.length} ${result.length === 1 ? 'repository' : 'repositories'} · ${type.value === 'original' ? 'Original work' : type.value === 'fork' ? 'Forks' : 'Original work & forks'}`;
}
function populateLanguages() {
  const language = $('#repo-language');
  const selected = language.value;
  language.replaceChildren(new Option('All languages', 'all'), ...[...new Set(repositoryData.filter(useful).map(repo => repo.language).filter(Boolean))].sort().map(name => new Option(name, name)));
  language.value = [...language.options].some(option => option.value === selected) ? selected : 'all';
}
controls.forEach(control => control.addEventListener(control.type === 'search' ? 'input' : 'change', renderRepositories));
$('#repo-reset').addEventListener('click', () => {
  controls[0].value = ''; controls[1].value = 'all'; controls[2].value = 'original'; controls[3].value = 'all'; controls[4].value = 'featured'; renderRepositories(); controls[0].focus();
});
async function fetchJSON(url, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, credentials: 'omit', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Data unavailable');
    return await response.json();
  } finally { clearTimeout(timer); }
}
async function refreshPublicRepositories() {
  try {
    const all = [];
    for (let page = 1; page <= 10; page++) {
      const batch = await fetchJSON(`https://api.github.com/users/AjitkumarMaurya/repos?per_page=100&sort=updated&page=${page}`);
      if (!Array.isArray(batch)) throw new Error('Unexpected response');
      all.push(...batch.filter(repo => validRepository(repo) && repo.owner?.login?.toLowerCase() === 'ajitkumarmaurya' && repo.private === false));
      if (batch.length < 100) break;
    }
    if (!all.length) throw new Error('Empty response');
    repositoryData = all;
    populateLanguages(); renderRepositories();
    $('#repo-refresh').textContent = 'Refreshed from public GitHub data. Original work is shown first; archived and irrelevant repositories are omitted.';
  } catch {
    $('#repo-refresh').textContent = 'Showing the saved public collection. Live GitHub refresh is temporarily unavailable.';
  }
}
(async () => {
  try {
    const data = await fetchJSON('assets/repositories.json');
    if (!Array.isArray(data)) throw new Error('Invalid snapshot');
    repositoryData = data.filter(validRepository);
    curatedData = new Map(repositoryData.filter(repo => selectedNames.includes(repo.name)).map(repo => [repo.name, repo]));
    populateLanguages(); renderRepositories();
    $('.repo-controls').hidden = false;
    if ('requestIdleCallback' in window) requestIdleCallback(refreshPublicRepositories, { timeout: 3000 }); else setTimeout(refreshPublicRepositories, 1000);
  } catch {
    $('#repo-refresh').textContent = 'Selected work is shown below. Visit GitHub for the full public collection.';
  }
})();
