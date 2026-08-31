#!/usr/bin/env python3
"""Rebuild LabHandsOnBob.zip so every lab folder is fully self-contained.

Problem: the bundle's lab-2 exercise required files from lab-1 via relative
paths like ../../../lab-1-ask-mode/src/models/Product, so a participant who
opened lab-2 in isolation hit broken imports. This script restructures the
bundle from the existing zip into independent per-lab folders, matching the
lab numbering used on the site (docs/js/data.js), and writes a fresh zip.

Usage:
    python3 scripts/build_labhandsonbob.py [--source PATH] [--out PATH]

Defaults: --source docs/downloads/LabHandsOnBob.zip
          --out    docs/downloads/LabHandsOnBob.zip (overwritten in place)
"""
import argparse
import shutil
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

ROOT_README = """# IBM Bob — Hands-On Lab: De la idea al código

Cada carpeta de este bundle es un laboratorio independiente. Abre solo la
carpeta del lab que estás siguiendo con **File → Open Folder** en IBM Bob —
no abras esta carpeta raíz.

| Lab en el sitio | Carpeta a abrir | Necesita |
|---|---|---|
| Lab 1 — Ask Mode | `lab-1-ask-mode/` | — |
| Lab 2 — Plan y Agent | `lab-2-plan-agent/` | Node.js 18+ |
| Lab 3 — Modo personalizado | `lab-3-modo-personalizado/` | — |
| Lab 4 — MCP | `lab-4-mcp-tavily/` | API key de Tavily (gratis) |
| Auditoría de seguridad (workshop "¿Tu código es seguro?") | `galaxium-travels/` | Python 3, Node.js 18+ |

Cada carpeta trae su propio `README.md` con el detalle. Las instrucciones
completas, con capturas y prompts para copiar, están en el sitio del
workshop.
"""

LAB2_README = """# Lab 2 — Plan y Agent

Sigue las instrucciones en el sitio del workshop: **De la idea al código →
Lab 2 — Plan y Agent**.

Esta carpeta es una copia independiente de la API de e-commerce (misma base
que el Lab 1) con el carrito de compras todavía sin implementar. No depende
de ninguna otra carpeta del bundle — puedes abrirla directamente aunque no
hayas hecho el Lab 1.

Vas a usar Plan Mode para diseñar el carrito y Agent Mode para
implementarlo en:

- `src/models/Cart.js`
- `src/controllers/cartController.js`
- `src/routes/api.js` (agrega las rutas de carrito al router existente)
"""

LAB3_README = """# Lab 3 — Modo personalizado

Sigue las instrucciones en el sitio del workshop: **De la idea al código →
Lab 3 — Modo personalizado**.

Abre esta carpeta como raíz del proyecto antes de crear el modo
`product-manager` — con `Scope: Project`, IBM Bob necesita una carpeta
abierta para escribir `.bob/custom_modes.yaml`.

`PRODUCT-BRIEF.md` le da al modo contexto real de producto para que puedas
probarlo con una pregunta como "¿qué funcionalidad deberíamos construir
después?".
"""

LAB3_PRODUCT_BRIEF = """# Bob's Grocery — brief de producto

Bob's Grocery es una API de e-commerce de alimentos (la misma base que
usaste en los Labs 1 y 2 de este workshop): productos, usuarios y,
recientemente, un carrito de compras.

## Quién la usa

Compradores finales vía una app web/móvil que consume esta API, y un equipo
interno pequeño (3 desarrolladores, 1 diseñador) que la mantiene.

## Qué existe hoy

- Catálogo de productos con categorías, precios y control de stock.
- Registro/login de usuarios con JWT.
- Carrito de compras (agregar, quitar, actualizar cantidad, vaciar).

## Qué duele hoy

- No hay checkout: el carrito no se puede convertir en un pedido.
- No hay historial de pedidos ni forma de que un usuario vea sus compras
  pasadas.
- El catálogo no tiene búsqueda ni filtros más allá de categoría.
- No hay ningún tipo de recomendación o relacionado ("también te puede
  interesar").

Usa este contexto cuando el modo `product-manager` te pida aclarar el
problema, el usuario objetivo o las restricciones.
"""

