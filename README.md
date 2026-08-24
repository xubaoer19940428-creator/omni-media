<div align="center">
  <a href="https://omni-media-production.up.railway.app/">
    <img src="./frontend/public/icon.svg" width="96" alt="OmniMedia logo">
  </a>

  <h1>OmniMedia</h1>

  <p><strong>Parse, preview, and download public media from 22 social platforms in one place.</strong></p>

  <p>
    Paste a link or complete app share text, inspect normalized media metadata,
    process batches, and download supported videos from a clean bilingual web interface.
  </p>

  <p>
    <a href="https://omni-media-production.up.railway.app/"><strong>Live Demo</strong></a>
    ·
    <a href="#quick-start">Quick Start</a>
    ·
    <a href="#api-examples">API Examples</a>
    ·
    <a href="README_zh.md">简体中文</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/platforms-22-5b5bd6?style=flat-square" alt="22 supported platforms">
    <img src="https://img.shields.io/badge/Python-3.10+-3776ab?style=flat-square&logo=python&logoColor=white" alt="Python 3.10+">
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16">
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT license"></a>
  </p>
</div>

## Product tour

<div align="center">
  <a href="./.github/assets/omnimedia-demo.mp4">
    <img src="./.github/assets/omnimedia-hero.webp" alt="OmniMedia home page" width="100%">
  </a>
  <p><a href="./.github/assets/omnimedia-demo.mp4"><strong>Watch the 12-second demo →</strong></a></p>
</div>

<table>
  <tr>
    <td width="50%"><img src="./.github/assets/omnimedia-workbench.webp" alt="OmniMedia parsing workbench"></td>
    <td width="50%"><img src="./.github/assets/omnimedia-result.webp" alt="OmniMedia parsed media result"></td>
  </tr>
  <tr>
    <td align="center">Unified parsing workbench</td>
    <td align="center">Media preview and normalized metadata</td>
  </tr>
</table>

## What you can do

- Paste a public post URL or the complete share text copied from an app.
- Parse media metadata into one consistent result format.
- Preview playable videos and covers directly in the browser.
- Queue up to 40 links in the web interface while preserving result order.
- Download supported media through the server instead of relying on fragile source links.
- Switch between English and Simplified Chinese, light and dark themes, on desktop or mobile.

## Supported platforms

| | | | |
| --- | --- | --- | --- |
| TikTok | Douyin | Instagram | Telegram |
| YouTube | Twitter / X | Facebook | Bilibili |
| Weibo | Reddit | Vimeo | Dailymotion |
| Twitch | Pinterest | Tumblr | Rumble |
| Xiaohongshu | AcFun | Youku | iQIYI |
| Tencent Video | Xigua Video | | |

OmniMedia works with public, login-free media. Paid, private, login-required,
geo-restricted, deleted, or DRM-protected content may not be available, and the
project does not attempt to bypass those restrictions. Platform behavior can
also change without notice.

## Try it

Open the [live demo](https://omni-media-production.up.railway.app/), then paste
any supported link or share text into the workbench.

### Douyin share text

```text
7.43 pda:/ A copied Douyin caption... https://v.douyin.com/xxxxx/ Copy this link...
```

### Standard and short links

```text
https://www.tiktok.com/@creator/video/1234567890
https://www.youtube.com/watch?v=xxxxxxxxxxx
https://www.instagram.com/reel/xxxxxxxxxxx/
https://www.bilibili.com/video/BVxxxxxxxxxx
```

### Batch input

Paste one link per line in the Batch Center. The web interface accepts up to 40
links at a time and processes them in bounded groups.

## Quick start

### Docker

Docker is the simplest way to run the complete web application:

```bash
git clone https://github.com/xubaoer19940428-creator/omni-media.git
cd omni-media
docker build -t omnimedia .
docker run --rm -p 7860:7860 omnimedia
```

Open <http://localhost:7860>.

### Run from source

Requirements: Python 3.10+, Node.js 22+, pnpm, and ffmpeg.

```bash
git clone https://github.com/xubaoer19940428-creator/omni-media.git
cd omni-media

corepack enable
cd frontend && pnpm install && pnpm run build && cd ..

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open <http://localhost:7860>. Windows users can activate the environment with
`venv\Scripts\activate`.

For optional configuration, see [`.env.example`](.env.example).

## API examples

The browser interface uses the same API. All examples below assume a local
server at `http://localhost:7860`. Replace the example URL with a public link
that you own or are authorized to use.

### Parse one link

```bash
curl -X POST http://localhost:7860/api/parse \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=xxxxxxxxxxx"}'
```

### Parse a batch

The API accepts up to 10 URLs per request.

```bash
curl -X POST http://localhost:7860/api/batch-parse \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://v.douyin.com/xxxxx/","https://www.tiktok.com/@creator/video/1234567890"]}'
```

### Download supported media

Use the original public URL returned by the parse flow:

```bash
curl -X POST http://localhost:7860/api/download \
  -H "Content-Type: application/json" \
  -d '{"original_url":"https://www.youtube.com/watch?v=xxxxxxxxxxx"}'
```

The response contains a `download_url`. Depending on the deployment, it can be
a local application route or a short-lived absolute URL.

Other useful endpoints:

- `GET /api/health` — service health
- `GET /api/platforms` — supported platform registry
- `GET /api/proxy-image?url=...` — bounded cover-image proxy

## Responsible use

Only download content that you own or are authorized to use. You are
responsible for complying with platform terms, copyright rules, privacy laws,
and local regulations. This project is intended for lawful interoperability,
personal tooling, research, and development; it does not provide a right to
copy or redistribute third-party content.

## Contributing

Issues and pull requests are welcome. Platform sites change frequently, so a
useful bug report should include the platform, a public example URL, the error
message, and the time the failure occurred. Never include cookies, credentials,
signed download URLs, or other secrets.

## License

OmniMedia is released under the [MIT License](LICENSE). Third-party components
and their notices are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
