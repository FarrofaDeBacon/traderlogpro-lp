const fs = require('fs');
const path = require('path');

const LOCALE_DIR = 'src/lib/i18n/locales/pt-BR';

function flatten(obj, prefix = '') {
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
        const full = prefix ? prefix + '.' + k : k;
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) Object.assign(res, flatten(v, full));
        else res[full] = v;
    }
    return res;
}

// Load all pt-BR keys
const ptBr = {};
const byFile = {};
for (const f of fs.readdirSync(LOCALE_DIR).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, f), 'utf8'));
    const flat = flatten(data);
    Object.assign(ptBr, flat);
    byFile[f] = flat;
}

// Walk source files
function walk(dir, exts = ['.svelte', '.ts'], exclude = new Set(['node_modules', '.svelte-kit', 'build', '__tests__', '.git'])) {
    const files = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (exclude.has(e.name)) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) files.push(...walk(full, exts, exclude));
        else if (exts.some(x => e.name.endsWith(x)) && !e.name.includes('.test.')) files.push(full);
    }
    return files;
}

const missing = {};
const re = /\$t\(\s*['"]([^'"{}]+)['"]/g;

for (const f of walk('src')) {
    if (f.includes('i18n')) continue;
    const content = fs.readFileSync(f, 'utf8');
    const fileMissing = [];
    let m;
    const reCopy = new RegExp(re.source, re.flags);
    while ((m = reCopy.exec(content)) !== null) {
        const key = m[1];
        if (!ptBr[key]) fileMissing.push(key);
    }
    if (fileMissing.length > 0) {
        missing[f.replace(/\\/g, '/')] = [...new Set(fileMissing)].sort();
    }
}

// Report
const allMissing = [...new Set(Object.values(missing).flat())].sort();
console.log('='.repeat(60));
console.log('TRULY MISSING KEYS IN PT-BR: ' + allMissing.length);
console.log('='.repeat(60));

// Group by first 2 segments (namespace)
const byNs = {};
for (const k of allMissing) {
    const ns = k.split('.').slice(0, 2).join('.');
    (byNs[ns] = byNs[ns] || []).push(k);
}
for (const [ns, keys] of Object.entries(byNs).sort()) {
    console.log('\n[' + ns + ']');
    keys.forEach(k => console.log('  ' + k));
}

console.log('\n\nFILES WITH MISSING KEYS:');
for (const [f, keys] of Object.entries(missing).sort()) {
    console.log('\n  ' + f.split('/').slice(-3).join('/'));
    keys.forEach(k => console.log('    ' + k));
}
