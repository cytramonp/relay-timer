import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {installDictionary,t,languagePath,languages} from '../docs/i18n-core.js';
import {matchesTimerSearch} from '../docs/timer-menu.js';
import {eggStages,eggSvg,eggStageIndex} from '../docs/egg-visual.js';
import {createBoard,act,seekCard} from '../docs/board-engine.js';
import {specialtyTimers} from '../docs/specialty-catalog.js';

test('all language pages preserve complete guide structure, routes and SEO alternates',()=>{
 const sitemap=fs.readFileSync('docs/sitemap.xml','utf8');const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);
 assert.equal(urls.length,220);assert.equal(new Set(urls).size,220);
 const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
 for(const url of urls){
  const u=new URL(url),lang=u.pathname.match(/^\/(es|fr|de|pt)\//)?.[1]||'en';const file=path.resolve('docs','.'+u.pathname,'index.html'),html=fs.readFileSync(file,'utf8');
  assert.ok(html.includes(`lang="${lang}"`),url);
  const links=[...html.matchAll(/<link\b[^>]*>/g)].map(m=>attributes(m[0]));
  assert.deepEqual(links.filter(x=>x.rel==='canonical').map(x=>x.href),[url]);
  const alternates=links.filter(x=>x.rel==='alternate');assert.equal(alternates.length,6,url);
  for(const code of Object.keys(languages))assert.ok(alternates.some(a=>a.hreflang===code&&a.href==='https://corptimer.com'+languagePath(u.pathname,code)),url+' '+code);
  assert.equal((html.match(/class="language-switcher"/g)||[]).length,1,url);
  for(const [,ref]of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   if(/^(https?:|#|mailto:|data:)/.test(ref))continue;const target=new URL(ref,url);let f=path.resolve('docs','.'+target.pathname);if(target.pathname.endsWith('/'))f=path.join(f,'index.html');assert.ok(fs.existsSync(f),`${url}: ${ref}`);
  }
  if(lang!=='en'){
   const original=fs.readFileSync(path.resolve('docs','.'+languagePath(u.pathname,'en'),'index.html'),'utf8');
   for(const tag of ['p','li','h1','h2','h3','dd','dt','figure'])assert.equal((html.match(new RegExp('<'+tag+'(?:\\s|>)','g'))||[]).length,(original.match(new RegExp('<'+tag+'(?:\\s|>)','g'))||[]).length,url+': '+tag);
  }
 }
 assert.ok(!sitemap.includes('live.html'));
 for(const lang of Object.keys(languages)){const html=fs.readFileSync('docs/'+(lang==='en'?'':lang+'/')+'live.html','utf8');assert.match(html,/noindex,nofollow/);}
});
test('translation catalogs retain placeholders and resolve dynamic statuses without corrupting numbers',()=>{
 for(const lang of ['es','fr','de','pt']){
  const data=JSON.parse(fs.readFileSync(`docs/locales/${lang}.json`));
  for(const [source,target]of Object.entries(data))assert.deepEqual((target.match(/\{\d+\}/g)||[]).sort(),(source.match(/\{\d+\}/g)||[]).sort(),`${lang}: ${source}`);
  installDictionary(data);
  for(const source of Object.keys(data)){let value=t(source);for(let i=0;i<3;i++)value=t(value);assert.equal(t(value),value,`${lang}: repeatedly translating ${source} must settle`);}
  installDictionary(data);assert.equal(t('Resume'),data.Resume);assert.equal(t('Runny yolk · 5 minutes'),data['Runny yolk · 5 minutes']);
  const next=t('Next: Runny yolk · 5 minutes');assert.ok(!next.includes('Runny yolk'),next);assert.ok(next.includes('5'));
  assert.equal(t('12:34.5'),'12:34.5');assert.equal(t('Мария — мой личный таймер'),'Мария — мой личный таймер');
 }
 installDictionary();
 for(const key of ['constructor','toString','__proto__'])assert.equal(t(key),key);
});
test('locale URLs preserve page identity and reject unsupported languages',()=>{
 assert.equal(languagePath('/fr/egg-timer/','es'),'/es/egg-timer/');assert.equal(languagePath('/pt/','en'),'/');
 assert.equal(languagePath('/relay-timer/es/fitness-timer/','de','/relay-timer/'),'/relay-timer/de/fitness-timer/');
 assert.throws(()=>languagePath('/egg-timer/','xx'));
});
test('menu search handles accents, multiple words, English names and empty results',()=>{
 assert.ok(matchesTimerSearch('meditation','Minuteur de méditation'));
 assert.ok(matchesTimerSearch('oeufs','Minuteur à œufs'));
 assert.ok(matchesTimerSearch('CAFÉ','Temporizador para café'));
 assert.ok(matchesTimerSearch('chess','Pendule d’échecs','Chess Timer'));
 assert.ok(matchesTimerSearch('15 timer','15 Minute Timer'));assert.ok(!matchesTimerSearch('15 timer','5 Minute Timer'));
 assert.ok(matchesTimerSearch('','Egg Timer'));assert.ok(!matchesTimerSearch('zzzz','Egg Timer'));
});
test('egg illustrations follow completed milestones, reset to raw, and make all six states distinct',()=>{
 const profile=specialtyTimers.find(x=>x.slug==='egg-timer');let board=createBoard(profile);const first=board[0];
 assert.equal(eggStageIndex(first),0);assert.equal(new Set(eggStages.map(([key])=>eggSvg(key))).size,6);
 assert.match(eggSvg('raw'),/fill-opacity/);assert.ok(!eggSvg('raw').includes('M80 10C52'));assert.ok(eggSvg('runny').includes('v19'));
 for(const [seconds,index]of [[0,0],[299,0],[300,1],[360,2],[420,3],[480,4],[600,5]])assert.equal(eggStageIndex(seekCard(first,seconds,'sequence')),index);
 board=[seekCard(first,600,'sequence')];board=act(board,0,'reset','sequence',0);assert.equal(eggStageIndex(board[0]),0);
});
