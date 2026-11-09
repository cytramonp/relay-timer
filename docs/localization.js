import {languages,installDictionary,t,languagePath} from './i18n-core.js';
import {publicPaths} from './locale-routes.js';
const lang=document.documentElement.lang||'en',base=new URL('./',import.meta.url).pathname;
const privateContent='script,style,svg,textarea,[contenteditable],.wordmark,[translate="no"],[data-user-content],#ovName,#live-title,#live-name,#live-agenda-list,#meeting-list strong,#parking-list,.custom-timer-list a:not(:last-child)';
const attributes=['aria-label','title','placeholder','alt'];
const sourceAttributes=new WeakMap(),translatedNodes=new WeakMap();
function localLink(anchor){
  if(anchor.closest('.language-switcher')||anchor.hasAttribute('download'))return;
  const raw=anchor.getAttribute('href');if(!raw||raw.startsWith('#'))return;
  const url=new URL(raw,location.href);if(url.origin!==location.origin)return;
  const english=languagePath(url.pathname,'en',base);if(!publicPaths.includes(english.slice(base.length)))return;
  url.pathname=languagePath(url.pathname,lang,base);
  if(anchor.href!==url.href)anchor.href=url.href;
}
function element(el){
  if(el.matches('a[href]'))localLink(el);
  if(lang==='en'||el.closest(privateContent)||el.closest('.language-options'))return;
  if(el.matches('input[data-i18n-value]')&&el.value===el.dataset.i18nValue)el.value=t(el.dataset.i18nValue);
  // Options without explicit values otherwise change the app's internal enum.
  if(el.tagName==='OPTION'&&!el.hasAttribute('value'))el.setAttribute('value',el.textContent);
  let sources=sourceAttributes.get(el);if(!sources){sources={};sourceAttributes.set(el,sources);}
  for(const name of attributes){const value=el.getAttribute(name);if(!value||sources[name]===value)continue;const next=t(value);if(next!==value){sources[name]=next;el.setAttribute(name,next);}}
}
function text(node){
  if(lang==='en'||!node.parentElement||node.parentElement.closest(privateContent)||node.parentElement.closest('.language-options'))return;
  if(translatedNodes.get(node)===node.data)return;
  const next=t(node.data);translatedNodes.set(node,next);if(next!==node.data)node.data=next;
}
function translateTree(root){
  if(root.nodeType===Node.TEXT_NODE){text(root);return;}
  if(root.nodeType!==Node.ELEMENT_NODE||root.closest(privateContent))return;
  element(root);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){const node=walker.currentNode;if(node.nodeType===Node.TEXT_NODE)text(node);else element(node);}
}
function setupMenus(){
  document.addEventListener('click',event=>{
    const link=event.target.closest('.language-options a');
    if(link){const url=new URL(link.href);url.search=location.search;url.hash=location.hash;link.href=url.href;try{localStorage.setItem('corptimer.language.v1',link.hreflang);}catch{} }
    document.querySelectorAll('.language-switcher[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});
  });
  document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const open=document.querySelector('.language-switcher[open]');if(open){open.open=false;open.querySelector('summary').focus();}});
  document.addEventListener('toggle',event=>{if(event.target.matches?.('.language-switcher[open]'))document.querySelectorAll('.timer-switcher[open]').forEach(el=>el.open=false);if(event.target.matches?.('.timer-switcher[open]'))document.querySelectorAll('.language-switcher[open]').forEach(el=>el.open=false);},true);
}
async function start(){
  if(!Object.hasOwn(languages,lang))return;
  if(lang!=='en'){
    try{const response=await fetch(new URL(`./locales/${lang}.json`,import.meta.url));if(!response.ok)throw Error('Language catalog unavailable');installDictionary(await response.json());}
    catch(error){console.error('CorpTimer language catalog could not load.',error);return;}
  }
  setupMenus();translateTree(document.body);
  const observer=new MutationObserver(records=>{
    const roots=new Set();for(const record of records){
      if(record.type==='characterData')text(record.target);
      else if(record.type==='attributes')element(record.target);
      else for(const added of record.addedNodes)roots.add(added);
    }
    for(const root of roots)if(root.isConnected)translateTree(root);
  });
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:[...attributes,'href']});
  document.documentElement.dataset.languageReady='true';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
