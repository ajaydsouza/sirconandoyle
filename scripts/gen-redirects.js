// scripts/gen-redirects.js — generates public/_redirects from migrated content
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src/content');

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];
  const get = (key) => yaml.match(new RegExp(`^${key}:\\s*(.+)`, 'm'))?.[1]?.trim().replace(/^"|"$/g, '');
  return {
    collection: get('collection'),
    novel: get('novel'),
  };
}

const lines = [
  '# sirconandoyle.com redirects — old WordPress flat URLs → new Astro paths',
  '',
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
  '# Individual content pages',
];

// Walk canon directory
function walkDir(dir, handler) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(fullPath, handler);
    else if (entry.name.endsWith('.md')) handler(fullPath);
  }
}

walkDir(path.join(CONTENT_DIR, 'canon'), (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { collection, novel } = parseFrontmatter(raw);
  const slug = path.basename(filePath, '.md');

  if (collection) {
    lines.push(`/${slug}/  /canon/${collection}/${slug}/  301`);
  } else if (novel) {
    // Determine subfolder (e.g. canon/novels/a-study-in-scarlet/)
    const novelDir = path.basename(path.dirname(filePath));
    lines.push(`/${slug}/  /canon/novels/${novelDir}/${slug}/  301`);
  }
});

walkDir(path.join(CONTENT_DIR, 'novels'), (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { novel } = parseFrontmatter(raw);
  const slug = path.basename(filePath, '.md');
  if (novel) {
    lines.push(`/${slug}/  /novels/${novel}/${slug}/  301`);
  }
});

const output = lines.join('\n') + '\n';
fs.writeFileSync(path.join(ROOT, 'public/_redirects'), output);
console.log(`Written public/_redirects (${lines.length} lines)`);
