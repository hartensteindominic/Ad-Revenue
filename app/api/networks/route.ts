import { NextResponse } from 'next/server';
import { NETWORKS, enabledNetworks } from '../../../lib/networks';
export async function GET(){
 const configured=new Set(enabledNetworks().map(n=>n.id));
 return NextResponse.json({networks:NETWORKS.map(n=>({...n,configured:configured.has(n.id)}))});
}
