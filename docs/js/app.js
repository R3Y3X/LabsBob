import { loadContent } from './content.js';
import { siteData, workshopGuides, findLab, getNextLab, getWorkshopStats, roadshowConfig, getRoadshowPlan, getLabTrackMeta } from './data.js';
import { getHomeRoute, getLabRoute, parseRoute } from './router.js';
import { initializeTheme, toggleTheme } from './theme.js';

const PREMIUM_STORAGE_KEY = 'labsBob.premiumAccess';
let premiumAccess = readPremiumAccess();

const HOME_SECTION_IDS = new Set(['roadshow-planner', 'available-workshops', 'nosotros', 'recursos', 'acerca-de', 'section-basic', 'section-integraciones', 'section-premium']);

const homeView = document.querySelector('#home-view');
const labView = document.querySelector('#lab-view');
const labShell = document.querySelector('#lab-shell');
const subnavEl = document.querySelector('#subnav-region');
const subnavItems = document.querySelector('#subnav-items');
const siteNavItems = document.querySelector('#site-nav-items');
const themeToggle = document.querySelector('#theme-toggle');
const siteSearch = document.querySelector('#site-search');
const hamburgerBtn = document.querySelector('#hamburger-btn');
const sideNav = document.querySelector('#side-nav');
const sideNavOverlay = document.querySelector('#side-nav-overlay');
const sideNavItemsMobile = document.querySelector('#side-nav-items-mobile');
const premiumToggle = document.querySelector('#premium-toggle');
const premiumToggleMobile = document.querySelector('#premium-toggle-mobile');

