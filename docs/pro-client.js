import {access} from './pro-policy.js';
import {loadCloud} from './cloud.js';
let config={enabled:false},view=access(),ready;
const publish=()=>window.dispatchEvent(new CustomEvent('corptimer-access',{detail:status()}));
export const status=()=>({...view,enabled:config.enabled,preview:!!config.preview});
export function initializeAccess(){return ready??=(async()=>{if(['127.0.0.1','localhost'].includes(location.hostname)&&new URLSearchParams(location.search).get('billing-preview')==='free'){config={enabled:true,preview:true};view={tier:'free',customize:false,canStart:true,remaining:2};publish();return;}try{config=await fetch(new URL('./billing-config.json',import.meta.url),{cache:'no-store'}).then(r=>r.json());}catch{}if(config.enabled){view={...view,tier:'free',customize:false,canStart:false,remaining:0};await refreshAccess();}publish();})();}
async function request(path,body={}) {
 if(config.preview)throw Error('Local UI preview: no account or payment request was sent.');
 const cloud=await loadCloud(),token=await cloud.billingToken();
 const response=await fetch(config.apiBase+path,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const data=await response.json();if(data.access){view=data.access;publish();}if(!response.ok)throw Error(data.error||'Your daily free sessions have been used.');return data;
}
export async function refreshAccess(){if(!config.enabled)return;try{await request('/access/status');}catch(error){window.dispatchEvent(new CustomEvent('corptimer-billing-error',{detail:error.message}));}}
export async function beginUse(sessionId){
 await initializeAccess();if(!config.enabled)return true;
 try {await request('/access/start',{sessionId});return true;}catch(error){window.dispatchEvent(new CustomEvent('corptimer-upgrade',{detail:error.message}));return false;}
}
export function canCustomize(){if(!config.enabled||view.customize)return true;window.dispatchEvent(new CustomEvent('corptimer-upgrade',{detail:'Make this timer your own with Pro.'}));return false;}
export async function checkout(portal=false){await initializeAccess();if(!config.enabled)throw Error('Payments are not open yet. All timer features remain available.');const cloud=await loadCloud();await cloud.ensureBillingUser();return (await request(portal?'/billing/portal':'/billing/checkout')).url;}
initializeAccess();
