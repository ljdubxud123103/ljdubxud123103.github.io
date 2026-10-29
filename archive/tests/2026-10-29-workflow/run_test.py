"""Synthetic structured-input smoke test, not an NLP parser or video validator."""
from pathlib import Path
from copy import deepcopy
import json
ROOT=Path(__file__).resolve().parent
assets={'人物':['@测试甲 常服','@测试乙 常服'],'场景':['@测试室内 日'],'道具':['@测试信物']}
speech=[{'id':'D1','speaker':'@测试甲 常服','kind':'对白','text':'拿好。'},{'id':'D2','speaker':'@测试乙 常服','kind':'对白','text':'我会保管好。'},{'id':'V1','speaker':'旁白','kind':'VO','text':'这一次，他没有回头。'}]
shots=[{'id':'1-1','unit':'1','duration':3,'view':'侧面中景','camera':'沿桌边向右短移，落在两人及交接区域','action':'测试甲在画左，测试乙在画右；甲右手将信物递向乙左手，乙接稳后甲松手。','assets':['@测试甲 常服','@测试乙 常服','@测试室内 日','@测试信物'],'speech':[speech[0]],'end':'信物在乙左手，甲右手已松开。'}, {'id':'1-2','unit':'1','duration':3,'view':'乙正面近景','camera':'固定，焦点落在乙眼睛与嘴部','action':'乙看向甲，开口回答；左手仍握信物。','assets':['@测试乙 常服','@测试室内 日','@测试信物'],'speech':[speech[1]],'end':'乙说完，仍望向甲；信物未换手。'}, {'id':'1-3','unit':'1','duration':3,'view':'甲背面中景','camera':'相机留在桌边，向门口水平摇摄跟随甲离开','action':'甲转向已有门口走出；乙留在桌旁。','assets':['@测试甲 常服','@测试乙 常服','@测试室内 日','@测试信物'],'speech':[speech[2]],'end':'甲出画；乙左手持信物留在原处。'}]
base={'fixture_only':True,'selected_units':['1'],'assets':assets,'required_assets':sum(assets.values(),[]),'source_speech':deepcopy(speech),'shots':shots,'mode':'cuts','music':False,'dependencies_read':True,'conflicts':[]}
def validate(d):
 errors=[]
 if not d['dependencies_read']:errors.append('DEPENDENCY_BLOCKED')
 if d['conflicts']:errors.append('WAIT_USER:ASSET_CONFLICT')
 known=sum(d['assets'].values(),[])
 if any(x not in known for x in d['required_assets']):errors.append('WAIT_USER:ASSET_MISSING')
 actual=[];totals={}
 for s in d['shots']:
  if s['unit'] not in d['selected_units']:errors.append('SCOPE')
  if not isinstance(s['duration'],(int,float)) or s['duration']<=0:errors.append('TIME')
  if d['mode']=='cuts' and s['duration']>4:errors.append('SHOT_OVER_4')
  totals[s['unit']]=totals.get(s['unit'],0)+s['duration']
  if any(x not in known for x in s['assets']):errors.append('ASSET_LABEL')
  if not all(s.get(k) for k in ['view','camera','action','end']):errors.append('FIELDS')
  actual+=s['speech']
 if any(t>30 for t in totals.values()):errors.append('UNIT_OVER_30')
 if actual!=d['source_speech']:errors.append('SPEECH_EXACT_MAPPING')
 if d['music']:errors.append('MUSIC')
 if d['mode']=='continuous' and len(d['shots'])!=1:errors.append('FALSE_CONTINUOUS')
 if set(d['required_assets'])-set(x for s in d['shots'] for x in s['assets']):errors.append('ASSET_NOT_ANCHORED')
 return sorted(set(errors))
