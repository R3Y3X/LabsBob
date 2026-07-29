# GitHub Pages Vanilla Site Plan

## Top-Level Overview

Create a minimal single-page site under [`docs/`](docs) for GitHub Pages using only [`index.html`](docs/index.html), plain CSS, and plain JavaScript. The site should mirror the IBM Workshop Hub and MkDocs-style design direction captured in [`docs/promtinicial.md`](docs/promtinicial.md) and the provided screenshots, while staying intentionally small in scope. The plan prioritizes [`DESIGN.md`](docs/DESIGN.md) first so later implementation sessions can work from a shared visual and structural reference, then builds the SPA shell, then adds content structure and assets in independently executable subtasks.

## Sub-Tasks

### 1. Define the visual system in [`DESIGN.md`](docs/DESIGN.md)
- **Intent** — Capture the target UI language before implementation so all later sessions follow the same layout, spacing, hierarchy, navigation, and component rules.
- **Expected Outcomes** — A complete [`DESIGN.md`](docs/DESIGN.md) describing the landing page layout, navbar behavior, lab cards, typography, color variables, spacing rhythm, responsive behavior, and content presentation rules for code blocks, callouts, and images.
- **Todo List**
  1. Review the visual cues from the supplied screenshots and the requirements in [`docs/promtinicial.md`](docs/promtinicial.md).
  2. Document the home layout structure, including hero area, category sections, and lab card presentation.
  3. Define the persistent header elements, global search placement, theme toggle behavior, and GitHub badge area.
  4. Define the lab-view sub-navigation pattern as a horizontal bar beneath the main header.
  5. Document component-level rules for code blocks, copy buttons, callouts, and inline imagery.
  6. Record responsive rules so later implementation stays consistent on smaller screens.
- **Relevant Context** — [`docs/promtinicial.md`](docs/promtinicial.md), [`README.md`](README.md)
- **Status** — [x] done

### 2. Establish the GitHub Pages SPA shell under [`docs/`](docs)
- **Intent** — Create the minimum static structure required for a GitHub Pages-compatible single-page app that can later host all lab content without rework.
- **Expected Outcomes** — A working static shell with [`docs/index.html`](docs/index.html), a modular CSS structure, a modular JavaScript structure, and a basic routing pattern based on hashes.
- **Todo List**
  1. Create the base GitHub Pages file structure under [`docs/`](docs) for HTML, CSS, JavaScript, and assets.
  2. Add the root HTML shell with placeholders for the main navbar, sub-navbar, home content, and dynamic lab content area.
  3. Create the CSS files that define theme variables, layout primitives, and shared components.
  4. Create the JavaScript entry point that initializes the SPA, handles hash-based navigation, and toggles light and dark theme state.
  5. Add the minimal GitHub Pages support files needed for static hosting behavior.
- **Relevant Context** — [`docs/promtinicial.md`](docs/promtinicial.md), [`docs/github-pages-vanilla-site-plan.md`](docs/github-pages-vanilla-site-plan.md)
- **Status** — [x] done

### 3. Build the landing page structure and reusable UI components
- **Intent** — Implement the visual homepage and shared interface pieces that establish the user experience before lab-specific content is added.
- **Expected Outcomes** — A landing page that reflects the approved design direction, including a branded header, search input, theme toggle, category sections, and reusable lab cards for the three difficulty groupings.
- **Todo List**
  1. Build the landing page sections for the welcome area and categorized lab menu.
  2. Implement reusable card markup and styles for BASIC, INTEGRACIONES, and PREMIUM PACKAGE entries.
  3. Style the top navigation to align with the design reference and screenshots.
  4. Add the static version of the horizontal lab sub-navigation so later lab views can reuse it.
  5. Verify the layout remains clean and minimal without introducing extra pages or frameworks.
- **Relevant Context** — [`docs/promtinicial.md`](docs/promtinicial.md), [`docs/DESIGN.md`](docs/DESIGN.md)
- **Status** — [x] done

### 4. Add content loading conventions and lab content scaffolding
- **Intent** — Define how lab content will be organized and loaded so later sessions can implement or migrate labs independently without changing the app shell.
- **Expected Outcomes** — A clear content directory structure, starter lab files, and a lightweight rendering approach for showing lab intro sections and step-based content inside the SPA.
- **Todo List**
  1. Create a content folder structure for the home view and the planned lab categories.
  2. Decide and document the lightweight content loading approach for markdown or HTML within the existing vanilla constraints.
  3. Add starter content files for each planned lab so navigation targets exist.
  4. Connect the router to render the appropriate view and to show the horizontal lab-step navigation in lab mode.
  5. Add baseline presentation styles for headings, paragraphs, code blocks, callouts, and images within rendered content.
- **Relevant Context** — [`docs/promtinicial.md`](docs/promtinicial.md), [`docs/DESIGN.md`](docs/DESIGN.md)
- **Status** — [x] done

### 5. Organize assets and document site maintenance in [`README.md`](README.md)
- **Intent** — Prepare the repo for sustainable updates by defining where assets live and how future lab updates should be made.
- **Expected Outcomes** — A consistent assets layout under [`docs/assets/`](docs/assets), plus updated project documentation explaining how to add or update labs in the GitHub Pages structure.
- **Todo List**
  1. Create the assets directory structure for shared images, icons, and lab-specific media.
  2. Define naming and placement rules so future asset imports remain predictable.
  3. Update [`README.md`](README.md) with concise instructions for adding new labs, updating content, and keeping the vanilla structure intact.
  4. Record any follow-up implementation notes that later sessions need when migrating richer lab materials.
- **Relevant Context** — [`README.md`](README.md), [`docs/promtinicial.md`](docs/promtinicial.md)
- **Status** — [x] done
