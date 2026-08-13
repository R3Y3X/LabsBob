# Imágenes — Seguridad (skills) y Rules

Carpeta propuesta: `docs/assets/images/labs/entendiendo-bob/`

Hoy estos labs casi no tienen capturas de UI: los prompts siguen en bloques copiables.

**Capturas oficiales IBM (Rules)** — ya descargadas y cableadas en `lab2-rules.html`:

- `ibm-rules-file.png`
- `ibm-rules-content.png`
- `ibm-rules-readme.png`

Las páginas oficiales de Auditoría y actor-critic no publican `<img>` (solo texto). No inventes capturas.

Las imágenes de abajo son **opcionales**; cuando las tengas, añade el `<figure class="lab-figure">` junto al paso. **No** sustituyas ningún `.code-block` por PNG.

Estilo común: captura **recortada** de IBM Bob IDE, tema oscuro Carbon. Encuadre del panel de Bob o del diálogo relevante. Relación ~16:9 o 3:2. Paleta: `#161616` / `#262626`, acento `#0f62fe`, mascota Bob. Preferible captura real; si usas IA, 1920×1080 y recorta.

El banner actual (`lab3_bob.png`) vive en `hands-on-inicial/` y se reutiliza. Para este track conviene un banner propio (prompt al final).

---

## Lab 1 — Skill ASVS

### `lab-seg-skills-panel.png`

IBM Bob Settings → Skills. Dark Carbon. Form “Create skill”: name `asvs-audit`, Spanish description about OWASP ASVS Level 1, toggle “Allow Bob to use this skill” on, scope project `galaxium-travels`. Cropped to the skill form, 16:9.

### `lab-seg-ask-riesgo.png`

Ask Mode chat: Bob answers in Spanish with stack, high-risk folders (auth, DB, API). File tree shows galaxium-travels. 16:9.

### `lab-seg-plan-auditoria.png`

Plan Mode: Spanish audit plan referencing skill `/asvs-audit`, output path `security/audit-findings.md`. 16:9.

### `lab-seg-agent-permisos.png`

Agent Mode permissions popover: Read, Edit, Execute, Skill ON; MCP OFF. IBM Carbon toggles. 16:9.

### `lab-seg-hallazgos.png`

Editor open at `security/audit-findings.md` plus Bob summary: PASS/FAIL counts, ASVS findings with file:line. Dark theme, 16:9.

---

## Lab 2 — Rules

### `lab-rules-archivo.png`

VS Code / IBM Bob dark editor showing `.bob/rules/basic_rules.md` with the three Spanish rules (JSDoc, concisión, internal-monologue). Explorer highlights `.bob/rules`. 16:9.

### `lab-rules-agent-readme.png`

Agent Mode after “Actualiza el README”: diff of README.md and a new file `internal-monologue/2026-01-15_actualizar-readme.md`. Approve bar visible. 16:9.

### `lab-rules-ask-breve.png`

Ask Mode: a three-sentence Spanish repo summary, visually short. Ask badge visible. 16:9.

---

## Lab 3 — Código seguro (actor-critic)

### `lab-seg-security-rules.png`

IBM Bob dark editor showing `.bob/rules/security.md` with Spanish meta-rules (MUST/NEVER for secrets, auth, TLS, input validation). Explorer highlights `.bob/rules/security.md`. Cropped 16:9, IBM Carbon.

### `lab-seg-actor-skill.png`

IBM Bob Settings → Skills. Form “Create skill”: name `secure-python-actor`, Spanish description about FastAPI + OWASP ASVS Level 1, Allow Bob toggle on, scope `galaxium-travels`. Cropped to the skill form, 16:9.

### `lab-seg-critic-skill.png`

Same Skills form for `secure-python-critic`. Description mentions NIST SP 800-53, OWASP ASVS and CWE Top 25. Dark Carbon, 16:9.

### `lab-seg-actor-critic-run.png`

IBM Bob Agent Mode. Chat shows two sequential subagents: Actor writing `booking_detail.py` then Critic findings report with OVERALL VERDICT PASS. Permissions show Skill and Subagent ON. Approve bar visible. Cropped 16:9.

### `lab-seg-endpoint.png`

Editor open at `booking_system_backend/routers/booking_detail.py` with FastAPI GET `/bookings/{booking_id}`, Header X-User-Email, 403/404 handling. Bob panel with a short Spanish compliance checklist. 16:9.

### Banner del track — `banner_seguridad_bob.png` (nuevo, para la tarjeta del hub)

3D IBM Bob robot (blue hard hat, white body) on a clean white background, distinct from the Primeros Pasos banner. Surrounding icons: shield, padlock, NIST/ASVS checklist, two small agent cards labeled Actor and Critic. No text logos except a subtle shield. 16:9, product-hero style, high key lighting. Not the same composition as the Ask/Plan/Agent banner.

---

## Cómo usar

Preferible captura real. Si usas IA: 1920×1080, recorta el panel útil, PNG. No sustituyas `.code-block` copiables. Cuando tengas `banner_seguridad_bob.png`, cambia `banner` del workshop `entendiendo-bob` en `docs/js/data.js`.

