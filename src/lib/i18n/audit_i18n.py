"""
i18n Audit Script for TraderLogPro
Finds all $t('...') and $t("...") keys used in .svelte and .ts files
and compares them against the pt-BR locale JSONs.
"""

import json
import os
import re
import sys
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path("c:/PROJETOS/TraderLogPro")
SRC_DIR = BASE_DIR / "src"
LOCALE_DIR = BASE_DIR / "src/lib/i18n/locales/pt-BR"


def load_all_ptbr_keys():
    """Load all keys from all pt-BR JSON files, flattening nested structures."""
    all_keys = {}
    for json_file in LOCALE_DIR.glob("*.json"):
        with open(json_file, encoding="utf-8") as f:
            data = json.load(f)
        flat = flatten_keys(data)
        for key, value in flat.items():
            all_keys[key] = {"value": value, "file": json_file.name}
    return all_keys


def flatten_keys(data, prefix=""):
    """Recursively flatten nested JSON keys into dot notation."""
    result = {}
    for k, v in data.items():
        full_key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            result.update(flatten_keys(v, full_key))
        else:
            result[full_key] = v
    return result


def extract_t_keys_from_file(filepath):
    """Extract all $t('key') and $t("key") calls from a file."""
    with open(filepath, encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    # Match $t('...') and $t("...") patterns
    # Also matches t('...') used in .ts files
    patterns = [
        r'\$t\(["\']([^"\')\s]+)["\']',
        r'(?<!\$)(?<!\w)t\(["\']([^"\')\s]+)["\']',
    ]
    
    keys = set()
    for pattern in patterns:
        matches = re.findall(pattern, content)
        for m in matches:
            # Skip interpolation patterns like $t(`...${...}...`)
            if "${" not in m and "{" not in m:
                keys.add(m)
    return keys


def scan_all_source_keys():
    """Scan all .svelte and .ts files for $t() keys."""
    used_keys = defaultdict(list)
    
    extensions = [".svelte", ".ts"]
    exclude_dirs = {"node_modules", ".svelte-kit", "build", "dist", "__tests__"}
    
    for ext in extensions:
        for filepath in SRC_DIR.rglob(f"*{ext}"):
            # Skip excluded directories
            if any(excluded in filepath.parts for excluded in exclude_dirs):
                continue
            # Skip test files and the i18n files themselves
            if "test" in filepath.name.lower() or "i18n" in str(filepath):
                continue
            
            keys = extract_t_keys_from_file(filepath)
            rel_path = filepath.relative_to(BASE_DIR)
            for key in keys:
                used_keys[key].append(str(rel_path))
    
    return used_keys


def main():
    print("=" * 70)
    print("TraderLogPro — i18n Audit Report")
    print("=" * 70)
    
    print("\n📂 Loading pt-BR locale keys...")
    ptbr_keys = load_all_ptbr_keys()
    print(f"   ✅ {len(ptbr_keys)} keys loaded from {LOCALE_DIR}")
    
    print("\n🔍 Scanning source files for $t() usage...")
    used_keys = scan_all_source_keys()
    print(f"   ✅ {len(used_keys)} unique keys found in source code")
    
    # Find missing keys (used but not in pt-BR)
    missing = {k: v for k, v in used_keys.items() if k not in ptbr_keys}
    
    # Find unused keys (in pt-BR but not used in code)
    used_set = set(used_keys.keys())
    ptbr_set = set(ptbr_keys.keys())
    unused = {k: ptbr_keys[k] for k in ptbr_set - used_set}
    
    # === REPORT: MISSING KEYS ===
    print(f"\n{'=' * 70}")
    print(f"❌ MISSING KEYS ({len(missing)} keys used in code but NOT in pt-BR)")
    print(f"{'=' * 70}")
    
    if missing:
        # Group by top-level namespace
        by_namespace = defaultdict(dict)
        for key, files in sorted(missing.items()):
            namespace = key.split(".")[0]
            by_namespace[namespace][key] = files[0]  # first file as reference
        
        for ns in sorted(by_namespace.keys()):
            print(f"\n  [{ns}]")
            for key, first_file in sorted(by_namespace[ns].items()):
                print(f"    ✗ {key}")
                print(f"        → {first_file}")
    else:
        print("  🎉 No missing keys found!")
    
    # === REPORT: UNUSED KEYS ===
    print(f"\n{'=' * 70}")
    print(f"⚠️  POTENTIALLY UNUSED KEYS ({len(unused)} keys in pt-BR not found in source)")
    print(f"{'=' * 70}")
    
    if unused:
        by_file = defaultdict(list)
        for key, info in sorted(unused.items()):
            by_file[info["file"]].append(key)
        
        for fname in sorted(by_file.keys()):
            print(f"\n  [{fname}]")
            for key in sorted(by_file[fname]):
                print(f"    ~ {key}")
    else:
        print("  🎉 No unused keys found!")
    
    # === SUMMARY ===
    print(f"\n{'=' * 70}")
    print(f"📊 SUMMARY")
    print(f"{'=' * 70}")
    print(f"  pt-BR keys:      {len(ptbr_keys):>5}")
    print(f"  Used in source:  {len(used_keys):>5}")
    print(f"  Missing (❌):    {len(missing):>5}")
    print(f"  Unused (⚠️):     {len(unused):>5}")
    print()
    
    if missing:
        print("\n💡 JSON snippet to add missing keys (grouped by file):")
        print("-" * 70)
        
        # Group missing keys by their first segment to suggest which JSON file
        by_file_suggestion = defaultdict(dict)
        for key in sorted(missing.keys()):
            parts = key.split(".")
            ns = parts[0]
            # Suggest file name
            file_map = {
                "common": "common.json",
                "trades": "trades.json",
                "settings": "settings.json",
                "dashboard": "dashboard.json",
                "auth": "auth.json",
                "analysis": "analysis.json",
                "risk": "risk.json",
                "finance": "finance.json",
                "fiscal": "fiscal.json",
                "reports": "reports.json",
                "strategies": "strategies.json",
                "navigation": "navigation.json",
                "onboarding": "onboarding.json",
                "ai": "ai.json",
                "accounts": "accounts.json",
            }
            suggested_file = file_map.get(ns, f"{ns}.json")
            
            # Build nested dict for pretty JSON
            nested = by_file_suggestion[suggested_file]
            current = nested
            for i, part in enumerate(parts[1:], 1):
                if i == len(parts) - 1:
                    current.setdefault(part, f"TODO: {key}")
                else:
                    current = current.setdefault(part, {})
        
        for fname, nested in sorted(by_file_suggestion.items()):
            print(f"\n  // Add to: src/lib/i18n/locales/pt-BR/{fname}")
            print(json.dumps(nested, indent=2, ensure_ascii=False))
    
    return len(missing)


if __name__ == "__main__":
    missing_count = main()
    sys.exit(0 if missing_count == 0 else 1)
