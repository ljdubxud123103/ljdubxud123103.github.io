from pathlib import Path
import json,re
base=Path(__file__).resolve().parent
sources=json.loads(Path('/tmp/84-merge-source.json').read_text())
a=next(r for r in sources if r[1]=='84-2A');b=next(r for r in sources if r[1]=='84-3A')
style=a[5].split('\n\n[场景基调]')[0]
speech=[]
for line in b[6].splitlines():
 name,text=line.split('：',1);speech.append((name,text[1:-1]))
assert len(speech)==4
timings=[(11.1,13.6),(14.0,20.1),(20.5,21.6),(22.0,25.7)]
shots=[
(3,'手机与姐妹关系中景/茶几南侧','固定在茶几西南斜侧，手机与沙发上的Renata分处前后景',
'iPhone手机在茶几西南角振动一次，Vera常服仍坐在茶几西侧地毯上，右手拿起手机，先看一眼北侧沙发上熟睡的Renata常服；左手落到地面准备支撑。屏幕朝向自己，画面不显示来电文字。',
'手机与桌面短促振动声，拿起后即停止；室内保持低弱环境声。','尚未接听；Vera右手持手机、左手撑地，Renata仍在原沙发熟睡。'),
(4,'Vera全身侧后中景/茶几南侧通道','一镜连续跟随：随她起身抬机，再沿南侧空道伴随到阳台移门，不用切镜省略位移',
'Vera常服左掌支撑地面、双脚收稳后站起，左手离地；右手始终握手机，沿茶几南侧空道正常走两三步到南墙东端阳台移门内侧，停稳后左手碰门把。动作只包括起身和走路，不抓取、披上或整理任何衣物。',
'实际落脚与低弱自然接触声，手机已停止振动，不额外添脚步。','Vera在阳台移门内侧，右手手机未接听，左手已到门把；外观完全继承人物资产。'),
(4,'移门侧面全身中景/门内西侧','固定展示门轨与门槛，两侧空间都可见，摄影机不穿过玻璃',
'Vera常服左手滑开移门，正常跨过门槛到阳台，转身仍用左手把门合上；双脚站稳后右拇指接听，手机贴右耳。进入阳台的过程完整可见，Renata常服留在室内沙发。',
'滑轨声和脚步按开门、跨门、合门次序出现；关好后室外远车流略清楚。','门已合上，Vera站阳台门外栏杆内侧一步处，右手手机贴耳，左手空出。'),
(4,'Vera侧面中近景/阳台西侧','沿阳台内侧短移，落在她停住的聆听视线；机位不越栏杆',
'Don Ernesto常服从电话开口。Vera常服只听，视线从城市远处落向栏杆近处，左手轻搭栏杆内沿；身体始终站在安全内侧，嘴部不做电话男声的口型。',
'按唯一声音骨架执行电话VO；环境低于人声，没有夸张呼吸。','第一句完整结束后电话继续第二句；Vera站位、持手机手与栏杆接触不变。'),
(4,'手机、侧脸与栏杆关系中近景','由阳台门侧短推到手机与脸的关系，保持真实景深，不绕到玻璃外',
'电话中的Don Ernesto常服继续交代转账信息。Vera常服右手手机保持在耳侧，目光留在远处，没有重复抬手机或重启听电话动作；左手仍在栏杆内沿。',
'Don Ernesto常服原定VO连续穿过切镜，保持同一低沉电话声线。','第二句仍在连续发声，Vera未抢话、未移动双脚。'),
(4,'Vera侧面近景/阳台西南侧','固定，给听完、短问句和继续聆听一个清楚的时间落点',
'Vera常服等第二句说完才轻声问来源；问完嘴唇自然轻合，继续听电话男声的回答。眼神始终有对象，不新增吸气、瞪眼或情绪性动作。',
'20.5—21.6秒只有Vera常服的现场短问句，22.0秒起恢复Don Ernesto常服电话VO；两人不重叠。','问句已完整说完，电话男声开始回答；手机始终在Vera右耳。'),
(4,'Vera听者中近景/阳台西侧','沿栏杆内侧后拉少许，让移门方向重新进入构图',
'Don Ernesto常服给出完整答案。Vera常服听到家族名时眼睑略收，头部不突然后仰；等男声句尾结束，再将右手手机放低，左手离开栏杆，身体转向室内移门。',
'电话VO到25.7秒完整结束，其后只留远车流；不新增叹气、深吸气或衣物整理声。','Vera右手持手机放低，左手空出，已面向移门；还在阳台栏杆内侧。'),
(3,'阳台回室内侧后中景/移门西侧','沿门边空道随她移动，门槛与支撑脚保持可见，镜头不穿门板',
'Vera常服走回移门，左手滑开门，跨过门槛回到客厅南侧通道；右手手机不换手。她进屋后保留门开启状态，Renata常服仍在沙发睡着，后续可直接沿室内通道走向入口。',
'短促脚步与滑轨声，进屋后城市底噪减弱，无新增人声。','Vera已在客厅南侧通道，右手持手机、左手空着；移门开启，Renata仍熟睡。')]
text=style+'''

[场景基调]
高层公寓客厅（夜）；高层公寓阳台，9:16竖屏。一条完整30秒视频，客厅到阳台再回室内的移动均可见。沿用室内既有实用灯侧光和窗外城市低亮冷光，手机屏幕不作面部补光。

[音轨规则]
远层为远处车流和室内底噪；中层只在实际动作时保留手机振动、落脚和移门滑轨声。无背景音乐、额外台词或旁白。手机拿起后振动即停止。
电话男声仅为Don Ernesto常服的原定VO，不出现其身体、地点或新的音频绑定。Vera只说自己的短问句，Renata不发声。唯一发声骨架如下，每句完整执行一次，切镜连续：
'''
for (name,line),(start,end) in zip(speech,timings):
 if name=='Don Ernesto VO':speaker='@Don Ernesto常服（电话VO，低沉沙哑、字词清楚，Vera只听，不做该句口型）'
 else:speaker='@Vera常服（现场对白，轻声直接，问句清楚，不额外吸气）'
 text+=f'{start:.1f}s—{end:.1f}s，{speaker}：「{line}」\n'
