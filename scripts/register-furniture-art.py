"""Register original PNG bounds, anchors and alpha masks without editing pixels."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]/'dist';m=json.loads((root/'assets/manifest.json').read_text());registry={};images={}
def components(im):
 w,h=im.size;a=im.getchannel('A').load();seen=bytearray(w*h);found=[]
 for y in range(h):
  for x in range(w):
   if seen[y*w+x] or a[x,y]<128:continue
   stack=[(x,y)];seen[y*w+x]=1;n=0;lx=rx=x;ty=by=y
   while stack:
    xx,yy=stack.pop();n+=1;lx=min(lx,xx);rx=max(rx,xx);ty=min(ty,yy);by=max(by,yy)
    for nx,ny in [(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)]:
     if 0<=nx<w and 0<=ny<h and not seen[ny*w+nx] and a[nx,ny]>=128:seen[ny*w+nx]=1;stack.append((nx,ny))
   if n>650:found.append([lx,ty,rx-lx+1,by-ty+1])
 return found
for name,cols,rows in [('chairs',4,4),('surfaces',4,5),('displays',4,2),('patients-rear',2,8),('staff',4,7),('plants',4,3),('exam-rear',4,4),('rear-reach',4,2)]:
 file=f'assets/rotation/{name}.png';im=Image.open(root/file).convert('RGBA');images[name]=im
 m['files']['rotation-'+name]={'file':file,'width':im.width,'height':im.height}
 if name=='staff':
  # Last generated row is truncated. Use the complete rear clipboard pose for
  # both service actions; direction remains genuine rear artwork.
  limits=[0,205,399,587,778,947,1117];ordered=[]
  for row in range(6):
   line=[]
   for col in range(4):
    x0=round(col*im.width/4);x1=round((col+1)*im.width/4);y0=limits[row];y1=limits[row+1]
    box=im.getchannel('A').crop((x0,y0,x1,y1)).point(lambda a:255 if a>=128 else 0).getbbox();a,b,c,d=box;line.append([x0+a,y0+b,c-a,d-b])
   ordered.append(line)
  ordered.append(ordered[4]);registry[name]=ordered;print(name,'inspected six complete rows; rear clipboard work pose shared between services');continue
 b=components(im);print(name,len(b),'expected',cols*rows)
 if len(b)!=cols*rows:raise ValueError((name,b))
 b.sort(key=lambda r:r[1]);ordered=[]
 for row in range(rows):ordered.append(sorted(b[row*cols:(row+1)*cols],key=lambda r:r[0]))
 registry[name]=ordered

name='exam-head-source';file=f'assets/rotation/{name}.png';im=Image.open(root/file).convert('RGBA');images[name]=im
m['files']['rotation-'+name]={'file':file,'width':im.width,'height':im.height}

clip_cache={}
def add(key,name,rect):
 cachekey=(name,tuple(rect))
 if cachekey in clip_cache:
  m['sprites'][key]=clip_cache[cachekey];return
 im=images[name];x,y,w,h=rect;a=im.getchannel('A');pixels=a.crop((x,y,x+w,y+h));px=pixels.load();seen=bytearray(w*h);largest=[]
 for yy in range(h):
  for xx in range(w):
   if seen[yy*w+xx] or px[xx,yy]<128:continue
   stack=[(xx,yy)];seen[yy*w+xx]=1;part=[]
   while stack:
    cx,cy=stack.pop();part.append((cx,cy))
    for nx,ny in [(cx-1,cy),(cx+1,cy),(cx,cy-1),(cx,cy+1)]:
     if 0<=nx<w and 0<=ny<h and not seen[ny*w+nx] and px[nx,ny]>=128:seen[ny*w+nx]=1;stack.append((nx,ny))
   if len(part)>len(largest):largest=part
 spans={};bits=[['0']*24 for _ in range(24)]
 for xx,yy in largest:
  old=spans.get(yy,[w,-1]);spans[yy]=[min(old[0],xx),max(old[1],xx)];bits[min(23,yy*24//h)][min(23,xx*24//w)]='1'
 rows=sorted(spans);left=[[spans[yy][0]/w,yy/h] for yy in rows];right=[[(spans[yy][1]+1)/w,(yy+1)/h] for yy in reversed(rows)]
 # Keep true source-component boundaries as renderer/picking metadata. PNG bytes unchanged.
 outline=left+right
 sprite={'sheet':name if name in m['files'] else 'rotation-'+name,'rect':list(rect),'anchor':[.5,1],'mask':[''.join(row) for row in bits],'outline':outline}
 m['sprites'][key]=sprite;clip_cache[cachekey]=sprite

def asset(kind,variant,r,name,rect):
 for layer in ['rear','front']:add(f'furnishing:{kind}:{variant}:{r}:{layer}',name,rect)
for row,v in enumerate(['default','peach','navy','premium']):
 for r in range(4):asset('chair',v,r,'chairs',registry['chairs'][row][r])
for row,(kind,v) in enumerate([('counter','default'),('counter','modern'),('display','default'),('display','modern'),('cabinet','default')]):
 for r in range(4):asset(kind,v,r,'surfaces',registry['surfaces'][row][r])
for row,v in enumerate(['default','modern']):
 for r in range(4):asset('display',v,r,'displays',registry['displays'][row][r])
for row,v in enumerate(['default','fern','rubber']):
 for r in range(4):asset('plant',v,r,'plants',registry['plants'][row][r])
# Centered diamond rugs repeat under 180-degree rotation: explicit symmetric aliases.
symmetry=[]
for v in ['default','terracotta','pattern']:
 for r in range(4):
  source=('furniture:'+str([13,14][r%2])) if v=='default' else f'variant:rug:{v}:{r%2}'
  s=m['sprites'][source];name=s['sheet']
  if name not in images:images[name]=Image.open(root/m['files'][name]['file']).convert('RGBA')
  for layer in ['rear','front']:add(f'furnishing:rug:{v}:{r}:{layer}',name,s['rect'])
  if r>=2:symmetry.append({'kind':'rug','variant':v,'orientation':r,'sourceOrientation':r%2,'reason':'Centered diamond weave and fringe have 180-degree rotational symmetry.'})
for row in range(8):
 for r in [2,3]:
  for f in [0,1]:add(f'character:{row+2}:sit:{r}:{f}','patients-rear',registry['patients-rear'][row][r-2])
for row,family in enumerate(['trial','manual','digital']):
 for r in [2,3]:
  for f in [0,1]:add(f'doctor:{family}:{r}:{f}','staff',registry['staff'][row][(r-2)*2+f])
for row,family in enumerate(['manual','trial']):
 for r in [2,3]:
  for f in [0,1]:add(f'doctor:{family}:{r}:{f}','rear-reach',registry['rear-reach'][row][(r-2)*2+f])
for mode,row in [('checkIn',3),('payment',5)]:
 for r in range(4):
  for f in [0,1]:add(f'receptionist:{mode}:{r}:{f}','staff',registry['staff'][row+(r//2)][(r%2)*2+f])
for row,id in enumerate(['trial_frame','manual_phoropter','digital_phoropter','digital_suite']):
 for r in [2,3]:
  add(f'station:{id}:{r}:rear','exam-rear',registry['exam-rear'][row][r-2])
  # Reuse the exact registered chair pixels for foreground occlusion.
  add(f'station:{id}:{r}:front','exam-rear',registry['exam-rear'][row][r-2])
# Optical heads use original rear casing crops; their physical arm is composed at runtime.
for model,rects in [('manual_phoropter',[[268,326,102,75],[439,326,102,75]]),('digital_phoropter',[[268,587,102,64],[441,587,102,64]]),('digital_suite',[[268,842,102,64],[441,842,102,64]])]:
 for r,rect in zip([2,3],rects):add(f'station:{model}:{r}:instrument','exam-head-source',rect)
for r in [2,3]:m['sprites'][f'station:trial_frame:{r}:instrument']=m['sprites'][f'station:trial_frame:{r-2}:front']
(root/'assets/manifest.json').write_text(json.dumps(m,separators=(',',':'))+'\n')
(root/'assets/rotation/registration.json').write_text(json.dumps({'bounds':registry,'symmetry':symmetry,'sharedWorkPose':'Rear receptionist payment and check-in share the complete rear clipboard pose; truncated source row is not integrated.'},indent=2)+'\n')
print('Sprites',len(m['sprites']))
