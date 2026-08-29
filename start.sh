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

# 检查虚拟环境是否存在且仍指向当前项目路径。
# venv 不能安全地跨目录复制；通过 pyvenv.cfg 检查 prefix 避免复用失效环境。
VENV_DIR="$(pwd)/venv"
VENV_PREFIX=""
if [ -x "$VENV_DIR/bin/python" ]; then
    VENV_PREFIX=$("$VENV_DIR/bin/python" -c 'import sys; print(sys.prefix)' 2>/dev/null || true)
fi
if [ ! -x "$VENV_DIR/bin/python" ] || [ "$VENV_PREFIX" != "$VENV_DIR" ]; then
    if [ -d "venv" ]; then
        echo "♻️ 检测到失效的虚拟环境，正在重建..."
        python3 -m venv --clear venv
    else
        echo "📦 创建虚拟环境..."
        python3 -m venv venv
    fi
    if [ $? -ne 0 ]; then
        echo "❌ 虚拟环境创建失败"
        exit 1
    fi
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

VENV_PYTHON="$VENV_DIR/bin/python"

# 安装依赖
echo "📦 安装Python依赖..."
"$VENV_PYTHON" -m pip install -r requirements.txt

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

"$VENV_PYTHON" app.py
