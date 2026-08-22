import { NextResponse } from 'next/server';
import { JsonRpcProvider, Contract, verifyMessage } from 'ethers';
import { createDrop } from '../../../../lib/dropEngine';
import { upsertDrop } from '../../../../lib/claimAuthority';

const ABI=['function ownerOf(uint256 tokenId) view returns (address)','function tokenURI(uint256 tokenId) view returns (string)'];
const MAX_AGE_MS=5*60*1000;
function uri(value){if(!value)return '';if(value.startsWith('ipfs://'))return `https://ipfs.io/ipfs/${value.slice(7)}`;if(value.startsWith('ar://'))return `https://arweave.net/${value.slice(5)}`;return value;}
export async function POST(request:Request){
 try{
  const body=await request.json();const address=typeof body.address==='string'?body.address.trim():'';const signature=typeof body.signature==='string'?body.signature:'';const tokenId=typeof body.tokenId==='string'?body.tokenId.trim():String(body.tokenId??'');const lat=Number(body.lat);const lng=Number(body.lng);const createdAt=Number(body.createdAt);
  if(!address||!signature||!tokenId||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180||!Number.isFinite(createdAt)||Math.abs(Date.now()-createdAt)>MAX_AGE_MS)return NextResponse.json({error:'Invalid or expired drop request.'},{status:400});
  const message=`Voxel Vault public drop\nContract: ${process.env.NEXT_PUBLIC_VOXEL_NFT_ADDRESS||''}\nToken: ${tokenId}\nLocation: ${lat.toFixed(6)},${lng.toFixed(6)}\nTimestamp: ${createdAt}`;
  const recovered=verifyMessage(message,signature);if(recovered.toLowerCase()!==address.toLowerCase())return NextResponse.json({error:'Wallet signature does not match the address.'},{status:401});
  const contractAddress=process.env.NEXT_PUBLIC_VOXEL_NFT_ADDRESS||'';const rpc=process.env.NEXT_PUBLIC_EVM_RPC_URL||process.env.EVM_RPC_URL||'';if(!contractAddress||!rpc)return NextResponse.json({error:'On-chain drop verification is not configured.'},{status:503});
  const provider=new JsonRpcProvider(rpc);const nft=new Contract(contractAddress,ABI,provider);const owner=await nft.ownerOf(tokenId);if(owner.toLowerCase()!==address.toLowerCase())return NextResponse.json({error:'You do not own this NFT on-chain.'},{status:403});
  let tokenUri='';try{tokenUri=await nft.tokenURI(tokenId)}catch{}
  const id=`nft-drop-${tokenId}-${Math.round(lat*1000)}-${Math.round(lng*1000)}`.slice(0,120);
  const drop=createDrop({id,name:`NFT #${tokenId} drop`,status:'active',quantity:1,publicZoneId:'public-map',radiusMeters:100,startAt:new Date().toISOString(),endAt:new Date(Date.now()+30*86400000).toISOString(),requiresWallet:true,maxClaimsPerWallet:1});
  const saved=await upsertDrop({...drop,lat,lng,owner:address.toLowerCase(),nftContract:contractAddress,nftTokenId:String(tokenId),tokenUri,collectible:{id:`nft-${tokenId}`,name:`Voxel NFT #${tokenId}`,family:'nft',subtype:'owned-object',rarity:'verified',verified:true,contract:contractAddress,tokenId:String(tokenId),owner:address.toLowerCase(),assetUrl:uri(tokenUri),realityBasis:{source:'on-chain NFT',verified:true}} ,claimedCount:0});
  return NextResponse.json({drop:saved});
 }catch(error){console.error('place NFT drop failed',error);return NextResponse.json({error:error?.message||'Unable to place NFT drop.'},{status:500});}
}
