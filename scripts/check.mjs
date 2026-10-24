import fs from 'node:fs';import {execFileSync} from 'node:child_process';
for(const f of fs.readdirSync('docs').filter(f=>f.endsWith('.js')))execFileSync(process.execPath,['--check','docs/'+f],{stdio:'inherit'});
for(const f of ['manifest.webmanifest','firebase-config.json'])JSON.parse(fs.readFileSync('docs/'+f));
console.log('All application JavaScript and JSON checks pass.');
