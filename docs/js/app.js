import { loadContent } from './content.js';
import { siteData, workshopGuides, findLab, getNextLab, getWorkshopStats } from './data.js';
import { getHomeRoute, getLabRoute, parseRoute } from './router.js';
import { initializeTheme, toggleTheme } from './theme.js';

// Global audience mode state: 'client' | 'partner'
let currentMode = 'client';

const HOME_SECTION_IDS = new Set(['available-workshops', 'nosotros', 'acerca-de']);

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

function getHashTarget() {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw || raw === '/') return null;
  if (raw.startsWith('/lab/') || raw.startsWith('lab/')) return null;
  // Support both #capacidades and #/capacidades
  const id = raw.replace(/^\//, '').split('/')[0];
  return HOME_SECTION_IDS.has(id) ? id : null;
}

function scrollToHomeSection(sectionId) {
  // Keep the selected navigation item stable while the newly rendered home
  // section is positioned. The header navigation is a direct jump, not a
  // progress indicator for every section crossed on the way there.
  suppressScrollSpy(sectionId ? 500 : 250);
  if (!sectionId) {
    setNavActive(null);
    window.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }

  const el = document.getElementById(sectionId);
  if (!el) return;

  const targetTop = Math.max(0, el.getBoundingClientRect().top + window.scrollY - HEADER_H);
  setNavActive(sectionId);
  window.scrollTo({ top: targetTop, behavior: 'auto' });
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

const SPY_SECTIONS = ['available-workshops', 'nosotros', 'acerca-de'];
const HEADER_H = 48; // fixed header height in px
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
    .map((item) => `<li><a class="cds--side-nav__link" href="${item.href}">${item.label}</a></li>`)
    .join('');

  const labLinks = siteData.sections
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

  let html = `<span class="cds--tag ${sectionTag.cls}" data-workshop-route>${escapeHtml(section.label)}</span>`;
  html += `<span class="cds--tag ${sectionTag.cls}">${escapeHtml(lab.supporting)}</span>`;
  stepTags.forEach((tag) => {
    html += `<span class="cds--tag cds--tag--cool-gray">${escapeHtml(tag)}</span>`;
  });
  html += audienceTag;
  return html;
}

