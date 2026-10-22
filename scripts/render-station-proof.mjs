import {createRequire} from 'node:module';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {resolve} from 'node:path';import {fileURLToPath} from 'node:url';
import {createClinic,EQUIPMENT,APPEARANCES,VARIANTS} from '../dist/tycoon/catalog.mjs';import {createWorld,advance} from '../dist/tycoon/simulation.mjs';import {createScene} from '../dist/tycoon/scene.mjs';import {loadAssets} from '../dist/tycoon/assets.mjs';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=fileURLToPath(new URL('../',import.meta.url)),out='/workspace/shared/little-eyes-furniture-proof';mkdirSync(out,{recursive:true});
const manifest=JSON.parse(readFileSync(resolve(root,'dist/assets/manifest.json'),'utf8')),assets=await loadAssets(manifest,()=>{},src=>loadImage(resolve(root,'dist',src)));
if(assets.failed.length)throw Error('Missing proof assets');globalThis.devicePixelRatio=1;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
function examWorld(id,r,appearance){const c=createClinic('corner');c.equipmentId=id;c.ownedEquipmentIds=EQUIPMENT.map(e=>e.id);c.items.find(i=>i.kind==='exam').rotation=r;let w=createWorld(c,()=>0);for(let n=0;n<1800&&!w.patients.some(p=>p.stage==='exam');n++)w=advance(w,.05,()=>0).world;w.patients=w.patients.filter(p=>p.id===w.exam);w.patients[0].appearance=appearance;w.clinic.items=w.clinic.items.filter(i=>i.kind!=='display');return w;}
function render(w,size=360,close=true,target='exam'){const canvas=createCanvas(size,size);canvas.getBoundingClientRect=()=>({left:0,top:0,width:size,height:size});const scene=createScene(canvas,assets);scene.render(w);if(close){scene.setCamera({zoom:3.2});scene.render(w);const h=scene.getHitRegions().find(h=>h.id===target);scene.setCamera({dx:size/2-h.bounds.x-h.bounds.w/2,dy:size*.52-h.bounds.y-h.bounds.h/2});scene.render(w);}scene.destroy();return canvas;}
function sheet(w,h){const c=createCanvas(w,h),x=c.getContext('2d');x.fillStyle='#eef1e7';x.fillRect(0,0,w,h);x.font='15px sans-serif';return [c,x];}
const [overview,oc]=sheet(2880,1440);
for(let a=0;a<8;a++){
 const [page,pc]=sheet(1440,1440);
 for(let i=0;i<4;i++)for(let r=0;r<4;r++){const w=examWorld(EQUIPMENT[i].id,r,a),canvas=render(w);pc.drawImage(canvas,r*360,i*360);pc.fillStyle='#314b3a';pc.fillText(`${APPEARANCES[a].name} · ${EQUIPMENT[i].name} · ${['Front 1','Front 2','Back 1','Back 2'][r]}`,r*360+12,i*360+24);oc.drawImage(canvas,(a%4)*720+r*180,Math.floor(a/4)*720+i*180,180,180);}
 writeFileSync(`${out}/appearance-${a+1}.png`,page.toBuffer('image/png'));
}
writeFileSync(`${out}/all-128.png`,overview.toBuffer('image/png'));
const [poses,px]=sheet(2400,4800),samples=[['seating',.5],['seating',.25],['seating',.01],['exam',0],['exam',1],['standing',.5],['standing',.25],['standing',.01]];
for(let i=0;i<4;i++)for(let r=0;r<4;r++)for(let n=0;n<samples.length;n++){const w=examWorld(EQUIPMENT[i].id,r,0),p=w.patients[0];p.stage=samples[n][0];p.poseRemaining=samples[n][1];w.elapsed=n===4?1.6:1.1;const c=render(w,300);px.drawImage(c,n*300,(i*4+r)*300);px.fillStyle='#314b3a';px.fillText(samples[n][0]+' '+samples[n][1],n*300+10,(i*4+r)*300+20);}
writeFileSync(`${out}/transitions.png`,poses.toBuffer('image/png'));
for(const preset of ['corner','storefront']){const canvas=createCanvas(390,844);canvas.getBoundingClientRect=()=>({left:0,top:0,width:390,height:844});const scene=createScene(canvas,assets),w=advance(createWorld(createClinic(preset)),22,()=>.8).world;scene.render(w);writeFileSync(`${out}/${preset}-390x844.png`,canvas.toBuffer('image/png'));scene.destroy();}
const [custom,cx]=sheet(1200,1200);
for(let n=0;n<4;n++){
 const c=createClinic('corner');c.xp=350;c.items.find(i=>i.id==='chair-0').variantId=['peach','premium','navy','premium'][n];c.items.find(i=>i.id==='chair-1').variantId=['navy','peach','premium','navy'][n];
 if(n%2)for(const i of c.items.filter(i=>['counter','display'].includes(i.kind)))i.variantId='modern';
 c.items.push({id:'proof-plant',kind:'plant',variantId:n%2?'rubber':'fern',x:0,y:2,rotation:0},{id:'proof-rug',kind:'rug',variantId:n%2?'pattern':'terracotta',x:5,y:5,rotation:n%2},{id:'proof-art',kind:'art',variantId:n%2?'signature':'lenses',x:2,y:0,rotation:0});
 c.wallId=n%2?'rose':'seafoam';c.floorId=n%2?'rose_tile':'walnut';
 cx.drawImage(render(createWorld(c),600,false),n%2*600,Math.floor(n/2)*600);cx.fillStyle='#314b3a';cx.fillText('Customization set '+(n+1),n%2*600+15,Math.floor(n/2)*600+25);
}
writeFileSync(`${out}/customization.png`,custom.toBuffer('image/png'));
for(const variant of ['default','peach','navy','premium']){
 const [page,x]=sheet(1440,2880);
 for(let a=0;a<8;a++)for(let r=0;r<4;r++){
  const w=createWorld(createClinic('corner')),chair={...w.clinic.items.find(i=>i.kind==='chair'),x:5,y:4,rotation:r,variantId:variant};w.clinic.items=[chair];w.doctor.tile=w.receptionist.tile={x:100,y:100};const p=w.patients[0];p.appearance=a;p.stage='waiting';p.path=[];p.seatId=chair.id;
  const c=render(w,360,true,chair.id);x.drawImage(c,r*360,a*360);x.fillStyle='#314b3a';x.fillText(`${APPEARANCES[a].name} ${variant} · ${r+1}/4`,r*360+12,a*360+24);
 }
 writeFileSync(`${out}/chairs-${variant}.png`,page.toBuffer('image/png'));
}
const [reception,rx]=sheet(1440,1440);
for(let variant=0;variant<2;variant++)for(let phase=0;phase<2;phase++)for(let r=0;r<4;r++){
 const w=createWorld(createClinic('corner')),counter={...w.clinic.items.find(i=>i.kind==='counter'),x:5,y:4,rotation:r,variantId:variant?'modern':'default'};w.clinic.items=[counter];w.doctor.tile={x:100,y:100};const p=w.patients[0];p.stage=phase?'payment':'checkIn';p.path=[];w.counter=p.id;w.receptionist.path=[];
 rx.drawImage(render(w,360,true,'counter'),r*360,(variant*2+phase)*360);rx.fillStyle='#314b3a';rx.fillText(`${counter.variantId} ${p.stage} · ${r+1}/4`,r*360+12,(variant*2+phase)*360+24);
}
writeFileSync(`${out}/reception.png`,reception.toBuffer('image/png'));
console.log('Production renderer: 128 model/orientation/appearance combinations, transition/work samples and both portrait presets.');

const variants=Object.entries(VARIANTS).filter(([kind])=>!['exam','chair','counter'].includes(kind)).flatMap(([kind,list])=>list.map(v=>({kind,variantId:v.id})));
const [catalog,ct]=sheet(960,variants.length*240);
for(let n=0;n<variants.length;n++)for(let r=0;r<(variants[n].kind==='art'?1:4);r++){const w=createWorld(createClinic('corner')),item={id:'proof',...variants[n],x:4,y:variants[n].kind==='art'?0:4,rotation:r};w.clinic.items=[item];w.patients=[];w.doctor.tile=w.receptionist.tile={x:100,y:100};ct.drawImage(render(w,240,true,'proof'),r*240,n*240);ct.fillStyle='#314b3a';ct.fillText(`${item.kind} ${item.variantId} ${r+1}/4`,r*240+10,n*240+20);}
writeFileSync(`${out}/furnishings.png`,catalog.toBuffer('image/png'));
