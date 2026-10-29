export type Stage={name:string;seconds:number};
export type Card={name:string;stages:Stage[];index:number;elapsed:number;anchor:number|null;laps:number[];done:boolean};
export type Profile={count:number;mode:string;stages:Stage[]};
export function createBoard(profile:Profile):Card[];
export function elapsed(card:Card,now:number):number;
export function settle(card:Card,mode:string,now:number):Card;
export function act(board:Card[],index:number,action:string,mode:string,now:number):Card[];
export function display(card:Card,mode:string,now:number):string;
