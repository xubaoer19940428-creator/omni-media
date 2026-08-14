@echo off
chcp 65001 >nul

echo 🎬 抖音视频去水印工具
echo ========================

REM 检查Python版本
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Python，请先安装Python 3.10+
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set python_version=%%i
echo ✅ Python版本: %python_version%

python -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: Python版本过低，请安装Python 3.10+
    pause
    exit /b 1
)

REM 检查是否已安装依赖
if not exist "requirements.txt" (
    echo ❌ 错误: 未找到requirements.txt文件
    pause
    exit /b 1
)

REM 安装依赖
echo 📦 安装Python依赖...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败，请检查网络连接或手动安装
    pause
    exit /b 1
)

echo ✅ 依赖安装完成

REM 创建下载目录
if not exist "downloads" (
    mkdir downloads
    echo 📁 创建下载目录: downloads\
)

REM 启动应用
echo 🚀 启动Web应用...
echo 📍 访问地址: http://localhost:7860
echo 🛑 按 Ctrl+C 停止服务
echo.

python app.py

pause
