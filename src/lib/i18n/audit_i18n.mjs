/**
 * TraderLogPro — i18n Full Audit
 * Finds hardcoded strings AND missing $t() keys in .svelte files
 * Run: node src/lib/i18n/audit_i18n.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const BASE_DIR = 'c:/PROJETOS/TraderLogPro';
const SRC_DIR = join(BASE_DIR, 'src');
const LOCALE_DIR = join(BASE_DIR, 'src/lib/i18n/locales/pt-BR');

const EXCLUDE_DIRS = new Set(['node_modules', '.svelte-kit', 'build', 'dist', '__tests__', '.git']);
const EXCLUDE_FILES = new Set(['audit_i18n.mjs', 'validate_i18n.py', 'index.ts']);

// ─── Load all pt-BR keys (flattened) ────────────────────────────────────────
function flattenKeys(obj, prefix = '') {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(result, flattenKeys(v, full));
    } else {
      result[full] = v;
    }
  }
  return result;
}

function loadPtBrKeys() {
  const files = readdirSync(LOCALE_DIR).filter(f => f.endsWith('.json'));
  const allKeys = {};
  const byFile = {};
  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(LOCALE_DIR, file), 'utf8'));
    const flat = flattenKeys(raw);
    byFile[file] = flat;
    for (const [k, v] of Object.entries(flat)) allKeys[k] = { value: v, file };
  }
  return { allKeys, byFile };
}

// ─── Walk source files ───────────────────────────────────────────────────────
function walkDir(dir, result = []) {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkDir(full, result);
    else if (entry.endsWith('.svelte') || (entry.endsWith('.ts') && !entry.includes('.test.')))
      result.push(full);
  }
  return result;
}

// ─── Extract $t() keys ────────────────────────────────────────────────────────
function extractTKeys(content) {
  const keys = new Set();
  // Match $t('key') and $t("key") — static keys only
  const re = /\$t\(\s*['"]([^'"{}]+)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) keys.add(m[1]);
  return keys;
}

// ─── Find hardcoded text in Svelte templates ─────────────────────────────────
function findHardcodedStrings(content, filepath) {
  const hits = [];
  const lines = content.split('\n');
  
  // Patterns that signal hardcoded text (outside of script tags)
  // We skip script blocks and style blocks
  let inScript = false, inStyle = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();
    
    if (trimmed.startsWith('<script')) { inScript = true; continue; }
    if (trimmed.startsWith('</script>')) { inScript = false; continue; }
    if (trimmed.startsWith('<style')) { inStyle = true; continue; }
    if (trimmed.startsWith('</style>')) { inStyle = false; continue; }
    if (inScript || inStyle) continue;
    
    // Skip empty lines, HTML-only lines, Svelte control flow
    if (!trimmed || trimmed.startsWith('{#') || trimmed.startsWith('{/') || 
        trimmed.startsWith('{:') || trimmed.startsWith('<!--')) continue;
    
    // Check for text content between tags (not $t, not expressions)
    // Pattern: >SomeText< where text is 3+ chars, not pure numbers/symbols
    const textContent = trimmed.match(/>([^<{]{3,})</g);
    if (textContent) {
      for (const match of textContent) {
        const text = match.replace(/^>/, '').replace(/<$/, '').trim();
        if (
          text.length >= 3 &&
          !/^\d+[\d.,\s%]*$/.test(text) &&  // skip pure numbers
          !/^[^a-zA-ZÀ-ÿ]+$/.test(text) &&  // skip no-letter strings
          !text.includes('{') &&              // skip expressions
          !text.includes('$t') &&            // skip already translated
          !/^(true|false|null|undefined)$/.test(text)
        ) {
          hits.push({ line: lineNum, text, context: 'text_content', raw: trimmed });
        }
      }
    }
    
    // Check title= and placeholder= attributes with hardcoded strings
    const attrMatches = trimmed.matchAll(/(?:title|placeholder|label|aria-label)="([^"]{3,})"/g);
    for (const attr of attrMatches) {
      const text = attr[1];
      if (!text.includes('{') && !/^\d+$/.test(text)) {
        hits.push({ line: lineNum, text, context: 'attribute', raw: trimmed });
      }
    }
  }
  
  return hits;
}

// ─── Main ────────────────────────────────────────────────────────────────────
const { allKeys: ptBrKeys } = loadPtBrKeys();
const files = walkDir(SRC_DIR);

const report = {
  missingKeys: {},    // $t('key') used but not in pt-BR
  hardcoded: {},      // text content not using $t()
};

const usedKeys = new Set();

for (const filepath of files) {
  const content = readFileSync(filepath, 'utf8');
  const rel = relative(BASE_DIR, filepath).replace(/\\/g, '/');

  // Skip i18n files
  if (rel.includes('i18n')) continue;
  
  // Collect $t() keys
  const tKeys = extractTKeys(content);
  for (const k of tKeys) usedKeys.add(k);
  
  // Find missing keys
  const missing = [...tKeys].filter(k => !ptBrKeys[k]);
  if (missing.length > 0) {
    report.missingKeys[rel] = missing.sort();
  }
  
  // Find hardcoded strings (only in .svelte files for template analysis)
  if (filepath.endsWith('.svelte')) {
    const hardcoded = findHardcodedStrings(content, filepath);
    if (hardcoded.length > 0) {
      report.hardcoded[rel] = hardcoded;
    }
  }
}

// ─── Output ──────────────────────────────────────────────────────────────────
console.log('='.repeat(72));
console.log('TraderLogPro — i18n FULL AUDIT REPORT');
console.log('='.repeat(72));

// SECTION 1: Missing $t() keys
const totalMissing = Object.values(report.missingKeys).flat().length;
console.log(`\n❌ MISSING KEYS IN PT-BR (${totalMissing} keys across ${Object.keys(report.missingKeys).length} files)`);
console.log('-'.repeat(72));

// Group by route/component section
const bySection = {};
for (const [file, keys] of Object.entries(report.missingKeys)) {
  const section = file.split('/').slice(0, 4).join('/');
  if (!bySection[section]) bySection[section] = {};
  bySection[section][file] = keys;
}

for (const [section, files] of Object.entries(bySection).sort()) {
  console.log(`\n  📁 ${section}`);
  for (const [file, keys] of Object.entries(files)) {
    console.log(`     ${file.split('/').pop()}`);
    for (const k of keys) console.log(`       ✗ ${k}`);
  }
}

// SECTION 2: Hardcoded strings (grouped by route)
const totalHardcoded = Object.values(report.hardcoded).flat().length;
console.log(`\n\n⚠️  HARDCODED STRINGS IN TEMPLATES (${totalHardcoded} occurrences)`);
console.log('-'.repeat(72));

const svelteRoutes = Object.entries(report.hardcoded)
  .filter(([f]) => f.includes('routes'))
  .sort(([a], [b]) => a.localeCompare(b));

const svelteComponents = Object.entries(report.hardcoded)
  .filter(([f]) => f.includes('components'))
  .sort(([a], [b]) => a.localeCompare(b));

console.log('\n  📁 ROUTES (Pages):');
for (const [file, hits] of svelteRoutes) {
  const uniqueTexts = [...new Set(hits.map(h => h.text))];
  console.log(`     ${file}`);
  for (const t of uniqueTexts.slice(0, 8)) {
    console.log(`       ~ "${t}"`);
  }
  if (uniqueTexts.length > 8) console.log(`       ... +${uniqueTexts.length - 8} more`);
}

console.log('\n  📁 COMPONENTS:');
for (const [file, hits] of svelteComponents) {
  const uniqueTexts = [...new Set(hits.map(h => h.text))];
  console.log(`     ${file}`);
  for (const t of uniqueTexts.slice(0, 5)) {
    console.log(`       ~ "${t}"`);
  }
  if (uniqueTexts.length > 5) console.log(`       ... +${uniqueTexts.length - 5} more`);
}

// SECTION 3: Summary
console.log('\n' + '='.repeat(72));
console.log('📊 SUMMARY');
console.log('='.repeat(72));
console.log(`  pt-BR keys defined:     ${Object.keys(ptBrKeys).length}`);
console.log(`  $t() keys in source:    ${usedKeys.size}`);
console.log(`  Missing from pt-BR:     ${totalMissing}`);
console.log(`  Hardcoded strings:      ${totalHardcoded}`);
console.log(`  Files with issues:      ${Object.keys(report.missingKeys).length + Object.keys(report.hardcoded).length}`);
console.log();
