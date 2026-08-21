import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export async function POST(req:Request){
 try{
  const supabase=getSupabaseAdmin(); const auth=req.headers.get('authorization'); const token=auth?.startsWith('Bearer ')?auth.slice(7):null;
  if(!token)return NextResponse.json({error:'Authentication required.'},{status:401});
  const {data:{user},error}=await supabase.auth.getUser(token); if(error||!user)return NextResponse.json({error:'Authentication required.'},{status:401});
  const body=await req.json(); const name=typeof body?.name==='string'?body.name.trim():''; const qubits=Number(body?.qubits); const operations=Array.isArray(body?.operations)?body.operations:[]; const results=Array.isArray(body?.results)?body.results:[];
  if(!name||name.length>120||!Number.isInteger(qubits)||qubits<1||qubits>8||operations.length>128)return NextResponse.json({error:'Invalid experiment.'},{status:400});
  const {data,error:insertError}=await supabase.from('quantum_experiments').insert({user_id:user.id,name,qubits,operations,results,simulator:'classical-state-vector'}).select('id,name,qubits,created_at').single();
  if(insertError)return NextResponse.json({error:'Quantum experiment storage is not configured.'},{status:503});
  return NextResponse.json({experiment:data});
 }catch{return NextResponse.json({error:'Unable to save experiment.'},{status:500})}
}
