#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="${1:-$SCRIPT_DIR/workshop-config.env}"
[ -f "$CONFIG_FILE" ] || { echo "No existe $CONFIG_FILE" >&2; exit 1; }
# shellcheck disable=SC1090
source "$CONFIG_FILE"
: "${RETAIL_MCP_URL:?Falta RETAIL_MCP_URL}"
: "${RETAIL_MCP_TOOLKIT_NAME:?Falta RETAIL_MCP_TOOLKIT_NAME}"

orchestrate toolkits add \
  --kind mcp \
  --name "$RETAIL_MCP_TOOLKIT_NAME" \
  --description "Voltia $WORKSHOP_ID — disponibilidad de inventario" \
  --url "$RETAIL_MCP_URL" \
  --transport streamable_http \
  --tools get_sku_availability
orchestrate toolkits list
