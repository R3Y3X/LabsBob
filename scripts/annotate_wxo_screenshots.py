#!/usr/bin/env python3
"""Copia las capturas del Track F a docs/assets y les dibuja el recuadro rojo.

El estilo (color y grosor) sale de la anotación que ya existe en
`seleccionar_agente.png`, para que todas las imágenes del track se vean igual.

Las cajas se declaran en fracciones del ancho/alto del origen, así que no
dependen de la resolución de la captura.

Uso:
    python3 scripts/annotate_wxo_screenshots.py
    python3 scripts/annotate_wxo_screenshots.py --src ~/Documents --dry-run
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw

# Estilo muestreado de docs/assets/images/labs/agentic-retail-wxo/seleccionar_agente.png
BOX_COLOR = (234, 64, 37)
BOX_WIDTH = 5

REPO_ROOT = Path(__file__).resolve().parent.parent
DEST_DIR = REPO_ROOT / "docs/assets/images/labs/agentic-retail-wxo"
DEFAULT_SRC_DIR = Path.home() / "Documents"

SHOT = "Captura de pantalla 2026-09-08 a las {}.png"

# destino -> (origen, [(x0, y0, x1, y1) en fracciones], qué encuadra)
IMAGES: dict[str, tuple[str, list[tuple[float, float, float, float]], str]] = {
    "wxo-ibmcloud-account.png": (
        SHOT.format("20.46.25"),
        [(0.639, 0.006, 0.800, 0.045)],
        "Selector de cuenta itz-saas-* arriba a la derecha",
    ),
    "wxo-resource-instance.png": (
        SHOT.format("20.46.59"),
        [(0.048, 0.443, 0.720, 0.500)],
        "Fila de la instancia watsonx Orchestrate",
    ),
    "wxo-manage-credentials.png": (
        SHOT.format("20.47.26"),
        [(0.190, 0.525, 0.578, 0.875)],
        "Tarjeta Credenciales: Clave de API + URL",
    ),
    "wxo-tools-tab.png": (
        SHOT.format("21.03.31"),
        [(0.022, 0.363, 0.253, 0.669)],
        "Tarjeta retail_availability_mcp con Type MCP",
    ),
    "sku-availability-chat.png": (
        SHOT.format("20.48.32"),
        [(0.526, 0.297, 0.985, 0.625)],
        "Pregunta y respuesta en el panel Draft Preview",
    ),
    "wxo-knowledge-select-source.png": (
        SHOT.format("21.05.15"),
        [(0.235, 0.417, 0.511, 0.519)],
        "Tarjeta Upload files marcada Selected",
    ),
    "wxo-knowledge-upload-file.png": (
        SHOT.format("21.05.20"),
        [(0.235, 0.520, 0.454, 0.567)],
        "El archivo product-catalog.docx ya cargado",
    ),
    "wxo-knowledge-details.png": (
        SHOT.format("21.05.00"),
        [(0.231, 0.307, 0.675, 0.555)],
        "Campos Name y Description del asistente",
    ),
    "substitute-finder-chat.png": (
        SHOT.format("20.50.10"),
        [(0.530, 0.708, 0.988, 0.840)],
        "Bloque Productos sustitutos de la respuesta",
    ),
    "store-associate-chat.png": (
        SHOT.format("20.50.50"),
        [(0.525, 0.299, 0.988, 0.561)],
        "Pregunta y respuesta con stock en Unicenter",
    ),
    "customer-shopping-chat.png": (
        SHOT.format("20.51.52"),
        [(0.532, 0.809, 0.975, 0.867)],
        "La línea que avisa que no hay stock en Unicenter",
    ),
}


def annotate(src: Path, dest: Path, boxes: list[tuple[float, float, float, float]]) -> None:
    image = Image.open(src).convert("RGB")
    width, height = image.size
    draw = ImageDraw.Draw(image)
    for x0, y0, x1, y1 in boxes:
        draw.rectangle(
            [(x0 * width, y0 * height), (x1 * width, y1 * height)],
            outline=BOX_COLOR,
            width=BOX_WIDTH,
        )
    image.save(dest, "PNG", optimize=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src", type=Path, default=DEFAULT_SRC_DIR, help="carpeta con las capturas originales")
    parser.add_argument("--dry-run", action="store_true", help="solo lista lo que haría")
    args = parser.parse_args()

    missing = []
    for dest_name, (src_name, boxes, note) in IMAGES.items():
        src = args.src / src_name
        dest = DEST_DIR / dest_name
        if not src.exists():
            missing.append(src_name)
            continue
        print(f"{dest_name:36s} ← {src_name}  ({note})")
        if not args.dry_run:
            annotate(src, dest, boxes)

    if missing:
        print("\nNo encontradas en el origen:", file=sys.stderr)
        for name in missing:
            print(f"  - {name}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
