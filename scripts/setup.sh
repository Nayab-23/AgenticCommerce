#!/bin/bash

# Setup script for Agentic LLM Router

echo "🚀 Setting up Agentic LLM Router..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

# Build shared package first
echo ""
echo "🔨 Building shared package..."
cd shared
npm install
npm run build
cd ..

# Install backend dependencies
echo ""
echo "📦 Installing router-backend dependencies..."
cd router-backend
npm install
cd ..

# Install provider-wrappers dependencies
echo ""
echo "📦 Installing provider-wrappers dependencies..."
cd provider-wrappers
npm install
cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Setup environment files
echo ""
echo "⚙️  Setting up environment files..."

if [ ! -f "router-backend/.env" ]; then
    cp router-backend/.env.example router-backend/.env
    echo "✓ Created router-backend/.env"
fi

if [ ! -f "provider-wrappers/.env" ]; then
    cp provider-wrappers/.env.example provider-wrappers/.env
    echo "✓ Created provider-wrappers/.env"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the system:"
echo "  npm run dev"
echo ""
echo "Or start services individually:"
echo "  cd router-backend && npm run dev"
echo "  cd provider-wrappers && npm run dev"
echo "  cd frontend && npm run dev"
echo ""
echo "Frontend will be available at: http://localhost:5173"
echo "Router API at: http://localhost:3000"
echo "Gemini Provider at: http://localhost:4001"
echo "Claude Provider at: http://localhost:4002"
echo ""
