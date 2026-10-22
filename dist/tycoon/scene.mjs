import {orientationFor} from './orientations.mjs';
import {CATALOG,PRESETS,WALLS,FLOORS,APPEARANCES,furnitureKey} from './catalog.mjs';
import {actorPose,furnitureComposition,stationPatient,pickObject} from './interactions.mjs';
export const project=(t,camera={x:0,y:0,zoom:1})=>({x:camera.x+(t.x-t.y)*26*camera.zoom,y:camera.y+(t.x+t.y)*13*camera.zoom});
export const unproject=(p,camera={x:0,y:0,zoom:1})=>{const a=(p.x-camera.x)/(26*camera.zoom),b=(p.y-camera.y)/(13*camera.zoom);return {x:(a+b)/2,y:(b-a)/2};};
export const depthKey=t=>(t.x+t.y)*1000+t.x;
export function createScene(canvas,initialAssets){
 const ctx=canvas.getContext('2d');let assets=initialAssets,camera={x:0,y:0,zoom:1},width=800,height=600,lastPreset=null,zoom=1,pan={x:0,y:0},hits=[];
 function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(globalThis.devicePixelRatio||1,2);width=r.width;height=r.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 function polygon(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.6;ctx.stroke();}}
 function tile(x,y,fill,stroke){const points=[{x,y},{x:x+1,y},{x:x+1,y:y+1},{x,y:y+1}].map(t=>project(t,camera));polygon(points,fill,stroke);return points;}
 function sprite(key,position,drawWidth,options={}){
  const s=assets?.sprites?.[key];if(!s?.image||options.opacity===0)return null;
  const p=project(position,camera),pivot=options.registration??[.5,1],offset=options.offset??[0,0];
  const h=options.height?options.height*camera.zoom:drawWidth*camera.zoom*s.rect[3]/s.rect[2],w=options.height?h*s.rect[2]/s.rect[3]:drawWidth*camera.zoom;
  const x=p.x+offset[0]*camera.zoom-w*pivot[0],y=p.y+offset[1]*camera.zoom-h*pivot[1];
  ctx.save();ctx.globalAlpha=options.opacity??1;if(options.wallSlope)ctx.transform(1,options.wallSlope,0,1,0,-options.wallSlope*(x+w/2));
  if(s.outline){ctx.beginPath();s.outline.forEach(([u,v],i)=>i?ctx.lineTo(x+u*w,y+v*h):ctx.moveTo(x+u*w,y+v*h));ctx.closePath();ctx.clip();}
  if(options.clips){for(const part of options.clips){const [u,v,cw,ch]=part.box,[dx,dy]=part.offset;const px=x+dx*camera.zoom,py=y+dy*camera.zoom;ctx.drawImage(s.image,s.rect[0]+u*s.rect[2],s.rect[1]+v*s.rect[3],cw*s.rect[2],ch*s.rect[3],px+u*w,py+v*h,cw*w,ch*h);if(options.hit)hits.push({...options.hit,bounds:{x:px+u*w,y:py+v*h,w:cw*w,h:ch*h},mask:s.mask,outline:s.outline,maskWindow:part.box});}}
  else ctx.drawImage(s.image,...s.rect,x,y,w,h);
  ctx.restore();
  const skew=options.wallSlope?{slope:options.wallSlope,x,y,w,h}:null;const bounds=skew?{x,y:y-Math.abs(skew.slope*w/2),w,h:h+Math.abs(skew.slope*w)}:{x,y,w,h};if(options.hit&&!options.clips)hits.push({...options.hit,bounds,mask:s.mask,outline:s.outline,skew});return bounds;
 }
 function highlight(i){const d=CATALOG[i.kind],{width:w,height:h}=orientationFor(i.kind,i.rotation);for(let x=0;x<w;x++)for(let y=0;y<h;y++)tile(i.x+x,i.y+y,'#a7c18165','#5c7c48');}
 function drawCharacter(p,role,world,pose=actorPose(world,p,role),selected=false){
  const char=role==='patient'?p.appearance+2:role==='doctor'?0:1;
  const key=pose.mode==='work'?(role==='doctor'?`doctor:${pose.family}:${pose.direction}:${pose.frame}`:`receptionist:${pose.family}:${pose.direction}:${pose.frame}`):`character:${char}:${pose.mode}:${pose.direction}:${pose.frame}`;
  const hit={id:role==='patient'?p.id:role,type:role==='patient'?'patient':'staff'};
  const ground=project(pose.position,camera);ctx.save();ctx.fillStyle='#34483421';ctx.beginPath();ctx.ellipse(ground.x+pose.offset[0]*camera.zoom,ground.y+pose.offset[1]*camera.zoom,10*camera.zoom,3*camera.zoom,0,0,Math.PI*2);ctx.fill();ctx.restore();
  const bounds=sprite(key,pose.position,0,{height:pose.height,offset:pose.offset,hit});
  if(!bounds){const pt=project(pose.position,camera),x=pt.x+pose.offset[0]*camera.zoom,y=pt.y+pose.offset[1]*camera.zoom;ctx.fillStyle=role==='doctor'?'#fffdf1':role==='receptionist'?'#718e78':APPEARANCES[p.appearance].color;ctx.fillRect(x-8*camera.zoom,y-30*camera.zoom,16*camera.zoom,25*camera.zoom);ctx.fillStyle='#bd916d';ctx.fillRect(x-6*camera.zoom,y-44*camera.zoom,12*camera.zoom,14*camera.zoom);hits.push({...hit,bounds:{x:x-10*camera.zoom,y:y-48*camera.zoom,w:20*camera.zoom,h:48*camera.zoom}});}
  if(selected){const pt=project(pose.position,camera);ctx.strokeStyle='#546f41';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(pt.x+pose.offset[0]*camera.zoom,pt.y+pose.offset[1]*camera.zoom+3*camera.zoom,15*camera.zoom,6*camera.zoom,0,0,Math.PI*2);ctx.stroke();}
 }
 function drawFurniture(item,world,selected,opacity=1,includeOccupants=true){
  if(selected)highlight(item);const parts=furnitureComposition(world,item,{includeOccupants}),active=item.kind==='exam'?stationPatient(world):null;
  let rearDrawn=false;
  for(const part of parts){if(['patient','doctor','receptionist'].includes(part.role)){if(!includeOccupants)continue;drawCharacter(part.patient,part.role,world,part);continue;}
   const box=sprite(part.key,part.position,part.width,{...part,opacity:opacity*(part.opacity??1),hit:{id:item.id,type:'item'}});if(part.role==='rear')rearDrawn=!!box;if(part.role==='rear'){
    const front=parts.find(p=>p.mount);if(front?.mount&&!front.mount.integrated){const base=project(front.position,camera),points=[front.mount.from,front.mount.via,front.mount.to].map(([x,y])=>({x:base.x+x*camera.zoom,y:base.y+y*camera.zoom}));ctx.save();ctx.globalAlpha=opacity;ctx.lineCap='round';ctx.lineJoin='round';for(const [color,lineWidth]of [['#3b362d',5],['#e6d3b3',3]]){ctx.strokeStyle=color;ctx.lineWidth=lineWidth*camera.zoom;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}for(const p of points.slice(0,2)){ctx.fillStyle='#e9d7b9';ctx.strokeStyle='#3b362d';ctx.lineWidth=camera.zoom;ctx.beginPath();ctx.arc(p.x,p.y,2.7*camera.zoom,0,Math.PI*2);ctx.fill();ctx.stroke();}ctx.restore();for(let n=1;n<points.length;n++){const a=points[n-1],b=points[n],pad=3*camera.zoom;hits.push({id:item.id,type:'item',bounds:{x:Math.min(a.x,b.x)-pad,y:Math.min(a.y,b.y)-pad,w:Math.abs(b.x-a.x)+pad*2,h:Math.abs(b.y-a.y)+pad*2},segment:{from:a,to:b,width:5*camera.zoom}});}}
   }
  }
  if(!rearDrawn){const geometry=orientationFor(item.kind,item.rotation),p=project({x:item.x+geometry.width/2,y:item.y+geometry.height/2},camera);ctx.fillStyle='#d6bea1';ctx.fillRect(p.x-17*camera.zoom,p.y-30*camera.zoom,34*camera.zoom,30*camera.zoom);hits.push({id:item.id,type:'item',bounds:{x:p.x-17*camera.zoom,y:p.y-30*camera.zoom,w:34*camera.zoom,h:30*camera.zoom}});}
  if(includeOccupants&&active&&['seating','exam','standing'].includes(active.stage)){const p=project({x:item.x+1,y:item.y+1},camera),bar=45*camera.zoom;ctx.fillStyle='#fffcf1';ctx.fillRect(p.x-bar/2,p.y-127*camera.zoom,bar,5*camera.zoom);ctx.fillStyle='#628456';ctx.fillRect(p.x-bar/2,p.y-127*camera.zoom,bar*(1-active.examRemaining/active.examDuration),5*camera.zoom);}
 }
 function drawItem(i,world,selected=false,ghost=false){
  const d=CATALOG[i.kind];if(i.x===null)return;if(i.kind!=='art'){drawFurniture(i,world,selected,ghost?.55:1,!ghost);return;}
  const {width:w,height:h}=orientationFor(i.kind,i.rotation),pos={x:i.x+w/2,y:i.y+h/2};let key=furnitureKey(i);
  const dw=i.kind==='art'?36:i.kind==='chair'?56:i.kind==='plant'?47:i.kind==='display'?68:i.kind==='rug'?104:(w+h)*26;
  if(selected)highlight(i);
  const origin=i.kind==='art'?{x:i.x+.5,y:.05}:pos,offset=i.kind==='art'?[0,-17]:[0,0];
  if(!sprite(key,origin,dw,{opacity:ghost?.55:1,offset,wallSlope:i.kind==='art'?.5:0,hit:{id:i.id,type:'item'}})){
   const p=project(origin,camera),bounds={x:p.x-17*camera.zoom,y:p.y-30*camera.zoom,w:34*camera.zoom,h:30*camera.zoom};ctx.fillStyle=ghost?'#adbe9d':'#d6bea1';ctx.fillRect(bounds.x,bounds.y,bounds.w,bounds.h);hits.push({id:i.id,type:'item',bounds});ctx.fillStyle='#435940';ctx.font=`${9*camera.zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText(d.name.split(' ')[0],p.x,p.y-13*camera.zoom);
  }
 }
 function render(world,view={}){
  if(!world)return;hits=[];const c=world.clinic,p=PRESETS[c.presetId];if(lastPreset!==p.id){lastPreset=p.id;pan={x:0,y:0};zoom=1;}
  const top=92,bottom=view.panelOpen?Math.min(height*.35,295):90,usable=Math.max(180,height-top-bottom);
  const fit=Math.min((width-42)/((p.width+p.height)*26),usable/((p.width+p.height)*13+100));
  camera={x:width/2-(p.width-p.height)*13*fit*zoom+pan.x,y:top+usable/2-((p.width+p.height)*13-76)/2*fit*zoom+pan.y,zoom:fit*zoom};
  ctx.clearRect(0,0,width,height);const wallColor=WALLS.find(a=>a.id===c.wallId),fl=FLOORS.find(a=>a.id===c.floorId);
  const a=project({x:0,y:0},camera),b=project({x:p.width,y:0},camera),d=project({x:0,y:p.height},camera),wall=78*camera.zoom;
  ctx.save();ctx.shadowColor='#51624920';ctx.shadowBlur=24;ctx.shadowOffsetY=16;polygon([a,b,project({x:p.width,y:p.height},camera),d],'#d7c9ae');ctx.restore();
  polygon([{x:a.x,y:a.y-wall},{x:b.x,y:b.y-wall},b,a],wallColor.color,'#c2b9a2');polygon([{x:d.x,y:d.y-wall},{x:a.x,y:a.y-wall},a,d],c.wallId==='cream'?'#dcd4c2':wallColor.color,'#b8b49d');
  for(let x=0;x<p.width;x++)for(let y=0;y<p.height;y++){
   const color=c.floorId==='checker'?(x+y)%2?'#e9e5d2':'#aebd9e':fl.color,pts=tile(x,y,color,c.floorId==='honey'?'#9e7e6050':'#b3aa8b45');
   const tex=assets?.sprites?.['floor:'+c.floorId];if(tex?.image){ctx.save();ctx.beginPath();pts.forEach((pt,j)=>j?ctx.lineTo(pt.x,pt.y):ctx.moveTo(pt.x,pt.y));ctx.closePath();ctx.clip();const t=project({x,y},camera);ctx.globalAlpha=.48;ctx.drawImage(tex.image,...tex.rect,t.x-26*camera.zoom,t.y,52*camera.zoom,26*camera.zoom);ctx.restore();}
  }
  for(let i=2;i<p.width-2;i+=4){const l=project({x:i,y:0},camera),r=project({x:i+2.4,y:0},camera);polygon([{x:l.x,y:l.y-wall+13*camera.zoom},{x:r.x,y:r.y-wall+13*camera.zoom},{x:r.x,y:r.y-16*camera.zoom},{x:l.x,y:l.y-16*camera.zoom}],'#bdd3cd','#f8f4e5');ctx.strokeStyle='#fcf7e8';ctx.lineWidth=4*camera.zoom;ctx.beginPath();ctx.moveTo(l.x,l.y-wall+13*camera.zoom);ctx.lineTo(l.x,l.y-16*camera.zoom);ctx.stroke();}
  const wallTexture=assets?.sprites?.['wall:'+c.wallId];if(['seafoam','rose'].includes(c.wallId)&&wallTexture?.image){ctx.save();ctx.beginPath();[{x:a.x,y:a.y-wall},{x:b.x,y:b.y-wall},b,a].forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();ctx.globalAlpha=.22;ctx.drawImage(wallTexture.image,...wallTexture.rect,a.x,a.y-wall,b.x-a.x,b.y-a.y+wall);ctx.restore();}
  if(c.wallId==='paper'){ctx.fillStyle='#8d9e7955';for(let i=1;i<p.width;i++){const pt=project({x:i,y:0},camera);ctx.fillRect(pt.x,pt.y-wall*.65,3*camera.zoom,7*camera.zoom);}}
  const entrance=project({x:p.entrance.x+.5,y:p.entrance.y+.5},camera);ctx.fillStyle='#71896a';ctx.font=`${10*camera.zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText('WELCOME',entrance.x,entrance.y+20*camera.zoom);
  c.items.filter(i=>i.x!==null&&i.kind==='rug').forEach(i=>drawItem(i,world,view.selectedId===i.id));
  const drawn=c.items.filter(i=>i.x!==null&&i.kind!=='rug').map(i=>({depth:depthKey({x:i.x+orientationFor(i.kind,i.rotation).width/2,y:i.y+orientationFor(i.kind,i.rotation).height/2}),draw:()=>drawItem(i,world,view.selectedId===i.id)}));
  for(const [role,person]of [['doctor',world.doctor],['receptionist',world.receptionist],...world.patients.map(p=>['patient',p])]){
   const pose=actorPose(world,person,role);if(pose.attachmentId||pose.stationId)continue;
   drawn.push({depth:depthKey(pose.position)+.1,draw:()=>drawCharacter(person,role,world,pose,view.selectedPatient===person.id)});
  }
  drawn.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
  if(view.ghost){const i=view.ghost,d=CATALOG[i.kind],{width:w,height:h}=orientationFor(i.kind,i.rotation);for(let x=0;x<w;x++)for(let y=0;y<h;y++)tile(i.x+x,i.y+y,view.valid?'#8fb46a88':'#cf8d7d88',view.valid?'#4c7444':'#ab5d49');if(!c.items.some(a=>a.kind===i.kind&&a.x===i.x&&a.y===i.y&&a.rotation===i.rotation)){const realHits=hits;hits=[];drawItem(i,world,false,true);hits=realHits;}}
  if(view.accessTiles)for(const [role,t]of Object.entries(view.accessTiles)){tile(t.x,t.y,role==='staff'?'#e4b76588':'#85b6b688',role==='staff'?'#a47a37':'#4e8081');}
  if(view.cursor&&!view.ghost)tile(view.cursor.x,view.cursor.y,'#fcf7e044','#6e8566');
 }
 return {render,hitTest(clientX,clientY){const r=canvas.getBoundingClientRect(),p=unproject({x:clientX-r.left,y:clientY-r.top},camera);return {x:Math.floor(p.x),y:Math.floor(p.y)};},pickObject(clientX,clientY){const r=canvas.getBoundingClientRect();return pickObject(hits,{x:clientX-r.left,y:clientY-r.top});},getHitRegions(){return hits.map(h=>({...h,bounds:{...h.bounds}}));},setCamera(next){if(next.reset){pan={x:0,y:0};zoom=1;}if(next.zoom)zoom=Math.max(.65,Math.min(3.2,zoom*next.zoom));if(next.dx)pan.x+=next.dx;if(next.dy)pan.y+=next.dy;},setAssets(a){assets=a;},resize,destroy(){observer.disconnect();}};
}
