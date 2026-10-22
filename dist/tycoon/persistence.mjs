import {hasCompleteFurnitureProfile} from './furniture-profiles.mjs';
import {CATALOG,PRESETS,WALLS,FLOORS,EQUIPMENT,VARIANTS} from './catalog.mjs';
import {validateLayout} from './grid.mjs';
import {MILESTONES} from './progression.mjs';
const KEY='little-eyes-tycoon-v4',V3='little-eyes-tycoon-v3',V2='little-eyes-tycoon-v2';
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const unique=a=>Array.isArray(a)&&new Set(a).size===a.length;
function validLayout(c){
 if(!c||!PRESETS[c.presetId]||!safe(c.coins)||!safe(c.completedVisits)||!WALLS.some(x=>x.id===c.wallId)||!FLOORS.some(x=>x.id===c.floorId)||!Array.isArray(c.items)||c.items.length>40)return false;
 for(const i of c.items){if(!i||typeof i.id!=='string'||!i.id.length||i.id.length>60||!CATALOG[i.kind]||!Number.isInteger(i.rotation)||i.rotation<0||i.rotation>(i.kind==='art'?0:3)||!((i.x===null&&i.y===null)||(Number.isInteger(i.x)&&Number.isInteger(i.y))))return false;}
 for(const [kind,def] of Object.entries(CATALOG)){const items=c.items.filter(i=>i.kind===kind);if(def.limit&&items.length>def.limit)return false;if(kind==='chair'&&items.filter(i=>i.x!==null).length<2)return false;}
 return validateLayout(c).ok;
}
export function validClinic(c){
 if(!validLayout(c)||!['trial_frame','manual_phoropter','legacy'].includes(c.starterId)||!safe(c.xp)||!unique(c.ownedEquipmentIds)||!c.ownedEquipmentIds.length||!c.ownedEquipmentIds.every(id=>EQUIPMENT.some(e=>e.id===id))||!c.ownedEquipmentIds.includes(c.equipmentId)||!unique(c.acknowledgedMilestoneIds)||!c.acknowledgedMilestoneIds.every(id=>MILESTONES.some(m=>m.id===id&&c.xp>=m.xp)))return false;
 return c.items.every(i=>VARIANTS[i.kind]?.some(v=>v.id===i.variantId)&&hasCompleteFurnitureProfile(i,c.equipmentId));
}
function convert(data,version){
 const old=data?.clinic;if(data?.version!==version||!old||!Array.isArray(old.items)||!old.items.every(i=>i&&[0,1].includes(i.rotation)))return null;
 const c=structuredClone(old);c.items=c.items.map(i=>({...i,rotation:i.kind==='art'?0:i.rotation}));
 if(version===2){if(![0,1,2].includes(c.equipmentTier)||!safe(c.completedVisits*10))return null;const ids=['manual_phoropter','digital_phoropter','digital_suite'];c.starterId='legacy';c.equipmentId=ids[c.equipmentTier];c.ownedEquipmentIds=ids.slice(0,c.equipmentTier+1);c.xp=c.completedVisits*10;c.acknowledgedMilestoneIds=[];c.items=c.items.map(i=>({...i,variantId:'default'}));delete c.equipmentTier;}
 return validClinic(c)?c:null;
}
function readOld(storage,key,version){try{return convert(JSON.parse(storage.getItem(key)),version);}catch{return null;}}
function older(storage){if(storage.getItem(KEY)!==null)return readOld(storage,V3,3)??readOld(storage,V2,2);if(storage.getItem(V3)!==null)return readOld(storage,V2,2);return null;}
export function recoverOlderClinic(storage){try{const clinic=older(storage);if(!clinic)return {clinic:null,notice:'The previous save is unavailable.'};const saved=saveClinic(storage,clinic);return {clinic,notice:saved?null:'Session only · Saving is unavailable. Keep this page open.'};}catch{return {clinic:null,notice:'Saving is unavailable or the previous record cannot be read.'};}}
export function recoverLegacyClinic(storage){return recoverOlderClinic(storage);}
export function loadClinic(storage){
 try{
  const raw=storage.getItem(KEY);if(raw!==null){let data;try{data=JSON.parse(raw);}catch{}
   if(data?.version===4&&validClinic(data.clinic))return {clinic:structuredClone(data.clinic),notice:null};
   return {clinic:null,notice:'Your current save could not be restored. It has been preserved. Recover a previous save, or choose a new practice to replace it.',canRecoverOlder:!!older(storage),needsRecovery:true};
  }
  const raw3=storage.getItem(V3),raw2=storage.getItem(V2);if(raw3===null&&raw2===null)return {clinic:null,notice:null};
  const clinic=raw3!==null?readOld(storage,V3,3):readOld(storage,V2,2);
  if(!clinic)return {clinic:null,notice:'The previous save could not be restored. It has been preserved.',canRecoverOlder:!!older(storage),needsRecovery:true};
  const saved=saveClinic(storage,clinic);return {clinic,notice:saved?null:'Session only · Your save was recovered but saving is unavailable. Keep this page open.'};
 }catch{return {clinic:null,notice:'Session only · Saving is unavailable or the save could not be read. You can still play.'};}
}
export function saveClinic(storage,clinic){if(!validClinic(clinic))return false;try{const {presetId,coins,completedVisits,starterId,equipmentId,ownedEquipmentIds,xp,acknowledgedMilestoneIds,wallId,floorId,items}=clinic;storage.setItem(KEY,JSON.stringify({version:4,clinic:{presetId,coins,completedVisits,starterId,equipmentId,ownedEquipmentIds,xp,acknowledgedMilestoneIds,wallId,floorId,items}}));return true;}catch{return false;}}
export function resetClinic(storage){try{for(const key of [KEY,V3,V2])storage.removeItem(key);return true;}catch{return false;}}
