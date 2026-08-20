# 🎬 OmniMedia — Multi-Platform Video Downloader & Archiver

<div align="center">

[ English ](README.md) | [ 简体中文 ](README_zh.md)

</div>

**OmniMedia** is a powerful, lightweight multi-platform video downloader and archival tool that seamlessly recognizes and processes public links across **22 mainstream platforms**.

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Web%20App-green?logo=flask&logoColor=white)
![yt-dlp](https://img.shields.io/badge/yt--dlp-Powered-red?logo=youtube&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

</div>

## ✨ Features

- 🌐 **Multi-Platform Support** — One-stop recognition for 22 mainstream video platforms
- 🔗 **Smart Parsing** — Supports various share link formats; paste raw share text directly
- 🎬 **Watermark-Free Download** — Extract high-quality watermark-free videos (Douyin logo removal)
- 📊 **Metadata Extraction** — Retrieve title, author, duration, likes, comments, and view counts
- 🎨 **Modern Interface** — Precision workbench style responsive web UI
- ⚡ **High Performance** — Fast and efficient video parsing and downloading
- 📱 **Mobile Friendly** — Fully responsive for mobile and desktop screens
- 🖼️ **Image Proxy** — Resolves CORS image loading issues for Instagram and other platforms

## 🌍 Supported Platforms

| Platform             | Parse | Download | No Watermark | Note                                      |
| :------------------- | :---: | :------: | :----------: | :---------------------------------------- |
| 🎶 Douyin            |  ✅   |    ✅    |      ✅      | Supports pasting full share text directly |
| 🎵 TikTok            |  ✅   |    ✅    |      ✅      | Supports full URLs and short links        |
| ✈️ Telegram          |  ✅   |    ✅    |      -       | Supports public channel video posts       |
| 📸 Instagram         |  ✅   |    ✅    |      -       | Supports Posts and Reels                  |
| 🎬 YouTube           |  ✅   |    ✅    |      -       | Supports standard Videos and Shorts       |
| 🐦 Twitter/X         |  ✅   |    ✅    |      -       | Supports tweet videos                     |
| 📘 Facebook          |  ✅   |    ✅    |      -       | Supports public videos                    |
| 📺 Bilibili          |  ✅   |    ✅    |      -       | Supports standard public videos           |
| 🔴 Weibo             |  ✅   |    ✅    |      -       | Supports video posts                      |
| 🤖 Reddit            |  ✅   |    ✅    |      -       | Supports public post videos               |
| 🎞️ Vimeo             |  ✅   |    ✅    |      -       | Supports public standalone videos         |
| ▶️ Dailymotion       |  ✅   |    ✅    |      -       | Supports public videos                    |
| 🟣 Twitch            |  ✅   |    ✅    |      -       | Supports Live streams, VODs, and Clips    |
| 📌 Pinterest         |  ✅   |    ✅    |      -       | Supports public video Pins                |
| 📝 Tumblr            |  ✅   |    ✅    |      -       | Supports public post videos               |
| 🟢 Rumble            |  ✅   |    ✅    |      -       | Supports public videos                    |
| 📕 Xiaohongshu (RED) |  ✅   |    ✅    |      -       | Supports public video notes               |
| 📺 AcFun             |  ✅   |    ✅    |      -       | Supports public videos and bangumi        |
| 🎬 Youku             |  ✅   |    ✅    |      -       | Supports public videos                    |
| 📽️ iQIYI             |  ✅   |    ✅    |      -       | Supports public videos                    |
| 🐧 Tencent Video     |  ✅   |    ✅    |      -       | Supports v.qq.com public videos           |
| 🍉 Xigua Video       |  ✅   |    ✅    |      -       | Supports public videos                    |

_Paid, private, login-required, geo-restricted, or DRM-protected content is not guaranteed to be parsed and this tool will not attempt to bypass access restrictions._

## 🚀 Quick Start

### Requirements

- Python 3.10+ (Python 3.12 matching Docker image is recommended)
- pip

### Installation Steps

1. **Clone the repository**

    ```bash
    git clone https://github.com/xubaoer19940428-creator/omni-media.git
    cd omni-media
    ```

2. **Create virtual environment (recommended)**

    ```bash
    python3 -m venv venv
    source venv/bin/activate  # macOS/Linux
    # or .\venv\Scripts\activate  # Windows
    ```

3. **Install dependencies**

    ```bash
    pip install -r requirements.txt
    ```

4. **Run the application**

    ```bash
    python app.py
    ```

5. **Open in browser**
   Navigate to `http://localhost:7860`

### One-Click Launch (macOS/Linux)

```bash
./start.sh
```

### One-Click Launch (Windows)

```bash
start.bat
```

## 📖 Usage Guide

### Basic Usage

1. **Copy video link** — Copy share link from any supported platform.
2. **Paste & Parse** — Paste the URL (or full share text) into the input box and click "Parse".
3. **Inspect video metadata** — View cover image, title, author, and statistics.
4. **Download video** — Click "Download Watermark-Free Video" to save the file.

### Supported URL Formats

**Douyin** — Paste the raw share text directly:

```
2.84 04/14 Vlp:/ P@X.ZZ Title... https://v.douyin.com/xxxxx/ Copy this link...
```

**TikTok:**

```
https://www.tiktok.com/@username/video/1234567890
https://vm.tiktok.com/xxxxx/
```

**Telegram (Public channel posts):**

```
https://t.me/channel_name/12345
https://t.me/s/channel_name/12345
```

_Private groups, secret chats, and login-restricted posts are not supported._

**YouTube:**

```
https://www.youtube.com/watch?v=xxxxx
https://youtu.be/xxxxx
https://www.youtube.com/shorts/xxxxx
```

**Instagram / Twitter / Facebook / Bilibili / Weibo** — Paste the video URL directly.

## 🛠️ Architecture & Tech Stack

### Backend

| Technology    | Purpose                                                       |
| ------------- | ------------------------------------------------------------- |
| **Flask**     | Web framework and REST APIs                                   |
| **yt-dlp**    | Multi-platform video parsing and downloading engine           |
| **curl_cffi** | Browser-impersonated requests and Douyin mobile page scraping |
| **requests**  | General HTTP requests / Image proxying                        |

### Frontend

| Technology             | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| **Font Awesome**       | Iconography                               |
| **Vanilla JavaScript** | Client-side interaction logic             |
| **CSS3 Animations**    | Responsive layout and loading transitions |

### Directory Structure

```
omni-media/
├── app.py                    # Flask application entry point & API routes
├── universal_downloader.py   # 🌐 Universal downloader core (multi-platform)
├── requirements.txt          # Python dependencies
├── README.md                 # Project documentation (English, Default)
├── README_zh.md              # Project documentation (Chinese)
├── start.sh / start.bat      # One-click start scripts
├── templates/
│   └── index.html            # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css         # UI styles
│   └── js/
│       └── app.js            # Frontend JavaScript logic
└── downloads/                # Downloaded files cache directory (auto-created)
```

## 🔍 API Endpoints

### Parse Video URL

```http
POST /api/parse
Content-Type: application/json

{
    "url": "Video link or raw share text"
}
```

**Sample Response:**

```json
{
	"success": true,
	"platform": "douyin",
	"platform_name": "抖音",
	"video_id": "7589158631908658458",
	"video_info": {
		"title": "Video title...",
		"author": "Author name",
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

### Download Video

```http
POST /api/download
Content-Type: application/json

{
    "video_id": "video_id",
    "original_url": "original_url",
    "platform": "platform_name"
}
```

### Image Proxy

```http
GET /api/proxy-image?url=IMAGE_URL
```

Resolves CORS and referrer blocking for cover images (e.g. Instagram).

### List Supported Platforms

```http
GET /api/platforms
```

## 🔧 Configuration

The application listens on port `7860` by default. You can override settings via environment variables:

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

Completed downloads use local storage by default. Production deployments can
publish every server-processed video to a private Cloudflare R2 bucket and
return a short-lived signed URL:

```bash
STORAGE_BACKEND=r2
R2_ACCOUNT_ID=your-account-id
R2_BUCKET_NAME=omnimedia-downloads
R2_ACCESS_KEY_ID=your-bucket-scoped-access-key
R2_SECRET_ACCESS_KEY=your-bucket-scoped-secret
R2_PRESIGNED_URL_SECONDS=600
R2_OBJECT_PREFIX=downloads
```

Keep R2 credentials on the backend only. Railway still needs temporary disk
space while yt-dlp and ffmpeg download or merge a video; the temporary file is
removed after R2 publication. Configure a bucket lifecycle rule for the object
prefix if downloads should expire automatically.

When running locally, the downloader automatically loads cookies from your local Chrome profile if detected. In server environments, it will not look for non-existent local browser profiles; if cookies are required for public content, set `YTDLP_COOKIE_FILE=/path/to/cookies.txt`. You can also explicitly specify `YTDLP_COOKIES_FROM_BROWSER=chrome` or set it to `off` to disable auto-detection.

In reverse proxy environments such as Railway, set `TRUST_PROXY=true` to let rate-limiting correctly identify client IP addresses and detect HTTPS. Do not enable this if clients connect directly to the application.

## 🐛 FAQ

### Q: Douyin parsing fails?

**A:** The parser utilizes mobile endpoint extraction. Ensure the required dependency is installed:

```bash
pip install curl_cffi
```

### Q: Douyin download is slow?

**A:** The watermark-free video is original high-definition source media and files can be several hundred megabytes. Download time depends on network bandwidth.

### Q: TikTok short links fail to parse?

**A:** TikTok implements strict anti-bot measures. We recommend using standard URLs (`https://www.tiktok.com/@username/video/xxx`).

### Q: Instagram cover images do not load?

**A:** The application has a built-in image proxy service that bypasses cross-origin and referer restrictions automatically.

### Q: YouTube videos cannot be downloaded?

**A:** Reinstall dependencies matching the pinned versions in `requirements.txt`:

```bash
pip install --upgrade -r requirements.txt
```

### Q: How to deploy on a production server?

**A:** Gunicorn is recommended:

```bash
pip install gunicorn
gunicorn -w 1 --threads 8 -b 0.0.0.0:7860 app:app
```

## 🛡️ Notes & Compliance

1. ⚖️ **Legal Use** — Please comply with applicable laws and regulations; use only for personal learning and research.
2. ©️ **Copyright Respect** — Respect original creators' copyright. Do not use for commercial purposes.
3. 🌐 **Network Environment** — Ensure stable network connectivity; some platforms may require specific network access.
4. 💾 **Disk Management** — Monitor disk space and clean downloaded files periodically.
5. 🔄 **Stay Updated** — Regularly update `yt-dlp` to ensure ongoing compatibility with platform changes.

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Disclaimer**: This tool is intended for educational and research purposes only. Users assume full responsibility for their usage. The developers bear no liability for any legal issues arising from the use of this tool. Please respect the rights of content creators.
