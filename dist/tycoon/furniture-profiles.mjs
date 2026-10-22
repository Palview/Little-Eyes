import {CATALOG,VARIANTS,EQUIPMENT} from './catalog.mjs';
import {orientationFor} from './orientations.mjs';
const layer=(key,width,offset=[0,0],extra={})=>({key,width,offset,registration:[.5,1],...extra});
export function instrumentSupport(profile,offset){return profile.family==='trial'?null:{from:profile.supportAnchor,via:[offset[0],profile.supportAnchor[1]],to:offset.map((v,i)=>v+profile.instrument.headAnchor[i]),headAnchor:profile.instrument.headAnchor,integrated:false};}
export function furnitureProfile(item,equipmentId='manual_phoropter'){
 const {kind,rotation:r}=item,v=item.variantId??'default',geometry=orientationFor(kind,r);
 if(!VARIANTS[kind]?.some(s=>s.id===v))throw Error('Unknown furniture style');
 if(kind==='exam'){
  const e=EQUIPMENT.find(e=>e.id===equipmentId);if(!e)throw Error('Unknown equipment profile');const back=r>=2,side=r%2,model=EQUIPMENT.indexOf(e);
  const width=back?100:108,registration=[.5,.94];
  const rearKey=`station:${equipmentId}:${r}:rear`,frontKey=`station:${equipmentId}:${r}:front`;
  const patient={direction:r,offset:back?(side?[20,-43]:[-20,-43]):(side?[8,-17]:[-8,-17]),height:back?50:58,eyeAnchor:back?[side?-2:2,-38]:[side?-2:2,-42]};
  const doctor={direction:back?r:(side?1:0),offset:back?(side?[-40,-26]:[40,-26]):e.interactionFamily==='manual'?(side?[-28,-20]:[28,-20]):e.interactionFamily==='trial'?(side?[-30,-14]:[30,-14]):(side?[-45,-8]:[45,-8]),height:60,handAnchor:side?[20,-35]:[-20,-35]};
  const supportAnchor=back?(side?[-42,-94]:[42,-94]):e.id==='digital_suite'?(side?[31,-82]:[-37,-76]):e.id==='digital_phoropter'?(side?[33,-86]:[-33,-86]):(side?[32,-90]:[-32,-90]);
  const instrument={headAnchor:[0,e.id==='manual_phoropter'?-15:-14],offset:patient.offset.map((n,i)=>n+patient.eyeAnchor[i]),restOffset:side?[-36,-56]:[36,-56],width:e.id==='trial_frame'?19:e.id==='manual_phoropter'?34:36,registration:[.5,e.id==='trial_frame'?.56:.65]};
  instrument.key=back?`station:${equipmentId}:${r}:instrument`:frontKey;
  if(back){instrument.restOffset=side?[-36,-63]:[36,-63];if(['trial','manual'].includes(e.interactionFamily)){doctor.handAnchor=e.interactionFamily==='trial'?[side?20:-20,-56]:[side?20:-20,-55];const reach=e.interactionFamily==='trial'?9:16;doctor.offset=instrument.offset.map((v,i)=>v+(i===0?(side?-reach:reach):0)-doctor.handAnchor[i]);}}
  const rear=layer(rearKey,width,[0,0],{registration}),front=layer(frontKey,back?width:instrument.width,back?[0,0]:instrument.offset,{registration:back?registration:instrument.registration,...(back?{clips:[{box:[side?.3:0,.25,.7,.75],offset:[0,0]}]}:{})});
  return {equipmentId,rotation:r,geometry,family:e.interactionFamily,width,drawWidth:width,registration,patient,seat:patient,doctor,operator:doctor,supportAnchor,instrument,previewMount:instrumentSupport({family:e.interactionFamily,supportAnchor,instrument},instrument.restOffset),rearKey,frontKey,rearLayers:[rear],frontLayers:[front],previewLayers:back?[rear,layer(instrument.key,instrument.width,instrument.restOffset,{registration:instrument.registration,opacity:e.interactionFamily==='trial'?0:1})]:[rear,{...front,offset:instrument.restOffset,opacity:e.interactionFamily==='trial'?0:1}],back};
 }
 const drawWidth=kind==='chair'?56:kind==='plant'?47:kind==='display'?68:kind==='rug'?104:kind==='art'?36:(geometry.width+geometry.height)*26;
 const key=kind==='art'?(v==='default'?'furniture:17':`variant:art:${v}:0`):`furnishing:${kind}:${v}:${r}:rear`;
 const frontKey=kind==='art'?key:`furnishing:${kind}:${v}:${r}:front`,rear=layer(key,drawWidth),front=[];
 let seat,operator;
 if(kind==='chair'){
  seat={direction:r,height:r>=2?43:58,offset:r>=2?[r===2?-3:3,-28]:[r===0?3:-3,-1],eyeAnchor:[0,-35]};
  front.push(layer(frontKey,drawWidth,[0,0],r>=2?{}:{clips:[{box:[r===0?0:.72,.33,.28,.52],offset:[0,0]}]}));
 }
 if(kind==='counter'){
  front.push(layer(frontKey,drawWidth,[0,0],{clips:[{box:[0,.43,1,.57],offset:[0,0]}]}));
  operator={direction:r,height:58,handAnchor:[0,-30]};
 }
 return {geometry,drawWidth,registration:[.5,1],previewLayers:[rear],rearLayers:[rear],frontLayers:front,seat,operator};
}
export function hasCompleteFurnitureProfile(item,equipmentId='manual_phoropter'){try{const p=furnitureProfile(item,equipmentId);return p.drawWidth>0&&p.rearLayers.length>0&&[...p.previewLayers,...p.rearLayers,...p.frontLayers].every(l=>typeof l.key==='string'&&l.width>0)&&(!(item.kind==='chair'||item.kind==='exam')||!!p.seat?.eyeAnchor)&&(!(item.kind==='counter'||item.kind==='exam')||!!p.operator?.handAnchor);}catch{return false;}}
