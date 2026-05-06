#!/bin/bash

# DreamBeesArt Port Cleanup Utility
# This script identifies and terminates ghost Node.js processes hanging on dev ports.

PORTS=(3000 3001 3002 3003 3004 3005)

echo "🐝 [DreamBees] Scanning for ghost processes on ports ${PORTS[*]}..."

for PORT in "${PORTS[@]}"; do
  PID=$(lsof -ti:$PORT)
  if [ ! -z "$PID" ]; then
    echo "🚨 Found process $PID on port $PORT. Terminating..."
    kill -9 $PID 2>/dev/null
    echo "✅ Port $PORT is now clear."
  fi
done

# Also kill any orphaned 'next-dev' processes that might not be bound to a port yet
ORPHANS=$(pgrep -f "next-dev" | grep -v $$)
if [ ! -z "$ORPHANS" ]; then
  echo "🚨 Found orphaned next-dev processes: $ORPHANS. Terminating..."
  echo "$ORPHANS" | xargs kill -9 2>/dev/null
  echo "✅ Orphaned processes cleared."
fi

echo "✨ [DreamBees] Port cleanup complete. Ready for 'next dev'."
