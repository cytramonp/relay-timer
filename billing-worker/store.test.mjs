import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import {reserve,readAccount} from './store.js';
function database(){const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));return {prepare(query){return {bind(...args){return {async first(){return sql.prepare(query).get(...args);},async run(){return {meta:sql.prepare(query).run(...args)};}};}};}};}
test('concurrent reservations respect free quota and retry does not charge twice',async()=>{
 const db=database(),now=Date.now(),state={firstUsedAt:now-20*86400000,uses:10};await db.prepare('INSERT INTO accounts(uid,state) VALUES(?,?)').bind('person',JSON.stringify(state)).run();
 const results=await Promise.all(['session_one','session_two','session_three'].map(id=>reserve(db,'person',id,now)));
 assert.equal(results.filter(r=>r.allowed).length,2);const before=(await readAccount(db,'person')).state.uses;
 const winning=['session_one','session_two','session_three'][results.findIndex(r=>r.allowed)];assert((await reserve(db,'person',winning,now)).allowed);assert.equal((await readAccount(db,'person')).state.uses,before);
});
test('trial usage is scoped to the account and begins on first start',async()=>{const db=database();assert.deepEqual((await readAccount(db,'a')).state,{});await reserve(db,'a','session_one',123456789);assert.equal((await readAccount(db,'a')).state.firstUsedAt,123456789);assert.deepEqual((await readAccount(db,'b')).state,{});});
