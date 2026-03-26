// scripts/gen-redirects.js — generates public/_redirects from migrated content
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src/content');
const REDIRECTS_FILE = path.join(ROOT, 'public/_redirects');

// Manual redirects and aliases that don't follow a simple pattern
const manualRedirects = [
  '# Collection indexes',
  '/the-adventures-of-sherlock-holmes/   /canon/adventures/   301',
  '/the-memoirs-of-sherlock-holmes/      /canon/memoirs/      301',
  '/the-return-of-sherlock-holmes/       /canon/return/       301',
  '/the-case-book-of-sherlock-holmes/    /canon/casebook/     301',
  '/his-last-bow/                        /canon/last-bow/     301',
  '/the-novels-of-sherlock-holmes/       /canon/novels/       301',
  '/novels-sir-arthur-conan-doyle/       /novels/             301',
  '/the-canon/                           /canon/              301',
  '/biography-of-sir-arthur-conan-doyle/ /about/              301',
  '',
  '# Individual content mappings',
];

const redirects = new Map();

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.name.endsWith('.md')) {
      callback(fullPath);
    }
  }
}

// 1. Process 'canon' collection
walkDir(path.join(CONTENT_DIR, 'canon'), (filePath) => {
  const relPath = path.relative(path.join(CONTENT_DIR, 'canon'), filePath);
  const parts = relPath.split(path.sep);
  const slug = path.basename(filePath, '.md');
  
  if (parts.length >= 2) {
    const collection = parts[0];
    // Special case for canon novels which are nested deeper
    if (collection === 'novels' && parts.length >= 3) {
      const novelDir = parts[1];
      // Intro file (slug matches novel dir) goes to novel index, not a sub-page
      if (slug === novelDir || slug === `the-${novelDir}`) {
        redirects.set(slug, `/canon/novels/${novelDir}/`);
      } else {
        redirects.set(slug, `/canon/novels/${novelDir}/${slug}/`);
      }
    } else {
      redirects.set(slug, `/canon/${collection}/${slug}/`);
    }
  }
});

// 2. Process 'novels' collection (non-Holmes)
walkDir(path.join(CONTENT_DIR, 'novels'), (filePath) => {
  const relPath = path.relative(path.join(CONTENT_DIR, 'novels'), filePath);
  const parts = relPath.split(path.sep);
  const slug = path.basename(filePath, '.md');

  if (parts.length >= 2) {
    const novel = parts[0];
    // Intro file (slug matches novel dir) goes to novel index, not a sub-page
    if (slug === novel || slug === `the-${novel}`) {
      redirects.set(slug, `/novels/${novel}/`);
    } else {
      redirects.set(slug, `/novels/${novel}/${slug}/`);
    }
  }
});

// 3. Process 'pages' collection
walkDir(path.join(CONTENT_DIR, 'pages'), (filePath) => {
  const slug = path.basename(filePath, '.md');
  // Pages are already at the root, so no redirect needed UNLESS we want to ensure it
  // But WordPress was also at root. So /about/ -> /about/ is a no-op 301.
  // We only add it if it's NOT a no-op.
  // However, WordPress %postname% urls were /slug/ and Astro is /slug/ by default.
});

// Extract slugs already covered by manual redirects to avoid duplicates
const manualSlugs = new Set(
  manualRedirects
    .filter(line => line.startsWith('/'))
    .map(line => line.trim().split(/\s+/)[0].replace(/^\/|\/$/g, ''))
);

// Generate the file content
const lines = [
  '# sirconandoyle.com redirects — generated on ' + new Date().toISOString(),
  '',
  ...manualRedirects,
];

// Add automated redirects, avoiding duplicates and no-ops
for (const [slug, newPath] of redirects) {
  const oldPath = `/${slug}/`;
  // Skip if already covered by a manual redirect or if it's a no-op
  if (manualSlugs.has(slug) || oldPath === newPath) continue;
  lines.push(`${oldPath.padEnd(40)} ${newPath.padEnd(50)} 301`);
}

fs.writeFileSync(REDIRECTS_FILE, lines.join('\n') + '\n');
console.log(`Successfully generated ${REDIRECTS_FILE} (${lines.length} lines)`);

