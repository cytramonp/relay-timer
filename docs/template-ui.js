import {icon} from './icons.js?v=8';
import {presets} from './presets.js?v=8';
import {isTemplate,freshPlan,makeTemplate,reviseTemplate,templateColors,templateIcons} from './templates.js?v=8';
import {removeRecord} from './storage.js?v=8';

const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
const builtins=[['daily','people','citron','A quick team check-in.'],['retro','loop','lilac','Reflect, discuss, improve.'],['planning','grid','mint','Turn a goal into a plan.'],['workshop','spark','peach','Make space for good ideas.'],['focus','focus','citron','Deep work, then a breather.'],['pomodoro','loop','peach','Four focus rounds with automatic breaks.'],['countdown','focus','mint','One timer. Set your duration and start.']];

export function templateUI({getRecords,commit,apply,getCurrent,toast,confirm}){
  let draft=null,editingId=null,revision=null,dirty=false;
  const dialog=$('templates-dialog');
  const select=$('template-select');
  function shelf(){draft=null;dirty=false;$('template-shelf').hidden=false;$('template-editor').hidden=true;$('templates-title').textContent='A good meeting starts here.';render();dialog.scrollTop=0;}
  function preview(state,color){const track=el('div','template-preview');track.dataset.color=color;track.setAttribute('aria-hidden','true');for(const a of state.agenda){const bar=el('i');bar.style.flexGrow=Math.max(.25,a.min);track.append(bar);}return track;}
  function card(record,appearance,description,builtin=false){
    const article=el('article','template-card');article.dataset.color=appearance.color;
    const graphic=el('div','template-graphic');graphic.append(icon(appearance.icon),preview(record.state,appearance.color));
    const heading=el('h4','',record.title),details=el('p','template-detail',`${record.state.agenda.length} slots · ${record.state.agenda.reduce((n,a)=>n+a.min,0)} min`);
    const summary=el('p','template-description',description||record.state.agenda.slice(0,3).map(a=>a.name).join(' · '));
    const actions=el('div','template-actions'),use=el('button','template-use','Use template'),edit=el('button','template-edit',builtin?'Customize':'Edit');use.append(icon('right'));edit.prepend(icon('edit'));
    use.setAttribute('aria-label',`Use ${record.title}`);edit.setAttribute('aria-label',`${builtin?'Customize':'Edit'} ${record.title}`);
    use.onclick=()=>{apply(record.title,freshPlan(record.state));dialog.close();};edit.onclick=()=>editDraft({...record,state:{...record.state,template:appearance}},builtin);
    actions.append(use,edit);article.append(graphic,heading,details,summary,actions);return article;
  }
  function render(){
    const custom=getRecords().filter(r=>!r.deleted&&isTemplate(r));$('custom-template-list').replaceChildren(...custom.map(r=>card(r,r.state.template)));
    $('template-empty').hidden=!!custom.length;$('custom-template-count').textContent=String(custom.length);
    $('builtin-template-list').replaceChildren(...builtins.map(([id,shape,color,description])=>card(presets[id](),{icon:shape,color},description,true)));
    const option=(value,label)=>{const o=el('option','',label);o.value=value;return o;};
    const starters=el('optgroup');starters.label='Starter templates';
    for(const [id]of builtins){const p=presets[id]();starters.append(option('starter:'+id,`${p.title} · ${p.state.total} min`));}
    const own=el('optgroup');own.label='Your templates';
    for(const r of custom)own.append(option('custom:'+r.id,`${r.title} · ${r.state.agenda.reduce((n,a)=>n+a.min,0)} min`));
    const actions=el('optgroup');actions.label='Create & manage';actions.append(option('save','Save current agenda as template…'),option('new','Create template…'),option('manage','Manage templates…'));
    select.replaceChildren(option('','Templates'),starters,...(custom.length?[own]:[]),actions);
  }
  function updatePreview(){
    if(!draft)return;const sum=draft.state.agenda.reduce((n,a)=>n+(Number(a.min)||0),0);$('template-total').textContent=`${draft.state.agenda.length} slots · ${sum} min`;
    const visual=$('template-visual');visual.dataset.color=draft.appearance.color;visual.replaceChildren(icon(draft.appearance.icon),preview(draft.state,draft.appearance.color));
  }
  function editDraft(record,builtin=false){
    editingId=builtin?null:record.id||null;revision=record.updatedAt??null;draft={title:record.title,state:freshPlan(record.state),appearance:{color:record.state.template?.color||'citron',icon:record.state.template?.icon||'grid'}};dirty=false;$('template-error').textContent='';
    $('template-shelf').hidden=true;$('template-editor').hidden=false;$('templates-title').textContent=editingId?'Make it your own.':'Create your next go-to.';
    $('template-name').value=draft.title;$('template-policy').value=draft.state.endPolicy;$('template-split').checked=draft.state.autoSplit;
    $('template-delete').hidden=!editingId;$('template-duplicate').hidden=!editingId;
    renderChoices();renderSlots();updatePreview();$('template-name').focus();dialog.scrollTop=0;
  }
  function renderChoices(){
    $('template-colors').replaceChildren(...templateColors.map(color=>{const b=el('button','color-choice');b.type='button';b.dataset.color=color;b.setAttribute('aria-label',`${color} color`);b.setAttribute('aria-pressed',String(draft.appearance.color===color));b.append(icon('check'));b.onclick=()=>{draft.appearance.color=color;dirty=true;renderChoices();updatePreview();};return b;}));
    $('template-icons').replaceChildren(...templateIcons.map(name=>{const b=el('button','icon-choice');b.type='button';b.setAttribute('aria-label',`${name} icon`);b.setAttribute('aria-pressed',String(draft.appearance.icon===name));b.append(icon(name));b.onclick=()=>{draft.appearance.icon=name;dirty=true;renderChoices();updatePreview();};return b;}));
  }
  function renderSlots(focusIndex){
    const rows=draft.state.agenda.map((a,index)=>{
      const row=el('div','template-slot'),name=el('input'),minutes=el('input'),kind=el('select');name.value=a.name;name.maxLength=120;name.required=true;name.setAttribute('aria-label',`Slot ${index+1} name`);
      minutes.type='number';minutes.min='0';minutes.max='1440';minutes.step='.25';minutes.required=true;minutes.value=a.min;minutes.setAttribute('aria-label',`Slot ${index+1} minutes`);
      for(const [value,label]of [['person','Speaker'],['topic','Topic']]){const option=el('option','',label);option.value=value;kind.append(option);}kind.value=a.kind;kind.setAttribute('aria-label',`Slot ${index+1} type`);
      name.oninput=()=>{a.name=name.value;dirty=true;};minutes.oninput=()=>{a.min=Number(minutes.value);dirty=true;updatePreview();};kind.onchange=()=>{a.kind=kind.value;dirty=true;};
      const position=el('span','slot-position',String(index+1)),moves=el('div','slot-moves');
      for(const [direction,offset]of [['up',-1],['down',1]]){const b=el('button');b.type='button';b.append(icon(direction));b.setAttribute('aria-label',`Move slot ${index+1} ${direction}`);b.disabled=index+offset<0||index+offset>=draft.state.agenda.length;b.onclick=()=>{const next=index+offset;[draft.state.agenda[index],draft.state.agenda[next]]=[draft.state.agenda[next],draft.state.agenda[index]];dirty=true;renderSlots(next);};moves.append(b);}
      const remove=el('button','slot-remove');remove.type='button';remove.setAttribute('aria-label',`Remove slot ${index+1}`);remove.append(icon('close'));remove.disabled=draft.state.agenda.length===1;remove.onclick=()=>{draft.state.agenda.splice(index,1);dirty=true;renderSlots(Math.min(index,draft.state.agenda.length-1));};
      row.append(position,name,kind,minutes,moves,remove);return row;
    });$('template-slots').replaceChildren(...rows);updatePreview();if(focusIndex!=null)rows[focusIndex]?.querySelector('input').focus();
  }
  function leave(action){if(!dirty){action();return;}confirm('Discard template changes?','The saved template stays unchanged. Your unsaved edits will be discarded.',()=>{dirty=false;action();});}
  function open(){shelf();dialog.showModal();}
  $('template-manage').onclick=open;
  select.onchange=()=>{const value=select.value;select.value='';
    if(value.startsWith('starter:')){const p=presets[value.slice(8)]?.();if(p)apply(p.title,freshPlan(p.state));}
    else if(value.startsWith('custom:')){const r=getRecords().find(r=>r.id===value.slice(7)&&!r.deleted&&isTemplate(r));if(r)apply(r.title,freshPlan(r.state));else toast('This template changed. Choose it again from the list.');}
    else if(value==='manage')open();
    else if(value==='save'){open();$('template-from-current').click();}
    else if(value==='new'){open();$('template-new').click();}
  };
  $('template-from-current').onclick=()=>{const current=getCurrent();editDraft({title:current.title,state:current.state},true);};
  $('template-new').onclick=()=>editDraft({title:'My template',state:{...presets.blank().state,agenda:[{id:crypto.randomUUID(),name:'Opening',min:5,kind:'topic'}],total:5,autoSplit:false}},true);
  $('template-back').onclick=()=>leave(shelf);
  $('templates-close').onclick=()=>leave(()=>dialog.close());dialog.addEventListener('cancel',e=>{if(dirty){e.preventDefault();leave(()=>dialog.close());}});
  $('template-name').oninput=()=>{draft.title=$('template-name').value;dirty=true;};
  $('template-policy').onchange=()=>{draft.state.endPolicy=$('template-policy').value;dirty=true;};
  $('template-split').onchange=()=>{draft.state.autoSplit=$('template-split').checked;dirty=true;};
  for(const [id,kind]of [['template-add-speaker','person'],['template-add-topic','topic']])$(id).onclick=()=>{if(draft.state.agenda.length>=2000){toast('A template can contain up to 2,000 slots.');return;}draft.state.agenda.push({id:crypto.randomUUID(),name:kind==='person'?'New speaker':'New topic',min:5,kind});dirty=true;renderSlots(draft.state.agenda.length-1);};
  $('template-form').onsubmit=e=>{e.preventDefault();try{
    const title=draft.title.trim();if(!title){$('template-name').focus();return;}
    draft.state.total=draft.state.agenda.reduce((n,a)=>n+a.min,0);
    const existing=getRecords().find(r=>r.id===editingId);
    if(editingId&&(!existing||existing.deleted||existing.updatedAt!==revision))throw Error('This template changed on another device. Return to the library and reopen it before saving.');
    const next=existing?reviseTemplate(existing,title,draft.state,draft.appearance):makeTemplate(title,draft.state,draft.appearance);
    commit(next);dirty=false;shelf();toast('Template saved. Use it whenever you need a fresh meeting.');
  }catch(error){$('template-error').textContent=error.message;}};
  $('template-duplicate').onclick=()=>{editingId=null;revision=null;draft.title+=' copy';$('template-name').value=draft.title;dirty=true;$('template-delete').hidden=true;$('template-duplicate').hidden=true;$('templates-title').textContent='Create your next go-to.';};
  $('template-delete').onclick=()=>{const existing=getRecords().find(r=>r.id===editingId);if(existing)confirm('Delete this template?','Meetings already created from this template stay in your library.',()=>{commit(removeRecord(existing));dirty=false;shelf();toast('Template deleted.');});};
  dialog.addEventListener('close',()=>{$('template-error').textContent='';});
  return {render,close(){dirty=false;dialog.close();}};
}
