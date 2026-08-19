'use client';

import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import {
  buildMetadata,
  ensureSepolia,
  NFTVERSE_ABI,
  NFTVERSE_MINT_FEE_WEI,
  NFTVERSE_SEPOLIA_ADDRESS,
  SEPOLIA_CHAIN_ID
} from '@/lib/nftverse';

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function metadataDataUri(metadata) {
  return `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;
}

export default function WalletConnect() {
  const [account, setAccount] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [mintOpen, setMintOpen] = useState(false);
  const [name, setName] = useState('My Voxel Vault 3D NFT');
  const [description, setDescription] = useState('A 3D creation minted with Voxel Vault.');
  const [assetUrl, setAssetUrl] = useState('');
  const [minting, setMinting] = useState(false);

  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum) return;

    ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      setAccount(accounts?.[0] || '');
    }).catch(() => {});

    const handleAccountsChanged = (accounts) => setAccount(accounts?.[0] || '');
    ethereum.on?.('accountsChanged', handleAccountsChanged);
    return () => ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
  }, []);

  async function connect() {
    setNotice('');
    const ethereum = window.ethereum;

    if (!ethereum) {
      setNotice('Open VoxelVault inside MetaMask Mobile to connect your wallet.');
      return;
    }

    setBusy(true);
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts?.[0] || '');
    } catch (error) {
      if (error?.code === 4001) setNotice('Connection cancelled.');
      else setNotice(error?.message || 'Could not connect MetaMask.');
    } finally {
      setBusy(false);
    }
  }

  async function mintNFT() {
    setNotice('');
    const ethereum = window.ethereum;
    if (!ethereum) {
      setNotice('Open VoxelVault inside MetaMask Mobile to mint.');
      return;
    }
    if (!account) {
      await connect();
      return;
    }
    if (!name.trim() || !description.trim()) {
      setNotice('Enter an NFT name and description.');
      return;
    }

    setMinting(true);
    try {
      await ensureSepolia();
      const provider = new BrowserProvider(ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) throw new Error('Please switch MetaMask to Sepolia.');

      const signer = await provider.getSigner();
      const owner = await signer.getAddress();
      const contract = new Contract(NFTVERSE_SEPOLIA_ADDRESS, NFTVERSE_ABI, signer);
      const metadata = buildMetadata({
        name,
        description,
        category: '3D Art',
        price: '0',
        assetUrl,
        scene: { source: 'Voxel Vault', assetUrl: assetUrl.trim() || null }
      });
      const uri = metadataDataUri(metadata);
      const mintFee = await contract.mintFee().catch(() => BigInt(NFTVERSE_MINT_FEE_WEI));
      const tx = await contract.mint(owner, uri, { value: mintFee });
      setNotice(`Mint submitted: ${tx.hash}`);
      const receipt = await tx.wait();

      let tokenId = '';
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === 'NFTMinted') {
            tokenId = parsed.args.tokenId.toString();
            break;
          }
        } catch (_) {}
      }

      const explorer = `https://sepolia.etherscan.io/tx/${tx.hash}`;
      setNotice(`NFT #${tokenId || 'minted'} is live on Sepolia. ${explorer}`);
      setMintOpen(false);
    } catch (error) {
      if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') setNotice('Mint cancelled in wallet.');
      else setNotice(error?.shortMessage || error?.message || 'Mint failed.');
    } finally {
      setMinting(false);
    }
  }

  return (
    <div className="walletConnect">
      <div className="walletActions">
        {account && (
          <button className="mintButton" onClick={() => setMintOpen((value) => !value)} type="button">
            ✦ Mint 3D NFT
          </button>
        )}
        <button className="walletButton" onClick={connect} disabled={busy} type="button">
          <span className="foxDot">🦊</span>
          {busy ? 'Connecting…' : account ? shortAddress(account) : 'Connect MetaMask'}
        </button>
      </div>

      {mintOpen && account && (
        <div className="mintPanel">
          <strong>Mint on NFTVerse</strong>
          <small>Sepolia · 0.01 ETH + gas · {shortAddress(NFTVERSE_SEPOLIA_ADDRESS)}</small>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="NFT name" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} />
          <input value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} placeholder="Optional 3D asset URL (IPFS/HTTPS)" />
          <button className="mintConfirm" onClick={mintNFT} disabled={minting} type="button">
            {minting ? 'Minting…' : 'Mint with existing HyperStream 3D contract'}
          </button>
        </div>
      )}

      {notice && <span className="walletNotice">{notice}</span>}
      <style jsx>{`
        .walletConnect{position:fixed;top:88px;right:20px;z-index:50;display:flex;flex-direction:column;align-items:flex-end;gap:7px}
        .walletActions{display:flex;align-items:center;gap:7px}
        .walletButton,.mintButton,.mintConfirm{border:1px solid rgba(145,116,255,.55);background:rgba(12,13,22,.94);color:#fff;border-radius:999px;padding:11px 16px;cursor:pointer;font-weight:800;box-shadow:0 8px 30px rgba(0,0,0,.3);backdrop-filter:blur(14px)}
        .mintButton{border-color:rgba(61,214,169,.5);color:#b9ffe9}
        .walletButton:disabled,.mintButton:disabled,.mintConfirm:disabled{opacity:.65;cursor:wait}
        .foxDot{margin-right:7px}
        .mintPanel{width:min(340px,calc(100vw - 24px));padding:15px;border:1px solid #34384b;background:rgba(10,12,20,.97);border-radius:15px;box-shadow:0 18px 55px rgba(0,0,0,.45);display:flex;flex-direction:column;gap:9px}
        .mintPanel strong{font-size:14px}.mintPanel small{color:#8991a6;font-size:10px;line-height:1.4}.mintPanel input,.mintPanel textarea{width:100%;border:1px solid #292d3d;background:#070910;color:#fff;border-radius:9px;padding:10px;font:inherit;font-size:12px;outline:none}.mintPanel textarea{resize:vertical}.mintConfirm{border-radius:9px;background:#7e5cff;border-color:#8f75ff;padding:11px}
        .walletNotice{max-width:360px;padding:9px 12px;border:1px solid #34384b;background:#0c0e16;color:#aeb5c8;border-radius:10px;font-size:11px;line-height:1.4;text-align:right;overflow-wrap:anywhere}
        @media(max-width:600px){.walletConnect{top:82px;right:12px}.walletActions{max-width:calc(100vw - 24px)}.walletButton,.mintButton{font-size:11px;padding:10px 12px}.mintButton{display:none}}
      `}</style>
    </div>
  );
}
