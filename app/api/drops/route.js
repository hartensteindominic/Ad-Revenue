import { NextResponse } from 'next/server';
import { createDrop } from '../../../lib/dropEngine';
import { listDrops, upsertDrop, seedMemoryDrop } from '../../../lib/claimAuthority';
import { getRealWorldCatalog } from '../../../lib/realWorldCatalog';

function catalogCollectible(item){return{id:`catalog-${item.id}`,name:item.name,family:item.type?.toLowerCase()||'object',subtype:item.id,rarity:item.rarity?.toLowerCase()||'common',verified:true,sourceUrl:item.sourceUrl,assetUrl:item.modelUri||item.previewUri,metadata:{name:item.name,image:item.previewUri,sourceUrl:item.sourceUrl,model:item.modelUri||null},realityBasis:{realWorld:true,source:item.sourceUrl,sourceName:item.sourceName}}}
const SEED_LOCATIONS=[
 {lat:42.8864,lng:-78.8784,zone:'buffalo',item:0},
 {lat:40.7648,lng:-73.9808,zone:'central-park',item:1},
 {lat:40.7359,lng:-73.9911,zone:'union-square',item:2},
 {lat:34.0522,lng:-118.2437,zone:'los-angeles',item:3},
 {lat:37.7749,lng:-122.4194,zone:'san-francisco',item:4},
 {lat:41.8781,lng:-87.6298,zone:'chicago',item:5},
 {lat:25.7617,lng:-80.1918,zone:'miami',item:6},
 {lat:47.6062,lng:-122.3321,zone:'seattle',item:7},
];
function ensureSeeds(){const catalog=getRealWorldCatalog();for(const location of SEED_LOCATIONS){const item=catalog[location.item%catalog.length];const raw={id:`real-drop-${item.id}-${location.zone}`,name:`${item.name} · Discoverable Drop`,status:'active',quantity:1,publicZoneId:location.zone,radiusMeters:100,lat:location.lat,lng:location.lng,startAt:new Date(Date.now()-86400000).toISOString(),endAt:new Date(Date.now()+30*86400000).toISOString(),collectible:catalogCollectible(item)};const drop=createDrop(raw);seedMemoryDrop({...drop,lat:raw.lat,lng:raw.lng,collectible:raw.collectible,claimedCount:0,sourceUrl:item.sourceUrl});}}
export async function GET(){try{ensureSeeds();const drops=await listDrops();return NextResponse.json({drops,storage:drops.length?'server-or-memory':'memory-seed'});}catch(error){console.error('list drops failed',error);return NextResponse.json({error:error?.message||'Unable to list drops'},{status:500});}}
export async function POST(request){try{const body=await request.json();const drop=createDrop({id:body.id||`drop-${Date.now().toString(36)}`,name:body.name,status:body.status||'active',quantity:body.quantity,publicZoneId:body.publicZoneId||'user-public-zone',radiusMeters:body.radiusMeters,startAt:body.startAt||new Date().toISOString(),endAt:body.endAt||new Date(Date.now()+2*86400000).toISOString()});const collectible=body.collectible||{id:drop.id,name:body.name||'Voxel collectible',family:body.family||'object',subtype:body.subtype||'object',rarity:body.rarity||'common',verified:false};const saved=await upsertDrop({...drop,lat:body.lat,lng:body.lng,collectible,claimedCount:0});return NextResponse.json({drop:saved});}catch(error){console.error('create drop failed',error);return NextResponse.json({error:error?.message||'Unable to create drop'},{status:400});}}
