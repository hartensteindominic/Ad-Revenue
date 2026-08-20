// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Sponsor-funded collectible ads. The ad is the collectible, but sponsorship is explicit.
/// @dev Sponsor funds are escrowed per campaign. Claims are wallet-authorized and chain-authoritative.
contract VoxelVaultSponsoredCollectible is ERC721, ERC721URIStorage, Ownable, Pausable, ReentrancyGuard {
    uint256 public constant BPS = 10_000;
    uint256 public constant MAX_EDITIONS = 100_000;
    uint256 public constant MAX_RESERVATIONS_PER_WALLET = 10;
    uint256 public constant RESERVATION_DURATION = 10 minutes;
    uint256 public constant MAX_DISCLOSURE_BYTES = 2_000;

    struct Campaign {
        address sponsor;
        address creator;
        uint256 fundedWei;
        uint256 remainingWei;
        uint256 perEditionWei;
        uint256 editionsTotal;
        uint256 editionsMinted;
        uint256 editionsReserved;
        uint256 startTime;
        uint256 endTime;
        uint256 creatorBps;
        uint256 collectorRewardsBps;
        uint256 platformBps;
        uint256 reserveBps;
        bool active;
    }

    struct Reservation {
        address wallet;
        uint256 quantity;
        uint256 expiry;
    }

    uint256 private _nextTokenId = 1;
    uint256 public nextCampaignId = 1;
    string public baseTokenURI;
    address payable public platformWallet;
    address payable public reserveWallet;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(bytes32 => Reservation)) public reservations;
    mapping(uint256 => mapping(address => uint256)) public walletReservationCount;
    mapping(uint256 => bytes32) public campaignPolicyHash;
    mapping(uint256 => string) public campaignDisclosure;
    mapping(uint256 => uint256) public tokenCampaign;
    mapping(uint256 => address) public tokenSponsor;
    mapping(uint256 => string) public tokenDisclosure;

    event CampaignCreated(uint256 indexed campaignId, address indexed sponsor, uint256 editions, uint256 fundedWei);
    event CampaignActivated(uint256 indexed campaignId);
    event CampaignPaused(uint256 indexed campaignId);
    event ReservationMade(uint256 indexed campaignId, bytes32 indexed nonce, address indexed wallet, uint256 quantity, uint256 expiry);
    event ReservationExpired(uint256 indexed campaignId, bytes32 indexed nonce);
    event SponsoredCollectibleMinted(uint256 indexed tokenId, uint256 indexed campaignId, address indexed collector, uint256 rewardWei);
    event CampaignCompleted(uint256 indexed campaignId);
    event CampaignSurplusWithdrawn(uint256 indexed campaignId, address indexed sponsor, uint256 amountWei);

    modifier campaignExists(uint256 campaignId) {
        require(campaigns[campaignId].sponsor != address(0), "Campaign not found");
        _;
    }

    modifier onlyCampaignSponsor(uint256 campaignId) {
        require(campaigns[campaignId].sponsor == msg.sender, "Not campaign sponsor");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_,
        address payable platformWallet_,
        address payable reserveWallet_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        require(platformWallet_ != address(0), "Invalid platform wallet");
        require(reserveWallet_ != address(0), "Invalid reserve wallet");
        baseTokenURI = baseTokenURI_;
        platformWallet = platformWallet_;
        reserveWallet = reserveWallet_;
    }

    function createCampaign(
        address creator,
        uint256 editions,
        uint256 startTime,
        uint256 endTime,
        uint256 creatorBps,
        uint256 collectorRewardsBps,
        uint256 platformBps,
        uint256 reserveBps,
        string calldata disclosure,
        bytes32 policyHash
    ) external payable whenNotPaused returns (uint256 campaignId) {
        require(creator != address(0), "Invalid creator");
        require(editions > 0 && editions <= MAX_EDITIONS, "Invalid edition count");
        require(startTime >= block.timestamp && startTime < endTime, "Invalid timeline");
        require(creatorBps + collectorRewardsBps + platformBps + reserveBps == BPS, "Splits must total 10000");
        require(msg.value >= editions, "Campaign must be funded");
        require(bytes(disclosure).length > 0 && bytes(disclosure).length <= MAX_DISCLOSURE_BYTES, "Disclosure required");

        uint256 perEdition = msg.value / editions;
        require(perEdition > 0, "Budget per edition too small");

        campaignId = nextCampaignId++;
        campaigns[campaignId] = Campaign({
            sponsor: msg.sender,
            creator: creator,
            fundedWei: msg.value,
            remainingWei: msg.value,
            perEditionWei: perEdition,
            editionsTotal: editions,
            editionsMinted: 0,
            editionsReserved: 0,
            startTime: startTime,
            endTime: endTime,
            creatorBps: creatorBps,
            collectorRewardsBps: collectorRewardsBps,
            platformBps: platformBps,
            reserveBps: reserveBps,
            active: false
        });
        campaignPolicyHash[campaignId] = policyHash;
        campaignDisclosure[campaignId] = disclosure;

        emit CampaignCreated(campaignId, msg.sender, editions, msg.value);
    }

    function activateCampaign(uint256 campaignId) external onlyOwner campaignExists(campaignId) {
        Campaign storage c = campaigns[campaignId];
        require(!c.active, "Already active");
        require(block.timestamp < c.endTime, "Campaign ended");
        c.active = true;
        emit CampaignActivated(campaignId);
    }

    function pauseCampaign(uint256 campaignId) external onlyOwner campaignExists(campaignId) {
        campaigns[campaignId].active = false;
        emit CampaignPaused(campaignId);
    }

    function reserve(uint256 campaignId, bytes32 nonce, uint256 quantity)
        external
        whenNotPaused
        campaignExists(campaignId)
    {
        Campaign storage c = campaigns[campaignId];
        require(c.active, "Campaign inactive");
        require(block.timestamp >= c.startTime && block.timestamp <= c.endTime, "Campaign not live");
        require(quantity == 1, "One collectible per reservation");
        require(c.editionsMinted + c.editionsReserved < c.editionsTotal, "Sold out");
        require(reservations[campaignId][nonce].wallet == address(0), "Nonce already used");
        require(walletReservationCount[campaignId][msg.sender] < MAX_RESERVATIONS_PER_WALLET, "Wallet reservation limit");

        uint256 expiry = block.timestamp + RESERVATION_DURATION;
        reservations[campaignId][nonce] = Reservation(msg.sender, 1, expiry);
        walletReservationCount[campaignId][msg.sender] += 1;
        c.editionsReserved += 1;

        emit ReservationMade(campaignId, nonce, msg.sender, 1, expiry);
    }

    function expireReservation(uint256 campaignId, bytes32 nonce) external campaignExists(campaignId) {
        Reservation memory r = reservations[campaignId][nonce];
        require(r.wallet != address(0), "Reservation not found");
        require(block.timestamp > r.expiry || msg.sender == r.wallet || msg.sender == owner(), "Reservation still valid");
        _removeReservation(campaignId, nonce);
        emit ReservationExpired(campaignId, nonce);
    }

    function mintSponsored(
        uint256 campaignId,
        bytes32 reservationNonce,
        string calldata metadataURI
    ) external nonReentrant whenNotPaused campaignExists(campaignId) {
        Campaign storage c = campaigns[campaignId];
        require(c.active, "Campaign inactive");
        require(block.timestamp >= c.startTime && block.timestamp <= c.endTime, "Campaign not live");
        require(bytes(metadataURI).length > 0, "Metadata URI required");

        Reservation memory r = reservations[campaignId][reservationNonce];
        require(r.wallet == msg.sender, "Reservation not owned");
        require(block.timestamp <= r.expiry, "Reservation expired");

        _removeReservation(campaignId, reservationNonce);
        require(c.remainingWei >= c.perEditionWei, "Campaign budget exhausted");

        uint256 unitBudget = c.perEditionWei;
        uint256 creatorAmount = (unitBudget * c.creatorBps) / BPS;
        uint256 collectorReward = (unitBudget * c.collectorRewardsBps) / BPS;
        uint256 platformAmount = (unitBudget * c.platformBps) / BPS;
        uint256 reserveAmount = unitBudget - creatorAmount - collectorReward - platformAmount;

        c.remainingWei -= unitBudget;
        c.editionsMinted += 1;

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);
        tokenCampaign[tokenId] = campaignId;
        tokenSponsor[tokenId] = c.sponsor;
        tokenDisclosure[tokenId] = campaignDisclosure[campaignId];

        _pay(c.creator, creatorAmount);
        _pay(payable(msg.sender), collectorReward);
        _pay(platformWallet, platformAmount);
        _pay(reserveWallet, reserveAmount);

        emit SponsoredCollectibleMinted(tokenId, campaignId, msg.sender, collectorReward);

        if (c.editionsMinted == c.editionsTotal) {
            c.active = false;
            emit CampaignCompleted(campaignId);
        }
    }

    function withdrawCampaignSurplus(uint256 campaignId)
        external
        nonReentrant
        campaignExists(campaignId)
        onlyCampaignSponsor(campaignId)
    {
        Campaign storage c = campaigns[campaignId];
        require(!c.active || block.timestamp > c.endTime || c.editionsMinted == c.editionsTotal, "Campaign still active");
        require(c.editionsReserved == 0, "Reservations outstanding");

        uint256 amount = c.remainingWei;
        c.remainingWei = 0;
        require(amount > 0, "No surplus");
        _pay(payable(msg.sender), amount);
        emit CampaignSurplusWithdrawn(campaignId, msg.sender, amount);
    }

    function _removeReservation(uint256 campaignId, bytes32 nonce) internal {
        Reservation memory r = reservations[campaignId][nonce];
        Campaign storage c = campaigns[campaignId];
        if (c.editionsReserved >= r.quantity) c.editionsReserved -= r.quantity;
        if (walletReservationCount[campaignId][r.wallet] >= r.quantity) {
            walletReservationCount[campaignId][r.wallet] -= r.quantity;
        }
        delete reservations[campaignId][nonce];
    }

    function _pay(address payable recipient, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok, ) = recipient.call{value: amount}("");
        require(ok, "Payment failed");
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner { baseTokenURI = newBaseURI; }

    function setPlatformWallet(address payable wallet) external onlyOwner {
        require(wallet != address(0), "Invalid platform wallet");
        platformWallet = wallet;
    }

    function setReserveWallet(address payable wallet) external onlyOwner {
        require(wallet != address(0), "Invalid reserve wallet");
        reserveWallet = wallet;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    receive() external payable {}
}
