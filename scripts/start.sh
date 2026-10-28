#!/bin/bash
echo "=================================================="
echo "    ♟️  STARTING OMNICHESS AI LOCAL WORKSTATION    "
echo "=================================================="

# Check if backend venv exists
if [ -d "backend/venv" ]; then
  echo "[+] Starting local FastAPI Coach service on port 8000..."
  source backend/venv/bin/activate
  python3 backend/main.py &
  BACKEND_PID=$!
  echo "[+] Backend PID: $BACKEND_PID"
fi

echo "[+] Launching Vite Cinematic Frontend on http://localhost:5173..."
npm run dev

# Cleanup when user stops frontend
if [ ! -z "$BACKEND_PID" ]; then
  kill $BACKEND_PID
fi

