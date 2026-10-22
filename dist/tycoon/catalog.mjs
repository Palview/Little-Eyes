export const EQUIPMENT=[
 {id:'trial_frame',name:'Trial-frame kit',price:100,unlockLevel:1,timeMultiplier:1.25,moneyMultiplier:1,interactionFamily:'trial'},
 {id:'manual_phoropter',name:'Manual phoropter',price:300,unlockLevel:2,timeMultiplier:.75,moneyMultiplier:1.25,interactionFamily:'manual'},
 {id:'digital_phoropter',name:'Digital phoropter',price:750,unlockLevel:3,timeMultiplier:.45,moneyMultiplier:1.5,interactionFamily:'digital'},
 {id:'digital_suite',name:'Digital refraction suite',price:1600,unlockLevel:4,timeMultiplier:.30,moneyMultiplier:1.75,interactionFamily:'digital'}
];
export const STARTERS={trial_frame:{coins:300},manual_phoropter:{coins:100}};
export const CATALOG={
 counter:{name:'Reception counter',w:2,h:1,blocking:true,core:true,approaches:{patient:[0,1],staff:[0,-1]},sprites:[0,1]},
 chair:{name:'Waiting chair',price:40,limit:6,w:1,h:1,blocking:true,approaches:{patient:[0,1]},sprites:[2,3]},
 exam:{name:'Exam station',w:2,h:2,blocking:true,core:true,approaches:{patient:[0,2],staff:[1,2]},sprites:[6,7]},
 display:{name:'Glasses display',w:1,h:2,blocking:true,core:true,approaches:{patient:[1,0]},sprites:[4,5]},
 plant:{name:'Leafy friend',price:30,limit:4,w:1,h:1,blocking:true,approaches:{},sprites:[12,12]},
 rug:{name:'Sage rug',price:40,limit:4,w:2,h:2,blocking:false,approaches:{},sprites:[13,14]},
 cabinet:{name:'Storage cabinet',price:60,limit:4,w:2,h:1,blocking:true,approaches:{},sprites:[15,16]},
 art:{name:'Eye-chart print',price:25,limit:4,w:1,h:1,blocking:false,wall:true,approaches:{},sprites:[17,17]}
};
export const WALLS=[{id:'cream',name:'Warm cream',color:'#eee5d4'},{id:'sage',name:'Sage paint',color:'#bac8ab'},{id:'peach',name:'Peach paint',color:'#e3bca6'},{id:'paper',name:'Little-leaf wallpaper',color:'#e1debf'}];
export const FLOORS=[{id:'pale',name:'Pale wood',color:'#dfc9a5'},{id:'honey',name:'Honey wood',color:'#ba916a'},{id:'cream',name:'Cream tile',color:'#e9e1cb'},{id:'checker',name:'Checker tile',color:'#b9c3aa'}];
export const PRESETS={corner:{id:'corner',name:'Corner Practice',subtitle:'A snug little neighborhood nook.',width:12,height:10,entrance:{x:5,y:9},counter:[2,7],chairs:[[1,4],[3,4]],exam:[7,2],display:[10,4],standing:[{x:5,y:6},{x:6,y:6},{x:7,y:6},{x:8,y:6},{x:9,y:6},{x:10,y:6}]},storefront:{id:'storefront',name:'Sunny Storefront',subtitle:'Long windows. Room to dream.',width:15,height:8,entrance:{x:1,y:7},counter:[2,5],chairs:[[6,5],[8,5]],exam:[11,1],display:[13,4],standing:[{x:5,y:4},{x:6,y:4},{x:7,y:4},{x:8,y:4},{x:9,y:4},{x:10,y:4}]}};
export function createClinic(presetId,starterId="manual_phoropter"){if(!STARTERS[starterId])throw Error("Unknown starter");const p=PRESETS[presetId];if(!p)throw Error('Unknown clinic preset');const item=(id,kind,pos)=>({id,kind,x:pos[0],y:pos[1],rotation:0,variantId:"default"});return {presetId,coins:STARTERS[starterId].coins,completedVisits:0,starterId,equipmentId:starterId,ownedEquipmentIds:[starterId],xp:0,acknowledgedMilestoneIds:[],wallId:'cream',floorId:'pale',items:[item('counter','counter',p.counter),...p.chairs.map((pos,i)=>item('chair-'+i,'chair',pos)),item('exam','exam',p.exam),item('display','display',p.display)]};}
export const APPEARANCES=[{name:'Milo',color:'#bc8d65'},{name:'Olive',color:'#8eaa8a'},{name:'Theo',color:'#d5ac65'},{name:'Juniper',color:'#b799b9'},{name:'Ada',color:'#9bbcb6'},{name:'Felix',color:'#cb9c86'},{name:'Nia',color:'#a8a6ca'},{name:'Hugo',color:'#9eaf80'}];

export const VARIANTS={
 chair:[{id:'default',name:'Sage',unlockLevel:1},{id:'peach',name:'Peach',unlockLevel:2},{id:'navy',name:'Navy',unlockLevel:2},{id:'premium',name:'Velvet cream',unlockLevel:4}],
 counter:[{id:'default',name:'Warm wood',unlockLevel:1},{id:'modern',name:'Modern cream',unlockLevel:3}],
 display:[{id:'default',name:'Warm wood',unlockLevel:1},{id:'modern',name:'Modern sage',unlockLevel:3}],
 plant:[{id:'default',name:'Leafy friend',unlockLevel:1},{id:'fern',name:'Little fern',unlockLevel:2},{id:'rubber',name:'Rubber plant',unlockLevel:2}],
 rug:[{id:'default',name:'Sage',unlockLevel:1},{id:'terracotta',name:'Terracotta weave',unlockLevel:1},{id:'pattern',name:'Cream pattern',unlockLevel:1}],
 art:[{id:'default',name:'Eye chart',unlockLevel:1},{id:'lenses',name:'Lens study',unlockLevel:1},{id:'signature',name:'A brighter world',unlockLevel:4}],
 cabinet:[{id:'default',name:'Warm wood',unlockLevel:1}],exam:[{id:'default',name:'Equipment finish',unlockLevel:1}]
};
WALLS.forEach(f=>f.unlockLevel=1);FLOORS.forEach(f=>f.unlockLevel=1);
WALLS.push({id:'seafoam',name:'Seafoam linen',color:'#afc8bd',unlockLevel:3},{id:'rose',name:'Rose linen',color:'#d8b5af',unlockLevel:3});
FLOORS.push({id:'rose_tile',name:'Rose tile',color:'#d9b5a6',unlockLevel:3},{id:'walnut',name:'Walnut parquet',color:'#a78367',unlockLevel:3});
export function variantFor(item){return VARIANTS[item.kind]?.find(v=>v.id===(item.variantId??'default'));}
export function furnitureKey(item){const v=item.variantId??'default';return item.kind==='art'?(v==='default'?'furniture:17':`variant:art:${v}:0`):`furnishing:${item.kind}:${v}:${item.rotation}:rear`;}
