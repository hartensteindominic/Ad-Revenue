export function getInjectedEthereum(){
  if(typeof window==='undefined') return null;
  const providers=window.ethereum?.providers;
  if(Array.isArray(providers)) return providers.find(p=>p?.isMetaMask)||providers[0]||null;
  return window.ethereum||null;
}

export function getMetaMaskMobileLink(){
  if(typeof window==='undefined') return '';
  const url=window.location.href;
  return `https://metamask.app.link/dapp/${url.replace(/^https?:\/\//,'')}`;
}

export async function connectMetaMask(){
  const ethereum=getInjectedEthereum();
  if(!ethereum) return {ok:false,reason:'mobile',url:getMetaMaskMobileLink()};
  const accounts=await ethereum.request({method:'eth_requestAccounts'});
  const address=accounts?.[0]||'';
  let chainId='';
  try{chainId=await ethereum.request({method:'eth_chainId'});}catch{}
  return {ok:Boolean(address),address,chainId,ethereum};
}
