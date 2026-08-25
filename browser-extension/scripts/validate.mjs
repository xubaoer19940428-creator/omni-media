import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_ORIGIN, SUPPORTED_PLATFORMS } from '../lib/core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (path) => JSON.parse(await readFile(join(root, path), 'utf8'));
const manifest = await readJson('manifest.json');

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.version, '1.0.0');
assert.deepEqual(manifest.permissions, ['activeTab', 'storage']);
assert.deepEqual(manifest.host_permissions, [`${API_ORIGIN}/*`]);
assert.equal(manifest.action.default_popup, 'popup.html');
assert.equal(SUPPORTED_PLATFORMS.length, 22);
assert.ok(!manifest.background, 'The popup-only MVP must not include a persistent background worker');

const runtimeFiles = [
  'manifest.json', 'popup.html', 'popup.css', 'popup.js', 'lib/core.mjs',
  'assets/icon.svg', 'assets/icon-16.png', 'assets/icon-32.png',
  'assets/icon-48.png', 'assets/icon-128.png',
  '_locales/en/messages.json', '_locales/zh_CN/messages.json'
];
await Promise.all(runtimeFiles.map((path) => access(join(root, path))));

const html = await readFile(join(root, 'popup.html'), 'utf8');
assert.match(html, /<script type="module" src="popup\.js"><\/script>/);
assert.doesNotMatch(html, /<script[^>]+src="https?:\/\//i, 'Remote script code is forbidden');
assert.doesNotMatch(html, /on(click|load|error)=/i, 'Inline event handlers are forbidden');
assert.match(html, /https:\/\/useomnimedia\.com\/privacy\/extension\//);
assert.match(html, /<textarea[^>]+id="media-input"/);
assert.match(html, /id="use-tab-button"/);

const popupJs = await readFile(join(root, 'popup.js'), 'utf8');
assert.doesNotMatch(popupJs, /\beval\s*\(|new\s+Function\s*\(/, 'Dynamic code execution is forbidden');
assert.match(popupJs, /credentials:\s*'omit'/);
assert.match(popupJs, /referrerPolicy:\s*'no-referrer'/);
assert.match(popupJs, /extractUrlFromText/);
assert.doesNotMatch(popupJs, /await loadActiveTab\(\)/, 'Opening the popup must not read the active tab');

for (const path of ['PRIVACY.md', 'STORE_LISTING.md']) {
  const disclosure = await readFile(join(root, path), 'utf8');
  assert.match(disclosure, /cover-image proxy/i, `${path} must disclose actual API usage`);
  assert.match(disclosure, /does not call the download endpoint/i, `${path} must distinguish the website download flow`);
}

for (const locale of ['en', 'zh_CN']) {
  const messages = await readJson(`_locales/${locale}/messages.json`);
  for (const key of ['extensionName', 'extensionDescription', 'actionTitle']) {
    assert.equal(typeof messages[key]?.message, 'string');
    assert.ok(messages[key].message.trim());
  }
}

for (const path of runtimeFiles) {
  const info = await stat(join(root, path));
  assert.ok(info.size < 1_000_000, `${path} unexpectedly exceeds 1 MB`);
}

for (const [path, expectedWidth, expectedHeight] of [
  ['store-assets/omnimedia-extension-1280x800.png', 1280, 800],
  ['store-assets/omnimedia-extension-promo-440x280.png', 440, 280]
]) {
  const png = await readFile(join(root, path));
  assert.equal(png.subarray(1, 4).toString(), 'PNG', `${path} must be a PNG`);
  assert.equal(png.readUInt32BE(16), expectedWidth, `${path} has the wrong width`);
  assert.equal(png.readUInt32BE(20), expectedHeight, `${path} has the wrong height`);
  if (path.includes('promo-440x280')) {
    assert.equal(png[25], 2, `${path} must be full-bleed RGB without transparency`);
  }
}

const promoSvg = await readFile(join(root, 'store-assets/omnimedia-extension-promo-440x280.svg'), 'utf8');
assert.doesNotMatch(promoSvg, /(?:href|xlink:href)=["']\.\./, 'Promo SVG must be self-contained');
assert.doesNotMatch(promoSvg, /One click|Parse the page/i, 'Promo should stay text-light and locale-neutral');

console.log(`Validated Manifest V3 package: ${runtimeFiles.length} runtime files, ${SUPPORTED_PLATFORMS.length} platforms.`);
