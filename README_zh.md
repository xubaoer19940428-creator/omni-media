# 🎬 多平台视频去水印下载工具

<div align="center">

[ English ](README.md) | [ 简体中文 ](README_zh.md)

</div>

一个功能强大的多平台视频去水印工具，正式识别并处理 **22 个主流平台**的公开链接。

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Web%20App-green?logo=flask&logoColor=white)
![yt-dlp](https://img.shields.io/badge/yt--dlp-Powered-red?logo=youtube&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

</div>

## ✨ 功能特性

- 🌐 **多平台支持** - 一站式识别 22 个主流视频平台
- 🔗 **智能解析** - 支持各种分享链接格式，直接粘贴分享文本即可
- 🎬 **无水印下载** - 获取高质量无水印视频（抖音去 Logo）
- 📊 **信息提取** - 获取视频标题、作者、时长、点赞等数据
- 🎨 **现代界面** - 精密工具台风格的响应式 Web 界面
- ⚡ **快速处理** - 高效的视频解析和下载
- 📱 **移动适配** - 完美支持手机和桌面设备
- 🖼️ **图片代理** - 解决 Instagram 等平台封面图跨域加载问题

## 🌍 支持平台

| 平台         | 解析 | 下载 | 无水印 | 备注                 |
| ------------ | :--: | :--: | :----: | -------------------- |
| 🎶 抖音      |  ✅  |  ✅  |   ✅   | 支持直接粘贴分享文本 |
| 🎵 TikTok    |  ✅  |  ✅  |   ✅   | 支持完整链接和短链接 |
| ✈️ Telegram  |  ✅  |  ✅  |   -    | 支持公开频道视频帖子 |
| 📸 Instagram |  ✅  |  ✅  |   -    | 支持 Post 和 Reel    |
| 🎬 YouTube   |  ✅  |  ✅  |   -    | 支持视频和 Shorts    |
| 🐦 Twitter/X |  ✅  |  ✅  |   -    | 支持推文视频         |
| 📘 Facebook  |  ✅  |  ✅  |   -    | 支持公开视频         |
| 📺 B站       |  ✅  |  ✅  |   -    | 支持普通视频         |
| 🔴 微博      |  ✅  |  ✅  |   -    | 支持视频微博         |
| 🤖 Reddit    |  ✅  |  ✅  |   -    | 支持公开帖子视频     |
| 🎞️ Vimeo    |  ✅  |  ✅  |   -    | 支持公开独立视频     |
| ▶️ Dailymotion | ✅ | ✅ | - | 支持公开视频 |
| 🟣 Twitch    |  ✅  |  ✅  |   -    | 支持直播、VOD、Clip  |
| 📌 Pinterest |  ✅  |  ✅  |   -    | 支持公开视频 Pin     |
| 📝 Tumblr    |  ✅  |  ✅  |   -    | 支持公开帖子视频     |
| 🟢 Rumble    |  ✅  |  ✅  |   -    | 支持公开视频         |
| 📕 小红书    |  ✅  |  ✅  |   -    | 支持公开笔记视频     |
| 📺 AcFun     |  ✅  |  ✅  |   -    | 支持视频和番剧       |
| 🎬 优酷      |  ✅  |  ✅  |   -    | 支持公开视频         |
| 📽️ 爱奇艺   |  ✅  |  ✅  |   -    | 支持公开视频         |
| 🐧 腾讯视频  |  ✅  |  ✅  |   -    | 支持 v.qq.com 视频   |
| 🍉 西瓜视频  |  ✅  |  ✅  |   -    | 支持公开视频         |

*付费、私密、登录后、地区限制或 DRM 保护内容不保证可解析，也不会尝试绕过访问限制。*

## 🚀 快速开始

### 环境要求

- Python 3.10+（推荐使用与 Docker 镜像一致的 Python 3.12）
- pip

### 安装步骤

1. **克隆项目**

   ```bash
   git clone https://github.com/xubaoer19940428-creator/remove-watermark.git
   cd remove-watermark
   ```

2. **创建虚拟环境（推荐）**

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # macOS/Linux
   # 或 .\venv\Scripts\activate  # Windows
   ```

3. **安装依赖**

   ```bash
   pip install -r requirements.txt
   ```

4. **运行应用**

   ```bash
   python app.py
   ```

5. **访问应用**
   打开浏览器访问 `http://localhost:7860`

### 一键启动（macOS/Linux）

```bash
./start.sh
```

### 一键启动（Windows）

```bash
start.bat
```

## 📖 使用说明

### 基本使用

1. **复制视频链接** — 在任意支持的平台复制视频分享链接
2. **粘贴并解析** — 将链接（或完整分享文本）粘贴到输入框，点击"解析"
3. **查看视频信息** — 系统显示封面、标题、作者、统计数据
4. **下载视频** — 点击"下载无水印视频"进行下载

### 支持的链接格式

**抖音** — 直接粘贴分享文本即可：

```
2.84 04/14 Vlp:/ P@X.ZZ 标题... https://v.douyin.com/xxxxx/ 复制此链接...
```

**TikTok：**

```
https://www.tiktok.com/@username/video/1234567890
https://vm.tiktok.com/xxxxx/
```

**Telegram（公开频道帖子）：**

```
https://t.me/channel_name/12345
https://t.me/s/channel_name/12345
```

*私密群组、私聊以及需要登录才能查看的内容不受支持。*

**YouTube：**

```
https://www.youtube.com/watch?v=xxxxx
https://youtu.be/xxxxx
https://www.youtube.com/shorts/xxxxx
```

**Instagram / Twitter / Facebook / B站 / 微博** — 直接粘贴视频链接即可。

## 🛠️ 技术架构

### 后端

| 技术              | 用途                         |
| ----------------- | ---------------------------- |
| **Flask**         | Web 框架                     |
| **yt-dlp**        | 多平台视频解析/下载引擎      |
| **curl_cffi**     | 浏览器兼容请求与抖音页面访问 |
| **requests**      | HTTP 请求 / 图片代理         |

### 前端

| 技术                | 用途               |
| ------------------- | ------------------ |
| **Font Awesome**    | 图标库             |
| **原生 JavaScript** | 交互逻辑           |
| **CSS3 动画**       | 加载动画和过渡效果 |

### 核心模块

```
remove-watermark/
├── app.py                    # Flask 应用主文件，API 路由
├── universal_downloader.py   # 🌐 通用下载器（多平台核心）
├── requirements.txt          # Python 依赖
├── README.md                 # 项目说明（英文，默认主页）
├── README_zh.md              # 项目说明（中文）
├── start.sh / start.bat      # 一键启动脚本
├── templates/
│   └── index.html            # 主页面模板
├── static/
│   ├── css/
│   │   └── style.css         # 样式文件
│   └── js/
│       └── app.js            # 前端交互逻辑
└── downloads/                # 下载文件目录（自动创建）
```

## 🔍 API 接口

### 解析视频链接

```http
POST /api/parse
Content-Type: application/json

{
    "url": "视频链接或分享文本"
}
```

**响应示例：**

```json
{
  "success": true,
  "platform": "douyin",
  "platform_name": "抖音",
  "video_id": "7589158631908658458",
  "video_info": {
    "title": "视频标题...",
    "author": "作者名",
    "video_url": "https://...",
    "cover_url": "https://...",
    "duration": 233,
    "like_count": 44150,
    "comment_count": 4466,
    "view_count": 8241
  },
  "has_download_url": true
}
```

### 下载视频

```http
POST /api/download
Content-Type: application/json

{
    "video_id": "视频ID",
    "original_url": "原始链接",
    "platform": "平台标识"
}
```

### 图片代理

```http
GET /api/proxy-image?url=图片URL
```

解决 Instagram 等平台封面图的跨域加载问题。

### 获取支持平台列表

```http
GET /api/platforms
```

## 🔧 配置说明

应用默认监听 `7860` 端口，常用配置可以通过环境变量覆盖：

```bash
PORT=7860
DOWNLOAD_DIR=downloads
MAX_DOWNLOAD_BYTES=536870912
DOWNLOAD_TTL_SECONDS=3600
CLEANUP_INTERVAL_SECONDS=60
HTTP_CONNECT_TIMEOUT=10
HTTP_READ_TIMEOUT=30
DOWNLOAD_HTTP_TIMEOUT=300
GUNICORN_THREADS=8
LOG_LEVEL=INFO
```

本地运行时会在检测到 Chrome 用户配置后自动使用浏览器 cookies。服务器部署时默认不会尝试读取不存在的浏览器配置；如公开内容确实需要 cookies，可设置 `YTDLP_COOKIE_FILE=/path/to/cookies.txt`。也可以通过 `YTDLP_COOKIES_FROM_BROWSER=chrome` 显式选择浏览器，或设置为 `off` 禁用自动检测。

在 Railway 等只通过可信反向代理访问的环境中，可设置 `TRUST_PROXY=true`，让限流正确识别客户端地址并识别 HTTPS。请勿在应用还能被客户端直接访问时启用此选项。

## 🐛 常见问题

### Q: 抖音解析失败？

**A:** 工具使用移动端页面解析方式。如果失败，请确认依赖已经完整安装：

```bash
pip install curl_cffi
```

### Q: 抖音下载很慢？

**A:** 无水印版视频是高清原画，文件较大（可达几百MB），下载需要一定时间，这是正常的。

### Q: TikTok 短链接解析失败？

**A:** TikTok 反爬虫机制较严格，建议使用完整链接格式（`https://www.tiktok.com/@username/video/xxx`）。

### Q: Instagram 封面图不显示？

**A:** 工具内置了图片代理服务，会自动通过服务端代理加载封面图。

### Q: YouTube 视频无法下载？

**A:** 先按项目锁定的兼容版本重新安装依赖：

```bash
pip install --upgrade -r requirements.txt
```

### Q: 如何部署到服务器？

**A:** 推荐使用 Gunicorn 部署：

```bash
pip install gunicorn
gunicorn -w 1 --threads 8 -b 0.0.0.0:7860 app:app
```

## 🛡️ 注意事项

1. ⚖️ **合法使用** — 请遵守相关法律法规，仅用于个人学习和研究
2. ©️ **版权尊重** — 尊重原创作者的版权，不要用于商业用途
3. 🌐 **网络环境** — 确保网络连接稳定，部分平台可能需要特殊网络环境
4. 💾 **存储空间** — 注意磁盘空间，及时清理下载文件
5. 🔄 **保持更新** — 定期更新 yt-dlp 以确保各平台兼容性

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**免责声明**: 本工具仅供学习和研究使用。使用者需自行承担使用风险，开发者不对因使用本工具而产生的任何法律责任负责。请尊重内容创作者的权益。
