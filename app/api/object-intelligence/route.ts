import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';

const MAX=2500;
export async function POST(req:Request){
 try{
  const supabase=getSupabaseAdmin(); const auth=req.headers.get('authorization'); const token=auth?.startsWith('Bearer ')?auth.slice(7):null;
  if(!token)return NextResponse.json({error:'Authentication required.'},{status:401});
  const {data:{user},error}=await supabase.auth.getUser(token); if(error||!user)return NextResponse.json({error:'Authentication required.'},{status:401});
  const body=await req.json(); const objectId=typeof body?.objectId==='string'?body.objectId.trim():''; const task=typeof body?.task==='string'?body.task.trim():'';
  if(!task||task.length>MAX)return NextResponse.json({error:'Task must be 1–2500 characters.'},{status:400});
  let object=null;
  if(objectId){const r=await supabase.from('voxel_objects').select('id,voxel_id,status,nft_contract_address,nft_token_id,metadata_uri').eq('id',objectId).maybeSingle();object=r.data||null;}
  const provider=process.env.VOXEL_AI_ENDPOINT;
  if(!provider)return NextResponse.json({mode:'orchestration-ready',task,object,capabilities:['identify','research','provenance','3d','quantum','room'],message:'AI provider is not configured.'});
  const r=await fetch(provider,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${process.env.VOXEL_AI_API_KEY||''}`},body:JSON.stringify({userId:user.id,task,object,capabilities:['identify','research','provenance','3d','quantum','room']})});
  if(!r.ok)return NextResponse.json({error:'AI provider unavailable.'},{status:502});
  const data=await r.json();return NextResponse.json({mode:'live',answer:typeof data.answer==='string'?data.answer.slice(0,12000):'No answer returned.',object});
 }catch(error){console.error('object intelligence failed',error);return NextResponse.json({error:'Object intelligence failed.'},{status:500});}
}
