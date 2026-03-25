// scripts/migrate.js — migrates output/posts/*.md → src/content/
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'output/posts');
const PAGES_DIR = path.join(ROOT, 'output/pages');
const CONTENT_DIR = path.join(ROOT, 'src/content');

// ── Frontmatter parser ────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const yaml = match[1];
  const body = match[2];
  const data = {};

  const titleMatch = yaml.match(/^title:\s*"(.*)"/m);
  if (titleMatch) data.title = titleMatch[1].replace(/\\"/g, '"');

  const dateMatch = yaml.match(/^date:\s*(\S+)/m);
  if (dateMatch) data.date = dateMatch[1];

  const coverMatch = yaml.match(/^coverImage:\s*"(.*)"/m);
  if (coverMatch) data.coverImage = coverMatch[1];

  const catSection = yaml.match(/^categories:\s*\n((?:[ \t]+-[^\n]*\n?)*)/m);
  data.categories = catSection
    ? [...catSection[1].matchAll(/- "([^"]+)"/g)].map(m => m[1])
    : [];

  const tagSection = yaml.match(/^tags:\s*\n((?:[ \t]+-[^\n]*\n?)*)/m);
  data.tags = tagSection
    ? [...tagSection[1].matchAll(/- "([^"]+)"/g)].map(m => m[1])
    : [];

  return { data, content: body };
}

// ── Classification ────────────────────────────────────────────────────────────

const CANON_SUBCOLLECTIONS = {
  adventures: 'adventures',
  memoirs:    'memoirs',
  return:     'return',
  casebook:   'casebook',
  lastbow:    'last-bow',
  'last-bow': 'last-bow',
};

// Holmes novels: categories includes 'the-novels'; novel identified by tag
const HOLMES_NOVEL_TAGS = {
  'study-in-scarlet':      'a-study-in-scarlet',
  'hound-of-baskervilles': 'hound-of-the-baskervilles',
  'valley-of-fear':        'valley-of-fear',
  'sign-of-four':          'sign-of-four',
};

// Non-canon novels: categories includes 'novels'; novel identified by tag
const NOVEL_TAGS = {
  'girdlestone':              'girdlestone',
  'beyond-the-city':          'beyond-the-city',
  'lost-world':               'lost-world',
  'stark-munro':              'stark-munro-letters',
  'cloomber':                 'mystery-of-cloomber',
  'crime-of-the-congo':       'crime-of-the-congo',
  'tales-of-terror-and-mystery': 'tales-of-terror-and-mystery',
  'captain-sharkey':          'captain-sharkey',
  'my-friend-the-murderer':   'my-friend-the-murderer',
  'captain-of-the-polestar':  'captain-of-the-polestar',
  'poison-belt':              'poison-belt',
  'croxley-master-tag':       'croxley-master',
};

function classifyPost({ categories: cats, tags }) {
  // Canon short stories
  if (cats.includes('canon') && !cats.includes('the-novels')) {
    for (const [cat, sub] of Object.entries(CANON_SUBCOLLECTIONS)) {
      if (cats.includes(cat)) return { type: 'canon', sub };
    }
    return null;
  }

  // Holmes novels
  if (cats.includes('canon') && cats.includes('the-novels')) {
    for (const tag of tags) {
      if (HOLMES_NOVEL_TAGS[tag]) return { type: 'canon-novel', sub: HOLMES_NOVEL_TAGS[tag] };
    }
    return null;
  }

  // Non-canon novels
  if (cats.includes('novels')) {
    for (const tag of tags) {
      if (NOVEL_TAGS[tag]) return { type: 'novel', sub: NOVEL_TAGS[tag] };
    }
    return null;
  }

  return null;
}

// ── Content cleaning ──────────────────────────────────────────────────────────

