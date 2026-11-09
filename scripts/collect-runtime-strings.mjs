// Authoring helper; the site build never needs TypeScript or a translation service.
import fs from 'node:fs';
import ts from '../mobile/node_modules/typescript/lib/typescript.js';
const rows=new Set();
function visit(node){
  if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))rows.add(node.text);
  if(ts.isTemplateExpression(node))rows.add(node.head.text+node.templateSpans.map((s,i)=>`{${i}}`+s.literal.text).join(''));
  ts.forEachChild(node,visit);
}
for(const file of fs.readdirSync('docs').filter(f=>f.endsWith('.js')&&!['localization.js','i18n-core.js'].includes(f))){
  visit(ts.createSourceFile(file,fs.readFileSync('docs/'+file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS));
}
fs.mkdirSync('outputs/localization',{recursive:true});
fs.writeFileSync('outputs/localization/runtime-literals.json',JSON.stringify([...rows],null,2));
