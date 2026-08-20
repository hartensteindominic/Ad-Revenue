import { BrowserProvider, Contract, parseEther } from 'ethers';

export const SEPOLIA_CHAIN_ID = '0xaa36a7';
export const SEPOLIA_CHAIN_ID_DECIMAL = 11155111n;
export const NFT_ADDRESS = process.env.NEXT_PUBLIC_VOXEL_NFT_ADDRESS || '';
export const MARKET_ADDRESS = process.env.NEXT_PUBLIC_VOXEL_MARKET_ADDRESS || '';

export const NFT_ABI = ['function mint(string uri,uint96 royaltyBps) returns (uint256)','function ownerOf(uint256 tokenId) view returns (address)','function tokenURI(uint256 tokenId) view returns (string)','function approve(address to,uint256 tokenId)','function setApprovalForAll(address operator,bool approved)','function balanceOf(address owner) view returns (uint256)'];
export const MARKET_ABI = ['function mintAndList(string uri,uint96 royaltyBps,uint256 price) returns (uint256)','function list(uint256 tokenId,uint256 price)','function buy(uint256 tokenId) payable','function delist(uint256 tokenId)','function makeOffer(uint256 tokenId,uint256 expiresAt) payable','function cancelOffer(uint256 tokenId)','function refundExpiredOffer(uint256 tokenId)','function acceptOffer(uint256 tokenId)','function startAuction(uint256 tokenId,uint256 reservePrice,uint256 durationSeconds)','function bid(uint256 tokenId) payable','function settleAuction(uint256 tokenId)','function withdraw()','function listings(uint256 tokenId) view returns (address seller,uint256 price)','function offers(uint256 tokenId) view returns (address buyer,uint256 amount,uint256 expiresAt)','function auctions(uint256 tokenId) view returns (address seller,uint256 reservePrice,uint256 endAt,address highestBidder,uint256 highestBid,bool settled)'];

export function hasContracts(){return Boolean(NFT_ADDRESS&&MARKET_ADDRESS);}

export async function getWallet(){
 if(typeof window==='undefined'||!window.ethereum) throw new Error('MetaMask is not installed. Open Voxel Vault in MetaMask Mobile or install MetaMask.');
 const provider=new BrowserProvider(window.ethereum);
 let network=await provider.getNetwork();
 if(network.chainId!==SEPOLIA_CHAIN_ID_DECIMAL){
  try{await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:SEPOLIA_CHAIN_ID}]});}
  catch(error){
   if(error?.code===4902) await window.ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:SEPOLIA_CHAIN_ID,chainName:'Sepolia',nativeCurrency:{name:'Sepolia Ether',symbol:'ETH',decimals:18},rpcUrls:['https://rpc.sepolia.org'],blockExplorerUrls:['https://sepolia.etherscan.io']}]});
   else throw error;
  }
  network=await provider.getNetwork();
  if(network.chainId!==SEPOLIA_CHAIN_ID_DECIMAL) throw new Error('Please switch MetaMask to Ethereum Sepolia.');
 }
 const accounts=await provider.send('eth_requestAccounts',[]);
 if(!accounts?.length) throw new Error('Wallet connection was cancelled.');
 const signer=await provider.getSigner(accounts[0]);
 return {provider,signer,address:await signer.getAddress()};
}

export async function getWalletStatus(){
 if(typeof window==='undefined'||!window.ethereum)return{installed:false,connected:false,networkOk:false};
 const provider=new BrowserProvider(window.ethereum); const accounts=await provider.send('eth_accounts',[]); const network=await provider.getNetwork();
 return{installed:true,connected:accounts.length>0,address:accounts[0]||'',networkOk:network.chainId===SEPOLIA_CHAIN_ID_DECIMAL,chainId:network.chainId};
}

export async function mintAndList({uri,royaltyPercent,priceEth}){if(!hasContracts())throw new Error('Voxel Vault Ethereum contracts are not configured in Vercel.');const{signer}=await getWallet();const market=new Contract(MARKET_ADDRESS,MARKET_ABI,signer);const tx=await market.mintAndList(uri,Math.round(Number(royaltyPercent)*100),parseEther(priceEth));return tx.wait();}
export async function buyAsset(tokenId,priceEth){if(!MARKET_ADDRESS)throw new Error('Marketplace contract is not configured.');const{signer}=await getWallet();const market=new Contract(MARKET_ADDRESS,MARKET_ABI,signer);const tx=await market.buy(tokenId,{value:parseEther(priceEth)});return tx.wait();}
export async function makeOffer(tokenId,amountEth,durationHours=24){if(!MARKET_ADDRESS)throw new Error('Marketplace contract is not configured.');const{signer}=await getWallet();const market=new Contract(MARKET_ADDRESS,MARKET_ABI,signer);const expires=Math.floor(Date.now()/1000)+Math.max(1,Number(durationHours))*3600;const tx=await market.makeOffer(tokenId,expires,{value:parseEther(amountEth)});return tx.wait();}
export async function bidOnAuction(tokenId,amountEth){if(!MARKET_ADDRESS)throw new Error('Marketplace contract is not configured.');const{signer}=await getWallet();const market=new Contract(MARKET_ADDRESS,MARKET_ABI,signer);const tx=await market.bid(tokenId,{value:parseEther(amountEth)});return tx.wait();}
export async function startAuction(tokenId,reserveEth,durationSeconds=86400){if(!MARKET_ADDRESS)throw new Error('Marketplace contract is not configured.');const{signer}=await getWallet();const market=new Contract(MARKET_ADDRESS,MARKET_ABI,signer);const tx=await market.startAuction(tokenId,parseEther(reserveEth),durationSeconds);return tx.wait();}
export async function settleAuction(tokenId){if(!MARKET_ADDRESS)throw new Error('Marketplace contract is not configured.');const{signer}=await getWallet();const market=new Contract(MARKET_ADDRESS,MARKET_ABI,signer);const tx=await market.settleAuction(tokenId);return tx.wait();}
export async function withdrawFunds(){if(!MARKET_ADDRESS)throw new Error('Marketplace contract is not configured.');const{signer}=await getWallet();const market=new Contract(MARKET_ADDRESS,MARKET_ABI,signer);const tx=await market.withdraw();return tx.wait();}
export async function getListing(tokenId){if(!MARKET_ADDRESS) return null; const provider=new BrowserProvider(window.ethereum); const market=new Contract(MARKET_ADDRESS,MARKET_ABI,provider); const x=await market.listings(tokenId); return {seller:x[0],price:x[1]};}
export async function getOffer(tokenId){if(!MARKET_ADDRESS) return null; const provider=new BrowserProvider(window.ethereum); const market=new Contract(MARKET_ADDRESS,MARKET_ABI,provider); const x=await market.offers(tokenId); return {buyer:x[0],amount:x[1],expiresAt:Number(x[2])};}
export async function getAuction(tokenId){if(!MARKET_ADDRESS) return null; const provider=new BrowserProvider(window.ethereum); const market=new Contract(MARKET_ADDRESS,MARKET_ABI,provider); const x=await market.auctions(tokenId); return {seller:x[0],reservePrice:x[1],endAt:Number(x[2]),highestBidder:x[3],highestBid:x[4],settled:x[5]};}
