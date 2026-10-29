export function intervalCue(clock,previous,config,lastSecond){
  if(!clock?.sequence||config.sound==='off'||!config.volume)return null;
  const remaining=clock.remaining(),second=Math.ceil(remaining/1000),current=clock.sequence[clock.index];
  if((clock.done&&!previous.done)||clock.index!==previous.index||(clock.waiting&&previous.remaining>0))return config.sound==='gong'&&config.gong===false?null:config.sound;
  if(clock.running&&current.type==='work'&&config.warning>0&&previous.remaining>config.warning*1000&&remaining<=config.warning*1000)return 'warning';
  if(clock.running&&second>0&&second<=config.finalCue&&second!==lastSecond)return 'beep';
  return null;
}
