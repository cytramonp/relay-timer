import {createRemoteJWKSet,jwtVerify} from 'jose';
import Stripe from 'stripe';
import {access} from '../docs/pro-policy.js';
import {readAccount,updateAccount,reserve} from './store.js';
import {playConfigured,verifyPlay,refreshPlay} from './play.js';
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
export async function authenticate(request,env){
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)throw Error('Unauthorized');
 const {payload}=await jwtVerify(token,keys,{issuer:`https://securetoken.google.com/${env.FIREBASE_PROJECT}`,audience:env.FIREBASE_PROJECT,algorithms:['RS256'],requiredClaims:['exp','iat','sub','auth_time']});
 if(!payload.sub||payload.sub.length>128||payload.sub.includes('/')||typeof payload.auth_time!=='number'||payload.auth_time>Date.now()/1000||payload.iat>Date.now()/1000)throw Error('Unauthorized');
 return payload;
}
export default {async fetch(request,env){
 const origin=request.headers.get('Origin');
 const headers=origin===env.APP_ORIGIN?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'}:{};
 const reply=(body,status)=>json(body,status,headers);
 if(origin&&origin!==env.APP_ORIGIN)return reply({error:'Origin not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 const path=new URL(request.url).pathname.replace(/^\/api/,'');
 if(request.method==='GET'&&path==='/health')return reply({ok:true,paymentsConfigured:!!env.STRIPE_SECRET&&!!env.STRIPE_WEBHOOK,playConfigured:playConfigured(env)});
 if(request.method!=='POST')return reply({error:'POST required'},405);
 try {
  const stripe=env.STRIPE_SECRET?new Stripe(env.STRIPE_SECRET,{httpClient:Stripe.createFetchHttpClient()}):null;
  if(path==='/billing/webhook'){
   let event;try{event=await stripe.webhooks.constructEventAsync(await request.text(),request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK,undefined,Stripe.createSubtleCryptoProvider());}catch{return reply({error:'Invalid signature'},400);}
   if(event.type.startsWith('customer.subscription.')){
    const sub=await stripe.subscriptions.retrieve(event.data.object.id),uid=sub.metadata.corptimerUid;
    if(uid&&sub.items.data.some(i=>i.price.id===env.STRIPE_PRICE)){
     await updateAccount(env.DB,uid,s=>{
      if(s.customer!==sub.customer||(s.stripeEventAt||0)>event.created)return s;
      const expiresAt=['active','trialing'].includes(sub.status)?Math.max(0,...sub.items.data.filter(i=>i.price.id===env.STRIPE_PRICE).map(i=>(i.current_period_end||0)*1000)):0;
      return {...s,stripeEventAt:event.created,providers:{...s.providers,stripe:{expiresAt,subscription:sub.id}}};
     });
    }
   }
   return reply({received:true});
  }
  let user;try{user=await authenticate(request,env);}catch{return reply({error:'Please sign in again.'},401);}
  const uid=user.sub;
  if(path==='/billing/google/verify') {
   const body=await request.json();
   const restored=await verifyPlay(env,uid,body.token);
   return reply({restored,access:access((await readAccount(env.DB,uid)).state)});
  }
  if(path==='/access/status')return reply({access:access(await refreshPlay(env,uid))});
  if(path==='/access/start'){
   await refreshPlay(env,uid);
   const body=await request.json();
   if(typeof body.sessionId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(body.sessionId))return reply({error:'Invalid session ID'},400);
   const result=await reserve(env.DB,uid,body.sessionId,Date.now());return reply(result,result.allowed?200:402);
  }
  if(user.firebase?.sign_in_provider==='anonymous')return reply({error:'Sign in with Google before subscribing.'},401);
  let account=(await readAccount(env.DB,uid)).state;
  if(path==='/billing/checkout'){
   if(access(account).tier==='pro')return reply({error:'Pro is already active. Use Manage subscription.'},409);
   const p=await stripe.prices.retrieve(env.STRIPE_PRICE);
   if(!p.active||p.currency!=='usd'||p.unit_amount!==499||p.recurring?.interval!=='year'||p.recurring.interval_count!==1)throw Error('Invalid annual price');
   if(!account.customer){const customer=await stripe.customers.create({metadata:{corptimerUid:uid}},{idempotencyKey:`corptimer-customer-${uid}`});account=await updateAccount(env.DB,uid,s=>({...s,customer:s.customer||customer.id}));}
   // Reuse an open Checkout so repeated clicks cannot create parallel subscriptions.
   const open=await stripe.checkout.sessions.list({customer:account.customer,status:'open',limit:10});
   const existing=open.data.find(s=>s.metadata?.corptimerUid===uid);
   if(existing)return reply({url:existing.url});
   const session=await stripe.checkout.sessions.create({mode:'subscription',customer:account.customer,line_items:[{price:p.id,quantity:1}],metadata:{corptimerUid:uid},subscription_data:{metadata:{corptimerUid:uid}},success_url:env.APP_ORIGIN+'/?billing=return',cancel_url:env.APP_ORIGIN+'/?billing=cancel'},{idempotencyKey:`corptimer-checkout-${uid}-${Math.floor(Date.now()/1800000)}`});
   return reply({url:session.url});
  }
  if(path==='/billing/portal'){
   if(!account.customer)return reply({error:'No subscription to manage.'},400);
   const portal=await stripe.billingPortal.sessions.create({customer:account.customer,return_url:env.APP_ORIGIN});return reply({url:portal.url});
  }
  return reply({error:'Not found'},404);
 }catch{return reply({error:'Subscription service unavailable. Please retry; your running timer can continue.'},503);}
}};