function readPremiumAccess() {
  try {
    return window.localStorage.getItem(PREMIUM_STORAGE_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

function getAccessMode() {
  return premiumAccess ? 'premium' : 'standard';
}

function persistPremiumAccess() {
  try {
    window.localStorage.setItem(PREMIUM_STORAGE_KEY, String(premiumAccess));
  } catch (error) {
    // Private browsing or blocked storage should not prevent the toggle from working.
  }
}

function updatePremiumToggle() {
  const label = premiumAccess ? 'Premium activo' : 'Sin premium';
  const title = premiumAccess
    ? 'Desactivar acceso a workflows premium'
    : 'Activar acceso a workflows premium';

  [premiumToggle, premiumToggleMobile].filter(Boolean).forEach((control) => {
    control.setAttribute('aria-pressed', String(premiumAccess));
    control.setAttribute('aria-label', title);
    control.title = title;
    const text = control.querySelector('[data-premium-toggle-label]');
    if (text) text.textContent = label;
  });

  document.body.dataset.premiumAccess = String(premiumAccess);
}

function rerenderAfterPremiumChange() {
  updatePremiumToggle();
  renderPlatformNav();

  const route = parseRoute(window.location.hash);
  if (route.view !== 'lab') {
    renderHome(siteSearch?.value || '');
    return;
  }

  const result = findLab(route.labSlug, getAccessMode());
  const stepExists = result?.lab.steps.some((step) => step.slug === route.stepSlug);
  if (!stepExists) {
    window.location.hash = getLabRoute(route.labSlug, 'overview');
    return;
  }

  renderRoute();
}

function togglePremiumAccess() {
  premiumAccess = !premiumAccess;
  persistPremiumAccess();
  rerenderAfterPremiumChange();
}

function getHashTarget() {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw || raw === '/') return null;
  if (raw.startsWith('/lab/') || raw.startsWith('lab/')) return null;
  // Support both #capacidades and #/capacidades, and section anchors like #section-integraciones
  const id = raw.replace(/^\//, '').split('/')[0];
  return HOME_SECTION_IDS.has(id) ? id : null;
}

function scrollLabToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function scrollToHomeSection(sectionId, { smooth = true } = {}) {
  const behavior = smooth ? 'smooth' : 'auto';
  suppressScrollSpy(smooth ? SMOOTH_SCROLL_MS : 250);
  if (!sectionId) {
    setNavActive(null);
    window.scrollTo({ top: 0, behavior });
    return;
  }

  const el = document.getElementById(sectionId);
  if (!el) return;

  const targetTop = Math.max(0, el.getBoundingClientRect().top + window.scrollY - HEADER_H);
  setNavActive(sectionId);
  window.scrollTo({ top: targetTop, behavior });
}

function saveHomeReturnTarget(link) {
  if (homeView.hidden) return;

  const payload = { scrollY: window.scrollY };
  const sectionEl = link.closest('[id^="section-"]');

  if (sectionEl) {
    payload.openSection = sectionEl.id.replace('section-', '');
    payload.offsetInSection = window.scrollY - sectionEl.offsetTop;
  } else {
    const anchorEl = link.closest('#roadshow-planner, #available-workshops');
    if (anchorEl) {
      payload.anchorId = anchorEl.id;
      payload.offsetInAnchor = window.scrollY - anchorEl.offsetTop;
    }
  }

  sessionStorage.setItem(HOME_RETURN_KEY, JSON.stringify(payload));
}

function getHomeReturnTarget() {
  try {
    return JSON.parse(sessionStorage.getItem(HOME_RETURN_KEY) || 'null');
  } catch {
    return null;
  }
}

function getHomeBackHref() {
  return getHomeRoute();
}

function openWorkshopSectionPanel(trigger, panel) {
  if (!trigger || !panel) return Promise.resolve();

  const maxHeight = panel.style.maxHeight;
  const isFullyOpen = trigger.getAttribute('aria-expanded') === 'true'
    && (maxHeight === 'none' || (maxHeight && maxHeight !== '0px'));
  if (isFullyOpen) return Promise.resolve();

  if (panel._openEndHandler) {
    panel.removeEventListener('transitionend', panel._openEndHandler);
    panel._openEndHandler = null;
  }

  return new Promise((resolve) => {
    trigger.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    panel.style.maxHeight = '0px';
    panel.getBoundingClientRect();
    panel.style.maxHeight = `${panel.scrollHeight}px`;
    panel._openEndHandler = (transitionEvent) => {
      if (transitionEvent.propertyName !== 'max-height') return;
      if (trigger.getAttribute('aria-expanded') !== 'true') return;
      panel.style.maxHeight = 'none';
      panel.removeEventListener('transitionend', panel._openEndHandler);
      panel._openEndHandler = null;
      resolve();
    };
    panel.addEventListener('transitionend', panel._openEndHandler);
  });
}

function restoreHomeScrollPosition(sectionId, saved = getHomeReturnTarget()) {
  if (sectionId) {
    scrollToHomeSection(sectionId);
    return;
  }

  if (saved?.openSection != null && saved.offsetInSection != null) {
    const sectionEl = document.getElementById(`section-${saved.openSection}`);
    if (sectionEl) {
      const targetTop = Math.max(0, sectionEl.offsetTop + saved.offsetInSection);
      suppressScrollSpy(250);
      window.scrollTo({ top: targetTop, behavior: 'auto' });
      runScrollSpy();
      return;
    }
  }

  if (saved?.anchorId && saved.offsetInAnchor != null) {
    const anchorEl = document.getElementById(saved.anchorId);
    if (anchorEl) {
      const targetTop = Math.max(0, anchorEl.offsetTop + saved.offsetInAnchor);
      suppressScrollSpy(250);
      window.scrollTo({ top: targetTop, behavior: 'auto' });
      runScrollSpy();
      return;
    }
  }

  if (saved?.scrollY != null) {
    suppressScrollSpy(250);
    window.scrollTo({ top: saved.scrollY, behavior: 'auto' });
    runScrollSpy();
    return;
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
  setNavActive(null);
}

async function restoreHomeAfterRender(sectionId) {
  const saved = getHomeReturnTarget();

  if (saved?.openSection) {
    const sectionEl = document.getElementById(`section-${saved.openSection}`);
    if (sectionEl) {
      await openWorkshopSectionPanel(
        sectionEl.querySelector('.hub-level-banner--trigger'),
        sectionEl.querySelector('.hub-section-panel')
      );
    }
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  restoreHomeScrollPosition(sectionId, saved);
  initScrollSpy();
}

function navigateHomeSectionFromLink(event, link) {
  const href = link.getAttribute('href') || '';
  const raw = href.replace(/^#\/?/, '').split('/')[0];
  const isHomeTop = !raw;
  const sectionId = isHomeTop ? null : (HOME_SECTION_IDS.has(raw) ? raw : null);
  if (!isHomeTop && sectionId === null) return false;

  event.preventDefault();
  setNavActive(sectionId);
  const destination = sectionId ? `#${sectionId}` : getHomeRoute();
  if (window.location.hash !== destination) {
    window.location.hash = destination;
  } else {
    scrollToHomeSection(sectionId);
  }
  return true;
}

function resetLabScroll() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function settleLabScroll() {
  resetLabScroll();
  requestAnimationFrame(resetLabScroll);
}

//validate email addres

function setNavActive(sectionId) {
  siteNavItems.querySelectorAll('.cds--header__menu-item').forEach((link) => {
    const href = link.getAttribute('href') || '';
    let isCurrent = false;
    if (sectionId) {
      isCurrent = href === `#${sectionId}`;
    } else {
      isCurrent = href === '#/' || href === '#';
    }
    if (isCurrent) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function updateNavCurrent() {
  const route = parseRoute(window.location.hash || '#/');
  if (route.view !== 'home') {
    siteNavItems.querySelectorAll('.cds--header__menu-item')
      .forEach((link) => link.removeAttribute('aria-current'));
    return;
  }
  setNavActive(getHashTarget());
}

// ── Scroll-spy: keep nav in sync as user scrolls the home page ───
// Uses a scroll listener instead of IntersectionObserver so it can
// reliably detect "back to top = Inicio" with no threshold edge cases.

const SPY_SECTIONS = ['roadshow-planner', 'available-workshops', 'nosotros', 'recursos', 'acerca-de'];
const HEADER_H = 48; // fixed header height in px
const SMOOTH_SCROLL_MS = 900;
const HOME_RETURN_KEY = 'hub-home-return';
let scrollSpyRaf = null;
let scrollSpyBound = false;
let scrollSpySuppressedUntil = 0;
let scrollSpyResumeTimer = null;
let labTocObserver = null;

function suppressScrollSpy(duration) {
  scrollSpySuppressedUntil = Date.now() + duration;
  window.clearTimeout(scrollSpyResumeTimer);
  scrollSpyResumeTimer = window.setTimeout(() => {
    scrollSpySuppressedUntil = 0;
  }, duration);
}

function runScrollSpy() {
  scrollSpyRaf = null;
  if (homeView.hidden) return;
  if (Date.now() < scrollSpySuppressedUntil) return;

  const scrollY = window.scrollY;
  // Find the last section whose top is at or above the trigger line
  // (header height + 8px breathing room)
  const trigger = scrollY + HEADER_H + 8;

  // Bottom-of-page detection: if user has scrolled within 64px of the bottom,
  // treat "acerca-de" as active so it can always be reached by the nav highlight.
  const atBottom = (window.innerHeight + scrollY) >= (document.body.scrollHeight - 64);
  if (atBottom) {
    setNavActive('acerca-de');
    return;
  }

  let active = null; // null = Inicio
  for (const id of SPY_SECTIONS) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.offsetTop <= trigger) {
      active = id;
    }
  }

  setNavActive(active);
}

function onScrollSpy() {
  if (scrollSpyRaf) return;
  scrollSpyRaf = requestAnimationFrame(runScrollSpy);
}

function initScrollSpy() {
  // Tear down previous listener if any
  window.removeEventListener('scroll', onScrollSpy);
  scrollSpyBound = false;

  window.addEventListener('scroll', onScrollSpy, { passive: true });
  scrollSpyBound = true;

  // Run once immediately so the state is correct on first render
  runScrollSpy();
}

function teardownScrollSpy() {
  window.removeEventListener('scroll', onScrollSpy);
  scrollSpyBound = false;
  if (scrollSpyRaf) {
    cancelAnimationFrame(scrollSpyRaf);
    scrollSpyRaf = null;
  }
}

// ── Lab page index ──────────────────────────────────────────────
// The lab remains the primary reading surface. This index lives at the far
// right and is derived from the actual headings, so it cannot drift from the
// content it describes.
function teardownLabToc() {
  labTocObserver?.disconnect();
  labTocObserver = null;
}

function getLabHeadingId(heading, prefix, usedIds) {
  if (heading.id) {
    usedIds.add(heading.id);
    return heading.id;
  }

  const base = heading.textContent
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'seccion';
  let id = `${prefix}-${base}`;
  let suffix = 2;

  while (usedIds.has(id) || document.getElementById(id)) {
    id = `${prefix}-${base}-${suffix}`;
    suffix += 1;
  }

  heading.id = id;
  usedIds.add(id);
  return id;
}

function setActiveLabTocLink(toc, id) {
  toc.querySelectorAll('.lab-toc__link').forEach((link) => {
    if (link.dataset.tocTarget === id) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function buildLabToc(proseEl, lab, step) {
  teardownLabToc();
  const layout = proseEl.closest('.lab-reading-layout');
  if (!layout) return;

  const usedIds = new Set();
  const prefix = `${lab.slug}-${step.slug}`;
  const headings = Array.from(proseEl.querySelectorAll('h2'))
    .filter((heading) => !heading.closest('.lab-guide, .lab-closure, .workshop-format'))
    .map((heading) => ({
      id: getLabHeadingId(heading, prefix, usedIds),
      label: heading.textContent.trim().replace(/\s+/g, ' ')
    }))
    .filter(({ label }) => label.length > 0);

  if (headings.length < 2) return;

  const toc = document.createElement('aside');
  toc.className = 'lab-toc';
  toc.setAttribute('aria-label', 'En esta página');
  toc.innerHTML = `
    <p class="lab-toc__title">En esta página</p>
    <nav class="lab-toc__nav" aria-label="Secciones del lab">
      <ul class="lab-toc__list">
        ${headings.map(({ id, label }) => `
          <li><a class="lab-toc__link" href="${getLabRoute(lab.slug, step.slug, id)}" data-toc-target="${id}">${escapeHtml(label)}</a></li>
        `).join('')}
      </ul>
    </nav>`;
  layout.append(toc);

  const scrollToTarget = (link) => {
    const target = document.getElementById(link.dataset.tocTarget);
    if (!target) return;
    setActiveLabTocLink(toc, target.id);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  toc.addEventListener('click', (event) => {
    const link = event.target.closest('.lab-toc__link');
    if (!link) return;
    event.preventDefault();
    const href = link.getAttribute('href');
    if (href && window.location.hash !== href) {
      history.replaceState(null, '', href);
    }
    scrollToTarget(link);
  });

  toc.addEventListener('keydown', (event) => {
    if (event.key !== ' ' || !event.target.matches('.lab-toc__link')) return;
    event.preventDefault();
    scrollToTarget(event.target);
  });

  setActiveLabTocLink(toc, headings[0].id);
  labTocObserver = new IntersectionObserver((entries) => {
    const active = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (active) setActiveLabTocLink(toc, active.target.id);
  }, {
    rootMargin: '-144px 0px -62% 0px',
    threshold: 0
  });

  headings.forEach(({ id }) => {
    const heading = document.getElementById(id);
    if (heading) labTocObserver.observe(heading);
  });
}

// ── SideNav open / close ─────────────────────────────────────────
function openSideNav() {
  sideNav.classList.add('cds--side-nav--expanded');
  sideNav.setAttribute('aria-hidden', 'false');
  hamburgerBtn.setAttribute('aria-expanded', 'true');
  hamburgerBtn.setAttribute('aria-label', 'Cerrar menú de navegación');
  sideNavOverlay.classList.add('is-visible');
  sideNavOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('hub-side-nav-open');
}

function closeSideNav() {
  sideNav.classList.remove('cds--side-nav--expanded');
  sideNav.setAttribute('aria-hidden', 'true');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  hamburgerBtn.setAttribute('aria-label', 'Abrir menú de navegación');
  sideNavOverlay.classList.remove('is-visible');
  sideNavOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('hub-side-nav-open');
}

// ── Top nav + SideNav items ──────────────────────────────────────
function renderPlatformNav() {
  siteNavItems.innerHTML = siteData.topNav
    .map((item) => `<li><a class="cds--header__menu-item" href="${item.href}">${item.label}</a></li>`)
    .join('');

  const navLinks = siteData.topNav
    .map((item) => `<li><a class="cds--side-nav__link hub-side-nav__top-link" href="${item.href}">${item.label}</a></li>`)
    .join('');

  const labLinks = getVisibleSections(getAccessMode())
    .map((section) => {
      const labItems = section.labs
        .map((lab) => `<li><a class="cds--side-nav__link cds--side-nav__link--sub" href="${getLabRoute(lab.slug)}">${lab.title}</a></li>`)
        .join('');
      return `
        <li class="hub-side-nav__section-label">${section.title}</li>
        ${labItems}
      `;
    })
    .join('');

  sideNavItemsMobile.innerHTML = navLinks + labLinks;
  updatePremiumToggle();
  siteNavItems.querySelectorAll('.cds--header__menu-item').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = (link.getAttribute('href') || '').replace(/^#\/?/, '');
      const isHomeLink = target === '';
      if (!isHomeLink && !HOME_SECTION_IDS.has(target)) return;
      // Prevent the browser's default anchor animation from passing through
      // intermediate sections before the SPA has rendered the target route.
      event.preventDefault();
      const sectionId = isHomeLink ? null : target;
      const destination = sectionId ? `#${sectionId}` : getHomeRoute();
      setNavActive(sectionId);
      suppressScrollSpy(sectionId ? 500 : 250);
      if (window.location.hash !== destination) {
        window.location.hash = destination;
      } else {
        scrollToHomeSection(sectionId);
      }
    });
  });
  updateNavCurrent();
}

// ── Section tag config ───────────────────────────────────────────
const SECTION_TAG = {
  basic: { cls: 'cds--tag--blue', label: 'Fundamentos de Bob' },
  integraciones: { cls: 'cds--tag--purple', label: 'Integración de plataforma' },
  premium: { cls: 'cds--tag--green', label: 'Modernización de aplicaciones' }
};

function getBannerTitle(lab, step) {
  if (step.slug === 'overview') return lab.title;
  return getStepSubnavLabel(lab, step);
}

function ensureLabBanner(proseEl, section, lab, step) {
  let banner = proseEl.querySelector('.lab-banner');

  if (!banner) {
    const panel = proseEl.querySelector('.content-panel') || proseEl;
    banner = document.createElement('div');
    banner.className = 'lab-banner';
    banner.innerHTML = `
      <div class="lab-banner__tags"></div>
      <h1 class="cds--productive-heading-05 lab-banner__title">${escapeHtml(getBannerTitle(lab, step))}</h1>
    `;
    panel.insertBefore(banner, panel.firstElementChild);
  }

  const titleEl = banner.querySelector('.lab-banner__title');
  if (titleEl) titleEl.textContent = getBannerTitle(lab, step);

  let tags = banner.querySelector('.lab-banner__tags');
  if (!tags) {
    tags = document.createElement('div');
    tags.className = 'lab-banner__tags';
    banner.insertBefore(tags, banner.firstElementChild);
  }

  tags.innerHTML = buildLabBannerTags(section, lab, step);
  return banner;
}

function buildLabBannerTags(section, lab, step) {
  const sectionTag = SECTION_TAG[section.id] || { cls: 'cds--tag--gray', label: section.label };
  const stepDef = lab.steps.find((item) => item.slug === step.slug) || step;
  const stepTags = stepDef.tags || [];
  const audienceTag = lab.audience && lab.audience.length === 1 && lab.audience[0] === 'partner'
    ? '<span class="cds--tag cds--tag--cyan">Solo Partners</span>'
    : '';
  const accessBadge = lab.variants && lab.accessMode === 'premium'
    ? '<span class="hub-premium-badge" aria-label="Contenido premium">Premium</span>'
    : '';

  let html = `<span class="cds--tag ${sectionTag.cls}" data-workshop-route>${escapeHtml(section.label)}</span>`;
  html += `<span class="cds--tag ${sectionTag.cls}">${escapeHtml(lab.supporting)}</span>`;
  html += accessBadge;
  stepTags.forEach((tag) => {
    html += `<span class="cds--tag cds--tag--cool-gray">${escapeHtml(tag)}</span>`;
  });
  html += audienceTag;
  return html;
}

function getTrackName(index) {
  let value = index + 1;
  let suffix = '';

  while (value > 0) {
    value -= 1;
    suffix = String.fromCharCode(65 + (value % 26)) + suffix;
    value = Math.floor(value / 26);
  }

  return `Track ${suffix}`;
}

function getFeaturedTracks(sections) {
  const tracks = new Map();
  let index = 0;

  sections.forEach((section) => {
    section.labs.forEach((lab) => {
      if (!lab.featured) return;
      tracks.set(lab.slug, getTrackName(index));
      index += 1;
    });
  });

  return tracks;
}

function buildLabCard(lab, section, featuredTrack = '') {
  const tag = SECTION_TAG[section.id] || { cls: 'cds--tag--gray', label: section.eyebrow };
  const trackMeta = getLabTrackMeta(lab.slug);
  const trackTag = trackMeta
    ? `<span class="hub-lab-card__track-badge hub-lab-card__track-badge--${trackMeta.accent}">${escapeHtml(trackMeta.label)}</span>`
    : '';
  const audienceTag = lab.audience && lab.audience.length === 1 && lab.audience[0] === 'partner'
    ? '<span class="cds--tag cds--tag--cyan hub-tag--partner">Solo Partners</span>'
    : '';
  const featuredTag = lab.featured && featuredTrack
    ? `<span class="cds--tag cds--tag--high-contrast hub-lab-card__tag--featured">${escapeHtml(featuredTrack)}</span>`
    : '';
  const isPremiumModernization = section.id === 'premium' && lab.variants && lab.accessMode === 'premium';
  const premiumBadge = isPremiumModernization
    ? '<span class="hub-lab-card__premium-badge" aria-label="Contenido premium">Premium</span>'
    : '';
  const imgPath = lab.banner || `./assets/images/labs/${lab.slug}/banner_bob.png`;
  const stats = getWorkshopStats(lab);
  const durationStat = stats.duration
    ? `<span class="hub-lab-card__stat">
        <svg class="hub-lab-card__stat-icon" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 32 32" fill="currentColor"><path d="M16 30a14 14 0 1 1 14-14 14 14 0 0 1-14 14Zm0-26a12 12 0 1 0 12 12A12 12 0 0 0 16 4Z"/><path d="M20.59 22 15 16.41V7h2v8.58l5 5.01z"/></svg>
        ${escapeHtml(stats.duration)}
      </span>`
    : '';
  const bobcoinLabel = stats.bobcoins
    ? (stats.bobcoins.min === stats.bobcoins.max
      ? `${stats.bobcoins.min}`
      : `${stats.bobcoins.min}–${stats.bobcoins.max}`)
    : '';
  const bobcoinStat = stats.bobcoins
    ? `<span class="hub-lab-card__stat">
        <svg class="hub-lab-card__stat-icon" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 32 32" fill="currentColor"><path d="M28 10h-2V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2v2a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V12a2 2 0 0 0-2-2ZM4 22V8h20v2H8a2 2 0 0 0-2 2v10Zm24 4H8V12h20Z"/><path d="M22 18a2 2 0 1 0 2 2 2 2 0 0 0-2-2Z"/></svg>
        ${escapeHtml(bobcoinLabel)} BobCoins
      </span>`
    : '';

  return `
    <a class="cds--tile cds--tile--clickable hub-lab-card hub-lab-card--${section.id}${isPremiumModernization ? ' hub-lab-card--premium-access' : ''}" href="${getLabRoute(lab.slug)}"
       aria-label="Abrir laboratorio ${escapeHtml(lab.title)}">
      <div class="hub-lab-card__media">
        <img src="${imgPath}" alt="Banner ${escapeHtml(lab.title)}" class="hub-lab-card__img" data-placeholder-path="${imgPath}" />
        ${premiumBadge}
      </div>
      <div class="hub-lab-card__body">
        <div class="hub-lab-card__tags">
          ${trackTag}
          ${featuredTag}
          <span class="cds--tag ${tag.cls}">${tag.label}</span>
          <span class="cds--tag ${tag.cls}">${escapeHtml(lab.supporting)}</span>
          ${audienceTag}
        </div>
        ${(durationStat || bobcoinStat) ? `<div class="hub-lab-card__stats">${durationStat}${bobcoinStat}</div>` : ''}
        <h3 class="cds--productive-heading-02 hub-lab-card__title">${escapeHtml(lab.title)}</h3>
        <p class="cds--body-01 hub-lab-card__description">${escapeHtml(lab.description)}</p>
        <p class="hub-lab-card__disclaimer">Los resultados de IA pueden variar entre sesiones.</p>
        <div class="hub-lab-card__footer">
          <span class="cds--link hub-lab-card__link">Abrir laboratorio <span aria-hidden="true">→</span></span>
        </div>
      </div>
    </a>
  `;
}

const BOB_PROFILES = [
  {
    role: 'Product Manager', tool: 'Jira', accentCls: 'hub-profile-card--blue',
    tasks: 'Estimaciones, planificación e identificación de riesgos',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true"><polygon points="14 20.18 10.41 16.59 9 18 14 23 23 14 21.59 12.58 14 20.18"/><path d="M25,5H22V4a2,2,0,0,0-2-2H12a2,2,0,0,0-2,2V5H7A2,2,0,0,0,5,7V28a2,2,0,0,0,2,2H25a2,2,0,0,0,2-2V7A2,2,0,0,0,25,5ZM12,4h8V8H12ZM25,28H7V7h3v3H22V7h3Z"/></svg>`
  },
  {
    role: 'Diseñador', tool: 'Figma', accentCls: 'hub-profile-card--purple',
    tasks: 'UX/UI y prototipos a código',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M27.3069,6.1069,30,3.4141,28.5859,2,25.8931,4.6929,24.8,3.6a1.9328,1.9328,0,0,0-2.8,0L4,21.6V28h6.4l18-18a1.9329,1.9329,0,0,0,0-2.8ZM9.6,26H6V22.4L23.4,5,27,8.6Z"/><rect x="8.1359" y="7.5001" width="10.7281" height="1.9998" transform="translate(-2.0563 12.0355) rotate(-45)"/></svg>`
  },
  {
    role: 'Arquitecto', tool: 'Instana', accentCls: 'hub-profile-card--teal',
    tasks: 'Comprensión y visualización de sistemas',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M25.7983,10a10,10,0,0,0-19.62.124A7.4964,7.4964,0,0,0,7.5,25H8V23H7.5a5.4961,5.4961,0,0,1-.377-10.9795l.8365-.0571.09-.8335A7.9934,7.9934,0,0,1,23.7368,10Z"/><path d="M28,12H18a2.0023,2.0023,0,0,0-2,2v4H12a2.0023,2.0023,0,0,0-2,2V30H30V14A2.0023,2.0023,0,0,0,28,12ZM12,28V20h4v8Zm16,0H18V14H28Z"/><rect x="20" y="16" width="2" height="4"/><rect x="24" y="16" width="2" height="4"/><rect x="20" y="22" width="2" height="4"/><rect x="24" y="22" width="2" height="4"/></svg>`
  },
  {
    role: 'Desarrollador', tool: 'GitHub', accentCls: 'hub-profile-card--cyan',
    tasks: 'Generación, refactor y modernización',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true"><polygon points="31 16 24 23 22.59 21.59 28.17 16 22.59 10.41 24 9 31 16"/><polygon points="1 16 8 9 9.41 10.41 3.83 16 9.41 21.59 8 23 1 16"/><rect x="5.91" y="15" width="20.17" height="2" transform="translate(-3.6 27.31) rotate(-75)"/></svg>`
  },
  {
    role: 'DevOps', tool: 'Terraform', accentCls: 'hub-profile-card--magenta',
    tasks: 'Gobernanza de PR y pipelines',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12.1,2A9.8,9.8,0,0,0,6.7,3.6L13.1,10a2.1,2.1,0,0,1,.2,3,2.1,2.1,0,0,1-3-.2L3.7,6.4A9.84,9.84,0,0,0,2,12.1,10.14,10.14,0,0,0,12.1,22.2a10.9,10.9,0,0,0,2.6-.3l6.7,6.7a5,5,0,0,0,7.1-7.1l-6.7-6.7a10.9,10.9,0,0,0,.3-2.6A10,10,0,0,0,12.1,2Zm8,10.1a7.61,7.61,0,0,1-.3,2.1l-.3,1.1.8.8L27,22.8a2.88,2.88,0,0,1,.9,2.1A2.72,2.72,0,0,1,27,27a2.9,2.9,0,0,1-4.2,0l-6.7-6.7-.8-.8-1.1.3a7.61,7.61,0,0,1-2.1.3,8.27,8.27,0,0,1-5.7-2.3A7.63,7.63,0,0,1,4,12.1a8.33,8.33,0,0,1,.3-2.2l4.4,4.4a4.14,4.14,0,0,0,5.9.2,4.14,4.14,0,0,0-.2-5.9L10,4.2a6.45,6.45,0,0,1,2-.3,8.27,8.27,0,0,1,5.7,2.3A8.49,8.49,0,0,1,20.1,12.1Z"/></svg>`
  },
  {
    role: 'Seguridad', tool: 'Vault', accentCls: 'hub-profile-card--red',
    tasks: 'Vulnerabilidades y detección de secretos',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true"><polygon points="14 16.59 11.41 14 10 15.41 14 19.41 22 11.41 20.59 10 14 16.59"/><path d="M16,30,9.8242,26.7071A10.9818,10.9818,0,0,1,4,17V4A2.0021,2.0021,0,0,1,6,2H26a2.0021,2.0021,0,0,1,2,2V17a10.9818,10.9818,0,0,1-5.8242,9.7071ZM6,4V17a8.9852,8.9852,0,0,0,4.7656,7.9423L16,27.7333l5.2344-2.791A8.9852,8.9852,0,0,0,26,17V4Z"/></svg>`
  }
];

const BOB_MODES = [
  {
    name: 'Ask Mode', tag: 'Consultor', step: '01', modifier: 'ask',
    desc: 'Analiza y explica código sin modificar archivos. Ideal para onboarding y documentación.',
    capabilities: ['Lectura de código', 'Explicaciones paso a paso', 'Generación de docs']
  },
  {
    name: 'Plan Mode', tag: 'Arquitecto', step: '02', modifier: 'plan',
    desc: 'Diseña la arquitectura y la lista de tareas antes de escribir una línea de código.',
    capabilities: ['Diseño de arquitectura', 'Task breakdown', 'Análisis de riesgos']
  },
  {
    name: 'Agent Mode', tag: 'Implementador', step: '03', modifier: 'agent',
    desc: 'Ejecuta el plan: crea archivos, corre tests, corrige y despliega con tu aprobación.',
    capabilities: ['Ejecución autónoma', 'Correr tests', 'Deploy con aprobación']
  }
];

const ROADSHOW_ACCENT_CLASS = {
  core: 'roadshow-accent--core',
  integration: 'roadshow-accent--integration',
  premium: 'roadshow-accent--premium',
  road: 'roadshow-accent--road'
};

function getRoadshowSelection() {
  try {
    const stored = JSON.parse(localStorage.getItem(roadshowConfig.storageKey) || '{}');
    const initial = roadshowConfig.initialTracks.some((track) => track.id === stored.initial)
      ? stored.initial
      : roadshowConfig.initialTracks[0].id;
    const path = roadshowConfig.paths.some((item) => item.id === stored.path)
      ? stored.path
      : roadshowConfig.paths[0].id;
    return { initial, path };
  } catch {
    return {
      initial: roadshowConfig.initialTracks[0].id,
      path: roadshowConfig.paths[0].id
    };
  }
}

function saveRoadshowSelection(selection) {
  localStorage.setItem(roadshowConfig.storageKey, JSON.stringify(selection));
}

function buildRoadshowTrackNode(block, track) {
  if (!track) return '';
  const accent = track.accent || 'core';
  const accentClass = ROADSHOW_ACCENT_CLASS[accent] || ROADSHOW_ACCENT_CLASS.core;
  const slug = track.slug || track.lab?.slug;
  const title = track.title || track.lab?.title || '';
  const label = track.label || '';
  const banner = track.banner || (slug ? `./assets/images/labs/${slug}/banner_bob.png` : '');
  const duration = track.stats?.duration || (slug ? workshopGuides[slug]?.duration : '') || '';
  const href = slug ? getLabRoute(slug) : '#';

  return `
    <li class="roadshow-timeline__item ${accentClass}">
      <div class="roadshow-timeline__rail" aria-hidden="true">
        <span class="roadshow-timeline__dot">${block.id}</span>
      </div>
      <a class="roadshow-timeline__card" href="${href}">
        <div class="roadshow-timeline__card-media">
          <img src="${banner}" alt="" class="roadshow-timeline__img" loading="lazy" />
        </div>
        <div class="roadshow-timeline__card-body">
          <p class="roadshow-timeline__block-label">${escapeHtml(block.label)} · ${escapeHtml(block.subtitle)}</p>
          <p class="roadshow-timeline__track-label">${escapeHtml(label)}</p>
          <h3 class="roadshow-timeline__title">${escapeHtml(title)}</h3>
          ${duration ? `<p class="roadshow-timeline__meta">${escapeHtml(duration)}</p>` : ''}
          <span class="roadshow-timeline__link">Abrir laboratorio <span aria-hidden="true">→</span></span>
        </div>
      </a>
    </li>
  `;
}

function renderRoadshowRoadmap(selection) {
  const plan = getRoadshowPlan(selection.initial, selection.path);

  const timelineMarkup = plan.blocks
    .map((block) => buildRoadshowTrackNode(block, block.track))
    .join('');

  return `
    <div class="roadshow-roadmap roadshow-roadmap--animate" id="roadshow-roadmap-panel">
      <div class="roadshow-roadmap__header">
        <p class="roadshow-roadmap__eyebrow">Tu plan del roadshow</p>
        <h3 class="roadshow-roadmap__title">3 bloques · 3 labs</h3>
        <p class="roadshow-roadmap__lead">
          ${escapeHtml(plan.initial.label)} en el Bloque 1, luego
          ${escapeHtml(plan.path.tracks.map((track) => track.label).join(' y '))}.
        </p>
      </div>
      <ol class="roadshow-timeline" aria-label="Recorrido del roadshow">
        ${timelineMarkup}
      </ol>
    </div>
  `;
}

function renderRoadshowInitialCards(selection) {
  return roadshowConfig.initialTracks.map((track) => {
    const isSelected = selection.initial === track.id;
    const planTrack = getRoadshowPlan(track.id, selection.path).initial;
    return `
      <button
        type="button"
        class="roadshow-track-card ${ROADSHOW_ACCENT_CLASS.core}${isSelected ? ' roadshow-track-card--selected' : ''}"
        data-roadshow-initial="${track.id}"
        role="radio"
        aria-checked="${isSelected}"
      >
        <span class="roadshow-track-card__badge">${escapeHtml(track.label)}</span>
        <span class="roadshow-track-card__title">${escapeHtml(track.title)}</span>
        <span class="roadshow-track-card__summary">${escapeHtml(track.summary)}</span>
        ${planTrack.stats?.duration ? `<span class="roadshow-track-card__meta">${escapeHtml(planTrack.stats.duration)}</span>` : ''}
        ${isSelected ? '<span class="roadshow-track-card__check" aria-hidden="true">✓</span>' : ''}
      </button>
    `;
  }).join('');
}

function renderRoadshowPathDetail(path) {
  const accentClass = ROADSHOW_ACCENT_CLASS[path.accent] || '';
  return `
    <div class="roadshow-path-detail ${accentClass}">
      <p class="roadshow-path-detail__label">Qué vas a abordar</p>
      <p class="roadshow-path-detail__summary">${escapeHtml(path.summary)}</p>
      <div class="roadshow-path-detail__topics">
        ${path.topics.map((topic) => `<span class="roadshow-path-detail__topic">${escapeHtml(topic)}</span>`).join('')}
      </div>
    </div>
  `;
}

function renderRoadshowPathCards(selection) {
  return roadshowConfig.paths.map((path) => {
    const isSelected = selection.path === path.id;
    const accentClass = ROADSHOW_ACCENT_CLASS[path.accent] || '';
    const routeLabel = path.tracks.map((track) => track.label).join(' → ');
    return `
      <button
        type="button"
        class="roadshow-path-card ${accentClass}${isSelected ? ' roadshow-path-card--selected' : ''}"
        data-roadshow-path="${path.id}"
        role="radio"
        aria-checked="${isSelected}"
      >
        <span class="roadshow-path-card__badge">${escapeHtml(routeLabel)}</span>
        <span class="roadshow-path-card__title">${escapeHtml(path.label)}</span>
        <span class="roadshow-path-card__hint">Bloques 2 y 3 en secuencia</span>
        ${isSelected ? '<span class="roadshow-path-card__check" aria-hidden="true">✓</span>' : ''}
      </button>
    `;
  }).join('');
}

function renderRoadshowPlanner(selection = getRoadshowSelection()) {
  const selectedPath = roadshowConfig.paths.find((item) => item.id === selection.path)
    || roadshowConfig.paths[0];

  return `
    <section id="roadshow-planner" class="roadshow-planner">
      <div class="roadshow-planner__inner">
        <header class="roadshow-planner__header">
          <p class="hub-section-eyebrow">${roadshowConfig.eyebrow}</p>
          <h2 class="roadshow-planner__heading">${roadshowConfig.title}</h2>
          <p class="roadshow-planner__lead">${roadshowConfig.lead}</p>
        </header>

        <div class="roadshow-planner__layout">
          <div class="roadshow-planner__choices">
            <div class="roadshow-step">
              <h3 class="roadshow-step__title">
                <span class="roadshow-step__number roadshow-accent--road">1</span>
                Paso 1 · Bloque 1
              </h3>
              <p class="roadshow-step__hint">Elige con qué lab quieres empezar el evento.</p>
              <div class="roadshow-track-grid" role="radiogroup" aria-label="Lab inicial del Bloque 1">
                ${renderRoadshowInitialCards(selection)}
              </div>
            </div>

            <div class="roadshow-step">
              <h3 class="roadshow-step__title">
                <span class="roadshow-step__number roadshow-accent--road">2</span>
                Paso 2 · Elige tu camino
              </h3>
              <p class="roadshow-step__hint">Los Bloques 2 y 3 van en pareja — elige una especialización.</p>
              <div class="roadshow-path-grid" role="radiogroup" aria-label="Camino del roadshow">
                ${renderRoadshowPathCards(selection)}
              </div>
              <div class="roadshow-path-detail-wrap" id="roadshow-path-detail">
                ${renderRoadshowPathDetail(selectedPath)}
              </div>
            </div>
          </div>

          <div class="roadshow-planner__roadmap-wrap" aria-live="polite" aria-atomic="true">
            ${renderRoadshowRoadmap(selection)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function updateRoadshowRoadmap(selection) {
  const wrap = document.querySelector('.roadshow-planner__roadmap-wrap');
  if (!wrap) return;
  wrap.innerHTML = renderRoadshowRoadmap(selection);
}

function updateRoadshowChoicesUI(selection) {
  document.querySelectorAll('[data-roadshow-initial]').forEach((btn) => {
    const isSelected = btn.dataset.roadshowInitial === selection.initial;
    btn.classList.toggle('roadshow-track-card--selected', isSelected);
    btn.setAttribute('aria-checked', String(isSelected));
    const check = btn.querySelector('.roadshow-track-card__check');
    if (isSelected && !check) {
      btn.insertAdjacentHTML('beforeend', '<span class="roadshow-track-card__check" aria-hidden="true">✓</span>');
    } else if (!isSelected && check) {
      check.remove();
    }
  });

  document.querySelectorAll('[data-roadshow-path]').forEach((btn) => {
    const isSelected = btn.dataset.roadshowPath === selection.path;
    btn.classList.toggle('roadshow-path-card--selected', isSelected);
    btn.setAttribute('aria-checked', String(isSelected));
    const check = btn.querySelector('.roadshow-path-card__check');
    if (isSelected && !check) {
      btn.insertAdjacentHTML('beforeend', '<span class="roadshow-path-card__check" aria-hidden="true">✓</span>');
    } else if (!isSelected && check) {
      check.remove();
    }
  });

  const path = roadshowConfig.paths.find((item) => item.id === selection.path);
  const detailEl = document.getElementById('roadshow-path-detail');
  if (path && detailEl) {
    detailEl.innerHTML = renderRoadshowPathDetail(path);
  }

  document.querySelectorAll('[data-roadshow-initial]').forEach((btn) => {
    const track = roadshowConfig.initialTracks.find((item) => item.id === btn.dataset.roadshowInitial);
    if (!track) return;
    const meta = getRoadshowPlan(track.id, selection.path).initial.stats?.duration || '';
    let metaEl = btn.querySelector('.roadshow-track-card__meta');
    if (meta) {
      if (!metaEl) {
        btn.insertAdjacentHTML('beforeend', `<span class="roadshow-track-card__meta">${escapeHtml(meta)}</span>`);
      } else {
        metaEl.textContent = meta;
      }
    } else if (metaEl) {
      metaEl.remove();
    }
  });
}

function bindRoadshowEvents() {
  document.addEventListener('click', (event) => {
    const initialBtn = event.target.closest('[data-roadshow-initial]');
    const pathBtn = event.target.closest('[data-roadshow-path]');
    if (!initialBtn && !pathBtn) return;
    if (!event.target.closest('#roadshow-planner')) return;

    const selection = getRoadshowSelection();
    if (initialBtn) {
      selection.initial = initialBtn.dataset.roadshowInitial;
    }
    if (pathBtn) {
      selection.path = pathBtn.dataset.roadshowPath;
    }

    saveRoadshowSelection(selection);
    updateRoadshowChoicesUI(selection);
    updateRoadshowRoadmap(selection);
  });

  document.addEventListener('keydown', (event) => {
    const card = event.target.closest('[data-roadshow-initial], [data-roadshow-path]');
    if (!card || !card.closest('#roadshow-planner')) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    const selection = getRoadshowSelection();
    const group = card.closest('[role="radiogroup"]');
    if (!group) return;

    const items = [...group.querySelectorAll('[role="radio"]')];
    const index = items.indexOf(card);
    if (index < 0) return;

    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = items[(index + delta + items.length) % items.length];
    next.focus();
    next.click();
  });
}

// ── Home page renderer ───────────────────────────────────────────
function renderHome(searchTerm = '') {
  const normalizedTerm = searchTerm.trim().toLowerCase();
  const visibleSections = getVisibleSections(getAccessMode());
  const featuredTracks = getFeaturedTracks(visibleSections);

  const sectionsMarkup = visibleSections
    .map((section, idx) => {
      const labs = section.labs.filter((lab) => {
        if (!normalizedTerm) return true;
        return [lab.title, lab.description, lab.supporting, section.title]
          .join(' ').toLowerCase().includes(normalizedTerm);
      });

      const cardsMarkup = labs.length
        ? labs.map((lab) => buildLabCard(lab, section, featuredTracks.get(lab.slug))).join('')
        : '<p class="cds--body-01 hub-empty-state">Ningún laboratorio coincide con esta búsqueda.</p>';

      const tag = SECTION_TAG[section.id] || { cls: 'cds--tag--gray', label: section.label };
      const isOpen = false;
      const panelId = `panel-section-${section.id}`;

      return `
        <div class="hub-workshop-section hub-workshop-section--accordion" id="section-${section.id}">
          <button
            class="hub-level-banner hub-level-banner--trigger cds--tile"
            aria-expanded="${isOpen}"
            aria-controls="${panelId}"
            type="button"
          >
            <div class="hub-level-banner__badges">
              <span class="cds--tag ${tag.cls}">${section.label}</span>
              <span class="cds--tag ${tag.cls}">${section.bobMode}</span>
            </div>
            <div class="hub-level-banner__row">
              <div class="hub-level-banner__content">
                <h2 class="cds--productive-heading-04 hub-level-banner__title">${section.title}</h2>
                <p class="hub-level-banner__desc">${section.description}</p>
              </div>
              <svg class="hub-level-banner__chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="24" height="24" aria-hidden="true"><path d="M8 11L2 5h12z"/></svg>
            </div>
          </button>
          <div class="hub-section-panel" id="${panelId}" aria-hidden="true" style="max-height: 0">
            <div class="hub-section-panel__inner">
              <div class="hub-cards-grid">${cardsMarkup}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  homeView.innerHTML = `
    <section class="hub-hero">
      <div class="hub-hero__inner">
        <div class="hub-hero__content">
          <p class="hub-hero__eyebrow">${siteData.hero.eyebrow}</p>
          <h1 class="hub-hero__title">${siteData.hero.title}</h1>
          <p class="cds--body-02 hub-hero__copy">${siteData.hero.description}</p>
          <div class="hub-hero__chips" aria-label="Secciones del hub">
            ${visibleSections.map((section) => `
              <a class="hub-hero__chip" href="#available-workshops">${section.title}</a>
            `).join('')}
          </div>
          <div class="hub-hero__actions">
            <a class="cds--btn cds--btn--primary" href="#roadshow-planner">Planificar mi recorrido</a>
            <a class="cds--btn cds--btn--ghost hub-hero__cta-secondary" href="#available-workshops">${siteData.hero.ctaLabel}</a>
          </div>
        </div>
        <div class="hub-hero__visual" aria-hidden="true">
          <img src="./assets/images/bobinicial.jpeg" alt="IBM Bob — tu copiloto de IA" class="hub-hero__img" loading="eager" />
        </div>
      </div>

      <div class="hub-profiles" aria-label="Bob para cualquier perfil">
        <div class="hub-profiles__inner">
          <h2 class="hub-profiles__heading">
            Bob es el <span class="hub-profiles__highlight">compañero perfecto</span> para <span class="hub-profiles__highlight">cualquier perfil</span>
          </h2>
          <div class="hub-profiles__track">

            <div class="hub-profile-card hub-profile-card--blue">
              <div class="hub-profile-card__arrow" aria-hidden="true"></div>
              <div class="hub-profile-card__content">
                <p class="hub-profile-card__role">Product Manager</p>
                <div class="hub-profile-card__icon-wrap" aria-hidden="true">
                  <img src="./assets/images/modosbob/bob_productor.png" alt="Product Manager" style="width:96px;height:96px;object-fit:contain;" />
                </div>
                <div class="hub-profile-card__tool">
                  <img src="./assets/images/logos/logo_jira.png" alt="Jira" style="width:18px;height:18px;object-fit:contain;" aria-hidden="true" />
                  <span><em class="hub-profile-card__ej">ej:</em> Jira</span>
                </div>
                <ul class="hub-profile-card__tasks">
                  <li>Estimaciones y planificación</li>
                  <li>Identificación de riesgos</li>
                </ul>
              </div>
            </div>

            <div class="hub-profile-card hub-profile-card--blue-mid">
              <div class="hub-profile-card__arrow" aria-hidden="true"></div>
              <div class="hub-profile-card__content">
                <p class="hub-profile-card__role">Diseñador</p>
                <div class="hub-profile-card__icon-wrap" aria-hidden="true">
                  <img src="./assets/images/modosbob/bob_diseñador.png" alt="Diseñador" style="width:96px;height:96px;object-fit:contain;" />
                </div>
                <div class="hub-profile-card__tool">
                  <img src="./assets/images/logos/logo_figma.png" alt="Figma" style="width:18px;height:18px;object-fit:contain;" aria-hidden="true" />
                  <span><em class="hub-profile-card__ej">ej:</em> Figma</span>
                </div>
                <ul class="hub-profile-card__tasks">
                  <li>Diseño de UX y UI</li>
                  <li>Prototipos a código</li>
                </ul>
              </div>
            </div>

            <div class="hub-profile-card hub-profile-card--periwinkle">
              <div class="hub-profile-card__arrow" aria-hidden="true"></div>
              <div class="hub-profile-card__content">
                <p class="hub-profile-card__role">Arquitecto / Analista</p>
                <div class="hub-profile-card__icon-wrap" aria-hidden="true">
                  <img src="./assets/images/modosbob/bob_analista.png" alt="Arquitecto / Analista" style="width:96px;height:96px;object-fit:contain;" />
                </div>
                <div class="hub-profile-card__tool">
                  <img src="./assets/images/logos/logo_instana.png" alt="Instana" style="width:18px;height:18px;object-fit:contain;" aria-hidden="true" />
                  <span><em class="hub-profile-card__ej">ej:</em> Instana</span>
                </div>
                <ul class="hub-profile-card__tasks">
                  <li>Comprensión de sistemas</li>
                  <li>Visualización de sistemas</li>
                </ul>
              </div>
            </div>

            <div class="hub-profile-card hub-profile-card--lavender">
              <div class="hub-profile-card__arrow" aria-hidden="true"></div>
              <div class="hub-profile-card__content">
                <p class="hub-profile-card__role">Desarrollador</p>
                <div class="hub-profile-card__icon-wrap" aria-hidden="true">
                  <img src="./assets/images/modosbob/bob_desarrollador.png" alt="Desarrollador" style="width:96px;height:96px;object-fit:contain;" />
                </div>
                <div class="hub-profile-card__tool">
                  <img src="./assets/images/logos/logo_github.png" alt="GitHub" style="width:18px;height:18px;object-fit:contain;" aria-hidden="true" />
                  <span><em class="hub-profile-card__ej">ej:</em> GitHub</span>
                </div>
                <ul class="hub-profile-card__tasks">
                  <li>Generación y refactor</li>
                  <li>Modernización coordinada</li>
                </ul>
              </div>
            </div>

            <div class="hub-profile-card hub-profile-card--violet">
              <div class="hub-profile-card__arrow" aria-hidden="true"></div>
              <div class="hub-profile-card__content">
                <p class="hub-profile-card__role">DevOps</p>
                <div class="hub-profile-card__icon-wrap" aria-hidden="true">
                  <img src="./assets/images/modosbob/bob_devops.png" alt="DevOps" style="width:96px;height:96px;object-fit:contain;" />
                </div>
                <div class="hub-profile-card__tool">
                  <img src="./assets/images/logos/logo_terraform.png" alt="Terraform" style="width:18px;height:18px;object-fit:contain;" aria-hidden="true" />
                  <span><em class="hub-profile-card__ej">ej:</em> Terraform</span>
                </div>
                <ul class="hub-profile-card__tasks">
                  <li>Gobernanza de PR</li>
                  <li>Pipeline de despliegue</li>
                </ul>
              </div>
            </div>

            <div class="hub-profile-card hub-profile-card--purple">
              <div class="hub-profile-card__content">
                <p class="hub-profile-card__role">Seguridad</p>
                <div class="hub-profile-card__icon-wrap" aria-hidden="true">
                  <img src="./assets/images/modosbob/bob_seguridad.png" alt="Seguridad" style="width:96px;height:96px;object-fit:contain;" />
                </div>
                <div class="hub-profile-card__tool">
                  <img src="./assets/images/logos/logo_vault.png" alt="Vault" style="width:18px;height:18px;object-fit:contain;" aria-hidden="true" />
                  <span><em class="hub-profile-card__ej">ej:</em> Vault</span>
                </div>
                <ul class="hub-profile-card__tasks">
                  <li>Detección de vulnerabilidades</li>
                  <li>Detección de secretos</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>

    ${renderRoadshowPlanner()}

    <section id="available-workshops" class="hub-workshops">
      <div class="hub-workshops__header">
        <p class="hub-section-eyebrow">Laboratorios</p>
        <h2 class="hub-workshops__heading">Workshops disponibles</h2>
      </div>
      <div class="hub-sections-stack">${sectionsMarkup}</div>
    </section>

    <section id="nosotros" class="hub-team">
      <div class="hub-team__inner">
        <p class="hub-section-eyebrow">El equipo</p>
        <h2 class="hub-section-heading-expressive">Nosotros</h2>
        <p class="hub-section-lead">
          Conoce a las personas que hacen posible este workshop — desde la concepción hasta la entrega.
        </p>
        <div class="hub-team-grid">

          <div class="hub-team-card">
            <div class="hub-team-card__avatar-wrap">
              <img src="./assets/images/equipo/rodrigoseguel.png" alt="Foto de Rodrigo Seguel" class="hub-team-card__avatar" loading="lazy" />
            </div>
            <div class="hub-team-card__body">
              <p class="hub-team-card__name">Rodrigo Seguel</p>
              <p class="hub-team-card__role">Rol del participante</p>
            </div>
            <div class="hub-team-card__accent hub-team-card__accent--blue"></div>
          </div>

          <div class="hub-team-card">
            <div class="hub-team-card__avatar-wrap">
              <img src="./assets/images/equipo/florenciaonetto.png" alt="Foto de Florencia Onetto" class="hub-team-card__avatar" loading="lazy" />
            </div>
            <div class="hub-team-card__body">
              <p class="hub-team-card__name">Florencia Onetto</p>
              <p class="hub-team-card__role">Rol del participante</p>
            </div>
            <div class="hub-team-card__accent hub-team-card__accent--purple"></div>
          </div>

          <div class="hub-team-card">
            <div class="hub-team-card__avatar-wrap">
              <img src="./assets/images/equipo/pedrokara.png" alt="Foto de Pedro Kara" class="hub-team-card__avatar" loading="lazy" />
            </div>
            <div class="hub-team-card__body">
              <p class="hub-team-card__name">Pedro Kara</p>
              <p class="hub-team-card__role">Rol del participante</p>
            </div>
            <div class="hub-team-card__accent hub-team-card__accent--teal"></div>
          </div>

          <div class="hub-team-card">
            <div class="hub-team-card__avatar-wrap">
              <img src="./assets/images/equipo/luisreyes.png" alt="Foto de Luis Reyes" class="hub-team-card__avatar" loading="lazy" />
            </div>
            <div class="hub-team-card__body">
              <p class="hub-team-card__name">Luis Reyes</p>
              <p class="hub-team-card__role">Rol del participante</p>
            </div>
            <div class="hub-team-card__accent hub-team-card__accent--cyan"></div>
          </div>

          <div class="hub-team-card">
            <div class="hub-team-card__avatar-wrap">
              <img src="./assets/images/equipo/ignaciostruque.png" alt="Foto de Ignacio Struque" class="hub-team-card__avatar" loading="lazy" />
            </div>
            <div class="hub-team-card__body">
              <p class="hub-team-card__name">Ignacio Struque</p>
              <p class="hub-team-card__role">Rol del participante</p>
            </div>
            <div class="hub-team-card__accent hub-team-card__accent--magenta"></div>
          </div>

          <div class="hub-team-card">
            <div class="hub-team-card__avatar-wrap">
              <img src="./assets/images/equipo/patriciacourdurier.jpg" alt="Foto de Patricia Courdurier" class="hub-team-card__avatar" loading="lazy" />
            </div>
            <div class="hub-team-card__body">
              <p class="hub-team-card__name">Patricia Courdurier</p>
              <p class="hub-team-card__role">Participante</p>
            </div>
            <div class="hub-team-card__accent hub-team-card__accent--blue"></div>
          </div>

          <div class="hub-team-card">
            <div class="hub-team-card__avatar-wrap">
              <img src="./assets/images/equipo/katherinesalgado.jpg" alt="Foto de Katherine Salgado" class="hub-team-card__avatar" loading="lazy" />
            </div>
            <div class="hub-team-card__body">
              <p class="hub-team-card__name">Katherine Salgado</p>
              <p class="hub-team-card__role">Participante</p>
            </div>
            <div class="hub-team-card__accent hub-team-card__accent--purple"></div>
          </div>

          <div class="hub-team-card">
            <div class="hub-team-card__avatar-wrap">
              <img src="./assets/images/equipo/hermansotomayor.jpg" alt="Foto de Herman Sotomayor" class="hub-team-card__avatar" loading="lazy" />
            </div>
            <div class="hub-team-card__body">
              <p class="hub-team-card__name">Herman Sotomayor</p>
              <p class="hub-team-card__role">Participante</p>
            </div>
            <div class="hub-team-card__accent hub-team-card__accent--teal"></div>
          </div>

          <div class="hub-team-card">
            <div class="hub-team-card__avatar-wrap">
              <img src="./assets/images/equipo/andreswagner.jpg" alt="Foto de Andres Wagner" class="hub-team-card__avatar" loading="lazy" />
            </div>
            <div class="hub-team-card__body">
              <p class="hub-team-card__name">Andres Wagner</p>
              <p class="hub-team-card__role">Participante</p>
            </div>
            <div class="hub-team-card__accent hub-team-card__accent--cyan"></div>
          </div>

          <div class="hub-team-card">
            <div class="hub-team-card__avatar-wrap">
              <img src="./assets/images/equipo/guillermotreister.jpg" alt="Foto de Guillermo Treister" class="hub-team-card__avatar" loading="lazy" />
            </div>
            <div class="hub-team-card__body">
              <p class="hub-team-card__name">Guillermo Treister</p>
              <p class="hub-team-card__role">Participante</p>
            </div>
            <div class="hub-team-card__accent hub-team-card__accent--magenta"></div>
          </div>

          <div class="hub-team-card">
            <div class="hub-team-card__avatar-wrap">
              <img src="./assets/images/equipo/ivanamorassutti.jpg" alt="Foto de Ivana Morassutti" class="hub-team-card__avatar" loading="lazy" />
            </div>
            <div class="hub-team-card__body">
              <p class="hub-team-card__name">Ivana Morassutti</p>
              <p class="hub-team-card__role">Participante</p>
            </div>
            <div class="hub-team-card__accent hub-team-card__accent--blue"></div>
          </div>

          <div class="hub-team-card">
            <div class="hub-team-card__avatar-wrap hub-team-card__avatar-wrap--mascot">
              <img src="./assets/images/equipo/ibmbob.png" alt="IBM Bob" class="hub-team-card__avatar" loading="lazy" />
            </div>
            <div class="hub-team-card__body">
              <p class="hub-team-card__name">IBM Bob</p>
              <p class="hub-team-card__role">Participante</p>
            </div>
            <div class="hub-team-card__accent hub-team-card__accent--purple"></div>
          </div>

        </div>
      </div>
    </section>

    <section id="recursos" class="hub-resources">
      <div class="hub-resources__inner">
        <div class="hub-resources__header">
          <p class="hub-section-eyebrow">Recursos</p>
          <h2 class="hub-resources__heading">Aprende más sobre IBM Bob</h2>
          <p class="hub-resources__lead">Documentación oficial, labs adicionales y contenido en video para profundizar en cada capacidad de Bob.</p>
        </div>
        <div class="hub-resources__grid">

          <a class="hub-resource-card hub-resource-card--primary"
             href="https://pages.github.ibm.com/Markus-Eisele/bob-book/getting-started-with-bob.pdf"
             target="_blank" rel="noreferrer noopener"
             aria-label="Abrir The Bob Book — documentación oficial">
            <div class="hub-resource-card__badge">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M25.7 9.3l-7-7C18.5 2.1 18.3 2 18 2H8C6.9 2 6 2.9 6 4v24c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V10c0-.3-.1-.5-.3-.7zM18 4.4L23.6 10H18V4.4zM24 28H8V4h8v6c0 1.1.9 2 2 2h6V28z"/><rect x="10" y="22" width="12" height="2"/><rect x="10" y="16" width="12" height="2"/></svg>
              <span>Lectura esencial</span>
            </div>
            <h3 class="hub-resource-card__title">The Bob Book</h3>
            <p class="hub-resource-card__desc">La documentación oficial y completa de IBM Bob. Referencia central para entender sus capacidades, modos y mejores prácticas.</p>
            <div class="hub-resource-card__footer">
              <span class="hub-resource-card__link">Abrir documentación <span aria-hidden="true">→</span></span>
              <span class="hub-resource-card__domain"></span>
            </div>
          </a>

          <a class="hub-resource-card hub-resource-card--purple"
             href="https://ibm-self-serve-assets.github.io/build-with-bob/"
             target="_blank" rel="noreferrer noopener"
             aria-label="Abrir Build with Bob — labs adicionales">
            <div class="hub-resource-card__badge">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M26 2H8A2 2 0 0 0 6 4v4H4v2h2v5H4v2h2v5H4v2h2v4a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 26H8v-4h2v-2H8v-5h2v-2H8v-5h2V8H8V4h18z"/><rect x="14" y="8" width="8" height="2"/><rect x="14" y="15" width="8" height="2"/><rect x="14" y="22" width="8" height="2"/></svg>
              <span>Labs adicionales</span>
            </div>
            <h3 class="hub-resource-card__title">Build with Bob</h3>
            <p class="hub-resource-card__desc">Colección de laboratorios prácticos para construir soluciones reales usando IBM Bob en distintos escenarios de desarrollo.</p>
            <div class="hub-resource-card__footer">
              <span class="hub-resource-card__link">Explorar labs <span aria-hidden="true">→</span></span>
              <span class="hub-resource-card__domain">ibm-self-serve-assets.github.io</span>
            </div>
          </a>

          <a class="hub-resource-card hub-resource-card--teal"
             href="https://ibm-self-serve-assets.github.io/building-blocks-docs/"
             target="_blank" rel="noreferrer noopener"
             aria-label="Abrir Building Blocks Docs — funcionalidades de Bob">
            <div class="hub-resource-card__badge">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12.1 2A9.8 9.8 0 0 0 6.7 3.6L13.1 10a2.1 2.1 0 0 1 .2 3 2.1 2.1 0 0 1-3-.2L3.7 6.4A9.84 9.84 0 0 0 2 12.1 10.14 10.14 0 0 0 12.1 22.2a10.9 10.9 0 0 0 2.6-.3l6.7 6.7a5 5 0 0 0 7.1-7.1l-6.7-6.7a10.9 10.9 0 0 0 .3-2.6A10 10 0 0 0 12.1 2zm8 10.1a7.61 7.61 0 0 1-.3 2.1l-.3 1.1.8.8L27 22.8a2.88 2.88 0 0 1 .9 2.1A2.72 2.72 0 0 1 27 27a2.9 2.9 0 0 1-4.2 0l-6.7-6.7-.8-.8-1.1.3a7.61 7.61 0 0 1-2.1.3 8.27 8.27 0 0 1-5.7-2.3A7.63 7.63 0 0 1 4 12.1a8.33 8.33 0 0 1 .3-2.2l4.4 4.4a4.14 4.14 0 0 0 5.9.2 4.14 4.14 0 0 0-.2-5.9L10 4.2a6.45 6.45 0 0 1 2-.3 8.27 8.27 0 0 1 5.7 2.3 8.49 8.49 0 0 1 2.4 5.9z"/></svg>
              <span>Funcionalidades</span>
            </div>
            <h3 class="hub-resource-card__title">Building Blocks Docs</h3>
            <p class="hub-resource-card__desc">Documentación técnica de los bloques de construcción de Bob: MCP, modos, skills, agentes y configuración avanzada.</p>
            <div class="hub-resource-card__footer">
              <span class="hub-resource-card__link">Ver documentación <span aria-hidden="true">→</span></span>
              <span class="hub-resource-card__domain">ibm-self-serve-assets.github.io</span>
            </div>
          </a>

          <button class="hub-resource-card hub-resource-card--red"
             id="yt-overlay-trigger"
             aria-haspopup="dialog"
             aria-label="Ver videos de IBM Bob en YouTube">
            <div class="hub-resource-card__badge">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
              <span>Video</span>
            </div>
            <h3 class="hub-resource-card__title">IBM Bob en YouTube</h3>
            <p class="hub-resource-card__desc">Canal oficial con demos, tutoriales y novedades de IBM Bob. Aprende viendo cómo otros usan la herramienta en situaciones reales.</p>
            <div class="hub-resource-card__footer">
              <span class="hub-resource-card__link">Ver videos <span aria-hidden="true">→</span></span>
              <span class="hub-resource-card__domain">youtube.com/@ibm-bob</span>
            </div>
          </button>

        </div>
      </div>
    </section>

    <!-- ── YouTube Videos Overlay ─────────────────────────────── -->
    <div id="yt-overlay" class="yt-overlay" role="dialog" aria-modal="true" aria-labelledby="yt-overlay-title">
      <div class="yt-overlay__panel">
        <button class="yt-overlay__close" id="yt-overlay-close" aria-label="Cerrar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M17.414 16L26 7.414 24.586 6 16 14.586 7.414 6 6 7.414 14.586 16 6 24.586 7.414 26 16 17.414 24.586 26 26 24.586z"/></svg>
        </button>

        <div class="yt-overlay__header">
          <div class="yt-overlay__avatar">
            <img src="./assets/images/bobinicial.jpeg" alt="IBM Bob" />
          </div>
          <div class="yt-overlay__header-text">
            <p class="yt-overlay__eyebrow">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
              Canal oficial
            </p>
            <h2 class="yt-overlay__title" id="yt-overlay-title">IBM Bob en YouTube</h2>
            <p class="yt-overlay__subtitle">Demos, tutoriales y casos de uso reales — organizados por temática</p>
          </div>
          <a class="yt-overlay__channel-btn"
             href="https://www.youtube.com/@ibm-bob/videos"
             target="_blank" rel="noreferrer noopener"
             aria-label="Abrir canal completo de IBM Bob en YouTube">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
            Ver canal completo
          </a>
        </div>

        <div class="yt-overlay__categories">

          <div class="yt-overlay__category yt-overlay__category--dev">
            <p class="yt-overlay__cat-title">Tu socio de codificación con IA</p>
            <div class="yt-overlay__links">
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=fO43F8LlOSE" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">01</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Incorporarse a un codebase en 5 minutos
              </a>
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=VynsWjLQhTE" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">02</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Codificación segura proactiva
              </a>
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=lBa6-rVq6eE" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">03</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Arquitecturar e implementar una nueva funcionalidad
              </a>
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=9KEw_glsLPw" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">04</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Revisión de código Shift-left
              </a>
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=xzxnH305SEE" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">05</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Primer en el mundo: Literate Coding
              </a>
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=sBWzf1QiXgQ" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">06</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                bobshell: Bob en tu terminal
              </a>
            </div>
          </div>

          <div class="yt-overlay__category yt-overlay__category--java">
            <p class="yt-overlay__cat-title">Modernización de Java</p>
            <div class="yt-overlay__links">
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=Qwl0Za2cXWw" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">01</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Actualizaciones de Java sin interrupciones con Bob
              </a>
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=mLl67iGUhsM" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">02</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Migración a Liberty a velocidad rayo con Bob
              </a>
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=7tEBpSLgyEA" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">03</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Moderniza todo: Upgrade Java + Poder de Liberty
              </a>
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=gqZG_afyQyg" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">04</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Modernización de UI Java con Quarkus
              </a>
            </div>
          </div>

          <div class="yt-overlay__category yt-overlay__category--deploy">
            <p class="yt-overlay__cat-title">Implementación con confianza</p>
            <div class="yt-overlay__links">
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=cXatmllOTac" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">01</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Del diagrama al despliegue
              </a>
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=flo7L7rVvKw" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">02</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Del diagrama al despliegue — con bobshell
              </a>
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=T4A04Jsxogs" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">03</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Elimina problemas de seguridad en tu código
              </a>
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=55qvXvBXdCA" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">04</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Squash Security Issues in your code
              </a>
            </div>
          </div>

          <div class="yt-overlay__category yt-overlay__category--obs">
            <p class="yt-overlay__cat-title">Desde la observabilidad a la acción</p>
            <div class="yt-overlay__links">
              <a class="yt-overlay__link" href="https://www.youtube.com/watch?v=yNiOlF95eKQ" target="_blank" rel="noreferrer noopener">
                <span class="yt-overlay__link-num">01</span>
                <svg class="yt-overlay__link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 28a1 1 0 0 1-1-1V5a1 1 0 0 1 1.482-.876l20 11a1 1 0 0 1 0 1.752l-20 11A1 1 0 0 1 7 28z"/></svg>
                Insights de rendimiento desde datos de observabilidad
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>

    <section id="acerca-de" class="hub-about">
      <div class="hub-about__inner">
        <p class="hub-section-eyebrow">Acerca de</p>
        <h2 class="hub-section-heading-expressive">IBM </h2>
        <p class="hub-section-lead">
          El futuro del desarrollo no consiste en escribir más código, sino en entregar más valor.
          IBM Bob acompaña a los desarrolladores desde el contexto hasta la implementación y validación,
          acelerando cada etapa del SDLC con agentes de IA. Para los líderes tecnológicos, esto significa
          equipos más productivos, menor deuda técnica y una capacidad real para transformar ideas en
          resultados de negocio con mayor velocidad y confianza.
        </p>
      </div>
    </section>
  `;

  bindImageFallbacks(homeView);
}

// ── Subnav ───────────────────────────────────────────────────────
function renderSubnav(links, currentHref) {
  subnavItems.innerHTML = links
    .map((link) => {
      const isActive = link.href === currentHref;
      const activeClass = isActive ? ' cds--tabs__nav-item--selected' : '';
      const ariaCurrent = isActive ? ' aria-current="page"' : '';
      return `<li><a class="cds--tabs__nav-item${activeClass}" href="${link.href}"${ariaCurrent}>${link.label}</a></li>`;
    })
    .join('');
}

// ── BobCoin helpers ───────────────────────────────────────────────

/* Carbon "Wallet" icon SVG — used as the BobCoin token indicator */
const BOBCOIN_ICON_SVG = `<svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M28 10h-2V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2v2a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V12a2 2 0 0 0-2-2ZM4 22V8h20v2H8a2 2 0 0 0-2 2v10Zm24 4H8V12h20Z"/><path d="M22 18a2 2 0 1 0 2 2 2 2 0 0 0-2-2Z"/></svg>`;

/** HTML widget for a specific step's cost */
function buildBobcoinWidget(cost) {
  if (!cost) return '';
  return `
    <div class="bobcoin-cost bobcoin-cost--compact" aria-label="Costo estimado: ${cost.min}–${cost.max} BobCoins">
      <span class="bobcoin-cost__icon" aria-hidden="true">${BOBCOIN_ICON_SVG}</span>
      <span class="bobcoin-cost__details">
        <span class="bobcoin-cost__label">Costo estimado</span>
        <span class="bobcoin-cost__value"><span class="bobcoin-cost__range">${cost.min}–${cost.max}</span> <span class="bobcoin-cost__note">BobCoins</span></span>
      </span>
    </div>`;
}

/** HTML widget for the overview tab showing the lab's total cost range */
function buildBobcoinTotalWidget(lab) {
  return '';
}

function replaceMissingImage(image) {
  if (image.dataset.carbonFallback === 'true') return;
  image.dataset.carbonFallback = 'true';

  const placeholder = document.createElement('div');
  placeholder.className = 'carbon-image-placeholder';

  const label = document.createElement('span');
  label.className = 'carbon-image-placeholder__label';
  label.textContent = 'Imagen pendiente';

  const srcPath = image.dataset.placeholderPath || image.getAttribute('src') || '';
  const pathTag = document.createElement('code');
  pathTag.className = 'carbon-image-placeholder__path';
  pathTag.textContent = srcPath;

  const description = document.createElement('p');
  description.className = 'carbon-image-placeholder__description';
  description.textContent = 'Guarda tu imagen en la ruta indicada para desplegar la portada del laboratorio.';

  placeholder.append(label, pathTag, description);
  image.replaceWith(placeholder);
}

const PERSON_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="40" height="40" fill="currentColor" aria-hidden="true"><path d="M16 16a7 7 0 1 0-7-7 7 7 0 0 0 7 7Zm0-12a5 5 0 1 1-5 5 5 5 0 0 1 5-5Zm9 28H7a2 2 0 0 1-2-2v-1a8.7 8.7 0 0 1 9-8h4a8.7 8.7 0 0 1 9 8v1a2 2 0 0 1-2 2Zm-9-9a6.7 6.7 0 0 0-7 6v1h14v-1a6.7 6.7 0 0 0-7-6Z"/></svg>`;

function replaceTeamAvatar(image) {
  if (image.dataset.teamFallback === 'true') return;
  image.dataset.teamFallback = 'true';
  const wrap = image.closest('.hub-team-card__avatar-wrap');
  if (!wrap) return;
  image.remove();
  wrap.classList.add('hub-team-card__avatar-wrap--empty');
  wrap.innerHTML = PERSON_ICON_SVG;
}

function bindImageFallbacks(container) {
  container.querySelectorAll('img').forEach((image) => {
    image.loading = image.loading || 'lazy';
    if (image.classList.contains('hub-team-card__avatar')) {
      image.addEventListener('error', () => replaceTeamAvatar(image), { once: true });
      if (image.complete && image.naturalWidth === 0) replaceTeamAvatar(image);
    } else {
      image.addEventListener('error', () => replaceMissingImage(image), { once: true });
      if (image.complete && image.naturalWidth === 0) replaceMissingImage(image);
    }
  });
}

function getImageCaption(image) {
  return (image.getAttribute('alt') || '').trim();
}

function isInstructionalImage(image) {
  if (image.closest('.lab-banner, .hub-lab-card, .hub-team-card, .hub-resource-card')) {
    return false;
  }

  return Boolean(image.closest('.content-panel, .lab-section, .lab-step, .prose'));
}

function addFigureCaption(figure, image) {
  if (figure.querySelector(':scope > figcaption')) return;
  const caption = getImageCaption(image);
  if (!caption) return;

  const figcaption = document.createElement('figcaption');
  figcaption.className = 'lab-figure__caption';
  figcaption.textContent = caption;
  figure.append(figcaption);
}

function normalizeInstructionalImages(container) {
  container.querySelectorAll('img').forEach((image) => {
    if (!isInstructionalImage(image) || image.dataset.instructionalImage === 'true') return;
    image.dataset.instructionalImage = 'true';
    image.loading = image.loading || 'lazy';
    image.decoding = 'async';

    const existingFigure = image.closest('figure');
    if (existingFigure) {
      existingFigure.classList.add('lab-figure');
      image.classList.add('lab-figure__img');
      addFigureCaption(existingFigure, image);
      return;
    }

    const linkedImage = image.parentElement?.matches('a')
      && image.parentElement.children.length === 1
      && !image.parentElement.textContent.trim()
      ? image.parentElement
      : image;
    const parent = linkedImage.parentElement;
    const figure = document.createElement('figure');
    figure.className = 'lab-figure';
    image.classList.add('lab-figure__img');

    if (linkedImage !== image) linkedImage.classList.add('lab-figure__link');

    if (parent?.matches('p') && parent.children.length === 1 && !parent.textContent.trim()) {
      parent.replaceWith(figure);
    } else {
      linkedImage.replaceWith(figure);
    }

    figure.append(linkedImage);
    addFigureCaption(figure, image);
  });
}

/**
 * After content is injected into the DOM, insert the bobcoin widget
 * immediately AFTER the .lab-banner (as a sibling), so it never
 * disrupts the banner's internal flex/grid layout.
 */
function injectBobcoinIntoBanner(container, widgetHtml) {
  if (!widgetHtml) return;
  const banner = container.querySelector('.lab-banner');
  if (!banner) return;
  banner.insertAdjacentHTML('afterend', widgetHtml);
}

// ── Shared workshop format ───────────────────────────────────────

const CHECKMARK_ICON = '<svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><polygon points="8,13.2 3.6,8.8 2.7,9.7 7.1,14.1 8,15 16.5,6.5 15.6,5.6"/></svg>';

const SUPPLEMENTAL_CONTENT = {
  'hands-on-inicial': {},
  'software-development-lifecycle': {
    overview: { file: './content/basic/software-development-lifecycle/walkthrough.html', label: 'Material complementario: recorrido SDLC resumido' }
  }
};

function checklistItem(content) {
  return `<li><span class="workshop-checklist__icon">${CHECKMARK_ICON}</span><span>${content}</span></li>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getAudienceLabel(audience = []) {
  if (audience.includes('client') && audience.includes('partner')) return 'Cliente y Partner';
  if (audience.includes('partner')) return 'Partner';
  return 'Cliente';
}

function getWorkshopGuide(lab) {
  return lab.guide || workshopGuides[lab.slug] || {
    duration: 'Por confirmar',
    outcome: lab.description,
    requirements: [['Preparación', 'Revisa los requisitos indicados por cada etapa antes de comenzar.']],
    materials: ['Prompts, comandos y capturas incluidos en las etapas.'],
    path: 'Completa las etapas en el orden indicado y valida cada resultado antes de continuar.',
    learning: [['Resultado', lab.description]]
  };
}

function getWorkshopStepDescription(lab, step) {
  if (step.description) return step.description;
  if (Array.isArray(step.tags) && step.tags.length) return step.tags.join(' · ');
  return lab.description;
}

function getWorkshopStepBadge(lab, step, index) {
  const navPrefixes = getLabNavPrefixes(lab);
  if (navPrefixes?.[step.slug]) {
    if (step.slug === 'lab-alt4') return 'ALT 4';
    const match = navPrefixes[step.slug].match(/Lab (\d+)/i);
    if (match) return `LAB ${match[1].padStart(2, '0')}`;
    return navPrefixes[step.slug].toUpperCase();
  }
  return `LAB ${String(index + 1).padStart(2, '0')}`;
}

function buildWorkshopStepCard(lab, step, index) {
  const stepBadge = getWorkshopStepBadge(lab, step, index);
  const description = getWorkshopStepDescription(lab, step);

  return `
    <a class="workshop-step-card" href="${getLabRoute(lab.slug, step.slug)}" aria-label="Abrir ${escapeHtml(step.label)}">
      <div class="workshop-step-card__header">
        <span class="workshop-step-card__badge">${escapeHtml(stepBadge)}</span>
      </div>
      <div class="workshop-step-card__body">
        <h3 class="workshop-step-card__title">${escapeHtml(step.label)}</h3>
        <p class="workshop-step-card__desc">${escapeHtml(description)}</p>
      </div>
      <div class="workshop-step-card__footer">
        <span class="workshop-step-card__btn">Abrir etapa <span aria-hidden="true">→</span></span>
      </div>
    </a>`;
}

function buildOverviewLabsSection(section, lab) {
  const steps = lab.steps.filter((step) => step.slug !== 'overview');
  const cards = steps.map((step, index) => buildWorkshopStepCard(lab, step, index)).join('');

  return `
    <section class="workshop-format workshop-format--${escapeHtml(section.id)}" aria-label="Labs del workshop">
      <section class="workshop-format__section workshop-format__section--labs" aria-labelledby="${lab.slug}-labs">
        <p class="workshop-format__eyebrow">Etapas</p>
        <h2 id="${lab.slug}-labs">Labs del workshop</h2>
        <div class="workshop-step-grid">${cards}</div>
      </section>
    </section>`;
}

const PREMIUM_SECTION_ORDER = {
  context: 10,
  materials: 20,
  prerequisites: 30,
  workflow: 40,
  steps: 50,
  checkpoint: 60,
  troubleshooting: 70,
  followup: 80
};

function getPremiumSectionKind(section) {
  const heading = section.querySelector(':scope > h2')?.textContent
    .trim()
    .toLocaleLowerCase('es') || '';

  if (/solución de problemas|obtén ayuda|consejos específicos/.test(heading)) return 'troubleshooting';
  if (/criterios de éxito|resultados esperados|conclusiones clave|ideas clave|lo que has logrado|lo que construiste/.test(heading)) return 'checkpoint';
  if (/siguiente|próximos pasos|pasos adicionales|extensiones|recursos|comentarios/.test(heading)) return 'followup';
  if (/requisitos previos|requisitos del sistema|requisitos de la estación/.test(heading)) return 'prerequisites';
  if (/obtén primero el código fuente|prepara el workspace|configuración de laboratorio|configuración del entorno|primera creación|desarrollo de plantillas|ejecución del libro/.test(heading)) return 'materials';
  if (/^(paso|ejercicio|parte \d|\d+\.|opcional:)/.test(heading)) return 'steps';
  if (/flujo de trabajo|cómo bob|controlando los permisos|modo personalizado/.test(heading)) return 'workflow';
  if (/introducción|objetivo|contexto|caso de uso|qué se prueba|qué hay|qué se esconde|por qué esto importa|estado inicial/.test(heading)) return 'context';
  return 'steps';
}

function normalizePremiumWorkflowStructure(proseEl, isOverview) {
  if (isOverview || !proseEl.querySelector('.premium-workflow')) return;

  const panel = proseEl.querySelector('.content-panel.premium-workflow');
  if (!panel || panel.dataset.premiumStructure === 'true') return;

  panel.dataset.premiumStructure = 'true';
  panel.classList.add('premium-workflow--structured');
  const sections = [...panel.querySelectorAll(':scope > .lab-section')];

  sections
    .map((section, index) => ({ section, index, kind: getPremiumSectionKind(section) }))
    .sort((left, right) => {
      const order = PREMIUM_SECTION_ORDER[left.kind] - PREMIUM_SECTION_ORDER[right.kind];
      return order || left.index - right.index;
    })
    .forEach(({ section, kind }) => {
      section.dataset.premiumSection = kind;
      panel.append(section);
    });
}

// Java Premium deliberately starts from the standard lesson shell. The only
// imported material is the workflow execution itself; context and navigation
// stay aligned with the non-premium version.
const JAVA_PREMIUM_COMMON_SECTIONS = {
  lab1: ['lab1-intro', 'lab1-checkpoint'],
  lab2: ['lab2-contexto'],
  lab3: ['lab3-contexto'],
  lab4: ['lab4-caso'],
  'lab-alt4': ['labalt4-que', 'labalt4-tdd', 'labalt4-estado', 'labalt4-setup'],
  lab5: ['lab5-caso', 'lab5-vigilar']
};

const LAB_STEP_ICON_SVG = '<svg class="lab-section__icon" aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 32 32" fill="currentColor"><path d="M11 8l16 8-16 8z"/></svg>';

function getWorkflowSectionHeading(section) {
  return section.querySelector(':scope > h2')?.textContent.trim().toLocaleLowerCase('es') || '';
}

function prepareJavaWorkflowSection(section) {
  const heading = section.querySelector(':scope > h2');
  if (heading && !heading.querySelector('.lab-section__icon')) {
    heading.insertAdjacentHTML('afterbegin', LAB_STEP_ICON_SVG);
  }

  section.querySelectorAll('.premium-workflow__figure').forEach((figure) => {
    figure.classList.remove('premium-workflow__figure');
  });
  section.querySelectorAll('.lab-figure__link').forEach((link) => {
    const image = link.querySelector('img');
    if (image) link.replaceWith(image);
  });
  return section;
}

function updateJavaPremiumWorkspace(panel, step) {
  const workspace = panel.querySelector('.lab-workspace-setup');
  if (!workspace) return;

  // Keep the banner summary from the loaded content so standard and premium
  // variants can share the same description for every Java lab.

  const badge = workspace.querySelector('.lab-workspace-setup__badge');
  if (badge) badge.textContent = 'Paso obligatorio — antes de ejecutar el workflow';

  const lead = workspace.querySelector('.lab-workspace-setup__lead');
  if (lead) {
    lead.innerHTML = lead.innerHTML
      .replace(/pega el prompt de Fase 1 de abajo\\.?/gi, 'abre la pestaña <strong>Workflows</strong> de Bob.')
      .replace(/pega el prompt de Fase 1 de abajo/gi, 'abre la pestaña <strong>Workflows</strong> de Bob.');
  }

  if (step.slug === 'lab1') {
    const intro = panel.querySelector('#lab1-intro')?.closest('.lab-section');
    const introLead = intro?.querySelector('p');
    if (introLead) {
      introLead.innerHTML = 'Migrarás el Simple Pharmacy Management System de Traditional WebSphere Application Server (TWas) al runtime ligero Liberty usando el workflow <strong>Java Modernization</strong> de Bob V2 en tres fases: Analizar → Aplicar cambios → Validar. Bob explica cada cambio y solicita tu aprobación antes de tocar un archivo.';
    }

    const note = workspace.querySelector('.lab-workspace-setup__note');
    if (note) {
      note.innerHTML = '<strong>Confirma Workflows:</strong> en el panel de Bob verifica el modo <strong>Agent</strong>, abre la pestaña <strong>Workflows</strong> con el botón ▶ y comprueba que aparece <strong>Java Modernization</strong>.';
    }
  }

  const premiumContext = panel.querySelector('#lab5-vigilar')?.closest('.lab-section');
  premiumContext?.querySelectorAll('li').forEach((item) => {
    if (/prompts en Agent Mode/i.test(item.textContent)) {
      item.innerHTML = '<strong>Lab independiente</strong> — no depende de los Labs 1–3; ejecuta el workflow <strong>Vulnerabilities Detection</strong>.';
    }
    if (/prompt de aprobación/i.test(item.textContent)) {
      item.innerHTML = '<strong>Flujo de remediación interactivo</strong> — cada CVE recibe un fix propuesto y una aprobación dentro del workflow.';
    }
  });

  const tddContext = panel.querySelector('#labalt4-que')?.closest('.lab-section');
  const tddAgentParagraph = [...(tddContext?.querySelectorAll('p') || [])]
    .find((paragraph) => /Agent Mode/i.test(paragraph.textContent));
  if (tddAgentParagraph) {
    tddAgentParagraph.innerHTML = 'Cada ejercicio se ejecuta con el workflow <strong>TDD</strong> de Bob; el recorrido mantiene el ciclo Red → Green → Refactor.';
  }
}

function replaceJavaPremiumActionSections(panel, step, workflowMarkup) {
  const source = document.createElement('div');
  source.innerHTML = workflowMarkup;
  const sourcePanel = source.querySelector('.content-panel');
  if (!sourcePanel) return;

  const commonSectionIds = new Set(JAVA_PREMIUM_COMMON_SECTIONS[step.slug] || []);
  [...panel.querySelectorAll(':scope > .lab-section')].forEach((section) => {
    const id = section.querySelector(':scope > h2')?.id;
    if (!commonSectionIds.has(id)) section.remove();
  });

  const ignoredHeadings = /^(introducción|¿qué es|obtén primero el código fuente|caso de uso|requisitos previos|configuración del entorno|vale la pena verlo|solución de problemas|obtén ayuda|criterios de éxito|conclusiones clave|siguiente|próximos pasos|pasos adicionales)/;
  const workflowSections = [...sourcePanel.querySelectorAll(':scope > .lab-section')].filter((section) => {
    const heading = getWorkflowSectionHeading(section);
    if (ignoredHeadings.test(heading)) return false;
    return !/^paso 1:\\s*(abre|abra)/.test(heading);
  });

  const checkpoint = panel.querySelector(':scope > .lab-section h2[id*="checkpoint"]')?.closest('.lab-section');
  const insertionPoint = checkpoint || panel.querySelector(':scope > details, :scope > .lab-troubleshooting-full');
  workflowSections
    .map(prepareJavaWorkflowSection)
    .forEach((section) => {
      if (insertionPoint) insertionPoint.before(section);
      else panel.append(section);
    });
}

async function applyPremiumWorkflowVariant(proseEl, lab, step) {
  if (
    lab.accessMode !== 'premium'
    || lab.slug !== 'java-modernization-v2'
    || !step.workflowSourceFile
  ) return;

  const panel = proseEl.querySelector('.content-panel.lab-template');
  if (!panel || panel.dataset.workflowVariantApplied === 'true') return;

  const workflowMarkup = await loadContent(step.workflowSourceFile);
  panel.dataset.workflowVariantApplied = 'true';
  updateJavaPremiumWorkspace(panel, step);
  replaceJavaPremiumActionSections(panel, step, workflowMarkup);
}

function shouldInjectOverviewFormat(proseEl, lab) {
  if (lab.customOverview) return false;
  if (proseEl.querySelector('.overview-journey, .journey-card')) return false;
  if (proseEl.querySelector('.hub-cards-grid a[href*="#/lab/"]')) return false;
  if (proseEl.querySelector('[data-custom-overview="true"]')) return false;
  return true;
}

function buildOverviewFormat(section, lab) {
  return '';
}

function buildStepBrief(section, lab, step) {
  const guide = getWorkshopGuide(lab);
  const eyebrowLabel = getLabNavPrefixes(lab) && step.slug !== 'overview'
    ? getStepSubnavLabel(lab, step)
    : `${section.title} · ${step.label}`;
  return `
    <section class="lab-guide" aria-labelledby="${lab.slug}-${step.slug}-goal">
      <p class="lab-guide__eyebrow">${escapeHtml(eyebrowLabel)}</p>
      <h2 id="${lab.slug}-${step.slug}-goal">Qué vas a lograr</h2>
      <p class="lab-guide__lead">Aplicarás esta etapa dentro de la ruta de ${escapeHtml(lab.title)} y validarás el resultado antes de avanzar.</p>
      <div class="lab-guide__grid">
        <section aria-labelledby="${lab.slug}-${step.slug}-prepare">
          <h3 id="${lab.slug}-${step.slug}-prepare">Requisitos y materiales</h3>
          <ul class="workshop-checklist">
            ${checklistItem('Completa los requisitos previos del inicio del workshop.')}
            ${checklistItem('Abre la carpeta, servicio o entorno indicado por esta etapa.')}
            ${checklistItem('Ten disponibles los prompts, comandos y capturas de referencia.')}
          </ul>
        </section>
        <section aria-labelledby="${lab.slug}-${step.slug}-context">
          <h3 id="${lab.slug}-${step.slug}-context">Contexto de la etapa</h3>
          <p>${escapeHtml(guide.path)}</p>
        </section>
      </div>
    </section>`;
}

const LAB_STEP_SEPARATOR = ' — ';

function getLabNavPrefixes(lab) {
  const map = {};
  const label = 'Lab';
  let n = 1;
  for (const step of lab.steps) {
    if (step.slug === 'overview') continue;
    if (step.slug === 'lab-alt4') {
      map[step.slug] = `${label} 4 alternativo`;
      continue;
    }
    const numbered = step.slug.match(/^lab(\d+)$/);
    if (numbered) {
      map[step.slug] = `${label} ${Number(numbered[1])}`;
      n = Math.max(n, Number(numbered[1]) + 1);
      continue;
    }
    map[step.slug] = `${label} ${n}`;
    n += 1;
  }
  return map;
}

function getLabNextLabels(lab) {
  return getLabNavPrefixes(lab);
}

function getStepSubnavLabel(lab, step) {
  if (step.slug === 'overview') return step.label;
  const prefixes = getLabNavPrefixes(lab);
  const prefix = prefixes[step.slug];
  if (prefix) {
    if (step.label.trim().toLowerCase() === prefix.trim().toLowerCase()) return prefix;
    return `${prefix}${LAB_STEP_SEPARATOR}${step.label}`;
  }
  return step.label;
}

function getClosureNextLabel(lab, nextStep, nextWorkshop) {
  if (nextStep) {
    const nextLabels = getLabNextLabels(lab);
    const shortLabel = nextLabels?.[nextStep.slug];
    if (shortLabel) {
      if (nextStep.label.trim().toLowerCase() === shortLabel.trim().toLowerCase()) {
        return `Continuar con ${shortLabel}`;
      }
      return `Continuar con ${shortLabel}${LAB_STEP_SEPARATOR}${nextStep.label}`;
    }
    return `Continuar con ${nextStep.label}`;
  }
  if (nextWorkshop) {
    const shortName = nextWorkshop.lab.supporting || nextWorkshop.lab.title;
    return `Continuar con ${shortName}`;
  }
  return null;
}

function getClosurePrevLabel(lab, prevStep) {
  if (!prevStep) return null;
  if (prevStep.slug === 'overview') return 'Introducción';
  const prefixes = getLabNavPrefixes(lab);
  const prefix = prefixes[prevStep.slug];
  if (prefix) {
    if (prevStep.label.trim().toLowerCase() === prefix.trim().toLowerCase()) return prefix;
    return `${prefix}${LAB_STEP_SEPARATOR}${prevStep.label}`;
  }
  return prevStep.label;
}

function buildStepClosure(lab, step) {
  const stepIndex = lab.steps.findIndex((item) => item.slug === step.slug);
  const prevStep = stepIndex > 0 ? lab.steps[stepIndex - 1] : null;
  const nextStep = lab.steps[stepIndex + 1];
  const nextWorkshop = nextStep ? null : getNextLab(lab.slug);

  // Next destination
  const nextDestination = nextStep
    ? getLabRoute(lab.slug, nextStep.slug)
    : nextWorkshop
      ? getLabRoute(nextWorkshop.lab.slug, 'overview')
      : null;
  const nextLabel = getClosureNextLabel(lab, nextStep, nextWorkshop);

  // Prev destination
  const prevDestination = prevStep ? getLabRoute(lab.slug, prevStep.slug) : null;
  const prevLabel = getClosurePrevLabel(lab, prevStep);

  // "Back to all labs" — resolves to the section anchor of this lab's category
  const sectionResult = findLab(lab.slug);
  const sectionId = sectionResult?.section?.id || '';
  const backToLabsHref = getHomeBackHref();

  const prevBtn = prevDestination
    ? `<a class="cds--btn cds--btn--ghost lab-closure__prev" href="${prevDestination}"><span aria-hidden="true">←</span> ${escapeHtml(prevLabel)}</a>`
    : `<span></span>`;

  let nextBtn;
  if (nextDestination) {
    nextBtn = `<a class="cds--btn cds--btn--tertiary lab-closure__next" href="${nextDestination}">${escapeHtml(nextLabel)} <span aria-hidden="true">→</span></a>`;
  } else {
    nextBtn = `<a class="cds--btn cds--btn--tertiary lab-closure__back" href="${backToLabsHref}"><span aria-hidden="true">←</span> Volver a todos los labs</a>`;
  }

  return `
    <section class="lab-closure lab-closure--next" aria-labelledby="${lab.slug}-${step.slug}-closure">
      <div class="lab-closure__nav">
        ${prevBtn}
        ${nextBtn}
      </div>
    </section>`;
}

function removeLegacyStepNavigation(proseEl) {
  proseEl.querySelectorAll('.content-panel .lab-section').forEach((section) => {
    const heading = section.querySelector(':scope > h2')?.textContent.trim().toLocaleLowerCase('es');
    const isLegacyNext = heading === 'siguiente' || heading === 'next';
    const routeLink = section.querySelector('a[href^="#/lab/"], a[href^="#lab/"]');

    if (isLegacyNext && routeLink) section.remove();
  });
}

function ensureStepClosure(proseEl, lab, step) {
  proseEl.querySelectorAll(':scope > .lab-closure').forEach((closure) => closure.remove());
  const contentPanel = proseEl.querySelector('.content-panel');
  const closure = buildStepClosure(lab, step);

  if (contentPanel) {
    contentPanel.insertAdjacentHTML('afterend', closure);
  } else {
    proseEl.insertAdjacentHTML('beforeend', closure);
  }
}

function normalizeVisibleCopy(container) {
  const replacements = new Map([
    ['Lab Complete', 'Lab completado'],
    ['SDLC Lab Complete', 'Workshop SDLC completado'],
    ['Alternative — Natural Language', 'Alternativa — lenguaje natural'],
    ['Why this replaces manual analysis', 'Por qué reemplaza el análisis manual'],
    ['Knowledge Preservation Use Case', 'Caso de uso: preservación de conocimiento'],
    ['Supported RPG Modernizations', 'Modernizaciones RPG admitidas'],
    ['IBM Bob Premium Package for IBM i Required', 'Se requiere IBM Bob Premium Package for IBM i'],
    ['Credentials required for Confluent and watsonx Orchestrate', 'Se requieren credenciales de Confluent y watsonx Orchestrate'],
    ['Bob is optional but recommended', 'Bob es opcional, pero recomendado'],
    ['Prerequisites', 'Prerrequisitos'],
    ['Rules and considerations', 'Reglas y consideraciones']
  ]);

  container.querySelectorAll('h1, h2, h3, .callout__title').forEach((element) => {
    const text = element.textContent.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '');
    const replacement = replacements.get(text);
    if (!replacement) return;
    element.textContent = replacement;
  });
  container.querySelectorAll('.copy-button').forEach((button) => {
    if (button.textContent.trim().toLowerCase() === 'copy') button.textContent = 'Copiar';
    button.setAttribute('aria-label', 'Copiar código');
  });
}

function markLabChecklistItem(item) {
  if (item.dataset.carbonChecked === 'true') return;
  item.dataset.carbonChecked = 'true';
  item.classList.add('lab-list__item--checked');
  const list = item.closest('.cds--list--unordered');
  if (list) list.classList.add('lab-checklist');
  const inner = item.innerHTML.replace(/^\s*✅\s*/u, '');
  item.innerHTML = `<span class="lab-list__icon" aria-hidden="true">${CHECKMARK_ICON}</span><span>${inner}</span>`;
}

function normalizeLabChecklists(proseEl) {
  const checklistHeading = /objetivos de aprendizaje|lo que (acabas de )?lograste|resumen del lab|checklist de cierre/i;

  proseEl.querySelectorAll('.lab-section').forEach((section) => {
    const heading = section.querySelector(':scope > h2');
    if (!heading || !checklistHeading.test(heading.textContent)) return;

    const list = section.querySelector(':scope > .cds--list--unordered');
    if (!list) return;

    list.classList.add('lab-checklist');
    list.querySelectorAll(':scope > .cds--list__item').forEach(markLabChecklistItem);
  });

  proseEl.querySelectorAll('.callout').forEach((callout) => {
    const title = callout.querySelector('.callout__title');
    if (!title || !checklistHeading.test(title.textContent)) return;

    const list = callout.querySelector('.cds--list--unordered');
    if (!list) return;

    list.classList.add('lab-checklist');
    list.querySelectorAll(':scope > .cds--list__item').forEach(markLabChecklistItem);
  });

  proseEl.querySelectorAll('.cds--list__item').forEach((item) => {
    if (!item.textContent.trim().startsWith('✅')) return;
    markLabChecklistItem(item);
  });
}

async function appendSupplementalContent(proseEl, lab, step) {
  const supplemental = SUPPLEMENTAL_CONTENT[lab.slug]?.[step.slug];
  if (!supplemental) return;

  const source = await loadContent(supplemental.file);
  const buffer = document.createElement('div');
  buffer.innerHTML = source;
  const content = buffer.querySelector('.content-panel') || buffer;
  content.querySelector('.lab-banner')?.remove();
  content.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
  normalizeVisibleCopy(content);

  const details = document.createElement('details');
  details.className = 'lab-supplemental';
  const summary = document.createElement('summary');
  summary.textContent = supplemental.label;
  const body = document.createElement('div');
  body.className = 'lab-supplemental__body';
  while (content.firstChild) body.append(content.firstChild);
  details.append(summary, body);
  proseEl.append(details);
}

function addResponsiveTableLabels(table) {
  const headers = Array.from(table.querySelectorAll('thead th'))
    .map((header) => header.textContent.trim());

  if (!headers.length) return;

  table.querySelectorAll('tbody tr').forEach((row) => {
    Array.from(row.children).forEach((cell, index) => {
      if ((cell.tagName === 'TD' || cell.tagName === 'TH') && headers[index]) {
        cell.dataset.label = headers[index];
      }
    });
  });
}

function fallbackCopy(text) {
  try {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.left = '-9999px';
    helper.style.top = '-9999px';
    document.body.appendChild(helper);
    helper.select();
    helper.setSelectionRange(0, 99999);
    const success = document.execCommand('copy');
    document.body.removeChild(helper);
    return Promise.resolve(success);
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return Promise.resolve(false);
  }
}

function copyToClipboard(textToCopy) {
  if (!textToCopy) return Promise.resolve(false);
  const cleanText = textToCopy.trim();
  if (!cleanText) return Promise.resolve(false);

  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(cleanText)
      .then(() => true)
      .catch((e) => {
        console.warn('navigator.clipboard failed, falling back to execCommand:', e);
        return fallbackCopy(cleanText);
      });
  }

  return fallbackCopy(cleanText);
}

window.copyToClipboard = copyToClipboard;

function siteDirectoryUrl() {
  const pageUrl = window.location.href.split('#')[0];
  if (/\/index\.html$/i.test(pageUrl)) return pageUrl.replace(/[^/]*$/, '');
  return pageUrl.endsWith('/') ? pageUrl : `${pageUrl}/`;
}

function rewriteDownloadLinks(container) {
  container.querySelectorAll('a[download][href], a[href$=".zip"]').forEach((link) => {
    let href = link.getAttribute('href') || '';
    if (!href || /^(https?:|mailto:|#)/i.test(href)) return;
    const downloadsMatch = href.match(/(?:^|\/)downloads\/([^/?#]+)$/);
    if (downloadsMatch) href = `./downloads/${downloadsMatch[1]}`;
    link.setAttribute('href', new URL(href, siteDirectoryUrl()).href);
  });
}

function isPromptContext(element) {
  const previous = element.previousElementSibling;
  const label = previous?.textContent || '';
  return /prompt\s+(?:para|de)\s+bob|pega este prompt|envía este prompt/i.test(label);
}

function getCodeBlockKind(code) {
  const language = (code.className.match(/language-([\w-]+)/) || [])[1]?.toLocaleLowerCase('es');
  if (language === 'yaml' || language === 'yml') return 'code-block--yaml';
  if (language === 'json') return 'code-block--json';
  return '';
}

function normalizeCodeSyntax(codeBlock) {
  if (codeBlock.querySelector('span')) return;
  const rawText = codeBlock.textContent;
  const lang = (codeBlock.className.match(/language-(\w+)/) || [])[1] || '';

  if (lang === 'sql') {
    codeBlock.innerHTML = escapeHtml(rawText)
      .replace(/\b(CREATE|STREAM|TABLE|WITH|AS|SELECT|FROM|GROUP BY|EMIT|CHANGES|VARCHAR|INT|KAFKA_TOPIC|KEY_FORMAT|VALUE_FORMAT|PARTITIONS|SUM)\b/g, '<span class="highlight-k">$1</span>')
      .replace(/('[\s\S]*?')/g, '<span class="highlight-s">$1</span>');
  } else if (lang === 'json') {
    codeBlock.innerHTML = escapeHtml(rawText)
      .replace(/("[\w_]+"\s*:)/g, '<span class="highlight-nt">$1</span>')
      .replace(/(:\s*"[\s\S]*?")/g, ': <span class="highlight-s">$1</span>')
      .replace(/(:\s*\d+)/g, ': <span class="highlight-m">$1</span>');
  } else if (lang === 'bash' || lang === 'shell') {
    codeBlock.innerHTML = escapeHtml(rawText)
      .replace(/\b(cd|setup\.sh|npm|git|python|python3|pip|orchestrate|docker|kubectl|helm|curl|wget)\b/g, '<span class="highlight-k">$1</span>')
      .replace(/(\s-[a-zA-Z0-9_-]+)/g, '<span class="highlight-na">$1</span>');
  }
}

function prepareCopyButton(button, codeBlock) {
  const isPrompt = codeBlock.classList.contains('code-block--prompt');
  const label = isPrompt ? 'Copiar prompt' : 'Copiar código';

  button.type = 'button';
  button.className = 'copy-button';
  button.removeAttribute('style');
  button.removeAttribute('onclick');
  button.removeAttribute('onmouseover');
  button.removeAttribute('onmouseout');
  button.setAttribute('aria-label', label);
  button.dataset.copyLabel = label;
  button.textContent = label;
}

function ensureCodeBlockCopyButton(codeBlock) {
  if (codeBlock.classList.contains('code-block--tree')) return;
  const button = codeBlock.querySelector(':scope > .copy-button') || document.createElement('button');
  if (!button.parentElement) codeBlock.prepend(button);
  prepareCopyButton(button, codeBlock);
}

function normalizePromptBlocks(container) {
  container.querySelectorAll('.prompt-block').forEach((legacyPrompt) => {
    const body = legacyPrompt.querySelector('.prompt-block__body');
    if (!body) return;

    const prompt = document.createElement('div');
    prompt.className = 'code-block code-block--prompt';

    const label = legacyPrompt.querySelector('.prompt-block__label')?.textContent
      .trim()
      .replace(/^🤖\s*/u, '') || 'Prompt para Bob';
    const heading = document.createElement('p');
    heading.className = 'code-block__label';
    heading.textContent = label;

    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = body.textContent;
    pre.append(code);
    prompt.append(heading, pre);
    legacyPrompt.replaceWith(prompt);
  });
}

function normalizeCodeBlocks(container) {
  normalizePromptBlocks(container);

  container.querySelectorAll('pre > code').forEach((code) => {
    const pre = code.parentElement;
    const existingBlock = pre.closest('.code-block');
    if (existingBlock) {
      normalizeCodeSyntax(code);
      return;
    }

    const source = pre.parentElement?.classList.contains('highlight') ? pre.parentElement : pre;
    const codeBlock = document.createElement('div');
    const kind = getCodeBlockKind(code);
    codeBlock.className = `code-block${kind ? ` ${kind}` : ''}`;
    if (isPromptContext(source)) codeBlock.classList.add('code-block--prompt');
    source.replaceWith(codeBlock);
    codeBlock.append(pre);
    normalizeCodeSyntax(code);
  });

  container.querySelectorAll('.code-block').forEach((codeBlock) => {
    const code = codeBlock.querySelector('code');
    if (!code) return;
    normalizeCodeSyntax(code);
    ensureCodeBlockCopyButton(codeBlock);
  });
}

function enhanceLabContent(proseEl, section, lab, step, isOverview) {
  if (!proseEl || proseEl.dataset.workshopEnhanced === 'true') return;
  proseEl.dataset.workshopEnhanced = 'true';
  normalizeVisibleCopy(proseEl);
  normalizeLabChecklists(proseEl);
  rewriteDownloadLinks(proseEl);

  const banner = ensureLabBanner(proseEl, section, lab, step);
  normalizePremiumWorkflowStructure(proseEl, isOverview);

  if (isOverview) {
    if (lab.overviewLabsOnly) {
      const anchor = proseEl.querySelector('#ov-materials')?.closest('.lab-section')
        || proseEl.querySelector('#ov-que')?.closest('.lab-section')
        || proseEl.querySelector('.lab-banner');
      if (anchor) anchor.insertAdjacentHTML('afterend', buildOverviewLabsSection(section, lab));
    } else if (shouldInjectOverviewFormat(proseEl, lab)) {
      const anchor = proseEl.querySelector('.bobcoin-cost--total') || banner;
      if (anchor) anchor.insertAdjacentHTML('afterend', buildOverviewFormat(section, lab));
    }
  }

  removeLegacyStepNavigation(proseEl);
  normalizeInstructionalImages(proseEl);
  normalizeCodeBlocks(proseEl);
  ensureStepClosure(proseEl, lab, step);

  proseEl.querySelectorAll('table').forEach((table) => {
    table.classList.add('lab-table');
    addResponsiveTableLabels(table);
    if (!table.parentElement.classList.contains('lab-table-wrap')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'lab-table-wrap';
      table.parentElement.insertBefore(wrapper, table);
      wrapper.append(table);
    }
  });

}

// ── Lab renderer ─────────────────────────────────────────────────
async function renderLab(route) {
  const result = findLab(route.labSlug, getAccessMode());

  if (!result) {
    window.location.hash = getHomeRoute();
    return;
  }

  const { section, lab } = result;
  const activeStep = lab.steps.find((step) => step.slug === route.stepSlug);
  if (!activeStep) {
    window.location.hash = getLabRoute(route.labSlug, 'overview');
    return;
  }
  const content = await loadContent(activeStep.baseFile || activeStep.file);
  const isOverview = activeStep.slug === 'overview';

  // Apply category to body for dynamic theming (TOC, nav, snippets)
  document.body.setAttribute('data-category', section.id);

  labShell.className = `lab-shell lab-shell--${lab.slug}${isOverview ? ' lab-shell--overview' : ''}`;

  renderSubnav(
    lab.steps.map((step) => ({
      label: getStepSubnavLabel(lab, step),
      href: getLabRoute(lab.slug, step.slug)
    })),
    getLabRoute(lab.slug, activeStep.slug)
  );

  labShell.innerHTML = `
    <div class="lab-reading-layout">
      <div class="prose prose--full">${content}</div>
    </div>
  `;

  const proseEl = labShell.querySelector('.prose');

  await appendSupplementalContent(proseEl, lab, activeStep);
  await applyPremiumWorkflowVariant(proseEl, lab, activeStep);
  enhanceLabContent(proseEl, section, lab, activeStep, isOverview);
  buildLabToc(proseEl, lab, activeStep);
  bindImageFallbacks(labShell);
  // Restore persisted env choice for this page
  applyPersistedEnv(proseEl);
  settleLabScroll();
}

/** Apply persisted env selection to all toggles in the given scope. */
function applyPersistedEnv(scope) {
  const stored = localStorage.getItem('lab-env') || 'platform';
  const toggles = (scope || document).querySelectorAll('.env-toggle[data-env-scope="global"], .env-selector-banner .env-toggle');
  toggles.forEach((group) => {
    group.querySelectorAll('.env-toggle__btn').forEach((b) => {
      b.classList.toggle('env-toggle__btn--active', b.dataset.envTab === stored);
    });
  });
  // Apply panels across entire prose scope
  const root = scope || document;
  root.querySelectorAll('[data-env-panel]').forEach((panel) => {
    panel.classList.toggle('env-panel--active', panel.dataset.envPanel === stored);
  });
}

// ── Route dispatcher ─────────────────────────────────────────────
async function renderRoute() {
  const route = parseRoute(window.location.hash);
  const sectionId = getHashTarget();

  if (route.view === 'home') {
    teardownLabToc();
    homeView.hidden = false;
    labView.hidden = true;
    subnavEl.hidden = true;
    subnavItems.innerHTML = '';
    document.body.classList.add('hub-view--home');
    document.body.classList.remove('hub-view--lab');
    document.body.removeAttribute('data-category'); // Reset dynamic theming
    renderHome(siteSearch?.value || '');
    updateNavCurrent();
    // Allow layout to settle, then scroll past fixed header
    setTimeout(() => {
      restoreHomeAfterRender(sectionId);
    }, 50);
    return;
  }

  // Entering lab view — tear down scroll-spy
  teardownScrollSpy();
  homeView.hidden = true;
  labView.hidden = false;
  subnavEl.hidden = false;
  document.body.classList.add('hub-view--lab');
  document.body.classList.remove('hub-view--home');
  scrollLabToTop();
  updateNavCurrent();
  resetLabScroll();
  await renderLab(route);
  scrollLabToTop();
  requestAnimationFrame(scrollLabToTop);
}

// ── Event bindings ───────────────────────────────────────────────
function bindEvents() {
  window.addEventListener('hashchange', renderRoute);

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    if (!href.startsWith('#')) return;

    const route = parseRoute(href);

    if (route.view === 'lab') {
      if (!homeView.hidden) saveHomeReturnTarget(link);
      return;
    }

    if (homeView.hidden) return;

    const inHomeNav = link.closest('#home-view, .cds--header, #side-nav');
    if (!inHomeNav) return;

    const raw = href.replace(/^#\/?/, '').split('/')[0];
    if (raw && !HOME_SECTION_IDS.has(raw)) return;

    navigateHomeSectionFromLink(event, link);
  });

  hamburgerBtn.addEventListener('click', () => {
    const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
    isExpanded ? closeSideNav() : openSideNav();
  });

  sideNavOverlay.addEventListener('click', closeSideNav);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sideNav.classList.contains('cds--side-nav--expanded')) {
      closeSideNav();
      hamburgerBtn.focus();
    }
  });

  sideNavItemsMobile.addEventListener('click', (event) => {
    if (event.target.closest('.cds--side-nav__link')) {
      closeSideNav();
    }
  });

  themeToggle.addEventListener('click', toggleTheme);

  [premiumToggle, premiumToggleMobile].filter(Boolean).forEach((control) => {
    control.addEventListener('click', togglePremiumAccess);
  });

  if (siteSearch) {
    siteSearch.addEventListener('input', () => {
      if (parseRoute(window.location.hash).view === 'home') {
        renderHome(siteSearch.value);
      }
    });
  }

  // YouTube overlay — open
  document.addEventListener('click', (event) => {
    if (event.target.closest('#yt-overlay-trigger')) {
      const overlay = document.getElementById('yt-overlay');
      if (overlay) {
        overlay.classList.add('is-open');
        document.getElementById('yt-overlay-close')?.focus();
      }
      return;
    }
    // Close — X button or backdrop click
    if (event.target.closest('#yt-overlay-close') || event.target.id === 'yt-overlay') {
      document.getElementById('yt-overlay')?.classList.remove('is-open');
      document.getElementById('yt-overlay-trigger')?.focus();
    }
  });

  // YouTube overlay — close on Escape (must run after the side-nav Escape handler)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const overlay = document.getElementById('yt-overlay');
      if (overlay?.classList.contains('is-open')) {
        overlay.classList.remove('is-open');
        document.getElementById('yt-overlay-trigger')?.focus();
        event.stopImmediatePropagation();
      }
    }
  });

  // Env toggle — global: sync all toggles + all panels across entire prose
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.env-toggle__btn[data-env-tab]');
    if (!btn) return;
    const group = btn.closest('.env-toggle');
    if (!group) return;
    const target = btn.dataset.envTab;
    const isGlobal = group.dataset.envScope === 'global'
      || group.closest('.env-selector-banner') !== null;

    if (isGlobal) {
      // Persist and sync entire prose
      localStorage.setItem('lab-env', target);
      const prose = group.closest('.prose, .lab-reading-layout') || document;
      prose.querySelectorAll('.env-toggle__btn[data-env-tab]').forEach((b) => {
        b.classList.toggle('env-toggle__btn--active', b.dataset.envTab === target);
      });
      prose.querySelectorAll('[data-env-panel]').forEach((panel) => {
        panel.classList.toggle('env-panel--active', panel.dataset.envPanel === target);
      });
    } else {
      // Local toggle — only within nearest section
      group.querySelectorAll('.env-toggle__btn').forEach((b) => {
        b.classList.toggle('env-toggle__btn--active', b === btn);
      });
      const scope = group.closest('.lab-section, .prose, .content-panel') || document;
      scope.querySelectorAll('[data-env-panel]').forEach((panel) => {
        panel.classList.toggle('env-panel--active', panel.dataset.envPanel === target);
      });
    }
  });

  // Lab step accordion (inside lab pages)
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.lab-accordion__trigger');
    if (!trigger) return;
    const panelId = trigger.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : trigger.nextElementSibling;
    if (!panel) return;
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
  });

  // Workshop section accordion (home page sections)
  // Uses JS scrollHeight for pixel-perfect max-height animation —
  // grid-template-rows:0fr is unreliable without a fixed parent height.
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.hub-level-banner--trigger');
    if (!trigger) return;
    if (event.target.closest('a')) return;
    const panelId = trigger.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    const willOpen = !isOpen;

    if (panel._openEndHandler) {
      panel.removeEventListener('transitionend', panel._openEndHandler);
      panel._openEndHandler = null;
    }

    if (willOpen) {
      openWorkshopSectionPanel(trigger, panel);
    } else {
      trigger.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      const currentHeight = panel.style.maxHeight;
      if (currentHeight === 'none' || currentHeight === '') {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
      panel.getBoundingClientRect();
      panel.style.maxHeight = '0px';
    }
  });

  document.addEventListener('click', async (event) => {
    // Keep anchors inside imported premium documents inside the current SPA.
    // Route links such as #/lab/... continue through the router.
    const inPageLink = event.target.closest('.prose a[href^="#"]');
    const inPageHref = inPageLink?.getAttribute('href') || '';
    if (inPageLink && inPageHref && !inPageHref.startsWith('#/')) {
      const target = document.getElementById(inPageHref.slice(1));
      if (target) {
        event.preventDefault();
        history.replaceState(null, '', inPageHref);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // Copy button
    const copyButton = event.target.closest('.copy-button');
    if (copyButton) {
      const code = copyButton.closest('.code-block')?.querySelector('code')
        || copyButton.parentElement?.querySelector('code')
        || copyButton.closest('.prose')?.querySelector('code');
      if (!code) return;
      const text = code.textContent || '';
      const copied = await copyToClipboard(text);
      if (copied) {
        const originalLabel = copyButton.dataset.copyLabel || 'Copiar';
        copyButton.textContent = 'Copiado';
        window.setTimeout(() => { copyButton.textContent = originalLabel; }, 1200);
      }
      return;
    }

    // Bobcoin breakdown toggle
    const breakdownBtn = event.target.closest('.bobcoin-cost__breakdown');
    if (breakdownBtn) {
      const targetId = breakdownBtn.getAttribute('aria-controls');
      const panel = targetId ? document.getElementById(targetId) : null;
      if (!panel) return;
      const isOpen = breakdownBtn.getAttribute('aria-expanded') === 'true';
      breakdownBtn.setAttribute('aria-expanded', String(!isOpen));
      panel.hidden = isOpen;
      breakdownBtn.textContent = isOpen ? 'ver desglose' : 'ocultar desglose';
    }
  });
}

bindRoadshowEvents();

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
initializeTheme();
updatePremiumToggle();
renderPlatformNav();
bindEvents();
renderRoute();
