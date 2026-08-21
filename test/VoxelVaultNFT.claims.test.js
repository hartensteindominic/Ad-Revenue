const { expect } = require('chai');
const { ethers } = require('hardhat');

const TYPES = {
  ClaimVoucher: [
    { name: 'recipient', type: 'address' },
    { name: 'royaltyReceiver', type: 'address' },
    { name: 'dropId', type: 'bytes32' },
    { name: 'claimTicketHash', type: 'bytes32' },
    { name: 'uriHash', type: 'bytes32' },
    { name: 'royaltyBps', type: 'uint96' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

function hash(value) {
  return ethers.keccak256(ethers.toUtf8Bytes(value));
}

async function voucherFor({ recipient, royaltyReceiver, dropId, ticket, uri, royaltyBps = 500, nonce = 1, deadline }) {
  return {
    recipient,
    royaltyReceiver,
    dropId: hash(dropId),
    claimTicketHash: hash(ticket),
    uriHash: hash(uri),
    royaltyBps,
    nonce,
    deadline,
  };
}

describe('VoxelVaultNFT signed claims', function () {
  async function deploy() {
    const [owner, relayer, collector, creator] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory('VoxelVaultNFT');
    const nft = await NFT.deploy(owner.address);
    await nft.waitForDeployment();
    return { owner, relayer, collector, creator, nft };
  }

  async function signVoucher(nft, signer, voucher) {
    const network = await ethers.provider.getNetwork();
    const domain = {
      name: 'Voxel Vault Claims',
      version: '1',
      chainId: network.chainId,
      verifyingContract: await nft.getAddress(),
    };
    return signer.signTypedData(domain, TYPES, voucher);
  }

  it('disables public mint by default', async function () {
    const { nft } = await deploy();
    expect(await nft.publicMintEnabled()).to.equal(false);
  });

  it('redeems a valid voucher and binds it to the exact recipient and metadata', async function () {
    const { owner, relayer, collector, creator, nft } = await deploy();
    const uri = 'data:application/json;base64,dm94ZWw=';
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const voucher = await voucherFor({
      recipient: collector.address,
      royaltyReceiver: creator.address,
      dropId: 'drop-camera-001',
      ticket: 'vvclaim-001',
      uri,
      deadline,
    });
    const signature = await signVoucher(nft, owner, voucher);

    await expect(
      nft.connect(relayer).claim(
        voucher.recipient,
        voucher.royaltyReceiver,
        voucher.dropId,
        voucher.claimTicketHash,
        uri,
        voucher.royaltyBps,
        voucher.nonce,
        voucher.deadline,
        signature
      )
    ).to.emit(nft, 'ClaimVoucherConsumed');

    expect(await nft.ownerOf(1)).to.equal(collector.address);
    expect(await nft.usedClaimTickets(voucher.claimTicketHash)).to.equal(true);
    const royalty = await nft.royaltyInfo(1, ethers.parseEther('1'));
    expect(royalty[0]).to.equal(creator.address);
    expect(royalty[1]).to.equal(ethers.parseEther('0.05'));
  });

  it('rejects a replay of the same claim ticket', async function () {
    const { owner, relayer, collector, creator, nft } = await deploy();
    const uri = 'ipfs://voucher-replay';
    const voucher = await voucherFor({
      recipient: collector.address,
      royaltyReceiver: creator.address,
      dropId: 'drop-replay',
      ticket: 'ticket-replay',
      uri,
      deadline: Math.floor(Date.now() / 1000) + 600,
    });
    const signature = await signVoucher(nft, owner, voucher);

    await nft.connect(relayer).claim(
      voucher.recipient,
      voucher.royaltyReceiver,
      voucher.dropId,
      voucher.claimTicketHash,
      uri,
      voucher.royaltyBps,
      voucher.nonce,
      voucher.deadline,
      signature
    );

    await expect(
      nft.connect(relayer).claim(
        voucher.recipient,
        voucher.royaltyReceiver,
        voucher.dropId,
        voucher.claimTicketHash,
        uri,
        voucher.royaltyBps,
        voucher.nonce,
        voucher.deadline,
        signature
      )
    ).to.be.revertedWith('Claim ticket already used');
  });

  it('rejects tampering with recipient or metadata', async function () {
    const { owner, relayer, collector, creator, nft } = await deploy();
    const uri = 'ipfs://exact-uri';
    const voucher = await voucherFor({
      recipient: collector.address,
      royaltyReceiver: creator.address,
      dropId: 'drop-tamper',
      ticket: 'ticket-tamper',
      uri,
      deadline: Math.floor(Date.now() / 1000) + 600,
    });
    const signature = await signVoucher(nft, owner, voucher);

    await expect(
      nft.connect(relayer).claim(
        owner.address,
        voucher.royaltyReceiver,
        voucher.dropId,
        voucher.claimTicketHash,
        uri,
        voucher.royaltyBps,
        voucher.nonce,
        voucher.deadline,
        signature
      )
    ).to.be.revertedWith('Invalid claim signature');

    await expect(
      nft.connect(relayer).claim(
        voucher.recipient,
        voucher.royaltyReceiver,
        voucher.dropId,
        voucher.claimTicketHash,
        'ipfs://tampered',
        voucher.royaltyBps,
        voucher.nonce,
        voucher.deadline,
        signature
      )
    ).to.be.revertedWith('Invalid claim signature');
  });

  it('rejects expired vouchers', async function () {
    const { owner, relayer, collector, creator, nft } = await deploy();
    const uri = 'ipfs://expired';
    const voucher = await voucherFor({
      recipient: collector.address,
      royaltyReceiver: creator.address,
      dropId: 'drop-expired',
      ticket: 'ticket-expired',
      uri,
      deadline: Math.floor(Date.now() / 1000) - 1,
    });
    const signature = await signVoucher(nft, owner, voucher);

    await expect(
      nft.connect(relayer).claim(
        voucher.recipient,
        voucher.royaltyReceiver,
        voucher.dropId,
        voucher.claimTicketHash,
        uri,
        voucher.royaltyBps,
        voucher.nonce,
        voucher.deadline,
        signature
      )
    ).to.be.revertedWith('Claim voucher expired');
  });
});
