from pathlib import Path
import json,re,hashlib
import openpyxl
base=Path(__file__).resolve().parent
source=Path('/Users/apple/Desktop/前夫黑道酵母_分镜_81-93.xlsx')
w=openpyxl.load_workbook(source)
rows=[list(r) for r in w.active.iter_rows(values_only=True) if len(r)>1 and r[1] in ['83-2A','83-2B']]
assert [r[1] for r in rows]==['83-2A','83-2B']
style=rows[0][5].split('\n\n[场景基调]')[0]
lines=[q.split('：',1)[1][1:-1] for q in rows[1][6].splitlines()]
assert lines==['La casa del lago. La caja fuerte del abuelo.','Lo agarré y corrí. Mi hermano me persiguió. No volteé.']
shots=[
(3,'客厅纵深中景/茶几南侧','机位从东窗内侧沿茶几南侧空道向西伴随，随Vera停步落稳',
'Vera常服原在东窗内侧。门外传来一次已有动静，她把视线从窗外移向入口，转身沿空道走向南墙西端的门，双手空着；镜头保持侧后方，只看身体转向和步伐，不要求同时看清正面微表情。',
'脚步随实际落脚出现，门此时未动，不提前添加门锁声。','无。','Vera常服到门内，门仍关闭，Renata常服仍在门外。'),
(3,'猫眼主观近景/Vera眼位','固定在门内猫眼观察位置',
'猫眼视野内，Renata常服站走廊门外，黄色信封由双手抱在胸腹前。湿发贴在脸侧，左脸原有淤伤保持；她看向门的猫眼附近，指尖压住信封边缘，没有后退或全身发抖。',
'低弱走廊环境声，不新增喘气、抽泣或呻吟。','无。','Renata常服仍在门外，信封仍在她双手；Vera常服尚未开门。'),
(4,'门内侧面中景/入口东侧','沿入口内侧向北退半步，为门扇向内开启让出真实空间',
'Vera常服右手转动门把，把门向室内拉开；身体随门扇退到北侧，给门槛留出通路。门外的Renata常服逐渐出现在门框内，Vera常服看清她左脸的伤后，原先准备开口的唇缝轻合，没有惊呼。',
'把手、锁舌和门轴依实际开启次序轻响，动作完成即停止。','无。','门已打开，Vera常服在门内北侧，Renata常服仍在门外；双方还未碰到信封。'),
(4,'Renata侧面中近景/门内东侧向外','从门框边向西短移，解除门框对左脸的遮挡，随后落稳',
'看见Vera常服后，Renata常服原先绷住的肩线缓慢落下一点，目光留在姐姐脸上，嘴角原有紧张稍松；已有泪痕可见，不新增突然涌泪、颤唇或抽气。她把信封从胸前放低，开口说明来源，声音轻而清楚。',
'环境声保持低位，衣料只随放低手臂轻擦。','11.5s起，Renata常服按音轨骨架说第一句；本栏不重念原句。','Renata常服开始把信封递向门内，双手仍持住边缘。'),
(4,'信封交接近景/门内东南侧','沿门槛内侧短距离平移，双方手指始终处于同一可读焦平面',
'Renata常服把信封送到Vera常服右手可及处；Vera常服右手托住下缘、拇指夹稳侧边，Renata常服确认被接住才松开双手。第一句说完后自然停顿，再接第二句；交接不因切镜重新发生。',
'手指与牛皮纸一次轻擦，低于对白，不增加撕封声。','Renata常服第一句连续收尾，16.4s起接第二句；声音依同一骨架向后连续。','信封归Vera常服右手，Renata常服双手已空出，仍在门外。'),
(4,'Vera听者近景/Renata肩侧','从Renata常服肩侧固定观察Vera常服，肩部不遮住Vera眼部',
'Renata常服在画外说完第二句。Vera常服视线从妹妹眼睛移到左脸伤处，眉间略收，下颌原有紧张保留；不安排明显吸气、瞪眼或咬牙声。右手持信封贴在身侧，左手抬到妹妹左脸旁，先停住，没有抓脸。',
'保留清楚对白与普通呼吸，不放大呼吸声。','Renata常服第二句跨切连续，到21.5s完整结束；Vera常服只听，不代说。','Vera常服左手停在左脸伤处旁，信封仍在右手；Renata常服未跨门槛。'),
(4,'姐妹侧面双人中景/门内东侧','轻向北后退，保留脸侧接触点与门槛的纵深关系',
'Vera常服左指轻触淤伤边缘一次，随即离开伤处，手掌移到Renata常服肩背。Renata常服看着姐姐，唇部短暂压合后放松，身体朝门内转半步，为进屋准备；没有重新做一次得救般大幅松垮。',
'手与衣料低弱接触声，不新增抽泣或安慰台词。','无。','Vera常服左手扶肩背、右手持信封；Renata常服已转向门内，双脚仍在门外。'),
(4,'侧后双人中景/入口内侧朝客厅','沿入口北侧空道向东缓退，与两人正常步速一致，停在客厅入口关系画面',
'Vera常服左手扶住Renata常服肩背，引她跨过门槛，自己随在其侧后一起走入客厅。Renata常服自行落脚，进入后在茶几西侧空处站稳；门仍保持打开，不凭空关闭，信封不换手。',
'两人真实落脚与衣料轻擦，步停后声音减弱。','无。','两人均在室内茶几西侧，Vera常服左手扶Renata常服肩背、右手持信封；Renata常服站稳，门保持开启。')]
prompt=style+'''

[场景基调]
高层公寓客厅（夜）；公寓大楼走廊，9:16竖屏。一条30秒完整视频，内部按下述镜头连续剪辑。走廊既有顶灯从Renata侧上方照入，室内北侧实用灯在Vera侧后形成暖轮廓；开门改变的是门洞透光，人物曝光不随反打跳变。

[音轨规则]
远层是公寓外远处车流，走廊与室内安静；中层仅保留实际脚步、门锁和纸张接触声。近层对白清楚，普通呼吸保持低弱。无背景音乐，无新增对白或旁白。
以下两句均由Renata常服说，每句完整发声一次，切镜声音连续；引号内只有原文：
11.5s—16.0s，@Renata常服（低声向姐姐交代，按两句之间自然停顿，声音略疲惫但不抽泣）：「'''+lines[0]+'''」
16.4s—21.5s，@Renata常服（接着说明逃跑经过，语义重音清楚，句尾落下，不以喘词或哭腔打断）：「'''+lines[1]+'''」

[锚定列表]
场景：@高层公寓客厅（夜）；@公寓大楼走廊
角色：@Vera常服；@Renata常服
道具：黄色牛皮纸线索信封（文字设定），沿用原段已确认的同一信封，不新增虚假绑定。

[空间布局总览]
入口在客厅南墙西端，门向室内开启，走廊在门外南侧。茶几在客厅中部，沙发在其北侧，东墙是落地窗，茶几南侧至入口保留通道。开场Vera在东窗内侧、Renata在门外朝北面对入口。Renata双手抱信封，左脸淤伤与湿发保持同一状态。开门后Vera在门内北侧、Renata仍在门外；交接完成后信封始终归Vera右手。所有位置由这些文字控制，不使用尾帧或站位图。

[运镜时间线（8个硬切分镜）]
'''
nums=['一','二','三','四','五','六','七','八']
for i,(dur,view,camera,action,fx,speech,end) in enumerate(shots):
 prompt+=f'分镜{nums[i]}：【景别/视角：{view} | 运镜：{camera}】\n【时长】{dur:.1f}s\n【构图】{action}\n【音效】{fx}\n【台词】{speech}\n【变化】{end}\n【镜头结尾·站位收束】{end}\n'
 if i<7:prompt+=f'画面硬切到分镜{nums[i+1]}。\n'
