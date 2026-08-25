import {
  API_ORIGIN,
  detectPlatform,
  extractUrlFromText,
  normalizeResult,
  safeHttpUrl
} from './lib/core.mjs';

const translations = {
  en: {
    live: 'Live', offline: 'Offline', inputLabel: 'Media link or share text', platformCount: '22 platforms',
    inputPlaceholder: 'Paste a link or share text…', clearInput: 'Clear input', waitingInput: 'Waiting for a supported link',
    useCurrentTab: 'Use current tab', currentTabAdded: 'Current tab added', currentTabUnavailable: 'Current tab is not a public web page',
    parseMedia: 'Parse media', parsing: 'Parsing public media', working: 'Working', publicSources: 'Public media sources',
    parsingDetail: 'Requesting normalized metadata from OmniMedia…', download: 'Continue secure download',
    openApp: 'Open web app', unsupportedTitle: 'This link is not supported',
    unsupportedDetail: 'Use a public media link from one of OmniMedia’s 22 supported platforms.',
    privacyNote: 'Sent only after you click Parse.', privacyPolicy: 'Privacy', detected: '{platform} detected',
    invalidInput: 'Paste a public link or complete share text from a supported platform.',
    errorTitle: 'Could not complete the request', networkError: 'OmniMedia could not be reached. Check your connection and try again.',
    busyError: 'The service is busy or rate-limited. Please wait a moment and try again.',
    parseError: 'This public media link could not be parsed. It may be private, expired, or temporarily blocked by the source platform.',
    downloadError: 'The web app could not be opened. Please try again.', untitled: 'Untitled media', unknownAuthor: 'Unknown author'
  },
  zh: {
    live: '正常', offline: '离线', inputLabel: '媒体链接或完整分享文本', platformCount: '22 个平台',
    inputPlaceholder: '粘贴链接或完整分享文本…', clearInput: '清空输入', waitingInput: '等待输入支持平台的链接',
    useCurrentTab: '使用当前标签页', currentTabAdded: '已填入当前标签页', currentTabUnavailable: '当前标签页不是公开网页',
    parseMedia: '解析媒体', parsing: '正在解析公开媒体', working: '处理中', publicSources: '公开媒体来源',
    parsingDetail: '正在从 OmniMedia 获取标准化媒体信息…', download: '继续安全下载',
    openApp: '打开网页版', unsupportedTitle: '暂不支持此链接',
    unsupportedDetail: '请使用 OmniMedia 已支持的 22 个平台之一的公开媒体链接。',
    privacyNote: '只有点击“解析”后才会发送。', privacyPolicy: '隐私', detected: '已识别 {platform}',
    invalidInput: '请粘贴支持平台的公开链接或完整分享文本。',
    errorTitle: '请求未能完成', networkError: '无法连接 OmniMedia，请检查网络后重试。',
    busyError: '服务当前繁忙或已达限频，请稍后重试。',
    parseError: '该公开媒体链接暂时无法解析，可能是私密内容、链接过期或源平台临时限制。',
    downloadError: '无法打开网页版，请重试。', untitled: '未命名媒体', unknownAuthor: '未知作者'
  }
};

const state = { lang: 'en', theme: 'light', input: '', parsedUrl: '', platform: null, result: null, busy: false, offline: false };
const $ = (id) => document.getElementById(id);
const elements = {
  languageButton: $('language-button'), themeButton: $('theme-button'), serviceStatus: $('service-status'),
  mediaInput: $('media-input'), clearButton: $('clear-button'), useTabButton: $('use-tab-button'),
  detectionDot: $('detection-dot'), detectionLabel: $('detection-label'), parseButton: $('parse-button'),
  progressCard: $('progress-card'), progressTitle: $('progress-title'), progressDetail: $('progress-detail'),
  messageCard: $('message-card'), messageTitle: $('message-title'), messageDetail: $('message-detail'),
  unsupportedCard: $('unsupported-card'), resultCard: $('result-card'), resultPlatform: $('result-platform'),
  resultTitle: $('result-title'), resultMeta: $('result-meta'), coverImage: $('cover-image'),
  coverShell: $('cover-shell'), downloadButton: $('download-button'), openAppButton: $('open-app-button')
};

function t(key, vars = {}) {
  return Object.entries(vars).reduce((value, [name, replacement]) =>
    value.replace(`{${name}}`, replacement), translations[state.lang][key] || translations.en[key] || key);
}

function applyTranslations() {
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-aria]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAria)); });
  elements.languageButton.textContent = state.lang === 'en' ? '中文' : 'EN';
  elements.languageButton.setAttribute('aria-label', state.lang === 'en' ? 'Switch to Chinese' : '切换到英文');
  elements.themeButton.setAttribute('aria-label', state.lang === 'en' ? 'Toggle color theme' : '切换颜色主题');
  elements.serviceStatus.classList.toggle('offline', state.offline);
  elements.serviceStatus.querySelector('[data-i18n]').textContent = t(state.offline ? 'offline' : 'live');
  renderDetection();
  if (state.result) renderResult();
}

function updateInput(value, announcement = '') {
  state.input = value;
  state.parsedUrl = extractUrlFromText(value);
  state.platform = detectPlatform(state.parsedUrl);
  elements.mediaInput.value = value;
  elements.clearButton.hidden = !value;
  elements.resultCard.hidden = true;
  state.result = null;
  hideMessage();
  renderDetection(announcement);
}

