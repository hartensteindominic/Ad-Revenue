export type ProvenanceEvent={type:'created'|'verified_purchase'|'minted'|'transferred'|'received'|'resold'|'repaired'|'certified';timestamp:string;actor?:string;networkId?:number;txHash?:string;note?:string};
export type ObjectPassport={voxelId:string;edition?:string;creator?:string;currentOwner?:string;metadataUri?:string;modelUri?:string;events:ProvenanceEvent[]};
export function appendProvenance(passport:ObjectPassport,event:ProvenanceEvent):ObjectPassport{return {...passport,events:[...passport.events,event].slice(-500)}}
export function latestConfirmedTransfer(passport:ObjectPassport){return [...passport.events].reverse().find(e=>e.type==='transferred'&&e.txHash)||null}
