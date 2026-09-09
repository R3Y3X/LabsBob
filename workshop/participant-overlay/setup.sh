#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STEP=all
CLEANUP=false
while [ "$#" -gt 0 ]; do
  case "$1" in
    -s) STEP="$2"; shift 2 ;;
    -c) CLEANUP=true; shift ;;
    -h|--help) echo "Uso: $0 [-s 1|2|3|4|all] [-c]   # -s 2: ensure ksql SR + CTAS; -s 3 produce + ksql fallback si el sink está vacío"; exit 0 ;;
    *) echo "Argumento no reconocido: $1" >&2; exit 2 ;;
  esac
done

run_step() { "$SCRIPT_DIR/run_in_cluster.sh" "$1"; }
if [ "$CLEANUP" = true ]; then run_step delete_topics; fi
case "$STEP" in
  1) run_step create_topic; run_step register_schema ;;
  2) run_step ensure_ksql_sr; run_step create_derived_topic ;;
  3) run_step produce_messages; run_step materialize_availability ;;
  4) run_step submit_flink ;;
  all) run_step create_topic; run_step register_schema; run_step ensure_ksql_sr; run_step create_derived_topic; run_step submit_flink; run_step produce_messages; run_step materialize_availability ;;
  *) echo "STEP debe ser 1, 2, 3, 4 o all" >&2; exit 2 ;;
esac
echo "Pipeline listo para el workspace configurado en .env"
