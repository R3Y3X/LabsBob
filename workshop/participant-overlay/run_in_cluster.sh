#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="${1:?uso: $0 <script_basename>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_ENV="$(cd "$SCRIPT_DIR/../.." && pwd)/.env"
ENV_FILE="${ENV_FILE:-$ROOT_ENV}"
[ -f "$ENV_FILE" ] || { echo "No existe .env: $ENV_FILE" >&2; exit 1; }
[ -f "$SCRIPT_DIR/$SCRIPT_NAME.py" ] || { echo "No existe $SCRIPT_DIR/$SCRIPT_NAME.py" >&2; exit 1; }

get_value() { awk -F= -v key="$1" '$1 == key {sub(/^[^=]*=/, ""); gsub(/^ | $/, ""); gsub(/^"|"$/, ""); print; exit}' "$ENV_FILE"; }
SSH_HOST="${SSH_HOST:-$(get_value SSH_HOST)}"
SSH_KEY="${SSH_KEY:-$(get_value SSH_KEY)}"
WORKSHOP_ID="${WORKSHOP_ID:-$(get_value WORKSHOP_ID)}"
[ -n "$SSH_HOST" ] || { echo "Falta SSH_HOST" >&2; exit 1; }
[ -n "$SSH_KEY" ] || { echo "Falta SSH_KEY" >&2; exit 1; }
[ -n "$WORKSHOP_ID" ] || { echo "Falta WORKSHOP_ID" >&2; exit 1; }
if [ "${SSH_KEY#/}" = "$SSH_KEY" ] && [ ! -f "$SSH_KEY" ]; then SSH_KEY="$(cd "$(dirname "$ENV_FILE")" && pwd)/$SSH_KEY"; fi
[ -f "$SSH_KEY" ] || { echo "No existe la clave SSH: $SSH_KEY" >&2; exit 1; }
chmod 600 "$SSH_KEY" 2>/dev/null || true

REMOTE_DIR="/root/inventory-pipeline-$WORKSHOP_ID"
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
TMP_ENV="$(mktemp)"
trap 'rm -f "$TMP_ENV"' EXIT
sed -E '/^[[:space:]]*(SSH_HOST|SSH_KEY)[[:space:]]*=/d' "$ENV_FILE" > "$TMP_ENV"
ssh "${SSH_OPTS[@]}" "$SSH_HOST" "mkdir -p '$REMOTE_DIR'"
scp "${SSH_OPTS[@]}" "$TMP_ENV" "$SSH_HOST:$REMOTE_DIR/.env"
scp "${SSH_OPTS[@]}" "$SCRIPT_DIR/$SCRIPT_NAME.py" "$SSH_HOST:$REMOTE_DIR/$SCRIPT_NAME.py"
scp "${SSH_OPTS[@]}" "$SCRIPT_DIR/run_in_cluster_remote.sh" "$SSH_HOST:$REMOTE_DIR/run_in_cluster_remote.sh"
ssh "${SSH_OPTS[@]}" "$SSH_HOST" "chmod +x '$REMOTE_DIR/run_in_cluster_remote.sh' && bash '$REMOTE_DIR/run_in_cluster_remote.sh' '$SCRIPT_NAME'"