LAB4_README = """# Lab 4 — MCP con Tavily

Sigue las instrucciones en el sitio del workshop: **De la idea al código →
Lab 4 — MCP**.

1. Consigue tu API key en [tavily.com](https://tavily.com).
2. Abre esta carpeta en IBM Bob y, en Settings → MCP, elige el alcance
   **Project**.
3. Duplica `.bob/mcp.json.example`, renombra la copia a `.bob/mcp.json` y
   pega tu API key ahí — nunca la pegues directamente en `mcp.json.example`,
   que es la plantilla versionada. El archivo real está ignorado por Git.
4. Recarga los servidores MCP, confirma que `tavily` está activo y prueba una
   búsqueda desde Agent Mode que pida fuentes y fechas.
"""

LAB4_MCP_EXAMPLE = """{
  "mcpServers": {
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp@latest"],
      "env": {
        "TAVILY_API_KEY": "PEGA_TU_API_KEY_DE_TAVILY_AQUI"
      }
    }
  }
}
"""

GALAXIUM_WORKSHOP_NOTE = """# Este proyecto es el material del workshop "¿Tu código es seguro?"

Las instrucciones completas (Rules, Auditoría ASVS, Código seguro
actor-critic) están en el sitio del workshop, no en este README — el
README de arriba es el de Galaxium Travels como proyecto en sí.

Abre esta carpeta (`galaxium-travels/`) directamente como raíz del proyecto
en IBM Bob. No depende de ninguna otra carpeta del bundle.
"""


def rewrite_cart_controller(text: str) -> str:
    return text.replace(
        "const Product = require('../../../lab-1-ask-mode/src/models/Product');",
        "const Product = require('../models/Product');",
    )


def rewrite_cart_routes(text: str) -> str:
    text = text.replace(
        "// const authMiddleware = require('../../../lab-1-ask-mode/src/middleware/auth');",
        "// Usa authController.verifyToken como middleware de autenticación —\n"
        "// ya está definido en ../controllers/authController, igual que en las\n"
        "// rutas de productos de más arriba en este mismo archivo.",
    )
    text = text.replace(
        "// router.post('/cart/add', authMiddleware, cartController.addToCart);",
        "// router.post('/cart/add', authController.verifyToken, cartController.addToCart);",
    )
    return text


