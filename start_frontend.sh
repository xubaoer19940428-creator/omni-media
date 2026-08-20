#!/bin/bash

# OmniMedia Next.js 前端启动脚本
echo "🚀 启动 OmniMedia Next.js 前端开发服务器..."
cd frontend || exit 1

if [ ! -d "node_modules" ]; then
    echo "📦 正在安装前端依赖..."
    pnpm install || npm install
fi

echo "📍 前端访问地址: http://localhost:3001"
echo "🛑 按 Ctrl+C 停止服务"
echo ""

pnpm run dev || npm run dev
