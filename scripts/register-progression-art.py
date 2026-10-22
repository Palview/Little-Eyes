"""Read original generated PNGs; register crop metadata and selection masks only.
Never alters source images. Run after regenerating an atlas to refresh its manifest.
"""
import json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'dist'
p=root/'assets/manifest.json';m=json.loads(p.read_text())
sheets={}
for name in ['equipment-v3','patients-v3','customization-v3','staff-v3']:
 im=Image.open(root/f'assets/{name}.png').convert('RGBA');sheets[name]=im;m['files'][name]={'file':f'assets/{name}.png','width':im.width,'height':im.height}
# Atlas generators approximate grid positions. Explicit inspected bounds prevent
# adjacent poses leaking into a crop; these coordinates do not alter image pixels.
bounds={
 'patients-v3':[
 [(57,20,97,180),(232,20,98,181),(430,20,94,180),(618,20,99,181),(812,19,91,182),(999,18,88,183),(1187,17,94,185),(1374,17,93,184),(1559,15,113,183),(1753,18,114,181)],
 [(56,206,99,193),(230,207,97,192),(432,206,95,193),(620,206,98,194),(813,207,90,195),(1000,207,88,194),(1187,206,89,195),(1378,207,88,194),(1566,205,110,191),(1752,205,110,191)],
 [(57,402,94,186),(235,403,95,185),(429,403,97,186),(617,401,98,187),(812,403,93,185),(999,405,88,183),(1186,407,92,183),(1374,405,94,182),(1559,404,114,183),(1755,402,115,185)],
 [(55,590,101,191),(229,591,100,191),(426,590,98,191),(617,590,100,191),(808,590,93,192),(1000,590,90,192),(1189,590,90,192),(1378,590,91,192),(1571,589,108,187),(1756,589,109,187)]],
 'equipment-v3':[
 [(93,61,231,231),(433,61,229,231),(773,103,243,166),(1135,103,225,166)],
 [(90,298,225,254),(442,299,223,253),(803,333,190,199),(1168,332,188,200)],
 [(90,553,233,247),(433,553,232,247),(791,584,213,187),(1159,584,213,187)],
 [(89,806,271,239),(427,806,246,241),(781,824,232,210),(1149,825,232,209)]],
 'customization-v3':[
 [(46,75,165,191),(327,77,162,189),(573,73,167,193),(808,73,165,193),(1070,75,168,191),(1321,75,164,191)],
 [(20,347,241,188),(296,347,235,188),(579,283,172,261),(819,284,167,260),(1050,295,247,242),(1321,282,192,255)],
 [(16,578,253,180),(280,576,249,180),(548,578,242,179),(791,578,239,179),(1095,560,182,214),(1329,560,182,214)],
 [(49,781,196,197),(304,781,194,197),(556,781,192,197),(805,781,188,197),(1030,828,264,147),(1307,828,214,142)]],
 'staff-v3':[
 [(97,34,176,295),(389,35,178,295),(732,35,176,294),(1003,35,165,294)],
 [(87,338,185,290),(380,340,190,290),(729,339,194,292),(1007,340,178,291)],
 [(115,634,152,296),(399,633,158,298),(737,634,158,296),(1009,635,155,295)],
 [(122,940,162,277),(402,938,171,280),(719,939,161,280),(1002,939,167,280)]]}
def cell(sheet,col,row,cols,rows,inset=None):
 rect=list(bounds[sheet][row][col])
 if inset:
  # Inset in bounds coordinates, used only to crop the head from its drawn support.
  x,y,w,h=rect;u,v,cw,ch=inset;rect=[x+round(u*w),y+round(v*h),round(w*cw),round(h*ch)]
 return rect

def register(key,sheet,rect):
 im=sheets[sheet];x,y,w,h=rect;a=im.getchannel('A');mask=[]
 for r in range(24):
  line=''
  for c in range(24):
   box=(x+c*w//24,y+r*h//24,x+max(c*w//24+1,(c+1)*w//24),y+max(r*h//24+1,(r+1)*h//24))
   line+='1' if a.crop(box).getextrema()[1]>100 else '0'
  mask.append(line)
 m['sprites'][key]={'sheet':sheet,'rect':rect,'anchor':[.5,1],'mask':mask}
ids=['trial_frame','manual_phoropter','digital_phoropter','digital_suite']
for row,id in enumerate(ids):
 for r in range(2):
  register(f'station:{id}:{r}:rear','equipment-v3',cell('equipment-v3',r,row,4,4))
  # Head only: support linkage is drawn by production composition using fixed anchors.
  if row:rect=cell('equipment-v3',2+r,row,4,4,[0,.35,1,.65]);sheet='equipment-v3'
  else:rect=cell('customization-v3',4+r,3,6,4);sheet='customization-v3'
  register(f'station:{id}:{r}:front',sheet,rect)
for n in range(4):
 for d in range(4):
  for f in range(2):
   rect=cell('patients-v3',d*2+f,n,10,4)
   register(f'character:{n+6}:walk:{d}:{f}','patients-v3',rect)
   register(f'character:{n+6}:idle:{d}:{f}','patients-v3',cell('patients-v3',d*2,n,10,4))
   register(f'character:{n+6}:sit:{d}:{f}','patients-v3',cell('patients-v3',8+d%2,n,10,4))
for row,family in enumerate(['trial','manual','digital']):
 for d in range(2):
  for f in range(2):register(f'doctor:{family}:{d}:{f}','staff-v3',cell('staff-v3',d*2+f,row,4,4))
for family,col in [('checkIn',0),('payment',2)]:
 for f in range(2):register(f'receptionist:{family}:{f}','staff-v3',cell('staff-v3',col+f,3,4,4))
for n,id in enumerate(['peach','navy','premium']):
 for r in range(2):register(f'variant:chair:{id}:{r}','customization-v3',cell('customization-v3',n*2+r,0,6,4))
for kind,col in [('counter',0),('display',2)]:
 for r in range(2):register(f'variant:{kind}:modern:{r}','customization-v3',cell('customization-v3',col+r,1,6,4))
for id,col in [('fern',4),('rubber',5)]:
 for r in range(2):register(f'variant:plant:{id}:{r}','customization-v3',cell('customization-v3',col,1,6,4))
for id,col in [('terracotta',0),('pattern',2)]:
 for r in range(2):register(f'variant:rug:{id}:{r}','customization-v3',cell('customization-v3',col+r,2,6,4))
for id,col in [('lenses',4),('signature',5)]:
 for r in range(2):register(f'variant:art:{id}:{r}','customization-v3',cell('customization-v3',col,2,6,4))
for key,col in [('floor:rose_tile',0),('floor:walnut',1),('wall:seafoam',2),('wall:rose',3)]:register(key,'customization-v3',cell('customization-v3',col,3,6,4))
p.write_text(json.dumps(m,separators=(',',':'))+'\n')
print('Registered original sprites and alpha masks:',len(m['sprites']))
