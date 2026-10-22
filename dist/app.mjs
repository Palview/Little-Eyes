import {purchaseEquipment,selectEquipment,acknowledgeMilestone} from './tycoon/progression.mjs';
import {renderStarterCards} from './tycoon/progression-ui.mjs';
import {beginCustomization,updateCustomization,commitCustomization} from './tycoon/customization.mjs';
import {isRotatable,rotateFacing} from './tycoon/orientations.mjs';
import {PRESETS,CATALOG,createClinic,APPEARANCES} from './tycoon/catalog.mjs';
import {createWorld,advance} from './tycoon/simulation.mjs';
import {footprint,sameTile,inside,serviceTiles} from './tycoon/grid.mjs';
import {beginEdit,previewEdit,commitEdit} from './tycoon/build.mjs';
import {createClock,setPauseReason,consumeFrame} from './tycoon/clock.mjs';
import {loadClinic,saveClinic,resetClinic,recoverOlderClinic} from './tycoon/persistence.mjs';
import {loadAssets} from './tycoon/assets.mjs';
import {createScene} from './tycoon/scene.mjs';
import {createUI} from './tycoon/ui.mjs';
const $=s=>document.querySelector(s);let storage;try{storage=localStorage;}catch{}
let pendingPreset=null;const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
const restored=loadClinic(storage);let world=restored.clinic?createWorld(restored.clinic):null;const preview=createWorld(createClinic('corner'));preview.patients=[];
const clock=createClock(),view={mode:'play',tab:'furniture',editSession:null,finishDraft:null,finishValid:false,message:'',manualPaused:false,manifest:null,selectedPatient:null,selectedObject:null,panel:'practice',panelOpen:false};
let assets={sprites:{},failed:[]},scene=createScene($('#clinic-canvas'),assets),lastUI=0,tx=0,dialogFocus=null;
function toast(message){const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,4500);}
function save(){if(!world)return;if(saveClinic(storage,world.clinic)){$('#save-note').dataset.warning='false';$('#save-note').textContent='Your practice saves on this device. Unfinished visits restart on reload.';}else{$('#save-note').dataset.warning='true';$('#save-note').textContent='Session only · Your browser is not allowing saves. Keep this page open to preserve progress.';}}
function showDialog(id){dialogFocus=document.activeElement;$('#'+id).showModal();setPauseReason(clock,'dialog',true);}
function closeDialog(id){$('#'+id).close();setPauseReason(clock,'dialog',!!document.querySelector('dialog[open]'));dialogFocus?.focus();}
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>setPauseReason(clock,'dialog',!!document.querySelector('dialog[open]')));
for(const id of ['preset-dialog','starter-dialog','recovery-dialog'])$('#'+id).addEventListener('cancel',e=>e.preventDefault());
function clearPreview(){view.editSession=null;view.finishDraft=null;view.finishValid=false;view.message='';}
function panel(name,build=false,open=true){clearPreview();view.panel=name;view.panelOpen=open;view.mode=build?'customize':'play';setPauseReason(clock,'build',build);}
function selectFurniture(selection){clearPreview();view.mode='customize';view.panel='build';view.panelOpen=true;view.tab=selection.mode==='inventory'?'inventory':'furniture';view.selectedObject=selection.id??null;view.selectedPatient=null;setPauseReason(clock,'build',true);view.editSession=beginCustomization(world,selection);refresh();}
function updateCandidate(patch){if(!view.editSession)return;view.editSession=updateCustomization(view.editSession,patch);refresh();}
function drawWorld(){const draft=view.editSession?.draft??view.finishDraft;if(view.mode==='customize'&&draft)return {...world,clinic:draft.clinic};return world??preview;}
function sceneView(){const session=view.editSession,c=session?.candidate,placed=c&&!c.stored&&Number.isInteger(c.x)&&Number.isInteger(c.y);let accessTiles;if(placed)try{accessTiles=serviceTiles(c);}catch{}return {selectedId:c?.id??view.selectedObject,selectedPatient:view.selectedPatient,panelOpen:view.panelOpen,ghost:placed?{...c,id:c.id??'ghost'}:null,valid:session?.result.ok??false,accessTiles};}
function refresh(){ui.render(world,view);scene.render(drawWorld(),sceneView());}
function confirm(){let r;if(view.editSession)r=commitCustomization(world,view.editSession,'custom-'+(++tx));else if(view.finishDraft&&view.finishValid)r=commitEdit(world,view.finishDraft,'finish-'+(++tx));else return;if(!r.result.ok){view.message=r.result.reason;toast(r.result.reason);refresh();return;}world=r.world;save();clearPreview();ui.refresh();refresh();toast('A little more you. Looking lovely!');}
function action(type,value){
 if(type==='fullscreen'){const el=document.documentElement;if(el?.requestFullscreen)Promise.resolve(el.requestFullscreen()).catch(()=>toast('Fullscreen is not available in this browser.'));else toast('The game already fills the available screen.');return;}
 if(type==='help'){showDialog('help-dialog');return;}if(type==='close-help'){closeDialog('help-dialog');return;}
 if(type==='preset'){if(world||!PRESETS[value])return;pendingPreset=value;$('#starter-cards').innerHTML=renderStarterCards(view.manifest);closeDialog('preset-dialog');showDialog('starter-dialog');return;}
 if(type==='back-presets'){pendingPreset=null;closeDialog('starter-dialog');showDialog('preset-dialog');return;}
 if(type==='starter'){if(world||!pendingPreset||!['trial_frame','manual_phoropter'].includes(value))return;world=createWorld(createClinic(pendingPreset,value));pendingPreset=null;view.manualPaused=false;setPauseReason(clock,'manual',false);panel('practice',false,false);closeDialog('starter-dialog');save();ui.refresh();refresh();return;}
 if(type==='recover-older'||type==='recover-v2'){if(world)return;const r=recoverOlderClinic(storage);if(!r.clinic){toast(r.notice);return;}world=createWorld(r.clinic);closeDialog('recovery-dialog');clearPreview();if(r.notice){$('#save-note').textContent=r.notice;$('#save-note').dataset.warning='true';}else save();ui.refresh();refresh();return;}
 if(type==='retry-art'){loadArt();return;}if(type==='new-game'){showDialog('reset-dialog');return;}if(type==='cancel-reset'){closeDialog('reset-dialog');return;}
 if(type==='confirm-reset'){resetClinic(storage);world=null;pendingPreset=null;view.manualPaused=false;view.selectedObject=null;view.selectedPatient=null;setPauseReason(clock,'manual',false);panel('practice',false,false);closeDialog('reset-dialog');if($('#recovery-dialog').open)closeDialog('recovery-dialog');showDialog('preset-dialog');return;}
 if(type.startsWith('zoom-')){scene.setCamera(type==='zoom-reset'?{reset:true}:{zoom:type==='zoom-in'?1.2:1/1.2});refresh();return;}if(!world)return;
 if(type==='ack-milestone'){world={...world,clinic:acknowledgeMilestone(world.clinic,value)};save();}
 else if(type==='close-panel'){$('#dock-practice').focus({preventScroll:true});panel('practice',false,false);}
 else if(type==='milestones')panel('milestones');
 else if(['open-equipment','open-patients','open-objects'].includes(type))panel(type.slice(5));
 else if(type==='mode-build')panel('build',true);
 else if(type==='mode-play')panel('practice');
 else if(type==='pause'){view.manualPaused=!view.manualPaused;setPauseReason(clock,'manual',view.manualPaused);}
 else if(type==='inspect-object'){const item=world.clinic.items.find(i=>i.id===value&&i.x!==null);if(item){panel('object');view.selectedObject=item.id;view.selectedPatient=null;}}
 else if(type==='move-object'||type==='placed'){const item=world.clinic.items.find(i=>i.id===value&&i.x!==null);if(item){selectFurniture({mode:'existing',id:item.id});return;}}
 else if(type==='inventory'){const item=world.clinic.items.find(i=>i.id===value&&i.x===null);if(item){selectFurniture({mode:'inventory',id:item.id});return;}}
 else if(type==='catalog'){if(CATALOG[value]?.price){selectFurniture({mode:'purchase',kind:value});$('#clinic-canvas').focus({preventScroll:true});return;}}
 else if(type==='variant'){const [id,variantId]=String(value).split('|');if(!view.editSession||!(id==='candidate'||view.editSession.candidate.id===id)){const item=world.clinic.items.find(i=>i.id===id);if(!item)return;selectFurniture({mode:item.x===null?'inventory':'existing',id});}updateCandidate({variantId});return;}
 else if(type==='rotate'||type==='rotate-back'){const c=view.editSession?.candidate;if(c&&isRotatable(c.kind))updateCandidate({rotation:rotateFacing(c.rotation,type==='rotate-back'?-1:1)});return;}
 else if(type==='confirm'){confirm();return;}
 else if(type==='cancel-edit')clearPreview();
 else if(type==='store'){updateCandidate({stored:true});return;}
 else if(type==='build-tab'){view.tab=value;clearPreview();}
 else if(type==='wall'||type==='floor'){view.editSession=null;const r=previewEdit(view.finishDraft??beginEdit(world),{type,value});view.finishDraft=r.draft;view.finishValid=r.result.ok;view.message=r.result.ok?'A fresh new finish. Confirm to keep it.':r.result.reason;}
 else if(type==='buy-equipment'||type==='select-equipment'){const r=type==='buy-equipment'?purchaseEquipment(world,value):selectEquipment(world,value);if(r.result.ok){world=r.world;panel('equipment');save();toast(type==='buy-equipment'?'New kit owned! Select it when you are ready.':'Selected for future visits. Current care keeps its original kit.');}else toast(r.result.reason==='locked'?'Reach the required milestone to buy this kit.':r.result.reason==='funds'?'Save a few more coins for this kit.':'This kit is already owned or unavailable.');}
 else if(type==='patient'){panel('patients');view.selectedPatient=value;view.selectedObject=null;const p=world.patients.find(p=>p.id===value);if(p)toast(`${APPEARANCES[p.appearance].name} is taking a little time for clearer sight.`);}
 refresh();
}
const ui=createUI($('#app'),{action});
function onTile(t){if(!world||!inside(world.clinic,t))return;if(view.mode==='customize'){if(view.editSession)updateCandidate(t);else{const selected=[...world.clinic.items].reverse().find(i=>i.x!==null&&footprint(i).some(p=>sameTile(p,t)));if(selected)selectFurniture({mode:'existing',id:selected.id});}}else{const p=world.patients.find(p=>sameTile(p.tile,t));if(p)action('patient',p.id);}}
const canvas=$('#clinic-canvas');const pointers=new Map();let dragging=false,lastDistance=0;
canvas.addEventListener('pointerdown',e=>{if(pointers.size===0)dragging=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});canvas.setPointerCapture(e.pointerId);if(pointers.size===2){dragging=true;const [a,b]=[...pointers.values()];lastDistance=Math.hypot(a.x-b.x,a.y-b.y);}});
canvas.addEventListener('pointermove',e=>{const p=pointers.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.hypot(e.clientX-p.startX,e.clientY-p.startY)>5)dragging=true;p.x=e.clientX;p.y=e.clientY;if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(lastDistance>0)scene.setCamera({zoom:distance/lastDistance});lastDistance=distance;dragging=true;}else if(dragging)scene.setCamera({dx,dy});});
canvas.addEventListener('pointerup',e=>{if(!dragging&&pointers.size===1){const hit=scene.pickObject(e.clientX,e.clientY);if(hit&&(!view.editSession||view.mode==='play')){if(hit.type==='item')action(view.mode==='customize'?'move-object':'inspect-object',hit.id);else if(hit.type==='patient')action('patient',hit.id);else action('inspect-object',hit.id==='doctor'?'exam':'counter');}else onTile(scene.hitTest(e.clientX,e.clientY));}pointers.delete(e.pointerId);if(pointers.size<2)lastDistance=0;});canvas.addEventListener('pointercancel',e=>pointers.delete(e.pointerId));
canvas.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();scene.setCamera({zoom:e.deltaY<0?1.08:1/1.08});}},{passive:false});
canvas.addEventListener('keydown',e=>{if(view.mode!=='customize'||document.querySelector('dialog[open]'))return;const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(d&&view.editSession){e.preventDefault();const c=view.editSession.candidate,p=PRESETS[world.clinic.presetId],x=c.x??2,y=c.y??2;updateCandidate({x:Math.max(0,Math.min(p.width-1,x+d[0])),y:Math.max(0,Math.min(p.height-1,y+d[1]))});}else if(e.key.toLowerCase()==='r'&&view.editSession){e.preventDefault();action(e.shiftKey?'rotate-back':'rotate');}else if(e.key==='Enter'){e.preventDefault();confirm();}else if(e.key==='Escape'){e.preventDefault();clearPreview();refresh();}});
document.addEventListener('visibilitychange',()=>setPauseReason(clock,'hidden',document.hidden));setPauseReason(clock,'hidden',document.hidden);
async function loadArt(){try{const manifest=window.LITTLE_EYES_MANIFEST??await fetch('assets/manifest.json').then(r=>{if(!r.ok)throw Error('Asset manifest unavailable');return r.json();});view.manifest=manifest;assets=await loadAssets(manifest);scene.setAssets(assets);$('#asset-status').textContent=assets.failed.length?'Some artwork is missing · play is still available':'Original little-world artwork · Ready';$('#retry-art').hidden=!assets.failed.length;ui.refresh();refresh();}catch{$('#asset-status').textContent='Artwork unavailable · using placeholders';$('#retry-art').hidden=false;}}
function frame(now){if(world){for(const dt of consumeFrame(clock,now)){world.reducedMotion=reducedMotion;const r=advance(world,dt);world=r.world;if(r.events.length){save();for(const event of r.events)toast(`A brighter day! +${event.amount} coins · +${event.xp} XP.`);}}}scene.render(drawWorld(),sceneView());if(now-lastUI>350){ui.render(world,view);lastUI=now;}requestAnimationFrame(frame);}
if(restored.notice){$('#save-note').dataset.warning='true';$('#save-note').textContent=restored.notice;}if(!world){if(restored.needsRecovery){$('#recovery-message').textContent=restored.notice;$('#recover-v2').hidden=!restored.canRecoverOlder;showDialog('recovery-dialog');}else showDialog('preset-dialog');}else{clearPreview();refresh();}loadArt();requestAnimationFrame(frame);
