// Shared entitlement rules. Times are UTC milliseconds; adapters supply trusted time.
export const PLAN = Object.freeze({price:4.99,currency:'USD',trialDays:10,trialUses:10,dailyUses:2});
export const DAY = 86400000;
export function access(state={},now=Date.now()) {
  const day=new Date(now).toISOString().slice(0,10);
  const pro=Object.values(state.providers||{}).some(p=>Number(p.expiresAt)>now);
  const expired=Number.isFinite(state.firstUsedAt)&&now-state.firstUsedAt>=PLAN.trialDays*DAY&&(state.uses||0)>=PLAN.trialUses;
  const remaining=Math.max(0,PLAN.dailyUses-(state.day===day?(state.dailyUses||0):0));
  return {tier:pro?'pro':expired?'free':'trial',customize:pro||!expired,canStart:pro||!expired||remaining>0,remaining,uses:state.uses||0,firstUsedAt:state.firstUsedAt??null,resetAt:Date.parse(day)+DAY};
}
export function startUse(state,sessionId,now=Date.now()) {
  if(typeof sessionId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(sessionId))throw Error('Invalid session ID');
  const sessions=state.sessions||{};
  if(Object.hasOwn(sessions,sessionId))return {state,allowed:true,access:access(state,now)};
  const before=access(state,now);if(!before.canStart)return {state,allowed:false,access:before};
  const day=new Date(now).toISOString().slice(0,10);
  // Reserve a use at the beginning: pause, resume, rounds and refresh share this ID.
  const recent=Object.fromEntries(Object.entries(sessions).sort((a,b)=>b[1]-a[1]).slice(0,499));
  const next={...state,firstUsedAt:state.firstUsedAt??now,uses:(state.uses||0)+1,day,dailyUses:(state.day===day?(state.dailyUses||0):0)+1,sessions:{...recent,[sessionId]:now}};
  return {state:next,allowed:true,access:access(next,now)};
}
