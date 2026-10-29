from pathlib import Path
import json,re,math,collections
from plans import PLANS
BASE=Path(__file__).resolve().parent
PROJECT=BASE.parent/'repository/archive/projects/la-reina-del-bajo-mundo'
source=json.loads((PROJECT/'SCRIPT_SOURCE.json').read_text())['blocks']
contract=json.loads((PROJECT/'TEMPLATE_CONTRACT.json').read_text())
known={a['name_original'] for a in json.loads((PROJECT/'ASSET_INDEX.json').read_text())['assets']}
actors={'Vera':'Vera常服','Emiliano':'Emiliano常服','Víctor':'Víctor常服','Damián':'Damián常服','Escorpión':'Escorpión常服','Renata':'Renata常服','Don Ernesto':'Don Ernesto常服','Ramón':'Ramón常服','Carmen':'Carmen常服'}
rx=re.compile(r'^(Vera|Emiliano|Víctor|Damián|Escorpión|Renata|Don Ernesto|Ramón|Carmen)(\s+VO)?(?:（[^）]*）)?：(.*)$',re.S)
speeches={}
for b in source:
 if b['body_index']>=273:continue
 m=rx.match(b['text'].strip())
 if m:
  name='Renata' if b['body_index']==135 else m.group(1)
  speeches[b['body_index']]={'source_index':b['body_index'],'name':name,'asset':actors[name],'kind':'VO' if m.group(2) else '对白','text':m.group(3)}
