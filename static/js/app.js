// 核心状态管理
const state = {
    videoData: null,
    filename: null,
    originalUrl: null,
    platform: null,
    isParsing: false
};

const fallbackCover = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">' +
    '<rect width="800" height="500" fill="#161914"/>' +
    '<rect x="52" y="52" width="696" height="396" rx="20" fill="none" stroke="#c8f169" stroke-width="3"/>' +
    '<text x="400" y="245" fill="#c8f169" font-family="monospace" font-size="30" text-anchor="middle">QUICKCLEAN</text>' +
    '<text x="400" y="285" fill="#b9d9ff" font-family="monospace" font-size="14" text-anchor="middle">PREVIEW UNAVAILABLE</text>' +
    '</svg>'
);

// DOM 元素引用
const elements = {
    shareUrlInput: document.getElementById("shareUrl"),
    parseBtn: document.getElementById("parseBtn"),
    loadingSection: document.getElementById("loading"),
    errorAlert: document.getElementById("errorAlert"),
    errorMessage: document.getElementById("errorMessage"),
    videoInfoSection: document.getElementById("videoInfo"),
    downloadBtn: document.getElementById("downloadBtn"),
    copyInfoBtn: document.getElementById("copyInfoBtn"),
    downloadProgress: document.getElementById("downloadProgress"),
    downloadComplete: document.getElementById("downloadComplete"),
    downloadLink: document.getElementById("downloadLink"),
    cleanupBtn: document.getElementById("cleanupBtn"),
    coverImage: document.getElementById("coverImage")
};

// 初始化
document.addEventListener("DOMContentLoaded", () => {
    initEvents();
});

function initEvents() {
    elements.parseBtn.addEventListener("click", handleParse);
    
    elements.shareUrlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleParse();
    });

    elements.downloadBtn.addEventListener("click", handleDownload);
    elements.copyInfoBtn.addEventListener("click", handleCopyInfo);
    elements.cleanupBtn.addEventListener("click", handleCleanup);

    // 智能剪贴板监听
    window.addEventListener('focus', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (isValidUrl(text) && text !== state.originalUrl) {
                elements.shareUrlInput.value = text;
            }
        } catch (e) {}
    });
}

async function handleParse() {
    if (state.isParsing) return;

    const url = elements.shareUrlInput.value.trim();
    if (!url) return notify('warning', 'Paste a video link first');
    if (!isValidUrl(url)) return notify('error', 'Paste a valid HTTP or HTTPS video link');
    if (state.filename) return notify('warning', 'Save and clear the current cached file before parsing another link');

    toggleUI('loading', true);
    toggleUI('error', false);
    toggleUI('video', false);
    toggleUI('complete', false);
    state.isParsing = true;
    elements.parseBtn.disabled = true;
    elements.parseBtn.setAttribute('aria-busy', 'true');

    try {
        const res = await fetch("/api/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            state.videoData = data;
            state.originalUrl = url;
            state.platform = data.platform;
            renderVideoInfo(data.video_info);
        } else {
            notify('error', data.error || "The parser is busy. Please try again shortly");
        }
    } catch (e) {
        notify('error', "Could not reach the parser. Check your connection and try again");
    } finally {
        toggleUI('loading', false);
        state.isParsing = false;
        elements.parseBtn.disabled = false;
        elements.parseBtn.removeAttribute('aria-busy');
    }
}

async function handleDownload() {
    if (!state.videoData) return;

    toggleUI('error', false);
    toggleUI('progress', true);
    toggleUI('video', false);
    elements.downloadBtn.disabled = true;

    try {
        const res = await fetch("/api/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                video_url: state.videoData.video_info.video_url,
                video_id: state.videoData.video_id,
                original_url: state.originalUrl,
                platform: state.platform
            })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            state.filename = data.expires_in ? null : data.filename;
            elements.downloadLink.href = data.download_url;
            elements.cleanupBtn.hidden = Boolean(data.expires_in);
            toggleUI('complete', true);
        } else {
            notify('error', data.error || "The download could not be completed");
            toggleUI('video', true);
        }
    } catch (e) {
        notify('error', "The download service encountered an error");
        toggleUI('video', true);
    } finally {
        toggleUI('progress', false);
        elements.downloadBtn.disabled = false;
    }
}

