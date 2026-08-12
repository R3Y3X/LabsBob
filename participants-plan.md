# Plan: Add Participants to Team Section

## Overview

Add 6 new named participants — Patricia Courdurier, Katherine Salgado, Herman Sotomayor,
Andres Wagner, Guillermo Treister, Ivana Morassutti — plus 1 blank slot to the "Nosotros"
team section in `docs/js/app.js`.

**Total cards after change:** 12 (5 existing + 6 new + 1 blank)  
**Grid layout:** 4 columns × 3 rows (adjusted from current 5-column layout)

The current grid has 10 slots (5 named + 5 blank placeholders with broken image paths).
We replace those 5 blank placeholders with 6 real participants + 1 blank, and update
the CSS grid from 5 columns to 4 columns to accommodate 3 clean rows.

---

## Sub-Task 1 — Save the 6 participant photos to the equipo folder

**Intent:** Store the provided photos as local image files so they can be referenced
by the team cards without relying on external sources.

**Expected Outcomes:**
- 6 new image files exist in `docs/assets/images/equipo/`
- Filenames follow the existing `lowercasefirstnamelastname.png` convention:
  - `patriciacourdurier.jpg`
  - `katherinesalgado.jpg`
  - `hermansotomayor.jpg`
  - `andreswagner.jpg`
  - `guillermotreister.jpg`
  - `ivanamorassutti.jpg`

**Todo List:**
1. The images were provided directly by the user in this conversation.
   Save each one to `docs/assets/images/equipo/` with the filename noted above.

**Relevant Context:**
- Existing photos live in `docs/assets/images/equipo/` (rodrigoseguel.png, etc.)
- The `replaceTeamAvatar` fallback in `app.js` (line 932) shows a placeholder SVG
  on image load error, so correct paths are essential.

**Status:** [ ] pending

---

## Sub-Task 2 — Replace the 5 placeholder cards with 6 real participants + 1 blank in app.js

**Intent:** Update the team grid HTML template in `docs/js/app.js` to replace the 5
placeholder "Nombre Apellido" cards (lines 717–770) with 6 named participant cards
and exactly 1 trailing blank slot.

**Expected Outcomes:**
- Cards 6–11 in the grid are the 6 new participants with their correct photo paths and names.
- Card 12 is a blank slot (placeholder "Nombre Apellido" with the fallback image path).
- The accent colors cycle through the palette (blue → purple → teal → cyan → magenta → blue → purple).
- The total card count in the grid is 12.

**Todo List:**
1. Open `docs/js/app.js`, find lines 717–770 (the 5 placeholder cards).
2. Replace those 5 cards with 6 real participant cards + 1 blank card using the image
   paths saved in Sub-Task 1.
3. Accent color assignment for the 6 new cards (continuing from where card 5 ends on magenta):
   - Patricia Courdurier → `--blue`
   - Katherine Salgado → `--purple`
   - Herman Sotomayor → `--teal`
   - Andres Wagner → `--cyan`
   - Guillermo Treister → `--magenta`
   - Ivana Morassutti → `--blue`
   - Blank slot → `--purple`

**Relevant Context:**
- The card template pattern (lines 662–671 in app.js) is the model to follow.
- The blank card should use a non-existent path so the `replaceTeamAvatar` fallback
  triggers automatically — e.g. `./assets/images/equipo/placeholder.jpg`.

**Status:** [ ] pending

---

## Sub-Task 3 — Update CSS grid from 5 columns to 4 columns

**Intent:** With 12 cards, a 4-column grid produces 3 clean rows.
The current 5-column default would create an uneven 3rd row (2 orphaned cards).

**Expected Outcomes:**
- `grid-template-columns: repeat(4, 1fr)` at the default breakpoint in `components.css`
- Responsive breakpoints adjusted:
  - ≤1055px → 4 columns (already matches)
  - ≤767px → 3 columns (unchanged)
  - ≤527px → 2 columns (unchanged)
- The 1055px breakpoint can be removed or kept as-is since it already matches the new default.

**Todo List:**
1. Open `docs/css/components.css`, line 1512.
2. Change `grid-template-columns: repeat(5, 1fr)` to `grid-template-columns: repeat(4, 1fr)`.
3. The `@media (max-width: 1055px)` rule now duplicates the default — remove it to keep CSS clean.

**Relevant Context:**
- Grid definition: `docs/css/components.css` line 1510–1515.
- Responsive rules: lines 1632–1653.

**Status:** [ ] pending
