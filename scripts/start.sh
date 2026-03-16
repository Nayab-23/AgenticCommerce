#!/bin/bash

# Quick start script - runs all services concurrently

echo "🚀 Starting Agentic Commerce..."
echo ""
echo "Services:"
echo "  - Router Backend: http://localhost:3000"
echo "  - Gemini Provider: http://localhost:4001"
echo "  - Claude Provider: http://localhost:4002"
echo "  - OpenAI Provider: http://localhost:4003"
echo "  - Frontend UI: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

npm run dev
