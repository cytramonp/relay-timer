// Original synthesized cues shared with the native app; no third-party recordings.
export class CuePlayer {
  constructor(){this.buffers=new Map();this.context=null;}
  async arm(){
    this.context ||= new (window.AudioContext||window.webkitAudioContext)();
    await this.context.resume();
    if(!this.loading)this.loading=Promise.all(['gong','bell','beep'].map(async name=>{
      const response=await fetch(new URL(`./assets/${name}.wav`,import.meta.url));if(!response.ok)throw Error('Cue could not load');
      this.buffers.set(name,await this.context.decodeAudioData(await response.arrayBuffer()));
    })).catch(e=>{this.loading=null;throw e;});
    await this.loading;
  }
  play(name='bell',volume=65){
    if(!this.context||this.context.state!=='running'||name==='off'||volume<=0)return false;
    const buffer=this.buffers.get(name==='horn'?'gong':name==='click'||name==='warning'?'beep':name);
    if(!buffer)return false;
    const source=this.context.createBufferSource(),gain=this.context.createGain();
    source.buffer=buffer;gain.gain.value=Math.max(0,Math.min(1,volume/100))*(name==='click'?.25:1);
    if(name==='horn')source.playbackRate.value=.65;
    source.connect(gain);gain.connect(this.context.destination);source.start();
    document.body.dataset.lastCue=name;
    document.body.dataset.cueCount=String(Number(document.body.dataset.cueCount||0)+1);
    source.onended=()=>{source.disconnect();gain.disconnect();};
    document.dispatchEvent(new CustomEvent('timer-cue',{detail:{name,at:Date.now()}}));return true;
  }
}
