import {CATALOG} from './catalog.mjs';
export function isRotatable(kind){return !!CATALOG[kind]&&!CATALOG[kind].wall;}
export function rotateFacing(rotation,step=1){if(!Number.isInteger(rotation)||rotation<0||rotation>3||![1,-1].includes(step))throw Error('Invalid orientation');return (rotation+step+4)%4;}
const profiles=Object.fromEntries(Object.entries(CATALOG).map(([kind,d])=>[kind,Array.from({length:d.wall?1:4},(_,rotation)=>{const odd=rotation%2,width=odd?d.h:d.w,height=odd?d.w:d.h;const approaches=Object.fromEntries(Object.entries(d.approaches).map(([key,[a,b]])=>{let x=odd?b:a,y=odd?a:b;if(rotation>=2){x=width-1-x;y=height-1-y;}return [key,[x,y]];}));return {rotation,width,height,approaches};})]));
export function orientationFor(kind,rotation=0){const p=profiles[kind]?.[rotation];if(!Number.isInteger(rotation)||!p)throw Error('Invalid furniture orientation');return structuredClone(p);}
