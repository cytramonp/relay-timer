export const languages = {en:'English',es:'Español',fr:'Français',de:'Deutsch',pt:'Português'};
export const normalizeText = value => String(value).replace(/\s+/g,' ').trim();
let dictionary=Object.create(null),patterns=[],cache=new Map(),translatedValues=new Set();
const escapeRegex=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function installDictionary(messages={}) {
  dictionary=Object.assign(Object.create(null),messages);cache=new Map();patterns=[];translatedValues=new Set(Object.values(messages).map(normalizeText));
  for(const [source,target] of Object.entries(messages)) {
    // Adjacent substitutions and plural suffixes cannot be recovered reliably
    // from rendered text. Use explicit singular/plural messages instead.
    if(/\{\d+\}\{\d+\}|\b(?:move|interval)\{\d+\}/.test(source))continue;
    const parts=source.split(/(\{\d+\})/g);
    if(parts.length===1||parts.filter(s=>!/^\{\d+\}$/.test(s)).join('').replace(/[^a-z]/gi,'').length<3)continue;
    const keys=[];const numericFirst=!parts[0]&&(parts.length>3||/^\{\d+\} (intervals?|minutes?|seconds?|hours?|slots?|moves?|sessions?|topics?|people|total)\b/.test(source));
    const expression=parts.map(part=>{if(!/^\{\d+\}$/.test(part))return escapeRegex(part);keys.push(part);return numericFirst&&keys.length===1?'([0-9][0-9:.,]*)':'(.+?)';}).join('');
    patterns.push({regex:new RegExp('^'+expression+'$'),keys,target,weight:(parts[0]?1000:0)+source.replace(/\{\d+\}/g,'').length});
  }
  patterns.sort((a,b)=>b.weight-a.weight);
}
export function t(value,depth=0) {
  if(typeof value!=='string')return value;
  const source=normalizeText(value);
  if(!/[A-Za-z]/.test(source))return value;
  let translated=dictionary[source]||cache.get(source);
  if(!translated&&translatedValues.has(source))return value;
  if(!translated&&depth<2){
    for(const pattern of patterns){const match=source.match(pattern.regex);if(!match)continue;
      translated=pattern.target.replace(/\{\d+\}/g,key=>{const index=pattern.keys.indexOf(key);return index<0?key:t(match[index+1],depth+1);});break;
    }
  }
  if(!translated&&depth<2){
    for(const separator of [' · ',': ',' → ',' / '])if(source.includes(separator)){
      const result=source.split(separator).map(part=>t(part,depth+1)).join(separator);if(result!==source){translated=result;break;}
    }
  }
  if(!translated)return value;
  if(cache.size>2000)cache.clear();cache.set(source,translated);
  return value.slice(0,value.length-value.trimStart().length)+translated+value.slice(value.trimEnd().length);
}
export function languagePath(pathname,lang,base='/') {
  if(!Object.hasOwn(languages,lang))throw Error('Unsupported language');
  if(!pathname.startsWith(base))return pathname;
  const tail=pathname.slice(base.length).replace(/^(?:es|fr|de|pt)\//,'');
  return base+(lang==='en'?'':lang+'/')+tail;
}
// Display a built-in name in the page language while keeping the persisted value
// stable. A name actually edited by the user is returned exactly as entered.
export function localizedInputValue(input) {
  const source=input.getAttribute('data-i18n-value');
  return source!==null&&input.value===t(source)?source:input.value;
}