function buildLabCard(lab, section) {
  const tag = SECTION_TAG[section.id] || { cls: 'cds--tag--gray', label: section.eyebrow };
  const audienceTag = lab.audience && lab.audience.length === 1 && lab.audience[0] === 'partner'
    ? '<span class="cds--tag cds--tag--cyan hub-tag--partner">Solo Partners</span>'
    : '';
  const featuredTag = lab.featured
    ? '<span class="cds--tag cds--tag--high-contrast hub-lab-card__tag--featured">Track principal</span>'
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
    <a class="cds--tile cds--tile--clickable hub-lab-card hub-lab-card--${section.id}" href="${getLabRoute(lab.slug)}"
       aria-label="Abrir laboratorio ${escapeHtml(lab.title)}">
      <div class="hub-lab-card__media">
        <img src="${imgPath}" alt="Banner ${escapeHtml(lab.title)}" class="hub-lab-card__img" data-placeholder-path="${imgPath}" />
      </div>
      <div class="hub-lab-card__body">
        <div class="hub-lab-card__tags">
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

// ── Home page renderer ───────────────────────────────────────────
function renderHome(searchTerm = '') {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  const sectionsMarkup = siteData.sections
    .map((section) => {
      const labs = section.labs.filter((lab) => {
        if (!normalizedTerm) return true;
        return [lab.title, lab.description, lab.supporting, section.title]
          .join(' ').toLowerCase().includes(normalizedTerm);
      });

      const cardsMarkup = labs.length
        ? labs.map((lab) => buildLabCard(lab, section)).join('')
        : '<p class="cds--body-01 hub-empty-state">Ningún laboratorio coincide con esta búsqueda.</p>';

      const tag = SECTION_TAG[section.id] || { cls: 'cds--tag--gray', label: section.label };

      return `
        <div class="hub-workshop-section" id="section-${section.id}">
          <div class="cds--tile hub-level-banner" role="region" aria-label="${section.title}">
            <div class="hub-level-banner__badges">
              <span class="cds--tag ${tag.cls}">${section.label}</span>
              <span class="cds--tag ${tag.cls}">${section.bobMode}</span>
            </div>
            <h2 class="cds--productive-heading-04 hub-level-banner__title">${section.title}</h2>
            <p class="cds--body-01 hub-level-banner__desc">${section.description}</p>
          </div>
          <div class="hub-cards-grid">${cardsMarkup}</div>
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
            ${siteData.sections.map((section) => `
              <a class="hub-hero__chip" href="#available-workshops">${section.title}</a>
            `).join('')}
          </div>
          <div class="hub-hero__actions">
            <a class="cds--btn cds--btn--primary" href="#available-workshops">${siteData.hero.ctaLabel}</a>
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

          <a class="hub-resource-card hub-resource-card--blue"
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
  enhanceLabFigures(container);
}

const LAB_FIGURE_MIN_WIDTH = 1400;

function enhanceLabFigures(container) {
  container.querySelectorAll('.lab-figure').forEach((figure) => {
    const img = figure.querySelector(':scope > .lab-figure__img, :scope > .lab-figure__link > .lab-figure__img');
    if (!img || img.dataset.labFigureEnhanced === 'true') return;
    img.dataset.labFigureEnhanced = 'true';

    const markLowResolution = () => {
      if (img.naturalWidth > 0 && img.naturalWidth < LAB_FIGURE_MIN_WIDTH) {
        figure.classList.add('lab-figure--lowres');
      }
    };

    if (img.complete) {
      markLowResolution();
    } else {
      img.addEventListener('load', markLowResolution, { once: true });
    }
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
  return workshopGuides[lab.slug] || {
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

function shouldInjectOverviewFormat(proseEl, lab) {
  if (lab.customOverview) return false;
  if (proseEl.querySelector('.overview-journey, .journey-card')) return false;
  if (proseEl.querySelector('.hub-cards-grid a[href*="#/lab/"]')) return false;
  if (proseEl.querySelector('[data-custom-overview="true"]')) return false;
  return true;
}

function buildOverviewFormat(section, lab) {
  const guide = getWorkshopGuide(lab);
  const steps = lab.steps.filter((step) => step.slug !== 'overview');
  const requirements = guide.requirements.map(([title, text]) => checklistItem(`<strong>${escapeHtml(title)}:</strong> ${escapeHtml(text)}`)).join('');
  const materials = guide.materials.map((item) => checklistItem(escapeHtml(item))).join('');
  const cards = steps.map((step, index) => buildWorkshopStepCard(lab, step, index)).join('');
  const learning = guide.learning.map(([area, result]) => `
    <tr><th scope="row">${escapeHtml(area)}</th><td>${escapeHtml(result)}</td></tr>`).join('');

  return `
    <section class="workshop-format workshop-format--${escapeHtml(section.id)}" aria-label="Guía del workshop">
      <div class="workshop-format__meta">
        <span class="cds--tag cds--tag--gray">${escapeHtml(section.label)}</span>
        <span class="cds--tag cds--tag--cool-gray">${escapeHtml(getAudienceLabel(lab.audience))}</span>
        <span class="cds--tag cds--tag--teal">${escapeHtml(guide.duration)}</span>
      </div>

      <section class="workshop-format__section" aria-labelledby="${lab.slug}-build">
        <p class="workshop-format__eyebrow">Resultado esperado</p>
        <h2 id="${lab.slug}-build">Qué vas a construir</h2>
        <p class="workshop-format__lead">${escapeHtml(guide.outcome)}</p>
      </section>

      <div class="workshop-format__split">
        <section class="workshop-format__section" aria-labelledby="${lab.slug}-requirements">
          <p class="workshop-format__eyebrow">Preparación</p>
          <h2 id="${lab.slug}-requirements">Requisitos previos</h2>
          <ul class="workshop-checklist">${requirements}</ul>
        </section>
        <section class="workshop-format__section" aria-labelledby="${lab.slug}-materials">
          <p class="workshop-format__eyebrow">Recursos</p>
          <h2 id="${lab.slug}-materials">Materiales del workshop</h2>
          <ul class="workshop-checklist">${materials}</ul>
        </section>
      </div>

      <section class="workshop-format__section workshop-format__section--labs" aria-labelledby="${lab.slug}-labs">
        <p class="workshop-format__eyebrow">Etapas</p>
        <h2 id="${lab.slug}-labs">Labs del workshop</h2>
        <div class="workshop-step-grid">${cards}</div>
      </section>

      <div class="workshop-format__split">
        <section class="workshop-format__section" aria-labelledby="${lab.slug}-path">
          <p class="workshop-format__eyebrow">Recomendación</p>
          <h2 id="${lab.slug}-path">Camino recomendado</h2>
          <p>Completa cada etapa, revisa su resultado esperado y solo después avanza a la siguiente. Las rutas alternativas se indican explícitamente en la navegación.</p>
        </section>
        <section class="workshop-format__section" aria-labelledby="${lab.slug}-learning">
          <p class="workshop-format__eyebrow">Resultados</p>
          <h2 id="${lab.slug}-learning">Qué vas a aprender</h2>
          <div class="lab-table-wrap">
            <table class="lab-table">
              <caption class="visually-hidden">Resultados de aprendizaje de ${escapeHtml(lab.title)}</caption>
              <thead><tr><th scope="col">Área</th><th scope="col">Al finalizar podrás</th></tr></thead>
              <tbody>${learning}</tbody>
            </table>
          </div>
        </section>
      </div>

      <aside class="workshop-format__help callout" data-tone="note" aria-label="Ayuda durante el workshop">
        <p class="callout__title">Ayuda durante el workshop</p>
        <p>Usa las capturas y prompts como referencia, revisa los checkpoints de cada etapa y vuelve al inicio del workshop si necesitas confirmar requisitos o materiales.</p>
      </aside>
    </section>`;
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
  let n = 1;
  for (const step of lab.steps) {
    if (step.slug === 'overview') continue;
    if (step.slug === 'lab-alt4') {
      map[step.slug] = 'Lab 4 alternativo';
      continue;
    }
    const numbered = step.slug.match(/^lab(\d+)$/);
    if (numbered) {
      map[step.slug] = `Lab ${Number(numbered[1])}`;
      n = Math.max(n, Number(numbered[1]) + 1);
      continue;
    }
    map[step.slug] = `Lab ${n}`;
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
  return 'Volver al inicio del workshop';
}

function buildStepClosure(lab, step) {
  const stepIndex = lab.steps.findIndex((item) => item.slug === step.slug);
  const nextStep = lab.steps[stepIndex + 1];
  const nextWorkshop = nextStep ? null : getNextLab(lab.slug);
  const destination = nextStep
    ? getLabRoute(lab.slug, nextStep.slug)
    : nextWorkshop
      ? getLabRoute(nextWorkshop.lab.slug, 'overview')
      : getLabRoute(lab.slug, 'overview');
  const destinationLabel = getClosureNextLabel(lab, nextStep, nextWorkshop);

  return `
    <section class="lab-closure lab-closure--next" aria-labelledby="${lab.slug}-${step.slug}-closure">
      <p class="lab-guide__eyebrow">Continuar</p>
      <h2 id="${lab.slug}-${step.slug}-closure">Siguiente</h2>
      <a class="cds--btn cds--btn--tertiary lab-closure__next" href="${destination}">${escapeHtml(destinationLabel)} <span aria-hidden="true">→</span></a>
    </section>`;
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

  container.querySelectorAll('h2, h3, .callout__title').forEach((element) => {
    const text = element.textContent.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '');
    element.textContent = replacements.get(text) || text;
  });
  container.querySelectorAll('.copy-button').forEach((button) => {
    if (button.textContent.trim().toLowerCase() === 'copy') button.textContent = 'Copiar';
    button.setAttribute('aria-label', 'Copiar código');
  });
}

function normalizeHandsOnPresentation(proseEl, lab) {
  proseEl.querySelectorAll('.cds--list__item').forEach((item) => {
    if (!item.textContent.trim().startsWith('✅') || item.dataset.carbonChecked === 'true') return;
    item.dataset.carbonChecked = 'true';
    item.classList.add('lab-list__item--checked');
    item.innerHTML = `<span class="lab-list__icon" aria-hidden="true">${CHECKMARK_ICON}</span><span>${item.innerHTML.replace(/^\s*✅\s*/u, '')}</span>`;
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

function enhanceLabContent(proseEl, section, lab, step, isOverview) {
  if (!proseEl || proseEl.dataset.workshopEnhanced === 'true') return;
  proseEl.dataset.workshopEnhanced = 'true';
  normalizeVisibleCopy(proseEl);
  normalizeHandsOnPresentation(proseEl, lab);
  rewriteDownloadLinks(proseEl);

  const banner = ensureLabBanner(proseEl, section, lab, step);

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
    proseEl.insertAdjacentHTML('beforeend', buildStepClosure(lab, step));
  } else {
    proseEl.insertAdjacentHTML('beforeend', buildStepClosure(lab, step));
  }

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

  proseEl.querySelectorAll('pre > code').forEach((codeBlock) => {
    const pre = codeBlock.parentElement;
    if (pre.parentElement.classList.contains('cds--snippet-container')) return;
    if (pre.closest('.code-block')) return;

    // Apply basic syntax highlighting if codeBlock is plain text
    if (!codeBlock.querySelector('span')) {
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

    const wrapper = pre.parentElement.classList.contains('highlight') ? pre.parentElement : pre;
    
    const snippetDiv = document.createElement('div');
    snippetDiv.className = 'cds--snippet cds--snippet--multi copy-snippet-block';
    snippetDiv.dataset.category = section.id;
    
    const containerDiv = document.createElement('div');
    containerDiv.className = 'cds--snippet-container';
    
    wrapper.replaceWith(snippetDiv);
    snippetDiv.appendChild(containerDiv);
    containerDiv.appendChild(wrapper);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'cds--snippet-btn cds--copy-btn';
    copyBtn.type = 'button';
    copyBtn.setAttribute('aria-label', 'Copiar código');
    copyBtn.innerHTML = `<svg class="cds--snippet__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="16" height="16"><path d="M28,8H18V4a2,2,0,0,0-2-2H4A2,2,0,0,0,2,4V18a2,2,0,0,0,2,2H8v6a2.0023,2.0023,0,0,0,2,2H28a2.0023,2.0023,0,0,0,2-2V10A2.0023,2.0023,0,0,0,28,8ZM4,18V4H16l.0012,14ZM28,26H10V10H18v4a2,2,0,0,0,2,2h6v10Z"/><polygon points="21.586 14 18 10.414 18 14 21.586 14"/></svg>`;
    
    copyBtn.addEventListener('click', async () => {
      const textToCopy = codeBlock.textContent || '';
      const copyFn = window.copyToClipboard || copyToClipboard;
      const success = await copyFn(textToCopy);
      if (success) {
        const originalHtml = copyBtn.innerHTML;
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = `<svg class="cds--snippet__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="16" height="16"><path d="M14 21.414L9 16.413 10.413 15 14 18.586 21.585 11 23 12.415 14 21.414z"></path></svg>`;
        setTimeout(() => {
          copyBtn.innerHTML = originalHtml;
          copyBtn.classList.remove('copied');
        }, 2000);
      }
    });

    snippetDiv.appendChild(copyBtn);
  });
}

// ── Lab renderer ─────────────────────────────────────────────────
async function renderLab(route) {
  const result = findLab(route.labSlug);

  if (!result) {
    window.location.hash = getHomeRoute();
    return;
  }

  const { section, lab } = result;
  const activeStep = lab.steps.find((step) => step.slug === route.stepSlug) || lab.steps[0];
  const content = await loadContent(activeStep.file);
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
  enhanceLabContent(proseEl, section, lab, activeStep, isOverview);
  buildLabToc(proseEl, lab, activeStep);
  bindImageFallbacks(labShell);
  // Restore persisted env choice for this page
  applyPersistedEnv(proseEl);

  if (route.headingId) {
    requestAnimationFrame(() => {
      document.getElementById(route.headingId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
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
      scrollToHomeSection(sectionId);
      // Start scroll-spy after content is in the DOM
      initScrollSpy();
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
  updateNavCurrent();
  await renderLab(route);
  window.scrollTo({ top: 0 });
}

// ── Event bindings ───────────────────────────────────────────────
function bindEvents() {
  window.addEventListener('hashchange', renderRoute);

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

  // Accordion
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

  document.addEventListener('click', async (event) => {
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
        copyButton.textContent = 'Copiado';
        window.setTimeout(() => { copyButton.textContent = 'Copiar'; }, 1200);
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

initializeTheme();
renderPlatformNav();
bindEvents();
renderRoute();
