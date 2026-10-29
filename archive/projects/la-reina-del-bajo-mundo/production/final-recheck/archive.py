from pathlib import Path
import shutil,json,base64,hashlib
base=Path(__file__).resolve().parent
root=base.parent
repo=root/'repository'
project=repo/'archive/projects/la-reina-del-bajo-mundo'
dest=project/'production/final-recheck'
dest.mkdir(parents=True,exist_ok=True)
changed=[]
for n in ['RECHECK.md','RECHECK_RESULT.json','verify.py','archive.py','preview-actions.png','preview-exit.png','preview-stage.png']:
 shutil.copy2(base/n,dest/n);changed.append(dest/n)
for src,name in [(root/'recheck_fix_plans.py','recheck_fix_plans.py'),(root/'template-work/final_recheck.mjs','final_recheck.mjs')]:
 shutil.copy2(src,dest/name);changed.append(dest/name)
for group in ['21-25','26-30','31-33']:
 for name in ['plans.py','rows.json','STRUCTURE_CHECK.json','speech_mapping.json']:
  p=project/f'production/{group}/{name}';shutil.copy2(root/f'production-{group}/{name}',p);changed.append(p)
p=project/'deliverables/前夫黑道酵母_分镜_21-33.xlsx';shutil.copy2(base/'checked-workbook.xlsx',p);changed.append(p)
d=json.loads((base/'RECHECK_RESULT.json').read_text())
p=project/'PRODUCTION_STATUS.json';s=json.loads(p.read_text());s.update(storyboards=d['rows'],shots=d['shots'],seconds=d['seconds'],full_project_check='production/final-recheck/RECHECK_RESULT.json',loop='production/final-recheck/RECHECK.md',workbook_verification='production/final-recheck/RECHECK_RESULT.json');p.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n');changed.append(p)
p=project/'README.md';s=p.read_text().replace('319个镜头','324个镜头').replace('production/31-33/PROJECT_FINAL_CHECK.json','production/final-recheck/RECHECK_RESULT.json');s+='\n用户追加自查后已修正空间通用状态、手机与披衣手部占用、伤者电梯离场及靠门前关门过程；当前59段324镜，1045秒。初交付报告保留历史版本，本次最终核对以production/final-recheck/为准。\n';p.write_text(s);changed.append(p)
p=repo/'archive/ARCHIVE_INDEX.json';s=json.loads(p.read_text());s['files']=[{'path':str(f.relative_to(repo)),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted((repo/'archive').rglob('*')) if f.is_file() and f!=p and '__pycache__' not in f.parts];p.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n');changed.append(p)
entries=[]
for p in changed:
 e={'path':str(p.relative_to(repo)),'mode':'100644','type':'blob'}
 if p.suffix in ['.xlsx','.png']:e['binary']=base64.b64encode(p.read_bytes()).decode()
 else:e['content']=p.read_text()
 entries.append(e)
payload=Path('/tmp/video-recheck-upload.json');payload.write_text(json.dumps(entries,ensure_ascii=False))
print(json.dumps({'files':len(entries),'chars':len(payload.read_text())}))
