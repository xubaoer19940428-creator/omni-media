#!/bin/bash

# 抖音视频去水印工具启动脚本

echo "🎬 抖音视频去水印工具"
echo "========================"

# 检查Python版本
python_version=$(python3 --version 2>&1)
if [[ $? -ne 0 ]]; then
    echo "❌ 错误: 未找到Python3，请先安装Python 3.10+"
    exit 1
fi

echo "✅ Python版本: $python_version"

if ! python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)'; then
    echo "❌ 错误: Python版本过低，请安装Python 3.10+"
    exit 1
fi

# 检查是否已安装依赖
if [ ! -f "requirements.txt" ]; then
    echo "❌ 错误: 未找到requirements.txt文件"
    exit 1
fi

# 检查虚拟环境是否存在
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ 虚拟环境创建失败"
        exit 1
    fi
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📦 安装Python依赖..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败，请检查网络连接或手动安装"
    exit 1
fi

echo "✅ 依赖安装完成"

# 创建下载目录
if [ ! -d "downloads" ]; then
    mkdir downloads
    echo "📁 创建下载目录: downloads/"
fi

# 启动应用
echo "🚀 启动Web应用..."
echo "📍 访问地址: http://localhost:7860"
echo "🛑 按 Ctrl+C 停止服务"
echo ""

python app.py
