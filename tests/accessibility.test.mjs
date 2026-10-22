import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8');
function color(selector){let value;for(const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){if(rule[1].trim().split(',').map(s=>s.trim()).includes(selector)){const c=rule[2].match(/(?:^|;)color:(#[\da-f]{6})(?:[;!]|$)/i);if(c)value=c[1];}}assert.ok(value,`Color for ${selector} exists`);return value;}
function luminance(hex){const c=hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function contrast(a,b){const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (hi+.05)/(lo+.05);}
test('small gameplay instructions meet 4.5:1 contrast on visit background',()=>{for(const selector of ['.visit-card p','.feedback','.stage-label','.focus-hint','.range-label','.range-ends','.reward-hint','.reward-breakdown'])assert.ok(contrast(color(selector),'#eff2e9')>=4.5,`${selector} needs readable contrast`);});
test('reset is reachable outside the hidden mobile sidebar',()=>{assert.match(html,/<footer>[\s\S]*?id="footer-reset"[\s\S]*?<\/footer>/);assert.match(app,/\$\('#footer-reset'\)\.onclick/);assert.doesNotMatch(css,/\.footer-reset\s*\{[^}]*display\s*:\s*none/);});