function renderDetection(announcement = '') {
  const hasText = Boolean(state.input.trim());
  elements.detectionDot.classList.toggle('supported', Boolean(state.platform));
  elements.detectionDot.classList.toggle('unsupported', hasText && !state.platform);
  elements.detectionLabel.textContent = announcement || (state.platform
    ? t('detected', { platform: state.platform.name })
    : (hasText ? t('unsupportedTitle') : t('waitingInput')));
  elements.parseButton.disabled = state.busy || !state.platform || state.offline;
  elements.unsupportedCard.hidden = !hasText || Boolean(state.platform) || Boolean(announcement);
}

function setBusy(busy) {
  state.busy = busy;
  elements.progressCard.hidden = !busy;
  elements.mediaInput.disabled = busy;
  elements.useTabButton.disabled = busy;
  elements.clearButton.disabled = busy;
  elements.parseButton.disabled = busy || !state.platform || state.offline;
  elements.downloadButton.disabled = busy;
}

function showMessage(detail) {
  elements.messageTitle.textContent = t('errorTitle');
  elements.messageDetail.textContent = detail;
  elements.messageCard.hidden = false;
}

function hideMessage() { elements.messageCard.hidden = true; }

async function apiRequest(path, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_ORIGIN}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-ID': crypto.randomUUID() },
      body: JSON.stringify(body), signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer'
    });
    let data = null;
    try { data = await response.json(); } catch {}
    if (!response.ok || !data?.success) {
      const error = new Error('API request failed');
      error.status = response.status;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function friendlyError(error, action) {
  if (error?.status === 429 || error?.status === 503) return t('busyError');
  if (error?.name === 'AbortError' || !navigator.onLine) return t('networkError');
  return action === 'open' ? t('downloadError') : t('parseError');
}

function renderResult() {
  const result = state.result;
  elements.resultPlatform.textContent = result.platform || state.platform?.name || '';
  elements.resultTitle.textContent = result.title || t('untitled');
  elements.resultMeta.textContent = [result.author || t('unknownAuthor'), result.duration].filter(Boolean).join(' · ');
  if (result.coverUrl) {
    elements.coverImage.src = `${API_ORIGIN}/api/proxy-image?url=${encodeURIComponent(result.coverUrl)}`;
    elements.coverImage.hidden = false;
    elements.coverShell.querySelector('.cover-placeholder').hidden = true;
  } else {
    elements.coverImage.removeAttribute('src');
    elements.coverImage.hidden = true;
    elements.coverShell.querySelector('.cover-placeholder').hidden = false;
  }
  elements.resultCard.hidden = false;
}

async function parseInput() {
  if (!state.platform || !state.parsedUrl || state.busy) {
    if (!state.busy) showMessage(t('invalidInput'));
    return;
  }
  hideMessage();
  elements.unsupportedCard.hidden = true;
  elements.resultCard.hidden = true;
  setBusy(true);
  try {
    const data = await apiRequest('/api/parse', { url: state.parsedUrl }, 45_000);
    state.result = normalizeResult(data, state.parsedUrl);
    if (!state.result) throw new Error('Invalid response');
    renderResult();
  } catch (error) {
    showMessage(friendlyError(error, 'parse'));
  } finally {
    setBusy(false);
  }
}

async function useCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabUrl = safeHttpUrl(tab?.url || '');
    if (!tabUrl) {
      renderDetection(t('currentTabUnavailable'));
      return;
    }
    updateInput(tabUrl);
    if (state.platform) renderDetection(t('currentTabAdded'));
    elements.mediaInput.focus();
  } catch {
    renderDetection(t('currentTabUnavailable'));
  }
}

async function openWebApp(autoParse) {
  const sourceUrl = state.result?.originalUrl || state.parsedUrl;
  const params = new URLSearchParams();
  if (sourceUrl) params.set('url', sourceUrl);
  if (sourceUrl && autoParse) params.set('auto', '1');
  const target = params.size ? `${API_ORIGIN}/?${params}` : API_ORIGIN;
  try {
    await chrome.tabs.create({ url: target, active: true });
  } catch (error) {
    showMessage(friendlyError(error, 'open'));
  }
}

async function loadPreferences() {
  const saved = await chrome.storage.local.get(['language', 'theme']);
  const browserLanguage = chrome.i18n.getUILanguage().toLowerCase();
  state.lang = saved.language === 'zh' || saved.language === 'en' ? saved.language : (browserLanguage.startsWith('zh') ? 'zh' : 'en');
  state.theme = saved.theme === 'dark' || saved.theme === 'light' ? saved.theme : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = state.theme;
  applyTranslations();
}

async function checkHealth() {
  try {
    const response = await fetch(`${API_ORIGIN}/api/health`, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error('offline');
  } catch {
    state.offline = true;
    applyTranslations();
  }
}

elements.mediaInput.addEventListener('input', (event) => updateInput(event.target.value));
elements.mediaInput.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void parseInput();
});
elements.clearButton.addEventListener('click', () => { updateInput(''); elements.mediaInput.focus(); });
elements.useTabButton.addEventListener('click', useCurrentTab);
elements.parseButton.addEventListener('click', parseInput);
elements.downloadButton.addEventListener('click', () => openWebApp(true));
elements.openAppButton.addEventListener('click', () => openWebApp(false));
elements.languageButton.addEventListener('click', async () => {
  state.lang = state.lang === 'en' ? 'zh' : 'en';
  await chrome.storage.local.set({ language: state.lang });
  applyTranslations();
});
elements.themeButton.addEventListener('click', async () => {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = state.theme;
  await chrome.storage.local.set({ theme: state.theme });
});
elements.coverImage.addEventListener('error', () => {
  elements.coverImage.hidden = true;
  elements.coverShell.querySelector('.cover-placeholder').hidden = false;
});

await loadPreferences();
void checkHealth();
elements.mediaInput.focus();
