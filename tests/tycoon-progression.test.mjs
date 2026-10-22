import test from 'node:test';
import assert from 'node:assert/strict';
import {createClinic,EQUIPMENT} from '../dist/tycoon/catalog.mjs';
const progression = await import('../dist/tycoon/progression.mjs').catch(()=>({}));
test('starter wallets and ownership are granted once by clinic creation',()=>{
 for(const preset of ['corner','storefront'])for(const [id,coins]of [['trial_frame',300],['manual_phoropter',100]]){
 const c=createClinic(preset,id);assert.equal(c.coins,coins);assert.equal(c.starterId,id);assert.deepEqual(c.ownedEquipmentIds,[id]);assert.equal(c.equipmentId,id);assert.equal(c.xp,0);assert.equal(c.items.filter(i=>i.kind==='chair').length,2);
 }
});
test('equipment duration and reward derive from their explicit multipliers',()=>{
 assert.equal(typeof progression.equipmentStats,'function');
 for(const [id,duration,payout]of [['trial_frame',50,40],['manual_phoropter',30,50],['digital_phoropter',18,60],['digital_suite',12,70]])assert.deepEqual(progression.equipmentStats(id),{duration,payout});
 assert.throws(()=>progression.equipmentStats('camera'));
});
test('milestone boundaries, maximum progression and ordered notifications',()=>{
 assert.equal(typeof progression.levelForXP,'function');
 for(const [xp,level]of [[0,1],[49,1],[50,2],[149,2],[150,3],[349,3],[350,4],[10000,4]])assert.equal(progression.levelForXP(xp),level);
 const c={...createClinic('corner'),xp:350};assert.equal(progression.pendingMilestones(c).length,3);assert.equal(progression.progressForXP(350).fraction,1);assert.equal(progression.progressForXP(350).nextThreshold,null);
 const ack=progression.acknowledgeMilestone(c,'neighborhood_favorite');assert.equal(progression.pendingMilestones(ack).length,2);assert.equal(c.acknowledgedMilestoneIds.length,0);
});
test('purchase gates, duplicate clicks and free grandfathered ownership selection',()=>{
 assert.equal(typeof progression.purchaseEquipment,'function');
 let w={clinic:{...createClinic('corner','trial_frame'),coins:2000}};
 assert.equal(progression.purchaseEquipment(w,'manual_phoropter').result.reason,'locked');
 w.clinic.xp=50;let a=progression.purchaseEquipment(w,'manual_phoropter');assert.equal(a.world.clinic.coins,1700);assert.equal(a.world.clinic.equipmentId,'trial_frame');
 const repeat=progression.purchaseEquipment(a.world,'manual_phoropter');assert.equal(repeat.world.clinic.coins,1700);
 a.world.clinic.xp=0;const selected=progression.selectEquipment(a.world,'manual_phoropter');assert.equal(selected.world.clinic.equipmentId,'manual_phoropter');assert.equal(selected.world.clinic.coins,1700);
 assert.equal(progression.selectEquipment(w,'digital_suite').result.ok,false);
 w.clinic.xp=350;w.clinic.coins=10;assert.equal(progression.purchaseEquipment(w,'digital_suite').result.reason,'funds');assert.equal(w.clinic.coins,10);
});
import {createWorld,advance} from '../dist/tycoon/simulation.mjs';
import {beginEdit,previewEdit,commitEdit} from '../dist/tycoon/build.mjs';
test('payment grants XP once and reserved equipment survives later selection',()=>{
 let w=createWorld(createClinic('corner','trial_frame'),()=>0);w.clinic.coins=2000;w.clinic.xp=350;
 while(!w.patients.some(p=>p.stage==='seating'))w=advance(w,.05,()=>0).world;
 const id=w.exam;assert.equal(w.patients.find(p=>p.id===id).equipmentId,'trial_frame');
 w=progression.purchaseEquipment(w,'digital_suite').world;w=progression.selectEquipment(w,'digital_suite').world;
 let rewards=[];for(let i=0;i<1600;i++){const r=advance(w,.05,()=>0);w=r.world;rewards.push(...r.events.filter(e=>e.patientId===id));}
 assert.equal(rewards.length,1);assert.equal(rewards[0].amount,40);assert.equal(rewards[0].xp,10);assert.equal(w.clinic.xp,350+w.clinic.completedVisits*10);assert.equal(w.clinic.coins,400+40+(w.clinic.completedVisits-1)*70);
});
test('cosmetic variants and finishes enforce milestones without changing prices or footprints',()=>{
 let w=createWorld(createClinic('corner'));let r=previewEdit(beginEdit(w),{type:'variant',id:'chair-0',variantId:'navy'});assert.equal(r.result.ok,false);
 w.clinic.xp=50;r=previewEdit(beginEdit(w),{type:'variant',id:'chair-0',variantId:'navy'});assert.equal(r.result.ok,true,r.result.reason);w=commitEdit(w,r.draft,'navy').world;assert.equal(w.clinic.coins,100);assert.equal(w.clinic.items.find(i=>i.id==='chair-0').variantId,'navy');
 r=previewEdit(beginEdit(w),{type:'floor',value:'rose_tile'});assert.equal(r.result.ok,false);w.clinic.xp=150;r=previewEdit(beginEdit(w),{type:'floor',value:'rose_tile'});assert.equal(r.result.ok,true);
});
test('paying from maximum representable counters keeps the clinic safely saveable',async()=>{
 const {validClinic}=await import('../dist/tycoon/persistence.mjs');let w=createWorld(createClinic('corner'));w.clinic.coins=Number.MAX_SAFE_INTEGER;w.clinic.xp=Number.MAX_SAFE_INTEGER;w.clinic.completedVisits=Number.MAX_SAFE_INTEGER;
 for(let i=0;i<1800&&!w.patients.some(p=>p.paid);i++)w=advance(w,.05,()=>0).world;
 assert.equal(w.clinic.coins,Number.MAX_SAFE_INTEGER);assert.equal(w.clinic.xp,Number.MAX_SAFE_INTEGER);assert.equal(w.clinic.completedVisits,Number.MAX_SAFE_INTEGER);assert.equal(validClinic(w.clinic),true);
});
