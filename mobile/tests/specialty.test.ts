import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('native specialty clocks and catalogue match the public web implementation',()=>{
 const read=(name:string)=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
 assert.equal(read('../src/core/board-engine.js'),read('../../docs/board-engine.js'));
 const catalogue=JSON.parse(read('../src/core/specialty-catalog.json'));
 assert.equal(catalogue.length,19);
 for(const profile of catalogue)assert.ok(fs.existsSync(new URL(`../assets/specialty/${profile.slug}.png`,import.meta.url)));
});
