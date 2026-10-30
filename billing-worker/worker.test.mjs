import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.js';
const env={APP_ORIGIN:'https://corptimer.com',FIREBASE_PROJECT:'relay-timer-web-7c39'};
test('status rejects unauthenticated callers even before Stripe is configured',async()=>{
 const r=await worker.fetch(new Request('https://billing.example/access/status',{method:'POST',headers:{Origin:env.APP_ORIGIN}}),env);
 assert.equal(r.status,401);
 assert.equal(r.headers.get('Access-Control-Allow-Origin'),env.APP_ORIGIN);
});
test('foreign browser origins cannot access billing',async()=>{
 const r=await worker.fetch(new Request('https://billing.example/access/status',{method:'POST',headers:{Origin:'https://other.example'}}),env);
 assert.equal(r.status,403);
 assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
});
test('forged Stripe webhook cannot grant access',async()=>{
 const r=await worker.fetch(new Request('https://billing.example/billing/webhook',{method:'POST',body:'{}',headers:{'stripe-signature':'forged'}}),{...env,STRIPE_SECRET:'sk_test_fixture_only',STRIPE_WEBHOOK:'whsec_fixture_only'});
 assert.equal(r.status,400);
});
