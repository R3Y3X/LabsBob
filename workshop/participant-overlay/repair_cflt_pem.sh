#!/usr/bin/env bash
# Normalize a TechZone OpenSSH PEM for macOS/Linux OpenSSH. Never prints the key.
# No python3: paste-from-TechZone often has CRLF or non-standard wrap (70 vs 76).
set -euo pipefail

PEM="${1:-}"
if [[ -z "$PEM" ]]; then
  PEM="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cflt-vsi-key.pem"
fi

fail() { echo "ERROR: $*" >&2; exit 1; }

[[ -f "$PEM" ]] || fail "no existe $PEM — créalo con BEGIN/END, guárdalo (Cmd+S) y no lo pegues en el chat."
[[ -s "$PEM" ]] || fail "el PEM está vacío (0 bytes). Pega BEGIN→END, guarda el archivo y reintenta. No lo pegues en el chat."
command -v ssh-keygen >/dev/null || fail "ssh-keygen no está en PATH."

BEGIN="-----BEGIN OPENSSH PRIVATE KEY-----"
END="-----END OPENSSH PRIVATE KEY-----"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

# Strip UTF-8 BOM, CRLF/CR → LF, trim spaces. Collect base64 body.
# LC_ALL=C so tr/od behave the same on macOS and Linux.
{
  if [[ "$(od -An -N3 -tx1 "$PEM" 2>/dev/null | tr -d ' \n')" == "efbbbf" ]]; then
    tail -c +4 "$PEM"
  else
    cat "$PEM"
  fi
} | tr -d '\r' | sed 's/[[:space:]]*$//' | awk -v begin="$BEGIN" -v end="$END" '
  BEGIN { started = 0; body = "" }
  {
    line = $0
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
    if (line == "") next
    if (line == begin) { started = 1; next }
    if (line == end) { started = 2; next }
    if (started == 1) body = body line
  }
  END {
    if (started != 2) {
      print "MISSING_MARKERS" > "/dev/stderr"
      exit 1
    }
    if (body == "") {
      print "EMPTY_BODY" > "/dev/stderr"
      exit 1
    }
    print body
  }
' > "$TMP.body" || fail "el archivo no tiene el bloque BEGIN/END OPENSSH PRIVATE KEY completo, o el cuerpo está vacío."

BODY="$(cat "$TMP.body")"
rm -f "$TMP.body"

write_wrapped() {
  local width="$1"
  local i=0
  local len=${#BODY}
  {
    printf '%s\n' "$BEGIN"
    while (( i < len )); do
      printf '%s\n' "${BODY:i:width}"
      i=$((i + width))
    done
    printf '%s\n' "$END"
  } > "$TMP"
  cat "$TMP" > "$PEM"
  chmod 600 "$PEM" || true
}

validate() {
  local out kind
  out="$(ssh-keygen -y -f "$PEM" 2>/dev/null)" || return 1
  kind="${out%% *}"
  [[ -n "$kind" ]] || return 1
  printf 'ok %s\n' "$kind"
}

write_wrapped 70
if validate; then
  exit 0
fi
write_wrapped 76
if validate; then
  exit 0
fi
fail "ssh-keygen sigue en invalid format. No regeneres la clave. Confirma BEGIN/END completos, guarda el archivo y reintenta."