def build(source_zip: Path, out_zip: Path) -> None:
    work = REPO_ROOT / "_labhandsonbob_build"
    if work.exists():
        shutil.rmtree(work)
    extract_dir = work / "extract"
    out_dir = work / "out" / "LabHandsOnBob"
    extract_dir.mkdir(parents=True)
    out_dir.mkdir(parents=True)

    with zipfile.ZipFile(source_zip) as zf:
        zf.extractall(extract_dir)
    src_root = extract_dir / "LabHandsOnBob"

    # ── Shared top-level files ──────────────────────────────────────
    shutil.copytree(src_root / "assets", out_dir / "assets")
    for name in ("LICENSE", "CONTRIBUTING.md", "BOBCLI.md", "bob-learning-time.html"):
        candidate = src_root / name
        if candidate.exists():
            shutil.copy2(candidate, out_dir / name)
    (out_dir / "README.md").write_text(ROOT_README, encoding="utf-8")

    gitignore_text = (src_root / ".gitignore").read_text(encoding="utf-8")
    if ".bob/mcp.json" not in gitignore_text:
        gitignore_text += (
            "\n# MCP server config with real API keys (Lab 4) — the .example file"
            "\n# stays tracked, the real one never does\n**/.bob/mcp.json\n"
        )
    (out_dir / ".gitignore").write_text(gitignore_text, encoding="utf-8")

    # ── Lab 1 — Ask Mode (unchanged, already self-contained) ────────
    shutil.copytree(src_root / "lab-1-ask-mode", out_dir / "lab-1-ask-mode")

    # ── Lab 2 — Plan y Agent ────────────────────────────────────────
    # Older source archives held the cart stubs in a separate legacy folder.
    # The current bundle already contains a standalone lab-2 folder, so the
    # builder accepts both archive layouts without recreating its stubs.
    old_cart = src_root / "lab-2-modos-existentes" / "ejercicio-carrito"
    lab2 = out_dir / "lab-2-plan-agent"
    if not old_cart.exists():
        shutil.copytree(src_root / "lab-2-plan-agent", lab2)
    else:
        shutil.copytree(src_root / "lab-1-ask-mode" / "src", lab2 / "src")
        shutil.copy2(src_root / "lab-1-ask-mode" / "package.json", lab2 / "package.json")
        shutil.copy2(old_cart / "models" / "Cart.js", lab2 / "src" / "models" / "Cart.js")

        cart_controller_text = (old_cart / "controllers" / "cartController.js").read_text(encoding="utf-8")
        (lab2 / "src" / "controllers" / "cartController.js").write_text(
            rewrite_cart_controller(cart_controller_text), encoding="utf-8"
        )

        cart_routes_stub = rewrite_cart_routes(
            (old_cart / "routes" / "api.js").read_text(encoding="utf-8")
        )
        # Strip the stub's own module.exports/header noise — we append its TODO
        # block onto the real api.js copied from Lab 1, right before that
        # file's module.exports, so participants extend one real router.
        todo_block = cart_routes_stub.split("module.exports = router;")[0]
        todo_block = todo_block.split("const cartController = require('../controllers/cartController');", 1)[-1]
        api_js_path = lab2 / "src" / "routes" / "api.js"
        api_js_text = api_js_path.read_text(encoding="utf-8")
        api_js_text = api_js_text.replace(
            "const productController = require('../controllers/productController');",
            "const productController = require('../controllers/productController');\n"
            "const cartController = require('../controllers/cartController');",
        )
        cart_section = (
            "\n// ============================================\n"
            "// Cart Routes — implement in this lab\n"
            "// ============================================\n"
            + todo_block.strip("\n")
            + "\n"
        )
        api_js_text = api_js_text.replace(
            "module.exports = router;", cart_section + "\nmodule.exports = router;"
        )
        api_js_path.write_text(api_js_text, encoding="utf-8")
    (lab2 / "README.md").write_text(LAB2_README, encoding="utf-8")

    # ── Lab 3 — Modo personalizado (renamed from lab-4) ──────────────
    lab3 = out_dir / "lab-3-modo-personalizado"
    lab3.mkdir(parents=True)
    (lab3 / "README.md").write_text(LAB3_README, encoding="utf-8")
    (lab3 / "PRODUCT-BRIEF.md").write_text(LAB3_PRODUCT_BRIEF, encoding="utf-8")

    # ── Lab 4 — MCP con Tavily (renamed from lab-5) ──────────────────
    lab4 = out_dir / "lab-4-mcp-tavily"
    lab4.mkdir(parents=True)
    (lab4 / "README.md").write_text(LAB4_README, encoding="utf-8")
    (lab4 / ".bob").mkdir()
    (lab4 / ".bob" / ".gitignore").write_text(
        "# Local MCP configuration containing API keys\nmcp.json\n", encoding="utf-8"
    )
    (lab4 / ".bob" / "mcp.json.example").write_text(LAB4_MCP_EXAMPLE, encoding="utf-8")

    # ── galaxium-travels (security workshop) ─────────────────────────
    # It was nested in the legacy archive and is top-level in the current
    # one. Preserve either source layout when rebuilding this shared bundle.
    galaxium_source = src_root / "galaxium-travels"
    if not galaxium_source.exists():
        galaxium_source = src_root / "lab-3-seguridad" / "galaxium-travels"
    shutil.copytree(galaxium_source, out_dir / "galaxium-travels")
    (out_dir / "galaxium-travels" / "WORKSHOP-LAB.md").write_text(
        GALAXIUM_WORKSHOP_NOTE, encoding="utf-8"
    )

    # Root .bob/custom_modes.yaml and the bob-custom-modes.yaml copies held
    # unrelated leftover modes (a pricing-comparison expert, an API-docs
    # expert) from a different exercise — dropped, not carried forward.

    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(out_dir.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(out_dir.parent))

    shutil.rmtree(work)
    print(f"Wrote {out_zip} ({out_zip.stat().st_size / 1_000_000:.1f} MB)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source", type=Path, default=REPO_ROOT / "docs" / "downloads" / "LabHandsOnBob.zip"
    )
    parser.add_argument(
        "--out", type=Path, default=REPO_ROOT / "docs" / "downloads" / "LabHandsOnBob.zip"
    )
    args = parser.parse_args()
    build(args.source, args.out)


if __name__ == "__main__":
    main()
