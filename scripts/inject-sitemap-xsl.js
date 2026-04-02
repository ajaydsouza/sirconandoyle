/**
 * Post-build script: injects an XSL stylesheet reference into generated sitemap XML files
 * so browsers render them as styled HTML pages.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST_DIR = join(import.meta.dirname, '..', 'dist', 'client');
const XSL_PI = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';

const files = await readdir(DIST_DIR);
const sitemaps = files.filter(f => f.startsWith('sitemap') && f.endsWith('.xml'));

for (const file of sitemaps) {
  const filePath = join(DIST_DIR, file);
  let content = await readFile(filePath, 'utf-8');

  // Skip if already has a stylesheet
  if (content.includes('xml-stylesheet')) continue;

  // Insert after the XML declaration
  content = content.replace(
    /(<\?xml[^?]*\?>)/,
    `$1\n${XSL_PI}`
  );

  await writeFile(filePath, content, 'utf-8');
  console.log(`Injected XSL stylesheet into ${file}`);
}
