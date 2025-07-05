#!/bin/bash

echo "🚀 Starting Sandbox AI Coding Agent Demo"
echo "==========================================="

# Start the development server in the background
echo "📡 Starting Next.js development server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test the API
echo "🧪 Testing job scheduling..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -d '{"task":"Build me a simple React todo app with Tailwind CSS"}')

echo "📝 Response: $RESPONSE"

# Extract job ID (simple approach for demo)
JOB_ID=$(echo $RESPONSE | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$JOB_ID" ]; then
    echo "✅ Job scheduled successfully! Job ID: $JOB_ID"
    echo "🔍 Checking job status..."
    
    # Check status a few times
    for i in {1..3}; do
        sleep 3
        echo "🔄 Status check $i..."
        curl -s "http://localhost:3000/api/status/$JOB_ID" | jq '.' 2>/dev/null || curl -s "http://localhost:3000/api/status/$JOB_ID"
        echo ""
    done
else
    echo "❌ Failed to schedule job"
fi

echo "🛑 Stopping development server..."
kill $SERVER_PID

echo "✨ Demo completed!"
echo ""
echo "To access the web interface:"
echo "- Main app: http://localhost:3000"
echo "- VNC web client (when container is running): http://localhost:6080"
echo "- Jupyter notebook (when container is running): http://localhost:8888"
