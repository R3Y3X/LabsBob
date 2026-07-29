# labsBob

Vanilla GitHub Pages prototype for an IBM Bob workshop portal.

## Project structure

- [`docs/index.html`](docs/index.html) is the GitHub Pages entry point
- [`docs/css/`](docs/css) contains the theme, layout, component, and responsive styles
- [`docs/js/`](docs/js) contains the SPA shell, routing, theme handling, and content loading
- [`docs/content/`](docs/content) contains the lab content fragments rendered by the SPA
- [`docs/assets/`](docs/assets) contains images and icons for the site
- [`docs/DESIGN.md`](docs/DESIGN.md) captures the visual and structural design rules
- [`docs/github-pages-vanilla-site-plan.md`](docs/github-pages-vanilla-site-plan.md) tracks the implementation plan and subtask status

## Local preview

Open [`docs/index.html`](docs/index.html) with any static server so fetched content files resolve correctly.

Example with Python:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/docs/`.

## How to add or update labs

1. Add or update the lab definition in [`docs/js/data.js`](docs/js/data.js).
2. Create the matching content fragments under [`docs/content/`](docs/content) using the lab slug and step slug structure.
3. Add any related media under [`docs/assets/images/`](docs/assets/images) using predictable lowercase, hyphenated names.
4. Reuse the existing classes and rules documented in [`docs/DESIGN.md`](docs/DESIGN.md) for code blocks, callouts, and layout consistency.
5. Keep the site vanilla: no frameworks, no build step, no extra pages unless the structure is intentionally expanded.

## Notes

- The current content files are scaffolds for the planned labs.
- The initial content loading approach uses fetched HTML fragments to keep the implementation minimal.
- Richer migration from external lab material can be layered into the existing structure later without changing the shell.
