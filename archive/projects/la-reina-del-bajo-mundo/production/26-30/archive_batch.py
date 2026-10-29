from pathlib import Path
import json,shutil,hashlib,base64
base=Path(__file__).resolve().parent
repo=base.parent/'repository'
project=repo/'archive/projects/la-reina-del-bajo-mundo'
dest=project/'production/26-30'
dest.mkdir(parents=True,exist_ok=True)
changed=[]
for name in ['plans.py','build_content.py','rows.json','speech_mapping.json','STRUCTURE_CHECK.json','REVIEW_LOOP.md','WORKBOOK_VERIFICATION.json','verify_workbook.py','archive_batch.py']:
 shutil.copy2(base/name,dest/name);changed.append(dest/name)
shutil.copy2(base.parent/'template-work/write_batch_26_30.mjs',dest/'write_batch_26_30.mjs');changed.append(dest/'write_batch_26_30.mjs')
out=project/'deliverables/前夫黑道酵母_分镜_21-33.xlsx'
shutil.copy2(base/'checked-workbook.xlsx',out);changed.append(out)
p=project/'PRODUCTION_STATUS.json';d=json.loads(p.read_text())
d.update(completed_episodes=list(range(21,31)),pending_episodes=[31,32,33],storyboards=45,shots=235,dialogue_count=78,vo_count=10,seconds=761.5,loop='production/26-30/REVIEW_LOOP.md',workbook_verification='production/26-30/WORKBOOK_VERIFICATION.json')
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');changed.append(p)
p=project/'PRODUCTION_REQUEST.md';s=p.read_text().replace('26—33集尚未制作。','26—30集21个生成段已完成文本Loop与导出读回，已追加至同一表格；31—33集待制作。');p.write_text(s);changed.append(p)
p=project/'production/26-30/BATCH_COMPLETION.md'
p.write_text('# 26—30集交付记录\n\n已向桌面同一工作簿追加21段、113镜，364.5秒；先前21—25集24段保持原值与格式。累计完成21—30集45段。31—33集尚未生成。\n\n两张截图的56项场景用于核实已完成资产；场景列均为现有精确名称。公寓密室动作在现有窗侧工作区拍摄，保留原文密室称呼，不冒充新场景绑定。剧本普通物件以文字描述，不虚构资产标签。未扩大既有21—25集缺项授权。\n\n逐句、逐段、时长和导出复核见同目录报告；未进行真实视频生成或观看验证。\n')
changed.append(p)
p=repo/'archive/ARCHIVE_INDEX.json';d=json.loads(p.read_text());d['files']=[{'path':str(f.relative_to(repo)),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted((repo/'archive').rglob('*')) if f.is_file() and f!=p and '__pycache__' not in f.parts];p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');changed.append(p)
entries=[]
for p in changed:
 e={'path':str(p.relative_to(repo)),'mode':'100644','type':'blob'}
 if p.suffix=='.xlsx':e['binary']=base64.b64encode(p.read_bytes()).decode()
 else:e['content']=p.read_text()
 entries.append(e)
payload=Path('/tmp/video-26-30-upload.json');payload.write_text(json.dumps(entries,ensure_ascii=False))
print(json.dumps({'files':len(entries),'payload_chars':len(payload.read_text()),'desktop_bytes':out.stat().st_size},ensure_ascii=False))
