#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STEP=all
CLEANUP=false
while [ "$#" -gt 0 ]; do
  case "$1" in
    -s) STEP="$2"; shift 2 ;;
    -c) CLEANUP=true; shift ;;
    -h|--help) echo "Uso: $0 [-s 1|2|3|all] [-c]"; exit 0 ;;
    *) echo "Argumento no reconocido: $1" >&2; exit 2 ;;
  esac
done

run_step() { "$SCRIPT_DIR/run_in_cluster.sh" "$1"; }
if [ "$CLEANUP" = true ]; then run_step delete_topics; fi
case "$STEP" in
  1) run_step create_topic ;;
  2) run_step create_derived_topic ;;
  3) run_step produce_messages ;;
  all) run_step create_topic; run_step register_schema; run_step create_derived_topic; run_step produce_messages ;;
  *) echo "STEP debe ser 1, 2, 3 o all" >&2; exit 2 ;;
esac
echo "Pipeline listo para el workspace configurado en .env"
