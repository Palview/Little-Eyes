import {CATALOG} from './catalog.mjs';
import {beginEdit,previewEdit,commitEdit} from './build.mjs';
export function beginCustomization(world,selection){
 const item=selection.id?world.clinic.items.find(i=>i.id===selection.id):null;
 if(!['existing','purchase','inventory'].includes(selection.mode)||(!item&&selection.mode!=='purchase')||!CATALOG[item?.kind??selection.kind])throw Error('Unknown furniture selection');
 const candidate=item?{...item,stored:false}:{kind:selection.kind,x:null,y:null,rotation:0,variantId:selection.variantId??'default',stored:false};
 if(selection.mode==='inventory'){candidate.x=null;candidate.y=null;}
 const session={base:beginEdit(world),mode:selection.mode,candidate,draft:null,result:{ok:false,reason:'Tap a clear tile.'},cost:0};
 return updateCustomization(session,{});
}
export function updateCustomization(session,patch){
 const candidate={...session.candidate,...patch};const next={...session,candidate,draft:null,cost:session.mode==='purchase'?CATALOG[candidate.kind]?.price??0:0};
 if(!candidate.stored&&(!Number.isInteger(candidate.x)||!Number.isInteger(candidate.y)))return {...next,result:{ok:false,reason:'Tap a clear tile to place your furnishing.'}};
 const type=session.mode==='purchase'?'purchase':session.mode==='inventory'?'placeInventory':'customize';
 const r=previewEdit(session.base,{...candidate,type});
 return {...next,draft:r.result.ok?r.draft:null,result:r.result,cost:r.result.ok?r.draft.cost:next.cost};
}
export function commitCustomization(world,session,transactionId){if(!session?.result.ok||!session.draft)return {world,result:{ok:false,reason:session?.result.reason??'Choose a valid placement.'}};return commitEdit(world,session.draft,transactionId);}
