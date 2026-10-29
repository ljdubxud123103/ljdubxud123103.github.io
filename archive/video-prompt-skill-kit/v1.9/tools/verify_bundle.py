#!/usr/bin/env python3
"""Offline bundle integrity checks; never assert that an assistant has read a file."""
from pathlib import Path
import argparse,hashlib,json,sys
ROOT=Path(__file__).resolve().parents[1]
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def safe(path):
 p=(ROOT/path).resolve()
 if not p.is_relative_to(ROOT):raise ValueError('path outside bundle: '+path)
 return p
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--full',action='store_true');ap.add_argument('--receipt',type=Path);args=ap.parse_args()
 m=json.loads((ROOT/'REPOSITORIES.json').read_text(encoding='utf-8'))
 required=[f for repo in m['repositories'] for f in repo['required_files']]
 errors=[]
 targets=list(required)
 core=ROOT/'BUNDLE_FILES.json'
 if core.exists():targets+=json.loads(core.read_text(encoding='utf-8'))
 if args.full:targets+=json.loads((ROOT/'REPOSITORY_FILES.json').read_text(encoding='utf-8'))
 seen=set()
 for item in targets:
  path=item['path']
  if path in seen:continue
  seen.add(path)
  try:
   p=safe(path)
   if not p.is_file():errors.append('MISSING '+path)
   elif p.stat().st_size!=item['bytes'] or sha(p)!=item['sha256']:errors.append('MISMATCH '+path)
  except (ValueError,OSError) as e:errors.append(str(e))
 if args.receipt:
  receipt=json.loads(args.receipt.read_text(encoding='utf-8'))
  if receipt.get('bundle_version')!=m['version']:errors.append('RECEIPT version mismatch')
  if not receipt.get('session_id'):errors.append('RECEIPT missing session_id')
  if receipt.get('read_state')!='read':errors.append('RECEIPT overall reading is pending')
  entries={x.get('path'):x for x in receipt.get('files',[])}
  for repo in m['repositories']:
   for f in repo['required_files']:
    e=entries.get(f['path'],{})
    if not(e.get('read_state')=='read' and e.get('coverage') and e.get('observed_at') and e.get('sha256')==f['sha256'] and e.get('commit')==repo['commit']):errors.append('RECEIPT incomplete '+f['path'])
 if errors:
  print('DEPENDENCY_BLOCKED\n'+'\n'.join(errors));return 1
 print(f'FILE_INTEGRITY_OK: {len(m["repositories"])} repositories, {len(required)} mandatory files, {len(seen)} distinct checked files.')
 print('This verifies bytes and any supplied declarations, NOT actual assistant reading or comprehension. Read all mandatory files before use.')
 return 0
if __name__=='__main__':sys.exit(main())