function renderVideoInfo(info) {
    // 封面代理逻辑
    const needsProxy = /instagram|cdninstagram|fbcdn/.test(info.cover_url);
    elements.coverImage.src = needsProxy
        ? `/api/proxy-image?url=${encodeURIComponent(info.cover_url)}`
        : (info.cover_url || fallbackCover);

    elements.coverImage.onerror = () => {
        elements.coverImage.onerror = null;
        elements.coverImage.src = fallbackCover;
    };

    document.getElementById("videoTitle").textContent = info.title || "Untitled video";
    document.getElementById("videoAuthor").textContent = info.author || "Unknown creator";
    document.getElementById("likeCount").textContent = formatNum(info.like_count);
    document.getElementById("commentCount").textContent = formatNum(info.comment_count);
    document.getElementById("shareCount").textContent = formatNum(info.share_count || info.view_count);
    document.getElementById("duration").textContent = formatTime(info.duration);

    toggleUI('video', true);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    elements.videoInfoSection.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start'
    });
}

function handleCopyInfo() {
    const info = state.videoData.video_info;
    const text = `Title: ${info.title}\nCreator: ${info.author}\nSource: ${state.originalUrl}`;
    navigator.clipboard.writeText(text)
        .then(() => notify('success', 'Video details copied to the clipboard'))
        .catch(() => notify('error', 'Copy failed. Check your browser permissions'));
}

async function handleCleanup() {
    if (!state.filename) return;
    try {
        const res = await fetch("/api/cleanup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: state.filename })
        });
        const data = await res.json();
        if (!res.ok) {
            return notify('error', data.error || 'Could not clear the cached file');
        }
        state.filename = null;
        toggleUI('complete', false);
        notify('success', 'Cached file cleared');
    } catch (e) {
        notify('error', 'Could not clear the cached file');
    }
}

// 辅助工具
function toggleUI(key, show) {
    const map = {
        loading: { element: elements.loadingSection, display: 'block' },
        error: { element: elements.errorAlert, display: 'flex' },
        video: { element: elements.videoInfoSection, display: 'block' },
        progress: { element: elements.downloadProgress, display: 'block' },
        complete: { element: elements.downloadComplete, display: 'flex' }
    };
    if (map[key]) {
        map[key].element.style.display = show ? map[key].display : 'none';
    }
}

function notify(type, msg) {
    if (type === 'error') {
        elements.errorMessage.textContent = msg;
        toggleUI('error', true);
    } else {
        const toast = document.createElement('div');
        const icon = type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check';
        toast.className = 'toast-notice';
        toast.dataset.type = type;
        toast.setAttribute('role', 'status');
        toast.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i><span></span>`;
        toast.querySelector('span').textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

function isValidUrl(url) {
    const match = url.match(/https?:\/\/[^\s<>"']+/i);
    if (!match) return false;

    try {
        const parsedUrl = new URL(match[0]);
        return ['http:', 'https:'].includes(parsedUrl.protocol) &&
            Boolean(parsedUrl.hostname);
    } catch (e) {
        return false;
    }
}

function formatNum(n) {
    if (!n) return '0';
    return n >= 10000 ? (n/10000).toFixed(1) + 'w' : n.toLocaleString();
}

function formatTime(s) {
    if (!s) return '0s';
    const totalSeconds = Math.round(s);
    const m = Math.floor(totalSeconds / 60);
    return m > 0 ? `${m}m ${totalSeconds % 60}s` : `${totalSeconds}s`;
}