def label(n):return '@'+n if n in known else n
numerals=['一','二','三','四','五','六','七','八','九','十','十一','十二']
rows=[];mapping=[];checks=[];coverage=[]
for u in PLANS:
 ep=int(u['id'].split('-')[0]);total=round(sum(s['duration'] for s in u['shots']),1)
 assert total<=30,(u['id'],total)
 assert all(0<s['duration']<=4 for s in u['shots'])
 selected=[b for b in source if u['start']<=b['body_index']<=u['end']];coverage.extend(b['body_index'] for b in selected)
 expected=[n for n in speeches if u['start']<=n<=u['end']]
 emitted=[n for s in u['shots'] for n in s['lines']]
 assert emitted==expected,(u['id'],expected,emitted)
 starts=[];t=0
 for sh in u['shots']:starts.append(t);t+=sh['duration']
 voice=[];prev_end=0
 for i,sh in enumerate(u['shots']):
  for n in sh['lines']:
   line=speeches[n];words=len(re.findall(r"\S+",line['text']));pauses=.28*len(re.findall('[.!?…]',line['text']))
   dur=round(max(.9,words/2.55+min(pauses,1.1)),1)
   begin=round(max(starts[i]+.1,prev_end+.22),1);end=round(begin+dur,1);prev_end=end
   assert end<=total,(u['id'],n,begin,end,total)
   voice.append({**line,'start':begin,'end':end,'shot_anchor':i+1,'estimated_words':words})
   mapping.append({**voice[-1],'storyboard':u['id']})
 audio='远层：'+('旅馆入口外的雨后道路车流与夜间底噪。' if ep==21 and u['id'].startswith('21-1') else '公寓外远处车流低声，室内维持安静。' if '公寓' in u['scene'] else '书房内安静的室内底噪，门外动静低于台词。' if '书房' in u['scene'] else '夜间空间的低弱环境底噪。')
 audio+='中层：仅在本段明确动作发生时保留对应接触声；静止处保持安静。近层：原定台词与自然呼吸，清楚可懂。无背景音乐、无额外台词、无额外旁白。'
 if voice:
  audio+='\n本段采用唯一声音骨架，镜头切换时持续发声，不在镜头栏重念；各区间为自然西语声演预算：\n'
  for v in voice:
   delivery='语气低而清楚，按语义停顿，感叹号不自动变为尖叫'
   if v['name']=='Renata':delivery='声音带疲惫与轻微不稳，词句完整，不加入抽泣语词'
   if v['name']=='Don Ernesto':delivery='电话VO，低沉沙哑，Vera只听，不做该句口型'
   if v['name']=='Ramón' and v['source_index']>=257:delivery='疼痛下的急促声演，原定呼喊词照原文发出，不再叠加额外叫声'
   audio+=f'{v["start"]:.1f}s—{v["end"]:.1f}s，{label(v["asset"])}（{v["kind"]}，{delivery}）：「{v["text"]}」\n'
 else:audio+='\n本段无原定对白或旁白，不新增发声。'
 anchors='场景：'+label(u['scene'])+'\n角色：'+'；'.join(label(n) for n in u['chars'])
 if u['props']:anchors+='\n道具：'+'；'.join(label(n) for n in u['props'])
 if any(n not in known for n in [u['scene'],*u['props']]):anchors+='\n未带@的本段场景或物件按已授权的文字设计执行，保持下述位置、数量和状态。'
 prompt=contract['style_lock_reference_first_row']+'\n\n[场景基调]\n'+u['scene']+'，9:16竖屏。'+u['light']+'\n\n[音轨规则]\n'+audio.rstrip()+'\n\n[锚定列表]\n'+anchors+'\n\n[空间布局总览]\n'+u['map']+'全部人物位置以门、桌、窗及通道为固定参照；反打只改变相机观察方向，不改变人物实际所在位置。本段由这些文字建立初始状态。\n\n'+f'[运镜时间线（{len(u["shots"])}个硬切分镜）]\n'
 for i,sh in enumerate(u['shots']):
  a=starts[i];b=a+sh['duration'];active=[v for v in voice if v['start']<b and v['end']>a]
  if active:
   desc='；'.join(label(v['asset'])+'的'+v['kind']+'按本段唯一声音骨架连续发声' for v in active)
   desc+='；切到听者或手部时原声转画外，听者不代说。'
  else:desc='无台词。'
  effect=[]
  for k,v in [('门','门扇与门锁随实际开合发声'),('脚','鞋底接触地面声'),('走','脚步随起停出现'),('纸','纸张轻擦声'),('信封','封口与纸张轻擦声'),('箱','箱体或扣锁的实际接触声'),('球棒','棒身与接触物的短促撞击声'),('手机','手指与机身接触的低弱摩擦声')]:
   if k in sh['action'] and any(w in sh['action'] for w in ['推开','拉开','合门','放','走','跨','抓','接','夹','开袋','翻','抽','转动','拿起','捡','踹','按下','振动']):effect.append(v)
  effect=list(dict.fromkeys(effect))
  fx='、'.join(effect[:2])+'；台词期间压低动作声。' if effect else '保留本场环境底噪与自然呼吸，不添加强调音。'
  prompt+=f'分镜{numerals[i]}：【景别/视角：{sh["view"]} | 运镜：{sh["camera"]}】\n【时长】{sh["duration"]:.1f}s\n【构图】{sh["action"]}\n【音效】{fx}\n【台词】{desc}\n【变化】{sh["end"]}\n【镜头结尾·站位收束】{sh["end"]}\n'
  if i+1<len(u['shots']):prompt+=f'画面硬切到分镜{numerals[i+1]}。\n'
 prompt+='\n[关键约束铁律]\n- 每个动作只发生一次，下一镜继承动作完成后的状态；人物位置服从本段文字空间布局。\n- 摄影机起点、路径与落点独立于人物动作，沿空置通道移动；硬切后重新明确观察侧别。\n- 双手的持物、接触与交接依时间线连续，不因切镜换手或复位。\n- 原定西语发声只执行音轨骨架一次，切镜声音连续，口型归属与声源一致。\n- 纸面、屏幕、招牌等画面内表面不出现可读文字，剧情原有文字仅保留在表格“对应原文”列。\n- 普通单镜不超过4秒，结尾状态包含在本段时长内。\n\n'+f'时长：{total:g}s'
 # Expand narrative actor names outside spoken quotes; dialogue is immutable.
 parts=re.split(r'(「[^」]*」)',prompt)
 for k in range(0,len(parts),2):
  for short in sorted(actors,key=len,reverse=True):
   parts[k]=re.sub(re.escape(short)+r'(?!常服)',actors[short],parts[k])
 prompt=''.join(parts)
 g='\n'.join(v['name']+(' VO' if v['kind']=='VO' else '')+'：「'+v['text']+'」' for v in voice)
 original=[]
 for x in selected:
  t=x['text']
  if x['body_index']==135:t=t.replace('Vera（','Renata（',1)
  original.append(t)
 rows.append([ep,u['id'],'；'.join(u['chars']),u['scene'],'；'.join(u['props']),prompt,g,'\n'.join(original),f'{total:g}s'])
 checks.append({'storyboard':u['id'],'seconds':total,'shots':len(u['shots']),'speech_source_indices':expected,'dialogue_count':sum(v['kind']=='对白' for v in voice),'vo_count':sum(v['kind']=='VO' for v in voice),'max_shot_seconds':max(sh['duration'] for sh in u['shots'])})
assert len(coverage)==len(set(coverage)),'duplicate original blocks'
required={b['body_index'] for b in source if b['body_index']<273}
assert set(coverage)==required,('source gap',required-set(coverage))
assert [x['source_index'] for x in mapping]==list(speeches),'speech order or count'
assert all(row[5].count('「'+v['text']+'」')==1 for row in rows for v in mapping if v['storyboard']==row[1]),'duplicate speech in prompt'
assert all(len(row[5])<32767 and len(row[7])<32767 for row in rows),'Excel cell overflow'
assert all(not any(word in row[5] for word in ['@图','{{Mixed','见上一段','同上']) for row in rows)
BASE.joinpath('rows.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
BASE.joinpath('speech_mapping.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2)+'\n')
report={'scope':'21—25集文本与结构核对，尚待导出后复核；不是实际成片验证','episodes':[21,22,23,24,25],'storyboards':len(rows),'shots':sum(len(u['shots']) for u in PLANS),'seconds':sum(c['seconds'] for c in checks),'source_blocks_covered':len(required),'dialogue_count':sum(c['dialogue_count'] for c in checks),'vo_count':sum(c['vo_count'] for c in checks),'speech_missing':0,'source_block_missing':0,'checks':checks}
BASE.joinpath('STRUCTURE_CHECK.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='checks'},ensure_ascii=False))