prompt+='''
[关键约束铁律]
- 每个动作只发生一次；开门、信封交接、触伤和带入室内依时间连续，不因切镜重启。
- Renata始终是两句台词的唯一说话人，Vera不代说；音轨骨架只念一次，不把镜头说明念出来。
- 情绪来自认出姐姐、交出信封、伤处被看见和获得扶持；以目光、肩线和手部任务承接，不用倒吸一口凉气、明显抽气、胸肩大幅起伏、瞪眼或突然全身颤抖表达。
- 左脸伤处不换边，信封不换手；Vera右手持信封后，只用空出的左手触脸、扶肩背。
- 门扇、门槛和通道真实存在，相机与人物均沿空道运动；进入室内后仍继承门开启的状态。
- 所有画内纸面与招牌不出现可读文字；原稿文字只在对应原文列保留。

时长：30s'''
assert sum(x[0] for x in shots)==30 and max(x[0] for x in shots)<=4
assert all(prompt.count('「'+t+'」')==1 for t in lines)
(base/'83-2_合并30s提示词.txt').write_text(prompt+'\n')
(base/'SOURCE_ROWS.json').write_text(json.dumps({'source':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'rows':rows},ensure_ascii=False,indent=2)+'\n')
(base/'CHECK.json').write_text(json.dumps({'scope':['83-2A','83-2B'],'output':'83-2，一条完整30秒视频','original_seconds':[12.5,13.5],'seconds':30,'shots':8,'speech_count':2,'speech_source':'Renata','speech_text_exact':True,'no_workbook_modified':True,'video_validation':'未实测'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'seconds':30,'shots':8,'speech_count':2,'chars':len(prompt)},ensure_ascii=False))
