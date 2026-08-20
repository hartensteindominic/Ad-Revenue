// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Royalty} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract VoxelVaultNFT is ERC721, ERC721URIStorage, ERC721Royalty, Ownable {
    uint256 private _nextTokenId = 1;
    uint96 public constant MAX_ROYALTY_BPS = 1500;
    mapping(address => bool) public minters;

    /// @notice Public mint is disabled by default. Explicitly enable it only for controlled testnet/demo deployments.
    bool public publicMintEnabled = false;

    event VoxelMinted(uint256 indexed tokenId, address indexed creator, string tokenURI, uint96 royaltyBps);
    event MinterUpdated(address indexed account, bool allowed);
    event PublicMintEnabledUpdated(bool enabled);

    constructor(address initialOwner) ERC721("Voxel Vault", "VOXEL") Ownable(initialOwner) {}

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
