import { importPKCS8, SignJWT } from 'jose';
import { readAccount, updateAccount } from './store.js';

const PACKAGE = 'com.corptimer.app';
const PRODUCT = 'corptimer_pro_yearly';
const BASE_PLAN = 'annual';
const accepted = new Set(['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', 'SUBSCRIPTION_STATE_CANCELED']);
export async function digest(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(n => n.toString(16).padStart(2, '0')).join('');
}
export function playEntitlement(receipt, now = Date.now(), allowTest = false) {
  const items = (receipt.lineItems || []).filter(i => i.productId === PRODUCT && i.offerDetails?.basePlanId === BASE_PLAN);
  const expiresAt = Math.max(0, ...items.map(i => Date.parse(i.expiryTime)).filter(Number.isFinite));
  const active = accepted.has(receipt.subscriptionState) && expiresAt > now && (!receipt.testPurchase || allowTest);
  return { expiresAt: active ? expiresAt : 0, product: PRODUCT };
}
let cachedOAuth;
async function publisherToken(env) {
  const service = JSON.parse(env.PLAY_SERVICE_ACCOUNT);
  if (cachedOAuth?.email === service.client_email && cachedOAuth.until > Date.now()) return cachedOAuth.token;
  const key = await importPKCS8(service.private_key, 'RS256');
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/androidpublisher' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' }).setIssuer(service.client_email)
    .setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('5m').sign(key);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error('Play verification unavailable');
  const data = await response.json();
  cachedOAuth = { email: service.client_email, token: data.access_token, until: Date.now() + 240000 };
  return data.access_token;
}
export function playConfigured(env) { return !!env.PLAY_SERVICE_ACCOUNT; }
async function googleReceipt(env, token) {
  const auth = await publisherToken(env);
  const response = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE}/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`, { headers: { Authorization: `Bearer ${auth}` }, signal: AbortSignal.timeout(10000) });
  if (response.status === 404 || response.status === 410) return { subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED' };
  if (!response.ok) throw Error('Play verification unavailable');
  return response.json();
}
async function acknowledge(env, token) {
  const response = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE}/purchases/subscriptions/${PRODUCT}/tokens/${encodeURIComponent(token)}:acknowledge`, {
    method: 'POST', headers: { Authorization: `Bearer ${await publisherToken(env)}`, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error('Play acknowledgement unavailable');
}
/** No caller-supplied expiry, price, sandbox flag, or "isPro" is trusted. */
export async function verifyPlay(env, uid, token, io = { receipt: googleReceipt, acknowledge }) {
  if (!playConfigured(env)) throw Error('Google Play is not configured');
  if (typeof token !== 'string' || token.length < 16 || token.length > 4096) throw Error('Invalid purchase token');
  const receipt = await io.receipt(env, token);
  const entitlement = playEntitlement(receipt, Date.now(), env.PLAY_ALLOW_TEST === 'true');
  const tokenHash = await digest(token);
  const previous = await env.DB.prepare('SELECT uid FROM play_purchases WHERE token_hash=?').bind(tokenHash).first();
  // New purchases must be bound to the obfuscated Firebase identity passed to Play.
  // A previously verified token may be restored to a new anonymous app install.
  // Its old identity loses access on its next access check (single current owner).
  if (!previous && receipt.externalAccountIdentifiers?.obfuscatedExternalAccountId !== await digest(uid)) throw Error('Purchase account mismatch');
  if (!entitlement.expiresAt) {
    await updateAccount(env.DB, uid, s => s.providers?.google?.token === token ? { ...s, providers: { ...s.providers, google: { expiresAt: 0 } } } : s);
    return false;
  }
  if (receipt.acknowledgementState !== 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED') await io.acknowledge(env, token);
  await env.DB.prepare('INSERT INTO play_purchases(token_hash,uid) VALUES(?,?) ON CONFLICT(token_hash) DO UPDATE SET uid=excluded.uid').bind(tokenHash, uid).run();
  await updateAccount(env.DB, uid, s => ({ ...s, providers: { ...s.providers, google: { ...entitlement, token, checkedAt: Date.now() } } }));
  return true;
}
export async function refreshPlay(env, uid) {
  const state = (await readAccount(env.DB, uid)).state;
  const previous = state.providers?.google;
  if (!previous?.token) return state;
  const owner = await env.DB.prepare('SELECT uid FROM play_purchases WHERE token_hash=?').bind(await digest(previous.token)).first();
  if (owner?.uid !== uid) return updateAccount(env.DB, uid, s => ({ ...s, providers: { ...s.providers, google: { expiresAt: 0 } } }));
  // Re-read Google before every new session / access refresh, including refunds and expiry.
  // Network failure blocks new starts rather than retaining a possibly revoked grant.
  const receipt = await googleReceipt(env, previous.token);
  const entitlement = playEntitlement(receipt, Date.now(), env.PLAY_ALLOW_TEST === 'true');
  return updateAccount(env.DB, uid, s => ({ ...s, providers: { ...s.providers, google: { ...entitlement, token: previous.token, checkedAt: Date.now() } } }));
}
