import { loadContent } from './content.js';
import { siteData, findLab } from './data.js';
import { getHomeRoute, getLabRoute, parseRoute } from './router.js';
import { initializeTheme, toggleTheme } from './theme.js';

// Global audience mode state: 'client' | 'partner'
let currentMode = 'client';

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
  // Desktop top nav <li> items directly in the <ul>
  siteNavItems.innerHTML = siteData.topNav
    .map((item, index) => {
      const current = index === 0 ? ' aria-current="page"' : '';
      return `<li role="none"><a class="cds--header__menu-item" role="menuitem"${current} href="${item.href}">${item.label}</a></li>`;
    })
    .join('');

  // Mobile SideNav: main links + all labs grouped by section
  const navLinks = siteData.topNav
    .map((item, index) => {
      const current = index === 0 ? ' aria-current="page"' : '';
      return `<li><a class="cds--side-nav__link"${current} href="${item.href}">${item.label}</a></li>`;
    })
    .join('');

  const labLinks = siteData.sections
    .map(section => {
      const labItems = section.labs
        .map(lab => `<li><a class="cds--side-nav__link cds--side-nav__link--sub" href="${getLabRoute(lab.slug)}">${lab.title}</a></li>`)
        .join('');
      return `
        <li class="hub-side-nav__section-label">${section.title}</li>
        ${labItems}
      `;
    })
    .join('');

  sideNavItemsMobile.innerHTML = navLinks + labLinks;
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
        <div class="hub-workshop-section">
          <div class="cds--tile hub-level-banner" role="region" aria-label="${section.title}">
            <div class="hub-level-banner__badges">
              <span class="cds--tag ${tag.cls}">${section.eyebrow}</span>
              <span class="cds--tag ${levelTagCls}">${section.level}</span>
              <span class="cds--tag cds--tag--teal">🤖 ${section.bobMode}</span>
            </div>
            <h2 class="cds--productive-heading-04 hub-level-banner__title">${section.title}</h2>
            <p class="cds--body-01 hub-level-banner__desc">${section.description}</p>
          </div>
          <div class="hub-cards-grid">${cardsMarkup}</div>
          <a class="cds--btn cds--btn--ghost hub-section-cta" href="#available-workshops">${section.actionLabel} →</a>
        </div>
      `;
    })
    .join('');

  // Mode selector tabs
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

  homeView.innerHTML = `
    <!-- ── Hero ── -->
    <section class="hub-hero">
      <div class="hub-hero__inner">
        <div class="hub-hero__content">
          <p class="cds--label-01 hub-hero__eyebrow">${siteData.hero.eyebrow}</p>
          <h1 class="hub-hero__title">${siteData.hero.title}</h1>
          <p class="cds--body-02 hub-hero__copy">${siteData.hero.description}</p>
          <div class="hub-hero__actions">
            <a class="cds--btn cds--btn--primary" href="#available-workshops">${siteData.hero.ctaLabel}</a>
          </div>
        </div>
        <div class="hub-hero__visual" aria-hidden="true">
          <img src="./assets/images/bobinicial.jpeg" alt="IBM Bob — tu copiloto de IA" width="480" height="360" loading="eager" />
        </div>
      </div>
    </section>

    <!-- ── Metrics strip ── -->
    <div class="hub-metrics">
      ${siteData.highlights.map((item) => `
        <div class="hub-metric-tile">
          <p class="hub-metric-value">${item.value}</p>
          <p class="hub-metric-label">${item.label}</p>
        </div>
      `).join('')}
    </div>

    <!-- ── Audience mode selector ── -->
    ${modeSelector}

    <!-- ── Available workshops ── -->
    <section id="available-workshops" class="hub-workshops">
      <div class="hub-workshops__header">
        <h2 class="cds--productive-heading-04 hub-workshops__heading">Workshops disponibles</h2>
      </div>
      <div class="hub-sections-stack">${sectionsMarkup}</div>
    </section>
  `;

  homeView.querySelector('#tab-client')?.addEventListener('click', () => {
    currentMode = 'client';
    renderHome(siteSearch.value, 'client');
  });
  homeView.querySelector('#tab-partner')?.addEventListener('click', () => {
    currentMode = 'partner';
    renderHome(siteSearch.value, 'partner');
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
  // For overview tabs the content panel already has a full lab-banner — hide the
  // shell header so the title is not duplicated.
  labShell.innerHTML = `
    <header class="lab-shell__header${isOverview ? ' lab-shell__header--hidden' : ''}">
      <p class="cds--label-01 lab-shell__meta">${section.title} · ${lab.level}</p>
      <h1 class="cds--productive-heading-05 lab-shell__title">${lab.title}</h1>
      <p class="cds--body-02 lab-shell__description">${lab.description}</p>
    </header>
    <div class="prose${isOverview ? ' prose--full' : ''}">${content}</div>
  `;
}

// ── Route dispatcher ─────────────────────────────────────────────
async function renderRoute() {
  const route = parseRoute(window.location.hash);

  if (route.view === 'home') {
    homeView.hidden = false;
    labView.hidden   = true;
    subnavEl.hidden  = true;   // hide subnav on home
    renderHome(siteSearch.value);
    return;
  }

  homeView.hidden  = false; // keep in DOM for layout
  homeView.hidden  = true;
  labView.hidden   = false;
  subnavEl.hidden  = false;  // show subnav on lab pages
  await renderLab(route);
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

  // Copy-to-clipboard for code blocks
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
