import { loadContent } from './content.js';
import { siteData, findLab } from './data.js';
import { getHomeRoute, getLabRoute, parseRoute } from './router.js';
import { initializeTheme, toggleTheme } from './theme.js';

// Global audience mode state: 'client' | 'partner'
let currentMode = 'client';

const HOME_SECTION_IDS = new Set(['capacidades', 'available-workshops', 'acerca-de']);

const homeView   = document.querySelector('#home-view');
const labView    = document.querySelector('#lab-view');
const labShell   = document.querySelector('#lab-shell');
const subnavEl   = document.querySelector('#subnav-region');
const subnavItems = document.querySelector('#subnav-items');
const siteNavItems = document.querySelector('#site-nav-items');
const themeToggle  = document.querySelector('#theme-toggle');
const siteSearch   = document.querySelector('#site-search');
const hamburgerBtn = document.querySelector('#hamburger-btn');
const sideNav      = document.querySelector('#side-nav');
const sideNavOverlay    = document.querySelector('#side-nav-overlay');
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
  if (!sectionId) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  requestAnimationFrame(() => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function updateNavCurrent() {
  const hash = window.location.hash || '#/';
  const target = getHashTarget();
  const route = parseRoute(hash);

  siteNavItems.querySelectorAll('.cds--header__menu-item').forEach((link) => {
    const href = link.getAttribute('href') || '';
    let isCurrent = false;
    if (route.view === 'home') {
      if (target) {
        isCurrent = href === `#${target}`;
      } else {
        isCurrent = href === '#/' || href === '#';
      }
    }
    if (isCurrent) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
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
    .map((item) => `<li role="none"><a class="cds--header__menu-item" role="menuitem" href="${item.href}">${item.label}</a></li>`)
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
  updateNavCurrent();
}

// ── Section tag config ───────────────────────────────────────────
const SECTION_TAG = {
  basic:         { cls: 'cds--tag--blue',   label: 'Desarrollo' },
  integraciones: { cls: 'cds--tag--purple', label: 'Automatización' },
  premium:       { cls: 'cds--tag--green',  label: 'IA Generativa' }
};

function buildLabCard(lab, section) {
  const tag = SECTION_TAG[section.id] || { cls: 'cds--tag--gray', label: section.eyebrow };
  const audienceTag = lab.audience && lab.audience.length === 1 && lab.audience[0] === 'partner'
    ? '<span class="cds--tag cds--tag--cyan hub-tag--partner">Solo Partners</span>'
    : '';
  return `
    <article class="cds--tile cds--tile--clickable hub-lab-card" tabindex="0"
             onclick="window.location.hash='${getLabRoute(lab.slug)}'"
             onkeydown="if(event.key==='Enter'||event.key===' '){window.location.hash='${getLabRoute(lab.slug)}'}">
      <div class="hub-lab-card__tags">
        <span class="cds--tag ${tag.cls}">${tag.label}</span>
        ${audienceTag}
      </div>
      <p class="cds--label-01 hub-lab-card__meta">${lab.supporting} · ${lab.level}</p>
      <h3 class="cds--productive-heading-02 hub-lab-card__title">${lab.title}</h3>
      <p class="cds--body-01 hub-lab-card__description">${lab.description}</p>
      <span class="cds--link hub-lab-card__link" aria-hidden="true">Abrir laboratorio →</span>
    </article>
  `;
}

const BOB_PROFILES = [
  { role: 'Product Manager', tool: 'Jira', tasks: 'Estimaciones, planificación e identificación de riesgos' },
  { role: 'Diseñador', tool: 'Figma', tasks: 'UX/UI y prototipos a código' },
  { role: 'Arquitecto', tool: 'Instana', tasks: 'Comprensión y visualización de sistemas' },
  { role: 'Desarrollador', tool: 'GitHub', tasks: 'Generación, refactor y modernización' },
  { role: 'DevOps', tool: 'Terraform', tasks: 'Gobernanza de PR y pipelines' },
  { role: 'Seguridad', tool: 'Vault', tasks: 'Vulnerabilidades y detección de secretos' }
];

const BOB_MODES = [
  { name: 'Ask Mode', tag: 'Consultor', desc: 'Analiza y explica código sin modificar archivos. Ideal para onboarding y documentación.' },
  { name: 'Plan Mode', tag: 'Arquitecto', desc: 'Diseña la arquitectura y la lista de tareas antes de escribir una línea de código.' },
  { name: 'Agent Mode', tag: 'Implementador', desc: 'Ejecuta el plan: crea archivos, corre tests, corrige y despliega con tu aprobación.' }
];

// ── Home page renderer ───────────────────────────────────────────
function renderHome(searchTerm = '', mode = currentMode) {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  const sectionsMarkup = siteData.sections
    .map((section) => {
      const labs = section.labs.filter((lab) => {
        if (mode === 'client' && lab.audience && !lab.audience.includes('client')) return false;
        if (!normalizedTerm) return true;
        return [lab.title, lab.description, lab.supporting, section.title]
          .join(' ').toLowerCase().includes(normalizedTerm);
      });

      const cardsMarkup = labs.length
        ? labs.map((lab) => buildLabCard(lab, section)).join('')
        : '<p class="cds--body-01 hub-empty-state">Ningún laboratorio coincide con esta búsqueda.</p>';

      const tag = SECTION_TAG[section.id] || { cls: 'cds--tag--gray', label: section.eyebrow };
      const levelTagCls = section.level === 'Premium'
        ? 'cds--tag--green'
        : section.level === 'Integración'
          ? 'cds--tag--purple'
          : 'cds--tag--blue';

      return `
        <div class="hub-workshop-section" id="section-${section.id}">
          <div class="cds--tile hub-level-banner" role="region" aria-label="${section.title}">
            <div class="hub-level-banner__badges">
              <span class="cds--tag ${tag.cls}">${section.eyebrow}</span>
              <span class="cds--tag ${levelTagCls}">${section.level}</span>
              <span class="cds--tag cds--tag--teal">${section.bobMode}</span>
            </div>
            <h2 class="cds--productive-heading-04 hub-level-banner__title">${section.title}</h2>
            <p class="cds--body-01 hub-level-banner__desc">${section.description}</p>
          </div>
          <div class="hub-cards-grid">${cardsMarkup}</div>
        </div>
      `;
    })
    .join('');

  const modeSelector = `
    <div class="cds--tabs cds--tabs--contained hub-mode-tabs" role="tablist" aria-label="Modo de audiencia">
      <button class="cds--tabs__nav-item${mode === 'client' ? ' cds--tabs__nav-item--selected' : ''}"
              role="tab" aria-selected="${mode === 'client'}" id="tab-client">
        Cliente
      </button>
      <button class="cds--tabs__nav-item${mode === 'partner' ? ' cds--tabs__nav-item--selected' : ''}"
              role="tab" aria-selected="${mode === 'partner'}" id="tab-partner">
        Partner
      </button>
    </div>
  `;

  const modesMarkup = BOB_MODES.map((m) => `
    <article class="cds--tile hub-cap-card">
      <span class="cds--tag cds--tag--blue">${m.tag}</span>
      <h3 class="cds--productive-heading-02 hub-cap-card__title">${m.name}</h3>
      <p class="cds--body-01">${m.desc}</p>
    </article>
  `).join('');

  const profilesMarkup = BOB_PROFILES.map((p) => `
    <article class="cds--tile hub-profile-card">
      <h3 class="cds--productive-heading-02">${p.role}</h3>
      <p class="cds--label-01 hub-profile-card__tool">${p.tool}</p>
      <p class="cds--body-01">${p.tasks}</p>
    </article>
  `).join('');

  homeView.innerHTML = `
    <section class="hub-hero">
      <div class="hub-hero__inner">
        <div class="hub-hero__content">
          <p class="cds--label-01 hub-hero__eyebrow">${siteData.hero.eyebrow}</p>
          <h1 class="hub-hero__title">${siteData.hero.title}</h1>
          <p class="cds--body-02 hub-hero__copy">${siteData.hero.description}</p>
          <div class="hub-hero__actions">
            <a class="cds--btn cds--btn--primary" href="#available-workshops">${siteData.hero.ctaLabel}</a>
            <a class="cds--btn cds--btn--tertiary" href="#capacidades">Ver capacidades</a>
          </div>
        </div>
        <div class="hub-hero__visual" aria-hidden="true">
          <img src="./assets/images/bobinicial.jpeg" alt="IBM Bob — tu copiloto de IA" width="480" height="360" loading="eager" />
        </div>
      </div>
    </section>

    <div class="hub-metrics">
      ${siteData.highlights.map((item) => `
        <div class="hub-metric-tile">
          <p class="hub-metric-value">${item.value}</p>
          <p class="hub-metric-label">${item.label}</p>
        </div>
      `).join('')}
    </div>

    <section id="capacidades" class="hub-capacidades">
      <div class="hub-capacidades__inner">
        <p class="cds--label-01 hub-section-eyebrow">Capacidades</p>
        <h2 class="cds--productive-heading-04">Bob en cada modo y perfil</h2>
        <p class="cds--body-01 hub-section-lead">Tres modos de trabajo y seis perfiles de equipo — Bob se adapta al rol y a la fase del ciclo de vida.</p>
        <div class="hub-cap-grid">${modesMarkup}</div>
        <h3 class="cds--productive-heading-03 hub-capacidades__subtitle">Bob es el compañero perfecto para cualquier perfil</h3>
        <div class="hub-profile-grid">${profilesMarkup}</div>
      </div>
    </section>

    ${modeSelector}

    <section id="available-workshops" class="hub-workshops">
      <div class="hub-workshops__header">
        <p class="cds--label-01 hub-section-eyebrow">Laboratorios</p>
        <h2 class="cds--productive-heading-04 hub-workshops__heading">Workshops disponibles</h2>
      </div>
      <div class="hub-sections-stack">${sectionsMarkup}</div>
    </section>

    <section id="acerca-de" class="hub-about">
      <div class="hub-about__inner">
        <p class="cds--label-01 hub-section-eyebrow">Acerca de</p>
        <h2 class="cds--productive-heading-04">IBM Workshop Hub</h2>
        <p class="cds--body-01">
          Este hub reúne workshops prácticos de IBM Bob para equipos Cliente y Partner.
          Cada laboratorio sigue el diseño IBM Carbon y te guía de la idea a un resultado ejecutable —
          con prompts listos, capturas de referencia y criterios de éxito claros.
        </p>
        <ul class="cds--list--unordered hub-about__list">
          <li class="cds--list__item"><strong>Audiencia Cliente:</strong> rutas de habilitación core y modernización.</li>
          <li class="cds--list__item"><strong>Audiencia Partner:</strong> incluye laboratorios premium adicionales (p. ej. RPG en IBM i).</li>
          <li class="cds--list__item"><strong>Diseño:</strong> tipografía IBM Plex, tokens Carbon y UI Shell estándar.</li>
        </ul>
      </div>
    </section>
  `;

  homeView.querySelector('#tab-client')?.addEventListener('click', () => {
    currentMode = 'client';
    renderHome(siteSearch.value, 'client');
    scrollToHomeSection(getHashTarget());
  });
  homeView.querySelector('#tab-partner')?.addEventListener('click', () => {
    currentMode = 'partner';
    renderHome(siteSearch.value, 'partner');
    scrollToHomeSection(getHashTarget());
  });
}

// ── Subnav ───────────────────────────────────────────────────────
function renderSubnav(links, currentHref) {
  subnavItems.innerHTML = links
    .map((link) => {
      const isActive = link.href === currentHref;
      const activeClass = isActive ? ' cds--tabs__nav-item--selected' : '';
      const ariaCurrent = isActive ? ' aria-selected="true"' : ' aria-selected="false"';
      return `<button class="cds--tabs__nav-item${activeClass}" role="tab"${ariaCurrent} data-href="${link.href}">${link.label}</button>`;
    })
    .join('');

  subnavItems.querySelectorAll('.cds--tabs__nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.hash = btn.dataset.href;
    });
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

  renderSubnav(
    lab.steps.map((step) => ({
      label: step.label,
      href: getLabRoute(lab.slug, step.slug)
    })),
    getLabRoute(lab.slug, activeStep.slug)
  );

  const isOverview = activeStep.slug === 'overview';
  labShell.innerHTML = `
    <header class="lab-shell__header${isOverview ? ' lab-shell__header--hidden' : ''}">
      <p class="cds--label-01 lab-shell__meta">${section.title} · ${lab.level}</p>
      <h1 class="cds--productive-heading-05 lab-shell__title">${lab.title}</h1>
      <p class="cds--body-02 lab-shell__description">${lab.description}</p>
    </header>
    <div class="prose prose--full">${content}</div>
  `;
}

// ── Route dispatcher ─────────────────────────────────────────────
async function renderRoute() {
  const route = parseRoute(window.location.hash);
  const sectionId = getHashTarget();

  if (route.view === 'home') {
    homeView.hidden = false;
    labView.hidden   = true;
    subnavEl.hidden  = true;
    subnavItems.innerHTML = '';
    document.body.classList.add('hub-view--home');
    document.body.classList.remove('hub-view--lab');
    renderHome(siteSearch.value);
    updateNavCurrent();
    // Allow layout to settle, then scroll past fixed header
    setTimeout(() => scrollToHomeSection(sectionId), 50);
    return;
  }

  homeView.hidden  = true;
  labView.hidden   = false;
  subnavEl.hidden  = false;
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

  siteSearch.addEventListener('input', () => {
    if (parseRoute(window.location.hash).view === 'home') {
      renderHome(siteSearch.value);
    }
  });

  document.addEventListener('click', async (event) => {
    const copyButton = event.target.closest('.copy-button');
    if (!copyButton) return;
    const code = copyButton.parentElement?.querySelector('code');
    if (!code) return;
    await navigator.clipboard.writeText(code.textContent || '');
    copyButton.textContent = 'Copiado';
    window.setTimeout(() => { copyButton.textContent = 'Copiar'; }, 1200);
  });
}

initializeTheme();
renderPlatformNav();
bindEvents();
renderRoute();
