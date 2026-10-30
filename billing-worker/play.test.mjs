import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { playEntitlement, verifyPlay, digest } from './play.js';
import { readAccount } from './store.js';
const future = new Date(Date.now() + 86400000).toISOString();
const receipt = () => ({ subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE', acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED', lineItems: [{ productId: 'corptimer_pro_yearly', offerDetails: { basePlanId: 'annual' }, expiryTime: future }] });
function database() {
  const sql = new DatabaseSync(':memory:'); sql.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  return { prepare(query) { return { bind(...args) { return { async first() { return sql.prepare(query).get(...args); }, async run() { return { meta: sql.prepare(query).run(...args) }; } }; } }; } };
}
test('Play lifecycle: active, cancellation through expiry and grace; no pending/hold/paused/expired, wrong plan or test production unlock', () => {
  for (const state of ['ACTIVE', 'IN_GRACE_PERIOD', 'CANCELED']) assert(playEntitlement({ ...receipt(), subscriptionState: 'SUBSCRIPTION_STATE_' + state }).expiresAt > 0);
  for (const state of ['PENDING', 'ON_HOLD', 'PAUSED', 'EXPIRED']) assert.equal(playEntitlement({ ...receipt(), subscriptionState: 'SUBSCRIPTION_STATE_' + state }).expiresAt, 0);
  const r = receipt(); r.lineItems[0].productId = 'forged'; assert.equal(playEntitlement(r).expiresAt, 0);
  const p = receipt(); p.lineItems[0].offerDetails.basePlanId = 'wrong'; assert.equal(playEntitlement(p).expiresAt, 0);
  const expired = receipt(); expired.lineItems[0].expiryTime = '2020-01-01T00:00:00Z'; assert.equal(playEntitlement(expired).expiresAt, 0);
  assert.equal(playEntitlement({ ...receipt(), testPurchase: {} }).expiresAt, 0);
  assert(playEntitlement({ ...receipt(), testPurchase: {} }, Date.now(), true).expiresAt > 0);
});
test('Unacknowledged purchase is verified, acknowledged, then granted; restore moves current ownership and never trusts client fields', async () => {
  const env = { DB: database(), PLAY_SERVICE_ACCOUNT: 'configured' }, r = { ...receipt(), acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING', externalAccountIdentifiers: { obfuscatedExternalAccountId: await digest('install-a') } };
  let ack = 0;
  const io = { async receipt() { return r; }, async acknowledge() { ack++; } };
  await verifyPlay(env, 'install-a', 'a-valid-private-purchase-token', io);
  assert.equal(ack, 1); assert((await readAccount(env.DB, 'install-a')).state.providers.google.expiresAt > 0);
  await verifyPlay(env, 'install-b', 'a-valid-private-purchase-token', io);
  assert.equal((await env.DB.prepare('SELECT uid FROM play_purchases WHERE token_hash=?').bind(await digest('a-valid-private-purchase-token')).first()).uid, 'install-b');
});
test('Forged account, pending receipt, acknowledgement failure and missing setup never grant access', async () => {
  const env = { DB: database(), PLAY_SERVICE_ACCOUNT: 'configured' };
  await assert.rejects(verifyPlay(env, 'a', 'a-valid-private-purchase-token', { async receipt() { return receipt(); } }));
  const r = { ...receipt(), acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING', externalAccountIdentifiers: { obfuscatedExternalAccountId: await digest('a') } };
  await assert.rejects(verifyPlay(env, 'a', 'a-valid-private-purchase-token', { async receipt() { return r; }, async acknowledge() { throw Error('network'); } }));
  assert.deepEqual((await readAccount(env.DB, 'a')).state, {});
  r.subscriptionState = 'SUBSCRIPTION_STATE_PENDING';
  assert.equal(await verifyPlay(env, 'a', 'a-valid-private-purchase-token', { async receipt() { return r; } }), false);
  assert.deepEqual((await readAccount(env.DB, 'a')).state, {});
  await assert.rejects(verifyPlay({ DB: database() }, 'a', 'a-valid-private-purchase-token'));
});
