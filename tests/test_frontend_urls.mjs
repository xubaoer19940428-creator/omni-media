import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../static/js/app.js', import.meta.url), 'utf8');
const stubElement = () => ({
    addEventListener() {},
    removeAttribute() {},
    setAttribute() {},
    style: {},
});
const context = {
    URL,
    document: {
        addEventListener() {},
        getElementById: stubElement,
    },
    encodeURIComponent,
};
vm.createContext(context);
vm.runInContext(`${source}\nthis.testIsValidUrl = isValidUrl;`, context);

const validUrls = [
    'https://www.tiktok.com/@creator/video/1234567890123456789',
    'https://www.douyin.com/video/1234567890123456789',
    'https://www.instagram.com/reel/ABC_def-12/',
    'https://t.me/public_channel/12345',
    'https://www.youtube.com/watch?v=BaW_jenozKc',
    'https://x.com/creator/status/1234567890123456789',
    'https://www.facebook.com/watch/?v=123456789012345',
    'https://www.bilibili.com/video/BV1xx411c7mD',
    'https://weibo.com/tv/show/1034:1234567890123456',
    'https://www.reddit.com/r/videos/comments/abc123/example/',
    'https://vimeo.com/76979871',
    'https://www.dailymotion.com/video/x84sh87',
    'https://www.twitch.tv/videos/1234567890',
    'https://www.pinterest.co.uk/pin/123456789/',
    'https://example.tumblr.com/post/123456789012/example',
    'https://rumble.com/v123abc-example.html',
    'https://www.xiaohongshu.com/explore/1234567890abcdef12345678',
    'https://www.acfun.cn/v/ac12345678',
    'https://v.youku.com/v_show/id_XNjA0MTY4NTQ4NA==.html',
    'https://www.iqiyi.com/v_19rrn9q7l4.html',
    'https://v.qq.com/x/page/a1234567890.html',
    'https://www.ixigua.com/1234567890123456789',
    'Shared link: https://vimeo.com/76979871',
    // Platform support is enforced by the backend's single platform registry.
    'https://example.com/video',
    'https://dailymotion.com.evil.example/video/x123',
];

for (const url of validUrls) {
    assert.equal(context.testIsValidUrl(url), true, `expected valid: ${url}`);
}

const invalidUrls = [
    'ftp://www.youtube.com/watch?v=BaW_jenozKc',
    'not a URL',
    'www.youtube.com/watch?v=BaW_jenozKc',
    'javascript:alert(1)',
];

for (const url of invalidUrls) {
    assert.equal(context.testIsValidUrl(url), false, `expected invalid: ${url}`);
}

console.log(`Frontend URL validation passed (${validUrls.length + invalidUrls.length} cases).`);