function cleanContent(content) {
  // Strip WordPress nextpage markers
  content = content.replace(/<!--nextpage-->/g, '');

  // Strip pagination nav links (WXR exporter artifact)
  content = content.replace(/\[«\s*Previous Page\][^\n]*/g, '');
  content = content.replace(/\[Next Page\s*»\][^\n]*/g, '');
  content = content.replace(/\|\s*\[Next Page\s*»\][^\n]*/g, '');

  // Clean WordPress \[caption\] shortcodes — keep only the inner image markdown
  content = content.replace(/\\\[caption[\s\S]*?\\\[\/caption\\\]/g, (match) => {
    const imgMatch = match.match(/!\[[^\]]*\]\([^)]+(?:\s+"[^"]*")?\)/);
    return imgMatch ? imgMatch[0] : '';
  });

  // Strip old WordPress/Amazon linked images: [![...](img)](http://sirconandoyle.com/wp-content/...) → image only
  content = content.replace(
    /\[(!(?:\[[^\]]*\])\([^)]+\))\]\(https?:\/\/[^)]*(?:sirconandoyle\.com\/wp-content|amazon\.com)[^)]*\)/g,
    '$1'
  );

  // Fix image paths: (images/ → (/images/posts/
  content = content.replace(/\(images\//g, '(/images/posts/');

  // Collapse multiple blank lines to max two
  content = content.replace(/\n{3,}/g, '\n\n');

  return content.trim();
}

// ── Frontmatter writer ────────────────────────────────────────────────────────

const SKIP_TAGS = new Set(['novels-2', 'canon-2', 'sir-arthur-conan-doyle']);

function writeFrontmatter(data, extra) {
  const lines = ['---'];
  lines.push(`title: ${JSON.stringify(data.title || '')}`);
  lines.push(`date: ${data.date || ''}`);
  if (extra.collection) lines.push(`collection: ${JSON.stringify(extra.collection)}`);
  if (extra.novel)      lines.push(`novel: ${JSON.stringify(extra.novel)}`);
  if (typeof extra.order === 'number') lines.push(`order: ${extra.order}`);
  if (data.coverImage)  lines.push(`coverImage: "/images/posts/${data.coverImage}"`);
  const tags = (data.tags || []).filter(t => !SKIP_TAGS.has(t));
  if (tags.length) {
    lines.push('tags:');
    tags.forEach(t => lines.push(`  - ${JSON.stringify(t)}`));
  }
  lines.push('---');
  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

const postFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

// First pass: classify and group for date-based ordering
const groups = {}; // "type/sub" → [{file, date}]
const classified = [];
let excluded = 0;

for (const file of postFiles) {
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
  const { data, content } = parseFrontmatter(raw);
  const dest = classifyPost(data);

  if (!dest) { excluded++; continue; }

  classified.push({ file, data, content, dest });
  const key = `${dest.type}/${dest.sub}`;
  (groups[key] ??= []).push({ file, date: data.date ?? '' });
}

// Sort each group by date → assign order 1, 2, 3…
const orderMap = {};
for (const items of Object.values(groups)) {
  items.sort((a, b) => a.date.localeCompare(b.date));
  items.forEach((item, i) => { orderMap[item.file] = i + 1; });
}

// Second pass: write output files
let written = 0;
for (const { file, data, content, dest } of classified) {
  let destDir, extra;

  if (dest.type === 'canon') {
    destDir = path.join(CONTENT_DIR, 'canon', dest.sub);
    extra = { collection: dest.sub, order: orderMap[file] };
  } else if (dest.type === 'canon-novel') {
    destDir = path.join(CONTENT_DIR, 'canon', 'novels', dest.sub);
    extra = { novel: dest.sub, order: orderMap[file] };
  } else {
    destDir = path.join(CONTENT_DIR, 'novels', dest.sub);
    extra = { novel: dest.sub, order: orderMap[file] };
  }

  fs.mkdirSync(destDir, { recursive: true });

  const fm = writeFrontmatter(data, extra);
  const body = cleanContent(content);
  fs.writeFileSync(path.join(destDir, file), `${fm}\n\n${body}\n`);
  written++;
}

// ── Migrate pages ─────────────────────────────────────────────────────────────

const pagesDestDir = path.join(CONTENT_DIR, 'pages');
fs.mkdirSync(pagesDestDir, { recursive: true });

const pageFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.md'));
for (const file of pageFiles) {
  const raw = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
  const { data, content } = parseFrontmatter(raw);

  // Fix image paths in pages (pages use /images/pages/)
  const cleaned = cleanContent(content)
    .replace(/\(\/images\/posts\//g, '(/images/pages/');

  const lines = ['---'];
  lines.push(`title: ${JSON.stringify(data.title || '')}`);
  if (data.date) lines.push(`date: ${data.date}`);
  if (data.coverImage) lines.push(`coverImage: "/images/pages/${data.coverImage}"`);
  lines.push('---');
  const fm = lines.join('\n');

  fs.writeFileSync(path.join(pagesDestDir, file), `${fm}\n\n${cleaned}\n`);
}

// ── Report ────────────────────────────────────────────────────────────────────

console.log(`\nMigration complete.`);
console.log(`Posts written: ${written}  |  Excluded: ${excluded}  |  Pages: ${pageFiles.length}\n`);
console.log('Groups:');
for (const [key, items] of Object.entries(groups).sort()) {
  console.log(`  ${key.padEnd(40)} ${items.length} posts`);
}
