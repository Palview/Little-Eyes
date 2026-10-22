import {EQUIPMENT} from './catalog.mjs';
export const MILESTONES=[
 {id:'neighborhood_favorite',level:2,xp:50,name:'Neighborhood favorite',unlocks:'Manual phoropter · peach and navy seating · new plant styles'},
 {id:'trusted_practice',level:3,xp:150,name:'Trusted practice',unlocks:'Digital phoropter · modern reception and display · new walls and floors'},
 {id:'signature_practice',level:4,xp:350,name:'Signature practice',unlocks:'Digital refraction suite · premium upholstery · signature wall art'}
];
export function equipmentStats(id){const e=EQUIPMENT.find(e=>e.id===id);if(!e)throw Error('Unknown equipment');return {duration:40*e.timeMultiplier,payout:Math.round(40*e.moneyMultiplier)};}
export function levelForXP(xp){return 1+MILESTONES.filter(m=>xp>=m.xp).length;}
export function progressForXP(xp){const level=levelForXP(xp),currentThreshold=level===1?0:MILESTONES[level-2].xp,nextThreshold=MILESTONES[level-1]?.xp??null;return {level,totalXP:xp,currentThreshold,nextThreshold,fraction:nextThreshold===null?1:Math.max(0,Math.min(1,(xp-currentThreshold)/(nextThreshold-currentThreshold)))};}
export function pendingMilestones(c){return MILESTONES.filter(m=>m.xp<=c.xp&&!c.acknowledgedMilestoneIds.includes(m.id));}
export function acknowledgeMilestone(c,id){if(!pendingMilestones(c).some(m=>m.id===id))return c;return {...c,acknowledgedMilestoneIds:[...c.acknowledgedMilestoneIds,id]};}
export function equipmentAvailability(c,id){const e=EQUIPMENT.find(e=>e.id===id);if(!e)return {canBuy:false,reason:'unknown'};const owned=c.ownedEquipmentIds.includes(id),xpRemaining=Math.max(0,(MILESTONES.find(m=>m.level===e.unlockLevel)?.xp??0)-c.xp),reason=owned?'owned':levelForXP(c.xp)<e.unlockLevel?'locked':c.coins<e.price?'funds':'available';return {owned,selected:c.equipmentId===id,requiredLevel:e.unlockLevel,xpRemaining,canBuy:reason==='available',reason};}
export function purchaseEquipment(w,id){const a=equipmentAvailability(w.clinic,id);if(!a.canBuy)return {world:w,result:{ok:false,reason:a.reason}};const e=EQUIPMENT.find(e=>e.id===id);return {world:{...w,clinic:{...w.clinic,coins:w.clinic.coins-e.price,ownedEquipmentIds:[...w.clinic.ownedEquipmentIds,id]}},result:{ok:true}};}
export function selectEquipment(w,id){if(!w.clinic.ownedEquipmentIds.includes(id))return {world:w,result:{ok:false,reason:'unowned'}};return {world:{...w,clinic:{...w.clinic,equipmentId:id}},result:{ok:true}};}
