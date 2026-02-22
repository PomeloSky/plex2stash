#!/bin/sh
set -e

echo "=== Plex2Stash Starting ==="
echo "DATA_DIR: ${DATA_DIR:-/data}"
echo "API PORT: ${PORT:-8787}"

# Ensure data directory exists
mkdir -p "${DATA_DIR:-/data}"

# Start API server in the background
cd /app/apps/api
node dist/index.js &
API_PID=$!

# Start Next.js web UI
cd /app/apps/web-standalone
PORT=3000 HOSTNAME=0.0.0.0 node apps/web/server.js &
WEB_PID=$!

echo "=== API running (PID: $API_PID) on port ${PORT:-8787} ==="
echo "=== Web running (PID: $WEB_PID) on port 3000 ==="

# Wait for any process to exit
wait -n $API_PID $WEB_PID

# Exit with the status of the process that exited first
exit $?
