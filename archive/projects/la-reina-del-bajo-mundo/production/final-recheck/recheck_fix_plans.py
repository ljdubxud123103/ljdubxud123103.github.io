from pathlib import Path
p=Path('production-21-25/plans.py')
s=p.read_text()
s += '''
# 2026-10-29 final recheck: unify entrance geometry and complete occupied-hand actions.
for u in PLANS:
 if '公寓' in u['scene']:
  u['map']=u['map'].replace('入口门在西墙，向室内开启','入口门在南墙西端，向室内开启').replace('阳台移门在南侧','阳台移门在南墙东端').replace('西门','入口门').replace('西侧入口','南墙西端入口')
  for sh in u['shots']:
   for k in ['action','end','camera']:
    sh[k]=sh[k].replace('西门','入口门').replace('西侧入口','南墙西端入口')
u=next(u for u in PLANS if u['id']=='24-2A')
u['shots'][2:3]=[
 s(3,'Vera全身侧面中景','随她起身轻抬，保留左手支撑与双脚','Vera左手撑地、双脚收稳后起身，右手握手机；站直后沿茶几南侧通道走到衣凳旁。','Vera站衣凳旁，手机仍在右手。'),
 s(3,'衣凳与双手中近景','固定在衣凳南侧，让手部动作可读','Vera先把手机放在衣凳空处，双手拿起原有米色风衣并披好；手机在衣凳上，不占用披衣的手。','风衣披好，手机留衣凳空处。'),
 s(3,'客厅至阳台关系中景','沿南侧通道伴随，停在玻璃移门前','Vera右手拿回手机，沿空道走到南墙东端的阳台移门；左手空出准备开门。','Vera到移门内侧，右手持手机，左手空着。')]
u=next(u for u in PLANS if u['id']=='25-2B')
u['map']+='本场可见电梯在入口外东侧约两步处，两人沿这段短距离离场。'
u['shots'][-1:]=[
 s(3,'三人全身关系中景/门外南侧','固定，手腕松开与搀扶接触完整可见','Vera先松开腕部再离开前臂；Ramón左手捧住受伤右腕，Carmen移到其左侧搀住上臂，扶他站稳。','Ramón站稳，Carmen扶左臂，Vera已无接触。'),
 s(2.5,'电梯门前中景','沿走廊北侧向东短移，跟到电梯口','电梯门已打开，Carmen扶Ramón向东慢行两步，先后跨过电梯门槛，Vera留在公寓门外。','两人都在电梯内，未跨门时提前关门。'),
 s(2.5,'电梯与公寓入口关系中景','固定，保持Vera与门外北墙球棒同框','电梯门在两人进入后合拢，Vera停在公寓门口，球棒仍靠北墙；不在关门过程中继续拉人入内。','电梯关闭，两人已离场，Vera留门外。')]
u=next(u for u in PLANS if u['id']=='25-2C')
u['shots'].insert(1,s(2.5,'玄关侧面中景','固定，完整显示门扇合拢路径','Vera已退进玄关，右手持球棒向下，左手握门内把手把门合上，确认门锁扣合后松手。','入口门已关闭，Vera站门内，球棒仍在右手。'))
u['shots'][2]['action']=u['shots'][2]['action'].replace('背靠门板','背靠已关闭的门板')
u['shots'][2]['end']='球棒横放门内地面；Vera坐在已关闭的门内侧，左手扶地。'
'''
p.write_text(s)
p=Path('production-26-30/plans.py');s=p.read_text();s += '''
# Final recheck: same apartment entrance as episodes 21–25, balcony at the other end.
for u in PLANS:
 if '高层公寓客厅' in u['scene']:
  u['map']=u['map'].replace('公寓入口在西墙','公寓入口在南墙西端').replace('南侧移门通阳台','南墙东端移门通阳台').replace('向西通入口','向西绕茶几后通南墙西端入口')
  for sh in u['shots']:
   sh['action']=sh['action'].replace('西侧入口方向','南墙西端入口方向')
   sh['end']=sh['end'].replace('西侧入口方向','南墙西端入口方向')
''';p.write_text(s)
p=Path('production-31-33/plans.py');s=p.read_text();s += '''
# Final recheck: topology does not assert outdated actor positions or microphone custody.
for u in PLANS:
 if u['scene']=='晚宴酒店大厅':
  u['map']=u['map'].replace('Vera在前排西侧靠中央通道座位，Damián在前排东侧；Reportero C在西侧边道拍摄。Víctor在讲台后，Don Ernesto站台上东侧，Carmen站台上西侧。','前排西侧靠中央通道为Vera的座位，前排东侧为Damián的座位；西侧边道是摄影位。讲台东、西两侧各有站人空处；人物是否在座或已经上台，依本段起始状态与动作描述，不据座位名复位。')
  u['map']=u['map'].replace('起初固定于支架；谁拿到它谁发声扩声','本段起始归属以下述手部状态为准；在支架上时靠近它的人发声扩声，被取下时由持有者发声扩声')
''';p.write_text(s)
