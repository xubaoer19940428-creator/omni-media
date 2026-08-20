import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const frontendRequire = createRequire(new URL('../frontend/package.json', import.meta.url));
const ts = frontendRequire('typescript');

function transpile(path) {
  return ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
}

function evaluateCommonJs(source, requireStub = frontendRequire) {
  const module = { exports: {} };
  Function('require', 'module', 'exports', source)(requireStub, module, module.exports);
  return module.exports;
}

const constants = evaluateCommonJs(
  transpile(new URL('../frontend/src/lib/constants.ts', import.meta.url)),
);
const api = evaluateCommonJs(
  transpile(new URL('../frontend/src/lib/api.ts', import.meta.url)),
  (specifier) => {
    if (specifier === './constants') return constants;
    return frontendRequire(specifier);
  },
);

const resultCardSource = fs.readFileSync(
  new URL('../frontend/src/components/ResultCard.tsx', import.meta.url),
  'utf8',
);
const batchCenterSource = fs.readFileSync(
  new URL('../frontend/src/components/BatchCenter.tsx', import.meta.url),
  'utf8',
);
assert.doesNotMatch(resultCardSource, /href=\{data\.video_url\}/);
assert.doesNotMatch(batchCenterSource, /window\.open\(task\.result\.video_url/);
assert.match(resultCardSource, /triggerServerDownload/);
assert.match(batchCenterSource, /triggerServerDownload/);
assert.match(resultCardSource, /onError=\{\(\) => setVideoPreviewFailed\(true\)\}/);

const workbenchSource = fs.readFileSync(
  new URL('../frontend/src/components/Workbench.tsx', import.meta.url),
  'utf8',
);
const i18nSource = fs.readFileSync(
  new URL('../frontend/src/lib/i18n.tsx', import.meta.url),
  'utf8',
);
assert.match(workbenchSource, /t\.workbench\.storagePolicy/);
assert.match(i18nSource, /512 MB/);
assert.match(i18nSource, /10 分钟有效/);

const platformCases = new Map([
  ['https://www.youtube.com/watch?v=abc', 'youtube'],
  ['https://www.pinterest.co.uk/pin/123', 'pinterest'],
  ['https://media.redditmedia.com/example', 'reddit'],
  ['https://player.vimeopro.com/video/123', 'vimeo'],
  ['https://youtube.com.evil.example/watch?v=abc', 'unknown'],
  ['https://notiktok.com/video/123', 'unknown'],
]);
for (const [url, expected] of platformCases) {
  assert.equal(api.detectPlatformKey(url), expected, url);
}

const calls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (_url, options) => {
  const urls = JSON.parse(options.body).urls;
  calls.push(urls);
  return {
    ok: true,
    async json() {
      return {
        success: true,
        results: urls.map((original_url) => ({ success: true, original_url })),
      };
    },
  };
};

try {
  const urls = Array.from({ length: 21 }, (_, index) =>
    `https://www.youtube.com/watch?v=${index}`,
  );
  const response = await api.batchParseMediaUrls(urls);
  assert.deepEqual(calls.map((batch) => batch.length), [10, 10, 1]);
  assert.deepEqual(
    response.results.map((result) => result.original_url),
    urls,
  );

  await assert.rejects(
    api.batchParseMediaUrls(Array.from({ length: 41 }, (_, index) =>
      `https://www.youtube.com/watch?v=${index}`,
    )),
    /maximum of 40/i,
  );
  assert.equal(calls.length, 3, 'oversized queue should not call the API');
} finally {
  globalThis.fetch = originalFetch;
}

console.log(`Next frontend contract passed (${platformCases.size} domain cases, batch 10/10/1, queue cap 40).`);
