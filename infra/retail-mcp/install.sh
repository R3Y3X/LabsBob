#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/opt/retail-mcp
ENV_DIR=/etc/retail-mcp
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

id retail-mcp >/dev/null 2>&1 || useradd --system --home-dir "$APP_DIR" --shell /usr/sbin/nologin retail-mcp
install -d -o retail-mcp -g retail-mcp "$APP_DIR" "$ENV_DIR"
install -o retail-mcp -g retail-mcp "$SCRIPT_DIR/server.py" "$APP_DIR/server.py"
install -o retail-mcp -g retail-mcp "$SCRIPT_DIR/requirements.txt" "$APP_DIR/requirements.txt"
python3 -m venv "$APP_DIR/.venv"
"$APP_DIR/.venv/bin/pip" install --disable-pip-version-check -r "$APP_DIR/requirements.txt"
if [ ! -f "$ENV_DIR/retail-mcp.env" ]; then
  install -o root -g retail-mcp -m 0640 "$SCRIPT_DIR/.env.example" "$ENV_DIR/retail-mcp.env"
  echo "Edit $ENV_DIR/retail-mcp.env with the VM's ksqlDB credentials before starting the service."
fi
install -o root -g root -m 0644 "$SCRIPT_DIR/retail-mcp.service" /etc/systemd/system/retail-mcp.service
systemctl daemon-reload
systemctl enable retail-mcp.service
systemctl restart retail-mcp.service
systemctl --no-pager --full status retail-mcp.service || true
