import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));

test('uses a narrow Manifest V3 permission set', () => {
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['activeTab', 'storage']);
  assert.deepEqual(manifest.host_permissions, ['https://useomnimedia.com/*']);
  assert.equal(manifest.content_scripts, undefined);
  assert.equal(manifest.background, undefined);
});

test('keeps executable code local', async () => {
  const html = await readFile(join(root, manifest.action.default_popup), 'utf8');
  const popup = await readFile(join(root, 'popup.js'), 'utf8');
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//i);
  assert.doesNotMatch(html, /<script(?![^>]+src=)[^>]*>/i);
  assert.doesNotMatch(popup, /api\/download/, 'Long-running downloads belong in the full web app');
  assert.match(popup, /params\.set\('auto', '1'\)/, 'Secure-download handoff should auto-parse in the web app');
  assert.match(html, /<textarea[^>]+id="media-input"/);
  assert.match(popup, /extractUrlFromText/);
  assert.match(popup, /use-tab-button/);
  assert.doesNotMatch(popup, /await loadActiveTab\(\)/, 'The active tab must not be read on popup open');
});

test('English and Simplified Chinese store locales have matching keys', async () => {
  const en = JSON.parse(await readFile(join(root, '_locales/en/messages.json'), 'utf8'));
  const zh = JSON.parse(await readFile(join(root, '_locales/zh_CN/messages.json'), 'utf8'));
  assert.deepEqual(Object.keys(en).sort(), Object.keys(zh).sort());
});
