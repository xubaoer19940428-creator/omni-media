'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // Nav
    nav: {
      workbench: 'Workbench',
      playground: 'API Playground',
      batch: 'Batch Queue',
      platforms: 'Platforms',
      docs: 'API Docs',
      systemNormal: 'All Systems Normal',
      engineConnecting: 'Engine Connecting',
    },
    // Hero
    hero: {
      badge: 'Universal Media Extraction & Scraping Engine',
      title1: 'Universal Social Media API',
      titleFor: 'for Developers &',
      titleBrackets: 'Platforms',
      subtitle: 'Parse public media links across 22 platforms through one same-origin REST API, with normalized JSON responses and server-side downloads.',
      statPlatforms: 'Supported Platforms',
      statWatermark: 'Core API Endpoints',
      statLatency: 'URLs per Request',
      statAvailability: 'Response Format',
      morePlatforms: '+12 more',
    },
    // Workbench
    workbench: {
      title: 'Video URL or App Share Text',
      ctrlEnter: 'Press Ctrl + Enter to parse',
      placeholder: 'Paste any post link or raw share text (TikTok, Douyin, Xiaohongshu, Instagram, YouTube, X/Twitter, Bilibili...)',
      paste: 'Paste',
      clear: 'Clear',
      extractMedia: 'Extract Media',
      extracting: 'Extracting...',
      extractedUrl: 'Extracted URL:',
      sampleLinks: 'Sample Links',
      recentHistory: 'Recent History',
      clearHistory: 'Clear',
      untitled: 'Untitled Media',
      noUrlError: 'Please provide a video or post share URL.',
      clipboardError: 'Unable to read clipboard. Please paste manually (Ctrl+V / Cmd+V).',
      storagePolicy: 'Public, login-free links only · 512 MB max · processed videos are stored privately in Cloudflare R2 · download links expire in 10 minutes · temporary files are removed after about 1 day · only download content you own or are authorized to use.',
    },
    // Result Card
    result: {
      video: 'Video Stream',
      gallery: 'Gallery',
      audio: 'Audio Track',
      meta: 'Metadata',
      json: 'JSON',
      noVideoPreview: 'No direct video stream found for preview',
      previewFailed: 'The source blocked browser preview. Server download is still available.',
      photoCarouselNote: 'This post is a high-res photo carousel',
      viewAllPhotos: 'View all photos',
      duration: 'Duration:',
      noDesc: 'No description available',
      downloadMp4: 'Download MP4',
      serverDownload: 'Server-Side Direct Download',
      serverProcessing: 'Server Processing...',
      copyDirectLink: 'Copy Direct Link',
      copyCaption: 'Copy Caption',
      copied: 'Copied',
      foundPhotos: 'Found Original Photos',
      openAllTabs: 'Open All in New Tabs',
      audioTrackTitle: 'Original Audio Track',
      downloadAudio: 'Download Audio (MP3)',
      copyAudioUrl: 'Copy Audio URL',
      platformMetrics: 'Platform Metrics',
      author: 'Author:',
      platform: 'Platform:',
      likes: 'Likes:',
      comments: 'Comments:',
      descAndTags: 'Description & Tags',
      copyJson: 'Copy JSON',
    },
    // API Playground
    playground: {
      tag: 'DEVELOPER API CONSOLE',
      title: 'Live API Testing & Multi-Language SDK',
      subtitle: 'Test the live endpoints and generate integration snippets in 5 languages.',
      requestGen: 'api-request-generator',
      copySnippet: 'Copy Snippet',
      targetEndpoint: 'Target Endpoint',
      inputUrl: 'Input Parameter (URL)',
      executeBtn: 'Execute API Request (Run Live)',
      executing: 'Executing Request...',
      responseViewer: 'live-response-inspector',
      emptyPrompt: 'Click "Execute API Request" to view live JSON response payload',
    },
    // Batch
    batch: {
      tag: 'BATCH PROCESSING PIPELINE',
      title: 'Batch Multi-Link Extraction Queue',
      subtitle: 'Paste up to 40 links at once. The client sends bounded batches and preserves result order.',
      inputLabel: 'Enter multiple URLs (one per line, raw share texts supported)',
      urlsReady: 'URLs ready to queue',
      addToQueue: 'Add to Queue',
      queueStatus: 'Queue Status:',
      total: 'Total',
      completed: 'Completed',
      startBatch: 'Start Batch Extraction',
      processingQueue: 'Processing Queue...',
      parseSingle: 'Parse',
      download: 'Download',
      queueLimit: 'The queue accepts at most {max} URLs. Clear or process the current queue first.',
    },
    // Platforms
    platforms: {
      tag: 'SUPPORTED PLATFORMS MATRIX',
      title: 'Supported Platform Parsers',
      subtitle: '22 registered adapters exposed through the same parse, batch, and platform-status APIs.',
      searchPlaceholder: 'Search by platform name or domain (e.g. tiktok, douyin, instagram)...',
      liveStatus: 'Parser Available',
      noWatermark: 'URL Recognition',
      galleryHd: 'Normalized JSON',
      audioExtractor: 'Batch API',
      testInWorkbench: 'Test in Workbench',
    },
    // Docs Modal
    docs: {
      title: 'OmniMedia RESTful API Specification',
      subtitle: 'Same-origin JSON API with configurable trusted cross-origin access',
      baseUrl: '1. Base URL & Headers',
      mediaEndpoint: '2. Media Extraction Endpoint',
      batchEndpoint: '3. Batch Media Extraction Endpoint',
      downloadEndpoint: '4. Server Download Processing',
      platformsEndpoint: '5. Platform Capabilities & Status',
      requestBody: 'Request Body (JSON):',
      successResponse: 'Success Response (200 OK):',
      close: 'Close Documentation',
      copied: 'Copied',
      copy: 'Copy',
      corsPolicy: 'Same-origin by default; configurable trusted origins',
    },
    extensionPrivacy: {
      eyebrow: 'BROWSER EXTENSION',
      title: 'OmniMedia Extension Privacy Policy',
      updated: 'Last updated: August 25, 2026',
      intro: 'This policy explains how the OmniMedia browser extension handles information when you use its single purpose: parsing a public media link that you explicitly choose.',
      scopeTitle: 'What the extension accesses',
      scopeBody: 'The extension accepts a link or complete share text that you paste into its input and extracts the first HTTP(S) URL locally. It reads the active tab URL only when you click Use current tab. It does not read page content, browsing history, cookies, passwords, personal messages, or clipboard data, and it does not inject scripts into websites.',
      sentTitle: 'Information sent to OmniMedia',
      sentItems: [
        'When you click Parse, the public URL extracted from your input is sent to useomnimedia.com to identify the platform and retrieve public media metadata. The surrounding share text is not sent.',
        'When you continue to a secure download, the full OmniMedia website opens with that public URL prefilled. The extension does not call the download endpoint. If you start a download on the website, completed files are stored temporarily in a private Cloudflare R2 bucket and are made available through a short-lived signed URL.',
        'Like most internet services, the hosting infrastructure receives network information such as an IP address and request timing. OmniMedia uses it for security, rate limiting, reliability, and abuse prevention.'
      ],
      localTitle: 'Information stored locally',
      localBody: 'Your language and light/dark theme preferences are stored in the browser extension storage on your device. They are not used for advertising or cross-site tracking.',
      retentionTitle: 'Retention and sharing',
      retentionBody: 'Temporary processed downloads are normally removed after about one day; signed download links normally expire after 10 minutes. OmniMedia does not sell personal information or use extension data for advertising. Railway and Cloudflare process limited information only as infrastructure providers needed to operate the service.',
      permissionsTitle: 'Why the extension requests permissions',
      permissionsItems: [
        'activeTab: read the current tab URL only when you click Use current tab.',
        'storage: remember language and theme preferences on your device.',
        'useomnimedia.com access: call the OmniMedia parse, health, and cover-image proxy APIs. Secure downloads continue in the full OmniMedia website.'
      ],
      controlTitle: 'Your choices',
      controlBody: 'Do not click Parse if you do not want the extracted public URL sent to OmniMedia. Pasted text is not stored by the extension. You can remove locally stored preferences by uninstalling the extension or using the browser\'s extension storage reset/remove controls.',
      contactTitle: 'Questions',
      contactBody: 'For privacy questions, open an issue in the OmniMedia GitHub repository.',
      contactLink: 'Contact through GitHub',
      back: 'Back to OmniMedia',
    },
    // Footer
    footer: {
      subtitle: 'Universal Social Media API & Developer Extraction Platform',
      poweredBy: 'Powered by Next.js & Python Engine',
      vercelReady: 'Vercel Ready',
      repo: 'GitHub Repository',
      license: 'MIT License',
      madeWith: 'Made with',
      forDevelopers: 'for Global Developers',
    }
  },
  zh: {
    // Nav
    nav: {
      workbench: '解析工作台',
      playground: 'API 调试台',
      batch: '批量处理',
      platforms: '支持平台',
      docs: 'API 规范',
      systemNormal: '服务运行正常',
      engineConnecting: '引擎连接中',
    },
    // Hero
    hero: {
      badge: '全能多平台媒体解析引擎',
      title1: '全能社媒数据与媒体 API',
      titleFor: '专为开发者与平台打造',
      titleBrackets: '矩阵',
      subtitle: '通过一个同源 REST API 解析 22 个平台的公开媒体链接，统一返回 JSON，并支持服务端下载。',
      statPlatforms: '支持平台总数',
      statWatermark: '核心 API 接口',
      statLatency: '单请求链接数',
      statAvailability: '响应格式',
      morePlatforms: '+12 更多平台',
    },
    // Workbench
    workbench: {
      title: '视频分享文本 / 网页链接输入',
      ctrlEnter: '支持 Ctrl + Enter 快捷解析',
      placeholder: '支持直接粘贴 App 分享文案（例如抖音、TikTok、小红书、B站、YouTube、Instagram、X/Twitter...）',
      paste: '剪贴板粘贴',
      clear: '清空',
      extractMedia: '立即解析',
      extracting: '正在解析...',
      extractedUrl: '已自动提取 URL:',
      sampleLinks: '填入示例链接',
      recentHistory: '最近解析记录',
      clearHistory: '清空记录',
      untitled: '无标题作品',
      noUrlError: '请输入有效的视频或图文分享链接',
      clipboardError: '无法读取剪贴板，请使用 Ctrl+V / Cmd+V 手动粘贴',
      storagePolicy: '仅支持公开且无需登录的链接 · 单文件最大 512 MB · 成品临时存入私有 Cloudflare R2 · 下载链接 10 分钟有效 · 文件约 1 天后清理 · 请仅下载自己拥有或已获授权的内容。',
    },
    // Result Card
    result: {
      video: '视频原画',
      gallery: '高清图集',
      audio: '原声音轨',
      meta: '数据指标',
      json: 'JSON',
      noVideoPreview: '未获取到可直接预览的视频流',
      previewFailed: '源站限制了浏览器预览，仍可使用服务端下载。',
      photoCarouselNote: '此作品为高清图文笔记 / 幻灯片',
      viewAllPhotos: '查看全部高清原图',
      duration: '时长:',
      noDesc: '暂无作品文案',
      downloadMp4: '下载 MP4',
      serverDownload: '使用 Python 服务端转码打包下载',
      serverProcessing: '服务端正在打包处理中...',
      copyDirectLink: '复制直链',
      copyCaption: '复制文案',
      copied: '已复制',
      foundPhotos: '已成功提取原图',
      openAllTabs: '新标签页打开全部原图',
      audioTrackTitle: '作品背景原声音轨',
      downloadAudio: '下载音频文件 (MP3)',
      copyAudioUrl: '复制音频直链',
      platformMetrics: '基础指标',
      author: '创作者:',
      platform: '所属平台:',
      likes: '点赞量:',
      comments: '评论量:',
      descAndTags: '文案与话题标签',
      copyJson: '复制 JSON',
    },
    // API Playground
    playground: {
      tag: 'DEVELOPER API CONSOLE',
      title: '实时 API 交互调试与 SDK 生成',
      subtitle: '在线发起真实请求，并生成 5 种后端语言的接入代码。',
      requestGen: 'api-request-generator',
      copySnippet: '复制代码',
      targetEndpoint: '选择 API 端点',
      inputUrl: '测试媒体链接 (URL)',
      executeBtn: '立即执行 API 请求 (Run Live)',
      executing: '正在发起真实请求...',
      responseViewer: 'live-response-inspector',
      emptyPrompt: '点击左侧「立即执行 API 请求」查看实时返回的 JSON 数据',
    },
    // Batch
    batch: {
      tag: 'BATCH PROCESSING PIPELINE',
      title: '批量多链接解析与归档',
      subtitle: '一次可录入最多 40 条链接，客户端按受控分块请求并保持结果顺序。',
      inputLabel: '输入批量链接（一行一条，支持完整分享文案）',
      urlsReady: '条链接待解析',
      addToQueue: '加入批量队列',
      queueStatus: '队列状态:',
      total: '总计',
      completed: '已完成',
      startBatch: '开始批量解析',
      processingQueue: '正在并发解析中...',
      parseSingle: '立即解析',
      download: '下载',
      queueLimit: '队列最多容纳 {max} 条链接，请先处理或清空当前队列。',
    },
    // Platforms
    platforms: {
      tag: 'SUPPORTED PLATFORMS MATRIX',
      title: '22 个主流平台解析器',
      subtitle: '22 个已注册适配器，共用单条解析、批量解析和平台状态接口。',
      searchPlaceholder: '搜索平台名称、域名（如 tiktok, 抖音, xiaohongshu）...',
      liveStatus: '已接入解析器',
      noWatermark: '链接识别',
      galleryHd: '统一 JSON',
      audioExtractor: '批量 API',
      testInWorkbench: '填入工作台测试',
    },
    // Docs Modal
    docs: {
      title: 'OmniMedia RESTful API 规范文档',
      subtitle: '标准同源 JSON API，支持配置可信跨域来源',
      baseUrl: '1. Base URL 与通用请求头',
      mediaEndpoint: '2. 单条媒体解析接口',
      batchEndpoint: '3. 批量多链接解析接口',
      downloadEndpoint: '4. 服务端转码打包下载接口',
      platformsEndpoint: '5. 支持平台状态查询接口',
      requestBody: '请求体 (JSON):',
      successResponse: '成功响应 (200 OK):',
      close: '完成查看',
      copied: '已复制',
      copy: '复制',
      corsPolicy: '默认仅同源，可配置可信跨域来源',
    },
    extensionPrivacy: {
      eyebrow: '浏览器扩展',
      title: 'OmniMedia 浏览器扩展隐私政策',
      updated: '最后更新：2026 年 8 月 25 日',
      intro: '本政策说明 OmniMedia 浏览器扩展在完成其单一用途时如何处理信息：解析由你明确选择的公开媒体链接。',
      scopeTitle: '扩展会访问什么',
      scopeBody: '扩展接受你粘贴到输入框中的链接或完整分享文本，并在本地提取第一个 HTTP(S) 链接。只有在你点击“使用当前标签页”时，它才会读取当前标签页 URL。扩展不读取页面正文、浏览历史、Cookie、密码、私人消息或剪贴板数据，也不会向网站注入脚本。',
      sentTitle: '会发送给 OmniMedia 的信息',
      sentItems: [
        '当你点击“解析”时，从输入中提取的公开 URL 会发送到 useomnimedia.com，用于识别平台并获取公开媒体信息。周围的分享文本不会被发送。',
        '当你继续安全下载时，完整 OmniMedia 网页会打开并预填该公开 URL。扩展本身不会调用下载接口；如果你在网页中开始下载，完成的文件会临时存放在私有 Cloudflare R2 存储桶中，并通过短时有效的签名链接提供。',
        '与多数互联网服务一样，托管基础设施会接收 IP 地址和请求时间等网络信息。OmniMedia 仅将其用于安全、限频、可靠性和防止滥用。'
      ],
      localTitle: '本地存储的信息',
      localBody: '语言和明暗主题偏好会保存在你设备上的浏览器扩展存储中。这些信息不会用于广告或跨站跟踪。',
      retentionTitle: '保留与共享',
      retentionBody: '临时处理的下载文件通常在约一天后删除，签名下载链接通常在 10 分钟后过期。OmniMedia 不出售个人信息，也不将扩展数据用于广告。Railway 和 Cloudflare 仅作为运行服务所必需的基础设施提供商处理有限信息。',
      permissionsTitle: '权限用途',
      permissionsItems: [
        'activeTab：只有在你点击“使用当前标签页”时读取当前标签页 URL。',
        'storage：在设备上记住语言和主题偏好。',
        'useomnimedia.com 访问权限：调用 OmniMedia 的解析、健康检查和封面图代理 API。安全下载会在完整 OmniMedia 网站中继续。'
      ],
      controlTitle: '你的选择',
      controlBody: '如果不希望将提取出的公开 URL 发送给 OmniMedia，请不要点击“解析”。扩展不会保存粘贴的文本。卸载扩展，或使用浏览器的扩展存储重置/删除功能，即可删除本地偏好。',
      contactTitle: '问题与联系',
      contactBody: '如有隐私相关问题，请在 OmniMedia GitHub 仓库提交 Issue。',
      contactLink: '通过 GitHub 联系',
      back: '返回 OmniMedia',
    },
    // Footer
    footer: {
      subtitle: '全能社媒数据与媒体解析开发者平台',
      poweredBy: '基于 Next.js & Python 高性能引擎构建',
      vercelReady: '适配 Vercel 一键部署',
      repo: 'GitHub 开源仓库',
      license: 'MIT 开源协议',
      madeWith: '用心构建',
      forDevelopers: '献给全球开发者',
    }
  }
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('omnimedia_lang') as Language;
      if (saved === 'en' || saved === 'zh') {
        setLangState(saved);
      }
    } catch {}
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('omnimedia_lang', newLang);
    } catch {}
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
