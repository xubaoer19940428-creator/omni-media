import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const layoutPath = fileURLToPath(new URL('../frontend/src/app/layout.tsx', import.meta.url));
const layout = await readFile(layoutPath, 'utf8');

assert.match(layout, /G-6LCMTWDMHX/);
assert.match(layout, /googletagmanager\.com\/gtag\/js/);
assert.match(layout, /send_page_view: false/);
assert.match(layout, /page_path: window\.location\.pathname/);
assert.match(layout, /page_location: window\.location\.origin \+ window\.location\.pathname/);
assert.match(layout, /hostname === 'useomnimedia\.com'/);
assert.doesNotMatch(layout, /page_location: window\.location\.href/);
assert.doesNotMatch(layout, /window\.location\.(search|hash)/);
assert.match(
  layout,
  /if \(window\.location\.hostname === 'useomnimedia\.com'\) \{[\s\S]*gtag\('config'/,
);

console.log('Google Analytics contract passed (production-only, query-free page views).');
