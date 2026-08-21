import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export async function POST(req:Request){
 try{
  const supabase=getSupabaseAdmin();const auth=req.headers.get('authorization');const token=auth?.startsWith('Bearer ')?auth.slice(7):null;
  if(!token)return NextResponse.json({error:'Authentication required.'},{status:401});
  const {data:{user},error}=await supabase.auth.getUser(token);if(error||!user)return NextResponse.json({error:'Authentication required.'},{status:401});
  const body=await req.json();const objectId=typeof body?.objectId==='string'?body.objectId.trim():'';const source=typeof body?.source==='string'?body.source.trim():'';
  if(!objectId||objectId.length>128)return NextResponse.json({error:'Invalid object.'},{status:400});
  const {data:object}=await supabase.from('voxel_objects').select('id,voxel_id,status,nft_contract_address,nft_token_id,metadata_uri').eq('id',objectId).maybeSingle();
  if(!object)return NextResponse.json({error:'Object not found.'},{status:404});
  const {data:existing}=await supabase.from('room_objects').select('id').eq('user_id',user.id).eq('object_id',object.id).maybeSingle();
  if(existing)return NextResponse.json({roomObject:existing,alreadyAdded:true});
  const {data:roomObject,error:insertError}=await supabase.from('room_objects').insert({user_id:user.id,object_id:object.id,source:source.slice(0,40)||'vault'}).select('id,object_id,source,created_at').single();
  if(insertError)return NextResponse.json({error:'Room storage is not configured.'},{status:503});
  return NextResponse.json({roomObject});
 }catch{return NextResponse.json({error:'Unable to add object to room.'},{status:500});}
}
