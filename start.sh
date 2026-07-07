#!/bin/bash

# Terminate background processes on exit
cleanup() {
    echo -e "\n\033[0;31mStopping LeetMap...\033[0m"
    kill "$BACKEND_PID" 2>/dev/null
    kill "$FRONTEND_PID" 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "\033[0;32m🚀 Starting LeetMap...\033[0m"

# 1. Start Python backend
echo -e "\033[0;34m[1/2] Launching FastAPI backend on port 5001...\033[0m"
cd backend
python3 -m uvicorn app:app --port 5001 --host 0.0.0.0 > /dev/null 2>&1 &
BACKEND_PID=$!
cd ..

# Give backend a moment to boot
sleep 1.5

# Check if backend running
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo -e "\033[0;31mError: Flask backend failed to start. Check backend files or port 5001.\033[0m"
    exit 1
fi
echo -e "\033[0;32m✓ Backend is active (PID: $BACKEND_PID)\033[0m"

# 2. Start Vite frontend
echo -e "\033[0;34m[2/2] Launching React Vite frontend...\033[0m"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "\033[0;32m✓ Frontend is active (PID: $FRONTEND_PID)\033[0m"
echo -e "\033[0;36m===================================================\033[0m"
echo -e "\033[0;36m  App is running! Open http://localhost:5173\033[0m"
echo -e "\033[0;36m  Press Ctrl+C to terminate both servers.\033[0m"
echo -e "\033[0;36m===================================================\033[0m"

# Keep script alive
wait
