from pathlib import Path
import json,shutil,hashlib,base64
base=Path(__file__).resolve().parent
repo=base.parent/'repository'
project=repo/'archive/projects/la-reina-del-bajo-mundo'
dest=project/'production/31-33'
dest.mkdir(parents=True,exist_ok=True)
changed=[]
p=base/'SOURCE_PREFLIGHT.json';d=json.loads(p.read_text());d['state']='用户已确认两项文字设计；本批完成并通过导出核对';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for name in ['plans.py','build_content.py','rows.json','speech_mapping.json','STRUCTURE_CHECK.json','REVIEW_LOOP.md','WORKBOOK_VERIFICATION.json','verify_workbook.py','archive_batch.py','SOURCE_PREFLIGHT.json','ASSET_DECISION.json','PROJECT_FINAL_CHECK.json','final_project_check.py','preview-start.png','preview-middle.png','preview-end.png']:
 shutil.copy2(base/name,dest/name);changed.append(dest/name)
shutil.copy2(base.parent/'template-work/write_batch_31_33.mjs',dest/'write_batch_31_33.mjs');changed.append(dest/'write_batch_31_33.mjs')
out=project/'deliverables/前夫黑道酵母_分镜_21-33.xlsx'
shutil.copy2(base/'checked-workbook.xlsx',out);changed.append(out)
assert hashlib.sha256(out.read_bytes()).hexdigest()==hashlib.sha256(Path('/Users/apple/Desktop/前夫黑道酵母_分镜_21-33.xlsx').read_bytes()).hexdigest()
summary=json.loads((base/'PROJECT_FINAL_CHECK.json').read_text())
p=project/'PRODUCTION_STATUS.json';d=json.loads(p.read_text())
d.update(completed_episodes=list(range(21,34)),pending_episodes=[],storyboards=summary['storyboards'],shots=summary['shots'],dialogue_count=summary['dialogue'],vo_count=summary['VO'],os_count=summary['OS'],seconds=summary['seconds'],loop='production/31-33/REVIEW_LOOP.md',workbook_verification='production/31-33/WORKBOOK_VERIFICATION.json',full_project_check='production/31-33/PROJECT_FINAL_CHECK.json',asset_exception='21—25既有授权；31—33酒店正门外景与衔尾蛇纹章文件夹按用户明确答复文字设计')
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');changed.append(p)
p=project/'CONFIRMED_PRODUCTION_POLICY.json';d=json.loads(p.read_text());d['31-33_confirmations']=json.loads((base/'ASSET_DECISION.json').read_text());p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');changed.append(p)
p=project/'PRODUCTION_REQUEST.md';s=p.read_text().replace('31—33集待制作。','31—33集14段已完成并通过文本Loop与导出核对，21—33集共59段已全部写入同一表格。');p.write_text(s);changed.append(p)
p=project/'README.md';s=p.read_text();s=s.replace('21—25集已完成24个生成段并通过文本Loop及保存值检查。26—33集尚未制作；','21—33集已分三批全部完成，共59个生成段、319个镜头、108句对白、10句VO及1句OS，通过文本Loop、原文逐句核对和导出读回；');s+='\n\n截图已完成场景为56项，较原场景Excel多“轿车内”，详见COMPLETED_SCENE_ASSETS.md。最终表格在deliverables/，全项目核对记录在production/31-33/PROJECT_FINAL_CHECK.json。未进行真实视频生成验证。\n';p.write_text(s);changed.append(p)
p=repo/'archive/README.md';s=p.read_text();line='- [前夫黑道酵母21—33集分镜](projects/la-reina-del-bajo-mundo/README.md)：最终工作簿、原始资料、三批Loop和完整原文核对记录。\n';s=s.replace('## 归档规则',line+'\n## 归档规则');p.write_text(s);changed.append(p)
p=dest/'BATCH_COMPLETION.md';p.write_text('# 第31—33集及项目交付完成\n\n最后一批14段、84镜、271秒，30句对白和1句OS已逐句核对；既有21—30集45行内容与字体、对齐、边框、列宽、行高均保留。桌面同一工作簿累计21—33集59段319镜。\n\n全项目551个非空原文段落与源DOCX直接比较通过，原文列按顺序完整保留；唯一正文标注修正为用户确认的第23集Renata发声。全项目108句对白、10句VO、1句OS的原文、声源、顺序与次数通过核对。\n\n用户明确允许酒店正门外景与衔尾蛇纹章文件夹文字设计，决策原话见ASSET_DECISION.json。现有场景和造型使用原标签，功能性群众不伪造绑定，全部以文字控制站位与镜头，无尾帧或站位图。\n\n验证仅为文本与工作簿，尚无真实视频测试；不报告抽卡成功率或演员表现已经验证。\n');changed.append(p)
p=repo/'archive/ARCHIVE_INDEX.json';d=json.loads(p.read_text());d['files']=[{'path':str(f.relative_to(repo)),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted((repo/'archive').rglob('*')) if f.is_file() and f!=p and '__pycache__' not in f.parts];p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');changed.append(p)
entries=[]
for p in changed:
 e={'path':str(p.relative_to(repo)),'mode':'100644','type':'blob'}
 if p.suffix in ['.xlsx','.png']:e['binary']=base64.b64encode(p.read_bytes()).decode()
 else:e['content']=p.read_text()
 entries.append(e)
payload=Path('/tmp/video-31-33-upload.json');payload.write_text(json.dumps(entries,ensure_ascii=False))
print(json.dumps({'files':len(entries),'payload_chars':len(payload.read_text()),'desktop_bytes':out.stat().st_size,'binary_blobs':sum('binary' in e for e in entries)},ensure_ascii=False))
