# OmniMedia 推广资料包

这份资料用于上线前后的内容分发。它只包含可公开信息，不包含 Clerk、PayPal、Railway、R2 或平台 Cookie 等凭据。外部账号发帖、投放广告和社区提交仍需要运营者本人确认并执行。

## 一句话定位

OmniMedia 是一个面向创作者和开发者的多平台媒体解析工具：粘贴公开链接即可获取统一媒体信息，也可以通过 REST API 接入 39 个平台。

## 首页 / SEO 基础信息

- **Title**：OmniMedia — Universal Social Media API & Media Downloader
- **Description**：Parse public media links across 39 platforms with normalized JSON, HD galleries, MP3 extraction, and secure server-side downloads.
- **中文描述**：支持抖音、TikTok、Instagram、YouTube、B站、X 等 39 个平台，统一解析公开媒体链接，返回标准 JSON，并提供高清图集、MP3 与安全服务端下载。
- **核心 CTA**：Start parsing / 立即试用
- **付费 CTA**：US$9.90/month · Unlimited downloads（PayPal Sandbox 测试阶段）

## 中文短文案

### 小红书 / 即刻（短版）

> 保存公开社媒视频，不用来回切 App。
>
> OmniMedia 支持抖音、TikTok、Instagram、YouTube、B站、X 等 39 个平台：粘贴分享链接，自动识别视频、高清图集和音频。
>
> 新用户先免费试 2 个视频；需要批量处理或长期下载，可升级 US$9.90/月无限套餐。
>
> 体验：<https://useomnimedia.com>

### 知乎 / 公众号（长版）

> 不同平台的分享链接格式、字段和下载方式一直不统一。OmniMedia 把这件事收敛成一个工作台和一套 REST API：公开链接自动识别，结果统一返回标题、作者、封面、媒体直链、时长和互动数据；需要时还能在服务端生成 MP4、MP3 或高清图集下载。
>
> 对创作者，它是一个轻量的素材归档工具；对开发者，它是一个可直接试跑、可复制多语言代码的媒体数据入口。支持 39 个平台，免费账户可先试 2 个视频，月度套餐为 US$9.90/月无限下载。

## English launch copy

### Product Hunt / X

> Meet OmniMedia: one link, every platform.
>
> Parse public media from TikTok, Douyin, Instagram, YouTube, Bilibili, X, and 33 more platforms through one normalized REST + JSON contract. Creators get a fast workbench; developers get batch parsing, platform status, and multi-language snippets.
>
> Try 2 downloads free, then upgrade to US$9.90/month for unlimited downloads.

### Developer community reply

> If your product needs public social-media metadata or media files, OmniMedia exposes a small, predictable API: `/api/parse`, `/api/batch-parse`, and `/api/download`. The live playground generates cURL, Python, Node, Go, and PHP examples.

## 推荐分发顺序

1. **先做可搜索内容**：发布 5 篇平台教程页（Instagram、TikTok、YouTube、抖音、B站），每篇只解决一个明确问题，并链接回工作台。
2. **再做短视频演示**：15–25 秒录屏，展示“粘贴分享文案 → 自动识别 → 下载 / 复制 JSON”，同时展示中英文界面。
3. **最后做开发者分发**：在 GitHub README、Product Hunt、X 和开发者社区放 API Playground 截图与最短 cURL 示例。
4. **追踪转化**：只使用现有站点分析和匿名事件，重点观察 `page_view`、开始解析、登录、PayPal 结账点击和成功回调，不要记录链接内容、Cookie 或支付密钥。

## 发帖前检查

- 链接使用 `https://useomnimedia.com`，不要使用本地地址或 Railway 临时域名。
- 公开说明“仅支持公开链接”，不要承诺绕过平台登录、私密内容或版权限制。
- Sandbox 阶段明确写“PayPal Sandbox 测试”，正式收款前再替换为 Live 配置和正式价格说明。
- 截图中隐藏用户邮箱、订单号、Clerk/PayPal 控制台和任何 Cookie。
- 外部平台的账号登录、发帖和广告投放由站长本人完成；本资料包不代表已经代发。
