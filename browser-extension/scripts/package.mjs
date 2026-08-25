import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
const dist = join(root, 'dist');
const filename = `omnimedia-browser-extension-${manifest.version}.zip`;
const output = join(dist, filename);
const checksum = `${output}.sha256`;

const runtimeEntries = [
  'manifest.json', 'popup.html', 'popup.css', 'popup.js', 'lib', 'assets', '_locales'
];

await mkdir(dist, { recursive: true });
await rm(output, { force: true });
await rm(checksum, { force: true });

const zipped = spawnSync('zip', ['-X', '-q', '-r', output, ...runtimeEntries], {
  cwd: root,
  encoding: 'utf8'
});
if (zipped.status !== 0) {
  throw new Error(zipped.stderr || 'zip failed');
}

const bytes = await readFile(output);
const digest = createHash('sha256').update(bytes).digest('hex');
await writeFile(checksum, `${digest}  ${filename}\n`);
console.log(`Created ${output}`);
console.log(`SHA-256 ${digest}`);
