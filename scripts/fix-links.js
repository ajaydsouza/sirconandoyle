// scripts/fix-links.js
// Rewrites absolute sirconandoyle.com links in all content .md files:
//   - Internal links → new relative URLs (using _redirects map)
//   - Dead old-site / wp-content links → unlinked plain text
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src/content');
const REDIRECTS_FILE = path.join(ROOT, 'public/_redirects');

// ── Build old-slug → new-path map from _redirects ────────────────────────────

const redirectMap = new Map(); // e.g. "/a-scandal-in-bohemia/" → "/canon/adventures/a-scandal-in-bohemia/"

for (const line of fs.readFileSync(REDIRECTS_FILE, 'utf8').split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const parts = line.trim().split(/\s+/);
  if (parts.length >= 2) redirectMap.set(parts[0], parts[1]);
}

// ── URL rewriter ──────────────────────────────────────────────────────────────

const SITE_RE = /https?:\/\/(?:www\.)?sirconandoyle\.com(\/[^\s)"']*)?/g;

function rewriteUrl(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/?$/, '/').replace(/^\/\//, '/');

    // Known redirect → new relative path
    if (redirectMap.has(path)) return redirectMap.get(path);

    // Paginated WordPress URL e.g. /a-scandal-in-bohemia/2/ → strip page suffix and try again
    const withoutPage = path.replace(/\/\d+\/$/, '/');
    if (withoutPage !== path && redirectMap.has(withoutPage)) return redirectMap.get(withoutPage);

    // Old site, wp-content, wp-admin, cropped images etc. → return null = unlink
    if (/\/(oldsite|wp-content|wp-admin|wp-login|feed|xmlrpc|tag\/|category\/)/.test(path)) return null;

    // Unmapped internal path — keep as relative (it may just work or 404 gracefully)
    return path;
  } catch {
    return null;
  }
}

// ── Process all .md files ─────────────────────────────────────────────────────

function walkDir(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, cb);
    else if (entry.name.endsWith('.md')) cb(full);
  }
}

let filesChanged = 0;
let linksRewritten = 0;
let linksUnlinked = 0;

walkDir(CONTENT_DIR, (filePath) => {
  let text = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace markdown links: [text](http://sirconandoyle.com/... "optional title")
  // Captures: label, url, optional title
  text = text.replace(/\[([^\]]*)\]\((https?:\/\/(?:www\.)?sirconandoyle\.com[^\s")]*)((?:\s+"[^"]*")?)?\)/g, (match, label, url, title = '') => {
    const newUrl = rewriteUrl(url);
    if (newUrl === null) {
      // For linked images, keep just the image markdown; for text links, keep text
      linksUnlinked++;
      changed = true;
      return label.startsWith('!') ? label : label;
    }
    if (newUrl !== url) {
      linksRewritten++;
      changed = true;
      return `[${label}](${newUrl}${title})`;
    }
    return match;
  });

  // Replace bare/naked sirconandoyle.com URLs left over (not in markdown link syntax)
  text = text.replace(SITE_RE, (url) => {
    const newUrl = rewriteUrl(url);
    if (newUrl === null) return '';
    return newUrl;
  });

  if (changed) {
    fs.writeFileSync(filePath, text);
    filesChanged++;
  }
});

console.log(`Done. Files changed: ${filesChanged} | Links rewritten: ${linksRewritten} | Links unlinked: ${linksUnlinked}`);
