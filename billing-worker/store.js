import {access,startUse} from '../docs/pro-policy.js';
export async function readAccount(db,uid){
 const row=await db.prepare('SELECT version,state FROM accounts WHERE uid=?').bind(uid).first();
 return row?{version:row.version,state:JSON.parse(row.state)}:{version:-1,state:{}};
}
// Optimistic compare-and-swap keeps quota reservations atomic across requests.
export async function updateAccount(db,uid,change){
 for(let attempt=0;attempt<8;attempt++){
  const old=await readAccount(db,uid),next=change(old.state);
  const result=old.version<0
   ?await db.prepare('INSERT OR IGNORE INTO accounts(uid,version,state) VALUES(?,0,?)').bind(uid,JSON.stringify(next)).run()
   :await db.prepare('UPDATE accounts SET state=?,version=version+1 WHERE uid=? AND version=?').bind(JSON.stringify(next),uid,old.version).run();
  if(result.meta.changes===1)return next;
 }
 throw Error('Account busy; retry shortly');
}
export async function reserve(db,uid,id,now){
 let allowed;
 const state=await updateAccount(db,uid,s=>{const r=startUse(s,id,now);allowed=r.allowed;return r.state;});
 return {allowed,access:access(state,now)};
}
