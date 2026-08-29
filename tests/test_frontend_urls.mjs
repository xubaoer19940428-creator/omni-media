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
    'https://www.dailymotion.com/video/x84sh87',
    'https://www.twitch.tv/videos/1234567890',
    'https://www.pinterest.co.uk/pin/123456789/',
    'https://www.acfun.cn/v/ac12345678',
    'https://v.youku.com/v_show/id_XNjA0MTY4NTQ4NA==.html',
    'https://v.qq.com/x/page/a1234567890.html',
    'http://youtube-dl.bandcamp.com/track/youtube-dl-test-song',
    'https://odysee.com/@gardeningincanada:b/plants-i-will-never-grow-again.-the:e',
    'https://archive.org/details/Cops1922',
    'https://imgur.com/A61SaA1',
    'https://www.linkedin.com/posts/mishalkhawaja_sendinblueviews-toronto-digitalmarketing-ugcPost-6850898786781339649-mM20',
    'https://www.snapchat.com/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYYWtidGhudGZpAX1TKn0JAX1TKnXJAAAAAA',
    'https://framatube.org/videos/watch/9c9de5e8-0a1e-484a-b099-e80766180a6d',
    'https://gab.com/SomeBitchIKnow/posts/107163961867310434',
    'https://truthsocial.com/@realDonaldTrump/posts/108779000807761862',
    'https://medal.tv/games/valorant/clips/jTBFnLKdLy15K',
    'https://rutube.ru/video/3eac3b4561676c17df9132a9a1e62e3e/',
    'http://coub.com/view/5u5n1',
    'http://ok.ru/video/1484130554189',
    'Shared link: https://www.youtube.com/watch?v=BaW_jenozKc',
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