def render(d):
 if validate(d):return None
 cols=['镜号','时长','景别/视角','运镜','构图与动作','声音与台词','资产','结束状态']
 out=['# 合成测试分镜表（不属于用户正式项目）','\n仅测试格式与结构化校验；不是已验证的视频生成提示词。无背景音乐。\n','| '+' | '.join(cols)+' |','| '+' | '.join(['---']*len(cols))+' |']
 for s in d['shots']:
  voice='；'.join(f'{v["speaker"]}（{v["kind"]}）：“{v["text"]}”' for v in s['speech'])
  vals=[s['id'],str(s['duration'])+'秒',s['view'],s['camera'],s['action'],voice,'、'.join(s['assets']),s['end']]
  out.append('| '+' | '.join(v.replace('|','\\|').replace('\n','<br>') for v in vals)+' |')
 return '\n'.join(out)+'\n'
cases=[]
def check(name,mutate,expected):
 d=deepcopy(base); mutate(d); e=validate(d); passed=(not e if expected is None else expected in e);cases.append({'case':name,'passed':passed,'observed':e});assert passed,(name,e)
check('正常三表到分镜输出',lambda d:None,None)
check('未完成阅读必须阻塞',lambda d:d.update(dependencies_read=False),'DEPENDENCY_BLOCKED')
check('关键人物缺项',lambda d:d['assets']['人物'].pop(),'WAIT_USER:ASSET_MISSING')
check('关键场景缺项',lambda d:d['assets']['场景'].clear(),'WAIT_USER:ASSET_MISSING')
check('关键道具缺项',lambda d:d['assets']['道具'].clear(),'WAIT_USER:ASSET_MISSING')
check('新旧资产冲突',lambda d:d['conflicts'].append('测试甲标签冲突'),'WAIT_USER:ASSET_CONFLICT')
check('标签空格被擅改',lambda d:d['shots'][0]['assets'].__setitem__(0,'@测试甲常服'),'ASSET_LABEL')
check('漏VO',lambda d:d['shots'][2]['speech'].clear(),'SPEECH_EXACT_MAPPING')
check('漏词',lambda d:d['shots'][1]['speech'][0].update(text='我会保管。'),'SPEECH_EXACT_MAPPING')
check('声源错配',lambda d:d['shots'][0]['speech'][0].update(speaker='@测试乙 常服'),'SPEECH_EXACT_MAPPING')
check('重复发声',lambda d:d['shots'][0]['speech'].append(deepcopy(d['source_speech'][0])),'SPEECH_EXACT_MAPPING')
check('普通单镜超4秒',lambda d:d['shots'][0].update(duration=5),'SHOT_OVER_4')
check('单段超30秒',lambda d:[s.update(duration=11) for s in d['shots']],'UNIT_OVER_30')
check('越过指定制作范围',lambda d:d['shots'][0].update(unit='2'),'SCOPE')
check('新增背景音乐',lambda d:d.update(music=True),'MUSIC')
check('硬切镜头组冒充一镜到底',lambda d:d.update(mode='continuous'),'FALSE_CONTINUOUS')
check('缺结束状态',lambda d:d['shots'][0].update(end=''),'FIELDS')
# Positive exception: one 8-second continuous shot, all speech retained.
d=deepcopy(base);d['mode']='continuous';d['shots']=d['shots'][:1];d['shots'][0].update(duration=8,speech=deepcopy(speech));assert not validate(d)
cases.append({'case':'真实单镜8秒允许连续镜头例外（仅结构检查）','passed':True,'observed':[]})
(ROOT/'fixture.json').write_text(json.dumps(base,ensure_ascii=False,indent=2)+'\n')
(ROOT/'分镜表格-合成测试.md').write_text(render(base))
(ROOT/'results.json').write_text(json.dumps({'scope':'结构化合成数据测试；不验证自然语言抽取、演员表现、光学真实性或成片效果','total':len(cases),'passed':sum(c['passed'] for c in cases),'cases':cases},ensure_ascii=False,indent=2)+'\n')
print(f'{len(cases)}/{len(cases)} checks passed; fixture, table and results written.')
