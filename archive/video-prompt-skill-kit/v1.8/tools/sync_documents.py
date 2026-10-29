#!/usr/bin/env python3
"""Synchronize Skill delivery/Loop and bundle hashes; never claim source reading."""
from pathlib import Path
import re
import json
import hashlib

ROOT = Path(__file__).resolve().parents[1]
SECTIONS = (0, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15, 16, 18)


def sections(text):
    return {int(re.match(r'## (\d+)\.', part).group(1)): part
            for part in re.split(r'(?=^## \d+\.)', text, flags=re.M)
            if re.match(r'## (\d+)\.', part)}


def main():
    source = (ROOT / 'SKILL.md').read_text(encoding='utf-8')
    blocks = sections(source)
    loop = ROOT / 'LOOP.md'
    header = loop.read_text(encoding='utf-8').split('## 0.', 1)[0]
    loop.write_text(header + ''.join(blocks[i] for i in SECTIONS), encoding='utf-8')
    delivery = ROOT.parent / 'deliverables' / 'Seedance-YXW-Complete-SKILL.md'
    if delivery.parent.is_dir():
        delivery.write_text(source, encoding='utf-8')
    manifest = []
    for path in sorted(ROOT.rglob('*')):
        rel = path.relative_to(ROOT)
        if (not path.is_file() or rel.parts[0] in ('repositories', 'reading')
                or '__pycache__' in rel.parts or path.name == 'BUNDLE_FILES.json'):
            continue
        raw = path.read_bytes()
        manifest.append({'path': rel.as_posix(), 'bytes': len(raw),
                         'sha256': hashlib.sha256(raw).hexdigest()})
    (ROOT / 'BUNDLE_FILES.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Synchronized Loop, delivery copy and bundle integrity manifest.')


if __name__ == '__main__':
    main()
