// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Royalty} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

contract VoxelVaultNFT is ERC721, ERC721URIStorage, ERC721Royalty, EIP712, Ownable {
    uint256 private _nextTokenId = 1;
    uint96 public constant MAX_ROYALTY_BPS = 1500;
    mapping(address => bool) public minters;

    /// @notice Public mint is disabled by default. Explicitly enable only for controlled demos/tests.
    bool public publicMintEnabled = false;

    /// @notice Signer authorized to issue server-backed claim vouchers.
    /// Supports EOAs and ERC-1271 smart-contract wallets such as Safe.
    address public claimSigner;

    mapping(bytes32 => bool) public usedClaimTickets;

    bytes32 public constant CLAIM_VOUCHER_TYPEHASH = keccak256(
        "ClaimVoucher(address recipient,address royaltyReceiver,bytes32 dropId,bytes32 claimTicketHash,bytes32 uriHash,uint96 royaltyBps,uint256 nonce,uint256 deadline)"
    );

    event VoxelMinted(uint256 indexed tokenId, address indexed creator, string tokenURI, uint96 royaltyBps);
    event MinterUpdated(address indexed account, bool allowed);
    event PublicMintEnabledUpdated(bool enabled);
    event ClaimSignerUpdated(address indexed signer);
    event ClaimVoucherConsumed(bytes32 indexed claimTicketHash, bytes32 indexed dropId, address indexed recipient, uint256 tokenId, uint256 nonce);

    constructor(address initialOwner)
        ERC721("Voxel Vault", "VOXEL")
        EIP712("Voxel Vault Claims", "1")
        Ownable(initialOwner)
    {
        require(initialOwner != address(0), "Owner required");
        claimSigner = initialOwner;
    }

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    function setMinter(address account, bool allowed) external onlyOwner {
        require(account != address(0), "Invalid minter");
        minters[account] = allowed;
        emit MinterUpdated(account, allowed);
    }

    function setPublicMintEnabled(bool enabled) external onlyOwner {
        publicMintEnabled = enabled;
        emit PublicMintEnabledUpdated(enabled);
    }

    function setClaimSigner(address signer) external onlyOwner {
        require(signer != address(0), "Invalid claim signer");
        claimSigner = signer;
        emit ClaimSignerUpdated(signer);
    }

    function mint(string calldata uri, uint96 royaltyBps) external returns (uint256 tokenId) {
        require(publicMintEnabled, "Public mint disabled");
        return _mintTo(msg.sender, msg.sender, uri, royaltyBps);
    }

    function mintTo(address recipient, address royaltyReceiver, string calldata uri, uint96 royaltyBps)
        external
        onlyMinter
        returns (uint256 tokenId)
    {
        return _mintTo(recipient, royaltyReceiver, uri, royaltyBps);
    }

    /// @notice Redeem a server-issued, EIP-712 signed claim voucher.
    /// The signature binds the recipient, drop, one-time ticket, exact metadata URI,
    /// royalty receiver, nonce and deadline. Anyone may relay the transaction.
    function claim(
        address recipient,
        address royaltyReceiver,
        bytes32 dropId,
        bytes32 claimTicketHash,
        string calldata uri,
        uint96 royaltyBps,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external returns (uint256 tokenId) {
        require(block.timestamp <= deadline, "Claim voucher expired");
        require(recipient != address(0), "Recipient required");
        require(royaltyReceiver != address(0), "Royalty receiver required");
        require(!usedClaimTickets[claimTicketHash], "Claim ticket already used");
        require(keccak256(bytes(uri)) != bytes32(0), "Metadata URI required");
        require(keccak256(bytes(uri)) == keccak256(abi.encodePacked(uri)), "Invalid metadata URI");

        bytes32 uriHash = keccak256(bytes(uri));
        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_VOUCHER_TYPEHASH,
                recipient,
                royaltyReceiver,
                dropId,
                claimTicketHash,
                uriHash,
                royaltyBps,
                nonce,
                deadline
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        require(SignatureChecker.isValidSignatureNow(claimSigner, digest, signature), "Invalid claim signature");

        usedClaimTickets[claimTicketHash] = true;
        tokenId = _mintTo(recipient, royaltyReceiver, uri, royaltyBps);
        emit ClaimVoucherConsumed(claimTicketHash, dropId, recipient, tokenId, nonce);
    }

    function _mintTo(address recipient, address royaltyReceiver, string calldata uri, uint96 royaltyBps)
        internal
        returns (uint256 tokenId)
    {
        require(recipient != address(0), "Recipient required");
        require(royaltyReceiver != address(0), "Royalty receiver required");
        require(bytes(uri).length > 0, "Token URI required");
        require(royaltyBps <= MAX_ROYALTY_BPS, "Royalty too high");

        tokenId = _nextTokenId++;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);
        _setTokenRoyalty(tokenId, royaltyReceiver, royaltyBps);
        emit VoxelMinted(tokenId, royaltyReceiver, uri, royaltyBps);
    }

    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        _burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage, ERC721Royalty) {
        super._burn(tokenId);
    }
}
