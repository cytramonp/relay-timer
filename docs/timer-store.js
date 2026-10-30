// Only preferences and paused configurations belong here; live rooms stay separate.
const META='corptimer.sync.metadata.v1';
const allowed=k=>/^corptimer(?:\.favorites\.v1|\.board\.|\.custom\.|\.templates\.|\.options\.|:tool:|:presets:)/.test(k);
export const readSetting=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
export function writeSetting(key,value,{localOnly=false}={}) {
  try {
    const text=JSON.stringify(value);localStorage.setItem(key,text);
    if(!localOnly&&allowed(key)) {
      const meta=readSetting(META,{});meta[key]=Date.now();localStorage.setItem(META,JSON.stringify(meta));
      window.dispatchEvent(new CustomEvent('timer-setting-written',{detail:{key,value:text,updatedAt:meta[key]}}));
    }
    return true;
  }catch{return false;}
}
export function localSettings(){const meta=readSetting(META,{});return Object.keys(localStorage).filter(allowed).map(key=>({key,value:localStorage.getItem(key),updatedAt:meta[key]||0}));}
export function receiveSetting(record){
  if(!record||!allowed(record.key)||typeof record.value!=='string'||!Number.isFinite(record.updatedAt))return false;
  try{JSON.parse(record.value);}catch{return false;}
  const meta=readSetting(META,{});if((meta[record.key]||0)>=record.updatedAt)return false;
  const changed=localStorage.getItem(record.key)!==record.value;
  localStorage.setItem(record.key,record.value);meta[record.key]=record.updatedAt;localStorage.setItem(META,JSON.stringify(meta));return changed;
}
export function selectAccount(uid) {
  const slot='corptimer.sync.account',previous=localStorage.getItem(slot)||'guest',next=uid||'guest';
  if(previous===next)return false;
  localStorage.setItem('corptimer.sync.bucket.'+previous,JSON.stringify(localSettings()));
  const cached=readSetting('corptimer.sync.bucket.'+next,null);
  // First sign-in may import this browser's guest setups; never import another account.
  const rows=cached||(previous==='guest'&&next!=='guest'?localSettings():[]);
  localSettings().forEach(r=>localStorage.removeItem(r.key));localStorage.removeItem(META);
  for(const r of rows){localStorage.setItem(r.key,r.value);}
  localStorage.setItem(META,JSON.stringify(Object.fromEntries(rows.map(r=>[r.key,r.updatedAt]))));
  localStorage.setItem(slot,next);return previous!=='guest'||!!cached;
}
