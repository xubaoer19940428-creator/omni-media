import test from 'node:test';
import assert from 'node:assert/strict';
import {
  API_ORIGIN,
  MAX_INPUT_LENGTH,
  SUPPORTED_PLATFORMS,
  detectPlatform,
  displayAuthor,
  extractUrlFromText,
  formatDuration,
  normalizeResult,
  safeHttpUrl
} from '../lib/core.mjs';

test('production API origin is HTTPS', () => {
  assert.equal(API_ORIGIN, 'https://useomnimedia.com');
});

test('registry contains the explicit 36-platform contract in backend order', () => {
  assert.deepEqual(SUPPORTED_PLATFORMS.map(({ key }) => key), [
    'tiktok', 'douyin', 'instagram', 'telegram', 'youtube', 'twitter',
    'facebook', 'bilibili', 'weibo', 'reddit', 'dailymotion',
    'twitch', 'pinterest', 'acfun', 'youku', 'tencent_video',
    'soundcloud', 'vk', 'niconico', 'streamable', 'loom', 'kick', 'bitchute',
    'bandcamp', 'odysee', 'archive_org', 'imgur', 'linkedin', 'snapchat',
    'peertube', 'gab', 'truthsocial', 'medaltv', 'rutube', 'coub',
    'odnoklassniki'
  ]);
});

test('detects exact and nested supported domains', () => {
  assert.equal(detectPlatform('https://www.tiktok.com/@x/video/1')?.key, 'tiktok');
  assert.equal(detectPlatform('https://v.douyin.com/abc/')?.key, 'douyin');
  assert.equal(detectPlatform('https://clips.twitch.tv/Example')?.key, 'twitch');
  assert.equal(detectPlatform('https://v.qq.com/x/cover/example.html')?.key, 'tencent_video');
  assert.equal(detectPlatform('https://youtube-dl.bandcamp.com/track/youtube-dl-test-song')?.key, 'bandcamp');
  assert.equal(detectPlatform('https://odysee.com/@creator:1/video:2')?.key, 'odysee');
  assert.equal(detectPlatform('https://archive.org/details/Cops1922')?.key, 'archive_org');
  assert.equal(detectPlatform('https://www.tumblr.com/example/123'), null);
  assert.equal(detectPlatform('https://vimeo.com/76979871'), null);
  assert.equal(detectPlatform('https://framatube.org/videos/watch/example')?.key, 'peertube');
});

test('rejects suffix confusion, unsafe schemes, invalid URLs, and oversized input', () => {
  assert.equal(detectPlatform('https://tiktok.com.evil.example/video/1'), null);
  assert.equal(detectPlatform('javascript:alert(1)'), null);
  assert.equal(detectPlatform('chrome://extensions'), null);
  assert.equal(detectPlatform('not a URL'), null);
  assert.equal(detectPlatform(`https://youtube.com/${'x'.repeat(5000)}`), null);
});

test('safeHttpUrl accepts only HTTP(S)', () => {
  assert.equal(safeHttpUrl('https://example.com/a'), 'https://example.com/a');
  assert.equal(safeHttpUrl('http://example.com/a'), 'http://example.com/a');
  assert.equal(safeHttpUrl('data:text/html,hello'), '');
});

test('extracts the first public URL from links and complete share text', () => {
  assert.equal(
    extractUrlFromText('3.21 复制打开抖音，看看【示例】 https://v.douyin.com/abc123/ 作品'),
    'https://v.douyin.com/abc123/'
  );
  assert.equal(
    extractUrlFromText('First https://youtu.be/one, then https://youtu.be/two'),
    'https://youtu.be/one'
  );
  assert.equal(extractUrlFromText('https://www.tiktok.com/@x/video/1）。'), 'https://www.tiktok.com/@x/video/1');
});

test('rejects text without a safe bounded HTTP(S) URL', () => {
  assert.equal(extractUrlFromText('not a link'), '');
  assert.equal(extractUrlFromText('javascript:alert(1)'), '');
  assert.equal(extractUrlFromText(`https://youtube.com/${'x'.repeat(MAX_INPUT_LENGTH)}`), '');
});

test('normalizes public result fields without trusting arbitrary URLs', () => {
  const result = normalizeResult({
    success: true,
    title: ' Demo ',
    author: { nickname: 'Creator' },
    platform: 'TikTok',
    platform_key: 'tiktok',
    cover_url: 'javascript:alert(1)',
    duration: 97,
    original_url: 'https://tiktok.com/@x/video/1'
  }, 'https://fallback.invalid');
  assert.deepEqual(result, {
    title: 'Demo', author: 'Creator', platform: 'TikTok', platformKey: 'tiktok',
    coverUrl: '', duration: '1:37', originalUrl: 'https://tiktok.com/@x/video/1'
  });
});

test('author and duration formatting handle alternate shapes', () => {
  assert.equal(displayAuthor({ name: 'A' }), 'A');
  assert.equal(displayAuthor('B'), 'B');
  assert.equal(formatDuration(5), '0:05');
  assert.equal(formatDuration(0), '');
});
