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
const profileResultSource = fs.readFileSync(
  new URL('../frontend/src/components/ProfileResult.tsx', import.meta.url),
  'utf8',
);
const homePageSource = fs.readFileSync(
  new URL('../frontend/src/app/page.tsx', import.meta.url),
  'utf8',
);
const footerSource = fs.readFileSync(
  new URL('../frontend/src/components/Footer.tsx', import.meta.url),
  'utf8',
);
const fallbackPageSource = fs.readFileSync(
  new URL('../templates/index.html', import.meta.url),
  'utf8',
);
const nextConfigSource = fs.readFileSync(
  new URL('../frontend/next.config.mjs', import.meta.url),
  'utf8',
);
const i18nSource = fs.readFileSync(
  new URL('../frontend/src/lib/i18n.tsx', import.meta.url),
  'utf8',
);
assert.match(workbenchSource, /t\.workbench\.storagePolicy/);
assert.match(i18nSource, /512 MB/);
assert.match(i18nSource, /10 分钟有效/);
assert.match(homePageSource, /URLSearchParams\(window\.location\.search\)/);
assert.match(homePageSource, /get\('auto'\) === '1'/);
assert.match(workbenchSource, /handleParse\(initialUrl\)/);
assert.match(workbenchSource, /parseProfileUrl/);
assert.match(workbenchSource, /t\.profile\.creatorMode/);
assert.match(profileResultSource, /tikhub-card/);
assert.match(profileResultSource, /dark:/);
assert.match(i18nSource, /creatorMode: 'Creator profile'/);
assert.match(i18nSource, /creatorMode: '个人主页'/);
assert.match(nextConfigSource, /trailingSlash:\s*true/);
assert.match(footerSource, /mailto:xubaoer199400428@gmail\.com/);
assert.match(footerSource, /t\.footer\.contact/);
assert.match(fallbackPageSource, /mailto:xubaoer199400428@gmail\.com/);

const platformCases = new Map([
  ['https://www.youtube.com/watch?v=abc', 'youtube'],
  ['https://www.pinterest.co.uk/pin/123', 'pinterest'],
  ['https://media.redditmedia.com/example', 'reddit'],
  ['https://player.vimeopro.com/video/123', 'unknown'],
  ['https://youtube.com.evil.example/watch?v=abc', 'unknown'],
  ['https://notiktok.com/video/123', 'unknown'],
]);
for (const [url, expected] of platformCases) {
  assert.equal(api.detectPlatformKey(url), expected, url);
}

const calls = [];
const profileCalls = [];
const downloadCalls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  const body = JSON.parse(options.body);
  if (url.endsWith('/api/profile/parse')) {
    profileCalls.push(body);
    return {
      ok: true,
      async json() {
        return {
          success: true,
          profile: { name: 'Example creator' },
          items: [],
          count: 0,
          has_more: false,
          next_cursor: null,
        };
      },
    };
  }
  if (url.endsWith('/api/download')) {
    downloadCalls.push(body);
    return {
      ok: true,
      async json() {
        return {
          success: true,
          filename: 'youtube_example.mp4',
          download_url: '/download/youtube_example.mp4',
        };
      },
    };
  }
  const urls = body.urls;
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
  await api.triggerServerDownload('https://www.youtube.com/watch?v=example', {
    formatSelector: '137+bestaudio/137',
  });
  await api.triggerServerDownload('https://www.youtube.com/watch?v=audio', {
    audioOnly: true,
  });
  assert.deepEqual(downloadCalls, [
    {
      original_url: 'https://www.youtube.com/watch?v=example',
      format_selector: '137+bestaudio/137',
    },
    {
      original_url: 'https://www.youtube.com/watch?v=audio',
      audio_only: true,
    },
  ]);

  const profile = await api.parseProfileUrl('https://www.youtube.com/@example', 6, 12);
  assert.equal(profile.profile.name, 'Example creator');
  assert.deepEqual(profileCalls, [{
    url: 'https://www.youtube.com/@example',
    limit: 6,
    cursor: 12,
  }]);

  globalThis.fetch = async () => ({
    ok: false,
    async json() { throw new SyntaxError('not json'); },
  });
  await assert.rejects(
    api.parseProfileUrl('https://www.youtube.com/@example'),
    /profile parsing failed/i,
  );
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

console.log(`Next frontend contract passed (${platformCases.size} domain cases, profile parse, batch 10/10/1, queue cap 40).`);
