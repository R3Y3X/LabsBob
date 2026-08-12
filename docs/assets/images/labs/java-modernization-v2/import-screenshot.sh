#!/usr/bin/env bash
# Importa una captura de pantalla al nombre exacto que espera el HTML del lab.
# Uso: ./import-screenshot.sh <nombre-destino.png> <ruta-captura-origen>
# Ejemplo: ./import-screenshot.sh lab1-phase1-analysis.png ~/Desktop/Captura.png

set -euo pipefail

MIN_WIDTH=1400
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ $# -ne 2 ]]; then
  echo "Uso: $0 <nombre-destino.png> <ruta-captura-origen>" >&2
  echo "Ejemplo: $0 lab1-phase1-analysis.png ~/Desktop/captura.png" >&2
  exit 1
fi

DEST_NAME="$1"
SOURCE="$2"
DEST="$SCRIPT_DIR/$DEST_NAME"

if [[ ! -f "$SOURCE" ]]; then
  echo "Error: no existe el archivo origen: $SOURCE" >&2
  exit 1
fi

if [[ "$DEST_NAME" != *.png ]]; then
  echo "Error: el destino debe terminar en .png" >&2
  exit 1
fi

WIDTH=$(sips -g pixelWidth "$SOURCE" 2>/dev/null | awk '/pixelWidth/ { print $2 }')
HEIGHT=$(sips -g pixelHeight "$SOURCE" 2>/dev/null | awk '/pixelHeight/ { print $2 }')

if [[ -z "$WIDTH" || -z "$HEIGHT" ]]; then
  echo "Error: no se pudo leer dimensiones de $SOURCE" >&2
  exit 1
fi

if [[ "$WIDTH" -lt "$MIN_WIDTH" ]]; then
  echo "Error: ancho ${WIDTH}px < mínimo ${MIN_WIDTH}px." >&2
  echo "Vuelve a capturar la ventana de Bob en resolución nativa (Cmd+Shift+4 → Espacio → ventana)." >&2
  exit 1
fi

# Normaliza a PNG verdadero (algunas capturas vienen como JPEG con extensión .png)
sips -s format png "$SOURCE" --out "$DEST" >/dev/null

echo "OK: $DEST_NAME (${WIDTH}×${HEIGHT} px) → $DEST"
