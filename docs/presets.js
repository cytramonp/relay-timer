function state(items,total,floor=0){return{agenda:items.map(([name,min,kind='topic'])=>({id:crypto.randomUUID(),name,min,kind})),total,floor,warn:1,sound:false,autoSplit:false,keepProp:true,shape:'wide',clock:70,run:null};}
export const presets={
  participants:()=>({title:'Eight participants',state:state(Array.from({length:8},(_,i)=>['Participant '+(i+1),5,'person']),40)}),
  daily:()=>({title:'Daily standup',state:state([['Progress toward the goal',4],['Work in progress & blockers',8],['Plan & follow-ups',3]],15)}),
  retro:()=>({title:'Sprint retrospective',state:state([['Check in',5],['Reflect',10],['Group & vote',10],['Discuss',25],['Actions & close',10]],60)}),
  planning:()=>({title:'Sprint planning',state:state([['Sprint goal',10],['Select work',25],['Plan delivery',20],['Commit & close',5]],60)}),
  workshop:()=>({title:'Workshop',state:state([['Welcome & outcome',10],['Explore',20],['Break',5],['Create',30],['Share',20],['Wrap up',5]],90)}),
  focus:()=>({title:'Focus session',state:state([['Focus',25],['Break',5]],30)}),
  pomodoro:()=>({title:'Pomodoro',state:{...state([['Focus 1',25],['Short break',5],['Focus 2',25],['Short break',5],['Focus 3',25],['Short break',5],['Focus 4',25],['Long break',15]],130),endPolicy:'auto'}}),
  countdown:()=>({title:'Countdown',state:{...state([['Countdown',10]],10),endPolicy:'auto'}}),
  blank:()=>({title:'New meeting',state:{...state([['Alex',5,'person'],['Morgan',5,'person'],['Discussion',5]],15,1),autoSplit:true}})
};
