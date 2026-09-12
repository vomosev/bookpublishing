#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${RUNTIME_LOG_DIR:-${PROJECT_ROOT}/logs}"
PID_FILE="${LOG_DIR}/server.pid"
LOG_FILE="${LOG_DIR}/server.log"

mkdir -p "$LOG_DIR"
cd "$PROJECT_ROOT"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or is not available in PATH." >&2
  exit 1
fi

if [[ -f "$PID_FILE" ]]; then
  existing_pid="$(cat "$PID_FILE" 2>/dev/null || true)"

  if [[ "$existing_pid" =~ ^[0-9]+$ ]] && kill -0 "$existing_pid" 2>/dev/null; then
    echo "Bookpublishing API is already running with PID ${existing_pid}."
    exit 0
  fi

  rm -f "$PID_FILE"
fi

{
  printf '\n[%s] Starting Bookpublishing API\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
} >>"$LOG_FILE"

nohup npm run server >>"$LOG_FILE" 2>&1 </dev/null &
api_pid=$!

printf '%s\n' "$api_pid" >"$PID_FILE"

sleep 1

if ! kill -0 "$api_pid" 2>/dev/null; then
  rm -f "$PID_FILE"
  echo "Error: Bookpublishing API failed to start. Review ${LOG_FILE}." >&2
  exit 1
fi

disown "$api_pid" 2>/dev/null || true

echo "Bookpublishing API started with PID ${api_pid}."
echo "Output is being written to ${LOG_FILE}."