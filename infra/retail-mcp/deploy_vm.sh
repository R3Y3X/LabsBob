#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Uso: $0 <usuario@host> <ssh-key.pem> <mesa 1|2|3> <env-local>" >&2
  exit 2
}
[ "$#" -eq 4 ] || usage
SSH_HOST="$1"
SSH_KEY="$2"
TABLE="$3"
ENV_FILE="$4"
[[ "$TABLE" =~ ^[123]$ ]] || usage
[ -f "$SSH_KEY" ] || { echo "No existe la clave: $SSH_KEY" >&2; exit 1; }
[ -f "$ENV_FILE" ] || { echo "No existe el env: $ENV_FILE" >&2; exit 1; }
chmod 600 "$SSH_KEY" 2>/dev/null || true

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE_DIR="/tmp/retail-mcp-deploy-mesa-$TABLE"
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
TMP_ENV="$(mktemp)"
trap 'rm -f "$TMP_ENV"' EXIT
{
  printf 'WORKSHOP_TABLE=%s\n' "$TABLE"
  grep -vE '^[[:space:]]*WORKSHOP_TABLE[[:space:]]*=' "$ENV_FILE" || true
} > "$TMP_ENV"
ssh "${SSH_OPTS[@]}" "$SSH_HOST" "rm -rf '$REMOTE_DIR' && mkdir -p '$REMOTE_DIR'"
scp "${SSH_OPTS[@]}" "$SCRIPT_DIR/server.py" "$SCRIPT_DIR/requirements.txt" "$SCRIPT_DIR/retail-mcp.service" "$SCRIPT_DIR/install.sh" "$SCRIPT_DIR/.env.example" "$SSH_HOST:$REMOTE_DIR/"
scp "${SSH_OPTS[@]}" "$TMP_ENV" "$SSH_HOST:$REMOTE_DIR/retail-mcp.env"
ssh "${SSH_OPTS[@]}" "$SSH_HOST" "sudo bash '$REMOTE_DIR/install.sh' && sudo install -o root -g retail-mcp -m 0640 '$REMOTE_DIR/retail-mcp.env' /etc/retail-mcp/retail-mcp.env && sudo systemctl restart retail-mcp.service"
PUBLIC_HOST="${SSH_HOST#*@}"
echo "MCP desplegado en $SSH_HOST para Mesa $TABLE. Verifica: curl -k https://$PUBLIC_HOST/retail-mcp/health"
