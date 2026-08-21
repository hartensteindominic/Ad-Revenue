import { NextResponse } from 'next/server';

const MAX_QUERY=500;
const ALLOWED=new Set(['https:']);
const PRIVATE=/^(localhost|127(?:\.\d+){3}|0\.0\.0\.0|::1|10(?:\.\d+){3}|192\.168(?:\.\d+){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d+){2})$/;

export async function POST(req:Request){
 try{
  const body=await req.json(); const query=typeof body?.query==='string'?body.query.trim():''; const source=typeof body?.url==='string'?body.url.trim():'';
  if(!query||query.length>MAX_QUERY)return NextResponse.json({error:'Enter a short research query.'},{status:400});
  if(!source)return NextResponse.json({mode:'research-ready',query,sources:[],message:'Connect an approved search provider to enable live web research.'});
  const url=new URL(source); if(!ALLOWED.has(url.protocol)||PRIVATE.test(url.hostname)||url.username||url.password)return NextResponse.json({error:'Source URL is not allowed.'},{status:400});
  const response=await fetch(url,{headers:{accept:'text/html,application/json;q=0.9,text/plain;q=0.8'},signal:AbortSignal.timeout(7000),redirect:'error'});
  if(!response.ok)return NextResponse.json({error:'Source unavailable.'},{status:502});
  const type=response.headers.get('content-type')||''; if(!/text\/|json/.test(type))return NextResponse.json({error:'Unsupported source type.'},{status:415});
  const text=(await response.text()).slice(0,120000);
  return NextResponse.json({mode:'source',query,url:source,content:text});
 }catch{return NextResponse.json({error:'Research request failed.'},{status:502})}
}
