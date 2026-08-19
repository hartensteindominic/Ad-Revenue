// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {VoxelVaultNFT} from "./VoxelVaultNFT.sol";

contract VoxelVaultMarketplace is ReentrancyGuard, Ownable {
    uint96 public constant MAX_FEE_BPS = 1000;
    uint96 public feeBps = 250;
    VoxelVaultNFT public immutable nft;

    struct Listing { address seller; uint256 price; }
    struct Offer { address buyer; uint256 amount; uint256 expiresAt; }
    struct Auction { address seller; uint256 reservePrice; uint256 endAt; address highestBidder; uint256 highestBid; bool settled; }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer) public offers;
    mapping(uint256 => Auction) public auctions;
    mapping(address => uint256) public pendingWithdrawals;

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Delisted(uint256 indexed tokenId, address indexed seller);
    event Sale(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 royalty, uint256 fee);
    event OfferMade(uint256 indexed tokenId, address indexed buyer, uint256 amount, uint256 expiresAt);
    event OfferCancelled(uint256 indexed tokenId, address indexed buyer);
    event OfferAccepted(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event AuctionStarted(uint256 indexed tokenId, address indexed seller, uint256 reservePrice, uint256 endAt);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionSettled(uint256 indexed tokenId, address indexed winner, uint256 amount);
    event FeeUpdated(uint96 feeBps);

    constructor(address initialOwner, address nftAddress) Ownable(initialOwner) {
        require(nftAddress != address(0), "NFT required");
        nft = VoxelVaultNFT(nftAddress);
    }

    function setFeeBps(uint96 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    function mintAndList(string calldata uri, uint96 royaltyBps, uint256 price) external nonReentrant returns (uint256 tokenId) {
        require(price > 0, "Price required");
        tokenId = nft.mintTo(address(this), msg.sender, uri, royaltyBps);
        listings[tokenId] = Listing(msg.sender, price);
        emit Listed(tokenId, msg.sender, price);
    }

    function list(uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price required");
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        nft.transferFrom(msg.sender, address(this), tokenId);
        listings[tokenId] = Listing(msg.sender, price);
        emit Listed(tokenId, msg.sender, price);
    }

    function delist(uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.seller == msg.sender, "Not seller");
        delete listings[tokenId];
        nft.safeTransferFrom(address(this), msg.sender, tokenId);
        emit Delisted(tokenId, msg.sender);
    }

    function buy(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.price > 0, "Not listed");
        require(msg.value == listing.price, "Wrong payment");
        delete listings[tokenId];
        (uint256 royalty, uint256 fee) = _distribute(tokenId, msg.value, listing.seller);
        nft.safeTransferFrom(address(this), msg.sender, tokenId);
        emit Sale(tokenId, listing.seller, msg.sender, msg.value, royalty, fee);
    }

    function makeOffer(uint256 tokenId, uint256 expiresAt) external payable nonReentrant {
        require(msg.value > 0, "Offer required");
        require(expiresAt > block.timestamp, "Expiry required");
        Offer memory old = offers[tokenId];
        if (old.buyer != address(0)) pendingWithdrawals[old.buyer] += old.amount;
        offers[tokenId] = Offer(msg.sender, msg.value, expiresAt);
        emit OfferMade(tokenId, msg.sender, msg.value, expiresAt);
    }

    function cancelOffer(uint256 tokenId) external nonReentrant {
        Offer memory offer = offers[tokenId];
        require(offer.buyer == msg.sender, "Not buyer");
        delete offers[tokenId];
        pendingWithdrawals[msg.sender] += offer.amount;
        emit OfferCancelled(tokenId, msg.sender);
    }

    function acceptOffer(uint256 tokenId) external nonReentrant {
        Offer memory offer = offers[tokenId];
        require(offer.buyer != address(0), "No offer");
        require(offer.expiresAt >= block.timestamp, "Offer expired");
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        delete offers[tokenId];
        nft.transferFrom(msg.sender, address(this), tokenId);
        (uint256 royalty, uint256 fee) = _distribute(tokenId, offer.amount, msg.sender);
        nft.safeTransferFrom(address(this), offer.buyer, tokenId);
        emit OfferAccepted(tokenId, offer.buyer, offer.amount);
        royalty; fee;
    }

    function startAuction(uint256 tokenId, uint256 reservePrice, uint256 durationSeconds) external nonReentrant {
        require(reservePrice > 0 && durationSeconds >= 5 minutes, "Invalid auction");
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        require(auctions[tokenId].seller == address(0), "Auction exists");
        nft.transferFrom(msg.sender, address(this), tokenId);
        auctions[tokenId] = Auction(msg.sender, reservePrice, block.timestamp + durationSeconds, address(0), 0, false);
        emit AuctionStarted(tokenId, msg.sender, reservePrice, block.timestamp + durationSeconds);
    }

    function bid(uint256 tokenId) external payable nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.seller != address(0) && !auction.settled, "No auction");
        require(block.timestamp < auction.endAt, "Auction ended");
        require(msg.value >= auction.reservePrice && msg.value > auction.highestBid, "Bid too low");
        if (auction.highestBidder != address(0)) pendingWithdrawals[auction.highestBidder] += auction.highestBid;
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    function settleAuction(uint256 tokenId) external nonReentrant {
        Auction memory auction = auctions[tokenId];
        require(auction.seller != address(0) && !auction.settled, "No auction");
        require(block.timestamp >= auction.endAt, "Auction active");
        auctions[tokenId].settled = true;
        if (auction.highestBidder == address(0)) {
            nft.safeTransferFrom(address(this), auction.seller, tokenId);
            emit AuctionSettled(tokenId, address(0), 0);
            return;
        }
        (uint256 royalty, uint256 fee) = _distribute(tokenId, auction.highestBid, auction.seller);
        nft.safeTransferFrom(address(this), auction.highestBidder, tokenId);
        emit AuctionSettled(tokenId, auction.highestBidder, auction.highestBid);
        royalty; fee;
    }

    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "Withdraw failed");
    }

    function _distribute(uint256 tokenId, uint256 salePrice, address seller) internal returns (uint256 royalty, uint256 fee) {
        fee = salePrice * feeBps / 10000;
        (address receiver, uint256 royaltyAmount) = IERC2981(address(nft)).royaltyInfo(tokenId, salePrice);
        royalty = royaltyAmount;
        if (royalty > salePrice - fee) royalty = salePrice - fee;
        if (receiver != address(0) && royalty > 0) pendingWithdrawals[receiver] += royalty;
        if (fee > 0) pendingWithdrawals[owner()] += fee;
        pendingWithdrawals[seller] += salePrice - royalty - fee;
    }

    receive() external payable { revert("Use marketplace functions"); }
}
