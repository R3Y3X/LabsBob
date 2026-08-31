#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="${1:?uso: $0 <script_basename>}"
WORKDIR="$(cd "$(dirname "$0")" && pwd)"
ENV_PATH="$WORKDIR/.env"
source "$ENV_PATH"
NS="${NAMESPACE:-confluent}"
SAFE_ID="${WORKSHOP_ID//[^a-zA-Z0-9-]/-}"
JOB="${SCRIPT_NAME//_/-}-${SAFE_ID}-job"
[ -f "$WORKDIR/$SCRIPT_NAME.py" ] || { echo "missing script: $WORKDIR/$SCRIPT_NAME.py"; exit 1; }

kubectl -n "$NS" delete configmap "$JOB" --ignore-not-found >/dev/null
kubectl -n "$NS" create configmap "$JOB" --from-file=app.py="$WORKDIR/$SCRIPT_NAME.py" --from-file=.env="$ENV_PATH" >/dev/null
kubectl -n "$NS" delete job "$JOB" --ignore-not-found >/dev/null
cat <<MANIFEST | kubectl apply -f - >/dev/null
apiVersion: batch/v1
kind: Job
metadata:
  name: $JOB
  namespace: $NS
spec:
  backoffLimit: 0
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: app
        image: python:3.11-slim
        workingDir: /app
        command: ["bash", "-c"]
        args:
        - |
          set -e
          pip install --quiet --no-input confluent-kafka python-dotenv requests
          python app.py
        volumeMounts:
        - name: code
          mountPath: /app
      volumes:
      - name: code
        configMap:
          name: $JOB
MANIFEST

POD=""
for _ in $(seq 1 60); do POD="$(kubectl -n "$NS" get pods -l job-name="$JOB" -o jsonpath="{.items[0].metadata.name}" 2>/dev/null || true)"; [ -n "$POD" ] && break; sleep 1; done
[ -n "$POD" ] || { echo "pod did not appear for $JOB"; exit 1; }
kubectl -n "$NS" wait --for=condition=Ready pod/"$POD" --timeout=300s 2>/dev/null || true
kubectl -n "$NS" logs -f "$POD" || true
EXIT=""
for _ in $(seq 1 30); do EXIT="$(kubectl -n "$NS" get pod "$POD" -o jsonpath="{.status.containerStatuses[0].state.terminated.exitCode}" 2>/dev/null || true)"; [ -n "$EXIT" ] && break; sleep 1; done
[ "${EXIT:-1}" -eq 0 ] || { echo "ERROR: pod $POD exited with code ${EXIT:-unknown}"; exit 1; }
echo "OK: $SCRIPT_NAME ($WORKSHOP_ID)"
