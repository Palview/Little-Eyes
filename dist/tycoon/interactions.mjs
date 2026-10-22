import {furnitureProfile,instrumentSupport} from './furniture-profiles.mjs';
import {serviceTiles} from './grid.mjs';
import {CATALOG,EQUIPMENT} from './catalog.mjs';
export const POSE_SECONDS=.5;
const occupiedStages=['seating','exam','standing'];
const reservedStages=['toExam',...occupiedStages];
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const clamp=n=>Math.max(0,Math.min(1,n));
export function examProfile(equipmentId='manual_phoropter',rotation=0){return furnitureProfile({kind:'exam',variantId:'default',rotation},equipmentId);}
export function stationPatient(world){return world.patients.find(p=>p.id===world.exam&&reservedStages.includes(p.stage))??null;}
export function activeStationEquipmentId(world){return stationPatient(world)?.equipmentId??world.clinic.equipmentId;}
function visualTile(p){const t={x:p.tile.x+.5,y:p.tile.y+.5};if(p.path?.length){t.x+=(p.path[0].x-p.tile.x)*p.progress;t.y+=(p.path[0].y-p.tile.y)*p.progress;}return t;}
function relativeScreen(from,to){return [(from.x-to.x-from.y+to.y)*26,(from.x-to.x+from.y-to.y)*13];}
export function actorPose(world,p,role='patient'){
  const mode=p.path?.length?'walk':'idle',base={position:visualTile(p),offset:[0,mode==='idle'&&!world.reducedMotion?Math.sin(world.elapsed*1.5)*.45:0],mode,direction:p.direction??0,height:58,frame:mode==='walk'?Math.floor(world.elapsed*5)%2:0};
  const exam=world.clinic.items.find(i=>i.kind==='exam'),active=stationPatient(world);
  if(exam&&active&&occupiedStages.includes(active.stage)&&(p.id===active.id||role==='doctor')){
    const profile=examProfile(active.equipmentId??world.clinic.equipmentId,exam.rotation),center={x:exam.x+1,y:exam.y+1};
    const seat=role==='doctor'?profile.doctor:profile.patient;
    const phase=active.stage==='seating'?clamp(1-active.poseRemaining/POSE_SECONDS):active.stage==='standing'?clamp(active.poseRemaining/POSE_SECONDS):1;
    const t=phase*phase*(3-2*phase),approach=relativeScreen(visualTile(p),center);
    return {...base,position:center,offset:mix(approach,seat.offset,t),direction:seat.direction,mode:role==='doctor'?(active.stage==='exam'?'work':'idle'):t<.5?'idle':'sit',family:profile.family,height:seat.height,attachmentId:exam.id,frame:world.reducedMotion?0:active.stage==='exam'?Math.floor(world.elapsed*2)%2:0,stationId:exam.id};
  }
  if(role==='patient'&&p.stage==='waiting'&&!p.path.length&&p.seatId){const chair=world.clinic.items.find(i=>i.id===p.seatId&&i.x!==null);if(chair){const seat=furnitureProfile(chair).seat;return {...base,position:{x:chair.x+.5,y:chair.y+.5},...seat,mode:'sit',frame:0,attachmentId:chair.id};}}
  const counter=world.clinic.items.find(i=>i.kind==='counter');
  const serving=world.patients.find(a=>a.id===world.counter&&['checkIn','payment'].includes(a.stage));
  if(counter&&!p.path?.length&&(role==='receptionist'||(role==='patient'&&serving?.id===p.id))){
   const profile=furnitureProfile(counter),center={x:counter.x+profile.geometry.width/2,y:counter.y+profile.geometry.height/2};
   const tile=serviceTiles(counter)[role==='receptionist'?'staff':'patient'];const position={x:tile.x+.5,y:tile.y+.5};
   return {...base,position,offset:[0,0],direction:role==='patient'?(counter.rotation+2)%4:counter.rotation,mode:role==='receptionist'&&serving?'work':'idle',family:serving?.stage,frame:world.reducedMotion?0:Math.floor(world.elapsed*2)%2,attachmentId:counter.id};
  }
  return base;
}
export function stationComposition(world,item){
 const patient=stationPatient(world),equipmentId=activeStationEquipmentId(world),profile=examProfile(equipmentId,item.rotation),origin={x:item.x+1,y:item.y+1};
 const shared={position:origin,width:profile.width,registration:profile.registration,equipmentId,family:profile.family};
 const rear={...shared,...profile.rearLayers[0],role:'rear'},result=[rear];
 const occupied=patient&&occupiedStages.includes(patient.stage);
 const phase=!occupied?0:patient.stage==='seating'?clamp(1-patient.poseRemaining/POSE_SECONDS):patient.stage==='standing'?clamp(patient.poseRemaining/POSE_SECONDS):1;
 const offset=mix(profile.instrument.restOffset,profile.instrument.offset,phase),headAnchor=profile.instrument.headAnchor;
 const mount=instrumentSupport(profile,offset);
 if(profile.back)result.push({...shared,key:profile.instrument.key,width:profile.instrument.width,registration:profile.instrument.registration,role:'instrument',offset,mount,opacity:profile.family==='trial'?phase:1});
 if(occupied){result.push({...actorPose(world,world.doctor,'doctor'),role:'doctor',patient:world.doctor});result.push({...actorPose(world,patient),role:'patient',patient});}
 result.push({...shared,...profile.frontLayers[0],role:'front',offset:profile.back?profile.frontLayers[0].offset:offset,mount:profile.back?null:mount,opacity:profile.back?1:profile.family==='trial'?phase:1});
 return result;
}
export function furnitureComposition(world,item,{includeOccupants=true}={}){
 if(item.kind==='exam'){const parts=stationComposition(world,item);return includeOccupants?parts:parts.filter(p=>!['doctor','patient'].includes(p.role));}
 const profile=furnitureProfile(item),origin={x:item.x+profile.geometry.width/2,y:item.y+profile.geometry.height/2};
 const rear=profile.rearLayers.map(l=>({...l,role:'rear',position:origin})),front=profile.frontLayers.map(l=>({...l,role:'front',position:origin}));
 if(!includeOccupants)return profile.previewLayers.map(l=>({...l,role:'rear',position:origin}));
 if(item.kind==='chair'){
  const p=world.patients.find(p=>p.stage==='waiting'&&!p.path.length&&p.seatId===item.id);
  return [...rear,...(p?[{...actorPose(world,p),role:'patient',patient:p}]:[]),...front];
 }
 if(item.kind==='counter'){
  const reception=actorPose(world,world.receptionist,'receptionist'),p=world.patients.find(p=>p.id===world.counter&&['checkIn','payment'].includes(p.stage)&&!p.path.length);
  const staff=reception.attachmentId===item.id?[{...reception,role:'receptionist',patient:world.receptionist}]:[],patients=p?[{...actorPose(world,p),role:'patient',patient:p}]:[];
  return item.rotation<2?[...rear,...staff,...front,...patients]:[...rear,...patients,...front,...staff];
 }
 return rear;
}
export function pickObject(regions,point){
 for(let i=regions.length-1;i>=0;i--){const r=regions[i],b=r.bounds;if(point.x<b.x||point.x>b.x+b.w||point.y<b.y||point.y>b.y+b.h)continue;
  if(r.segment){const {from,to,width}=r.segment,dx=to.x-from.x,dy=to.y-from.y,t=Math.max(0,Math.min(1,((point.x-from.x)*dx+(point.y-from.y)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(point.x-from.x-t*dx,point.y-from.y-t*dy)>width/2)continue;}
  let u=(point.x-b.x)/b.w,v=(point.y-b.y)/b.h;
  if(r.skew){const k=r.skew;u=(point.x-k.x)/k.w;v=(point.y-k.y-k.slope*(point.x-k.x-k.w/2))/k.h;if(u<0||u>1||v<0||v>1)continue;}
  const win=r.maskWindow??[0,0,1,1];u=win[0]+u*win[2];v=win[1]+v*win[3];
  if(r.outline){let inside=false;for(let a=0,b=r.outline.length-1;a<r.outline.length;b=a++){const [ax,ay]=r.outline[a],[bx,by]=r.outline[b];if((ay>v)!==(by>v)&&u<(bx-ax)*(v-ay)/(by-ay)+ax)inside=!inside;}if(!inside)continue;}
  if(r.mask?.length){const row=Math.max(0,Math.min(r.mask.length-1,Math.floor(v*r.mask.length))),col=Math.max(0,Math.min(r.mask[0].length-1,Math.floor(u*r.mask[0].length)));if(r.mask[row][col]!=='1')continue;}
  return r;
 }return null;
}
export function objectLabel(item){return CATALOG[item.kind]?.name??'Clinic object';}