text+='''
[锚定列表]
场景：@高层公寓客厅（夜）；@高层公寓阳台
角色：@Vera常服；@Renata常服；@Don Ernesto常服（仅电话VO，不入画）
道具：@iPhone手机
人物外观全程直接继承对应资产，只描述当前动作，不重设计服装或添加独立穿戴物件。

[空间布局总览]
茶几位于客厅中部，Renata常服睡在北侧沙发，Vera常服开场坐茶几西侧地毯。手机在茶几西南角。南墙东端移门通向阳台，茶几南侧空道到移门约两三步；阳台栏杆在门外南侧，门外留一步宽的安全站立区。Vera起身后沿空道走到门口，左手开门、右手持手机；到阳台合门后才接听。原文中的穿戴动作本稿不执行；不取衣、不披衣、不换装、不整理领口。Don Ernesto只存在于手机声音中。

[运镜时间线（8个硬切分镜）]
'''
t=0;nums=['一','二','三','四','五','六','七','八']
for i,(d,v,c,action,fx,e) in enumerate(shots):
 active=[name for (name,line),(start,end) in zip(speech,timings) if start<t+d and end>t]
 desc='按本段唯一声音骨架连续执行；镜头栏不重念原句。' if active else '无。'
 text+=f'分镜{nums[i]}：【景别/视角：{v} | 运镜：{c}】\n【时长】{d:.1f}s（{t:g}s—{t+d:g}s）\n【构图】{action}\n【音效】{fx}\n【台词】{desc}\n【变化】{e}\n【镜头结尾·站位收束】{e}\n';t+=d
 if i<7:text+=f'画面硬切到分镜{nums[i+1]}。\n'
text+='''
[关键约束铁律]
- 外观只继承角色资产；本段不添加任何服装结构、颜色、搭配或披衣换装指令，不调用独立衣物道具。
- 客厅、移门、阳台与回室内的路径连续可见；门开后再跨门，不能靠切镜瞬移。结束时移门仍开，不凭空关门。
- 右手手机始终归Vera，左手先支撑地面、再操作门和扶栏杆；各动作依次发生。
- 四句西语原文、说话人和VO身份保持不变，每句只执行一次；电话男声与Vera问句不重叠。
- Renata始终留在原沙发熟睡；情绪以目光和听完后的停顿表现，不安排深吸气、倒吸凉气或夸张呼吸。
- 手机屏幕和画内其他表面不出现可读文字，原稿仅在对应原文列保留。

时长：30s'''
assert t==30 and max(x[0] for x in shots)<=4
assert all(text.count('「'+line+'」')==1 for name,line in speech)
assert all(word not in text for word in ['米色风衣','@米色','披好','衣凳','风衣被'])
row=[84,'84-2A','Vera常服；Renata常服；Don Ernesto常服','高层公寓客厅（夜）；高层公寓阳台','iPhone手机',text,b[6],a[7]+'\n'+b[7],'30s']
(base/'rows.json').write_text(json.dumps([row],ensure_ascii=False,indent=2)+'\n')
(base/'SOURCE_ROWS.json').write_text(json.dumps([a,b],ensure_ascii=False,indent=2)+'\n')
(base/'84-2A_合并30s提示词.txt').write_text(text+'\n')
(base/'PLAN_CHECK.json').write_text(json.dumps({'input':['84-2A','84-3A'],'original_seconds':[18.5,23.5],'output':'84-2A','seconds':30,'shots':8,'speech_count':4,'VO_count':3,'dialogue_count':1,'clothing_prop_removed':True,'costume_action_removed':True,'character_assets_unchanged':True,'source_text_column_preserved':True,'speech_intervals':timings,'video_validation':'未实测'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'seconds':30,'shots':8,'speech_occurrences':4,'clothing_instructions_removed':True},ensure_ascii=False))
