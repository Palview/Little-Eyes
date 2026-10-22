import {spawnSync} from 'node:child_process';import {readdirSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));let failed=false;
if(spawnSync(process.execPath,[join(root,'scripts/package-standalone.mjs')],{stdio:'inherit'}).status!==0)process.exit(1);
for(const dir of ['tests','legacy-v1/tests'])for(const f of readdirSync(join(root,dir)).filter(f=>f.endsWith('.test.mjs')&&(dir!=='tests'||f.startsWith('tycoon-')))){const r=spawnSync(process.execPath,[join(root,dir,f)],{stdio:'inherit'});if(r.status!==0)failed=true;}
for(const f of ['app.mjs',...readdirSync(join(root,'dist/tycoon')).filter(f=>f.endsWith('.mjs')).map(f=>'tycoon/'+f)]){const r=spawnSync(process.execPath,['--check',join(root,'dist',f)],{stdio:'inherit'});if(r.status!==0)failed=true;}
process.exitCode=failed?1:0;
