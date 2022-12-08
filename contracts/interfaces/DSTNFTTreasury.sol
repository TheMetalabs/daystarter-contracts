
// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/*
  Base NFT treasury implmentation for DAYSTARTER NFTs - Membership, Benefit and Achievement.

  NFT owners should deposit their NFTs to NFT treasury for using their NFTs in DAYSTARTER offchain application.
  NFT Owners can
    - use NFTs to earn DSP(DAYSTARTER Point)
    - sell to earn DSP or DST(DAYSTARTER Token)
    - buy to use NFT
    - request withdraw
  After withdraw, Users own their NFTs but can't use them in DAYSTARTER offchain application.

  Minter can
    - set ERC721 address to deposit
    - withdraw NFTs in treasury to any address
*/
abstract contract DSTNFTTreasury is AccessControl {
    event DepositEvent(address nftAddr, uint256 nftId);
    event WithdrawEvent(address nftAddr, uint256 nftId);
    event AddressChangeEvent(address addr);

    // 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    address public nftAddr;

    // Contract name
    string private _name;

    // Token symbol
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _name = name_;
        _symbol = symbol_;
    }

    function setAddress(address addr) public onlyRole(MINTER_ROLE) {
        require(IERC721(addr).supportsInterface(0x80ac58cd), "Only ERC721 is supported");
        nftAddr = addr;
        emit AddressChangeEvent(addr);
    }

    function deposit(uint256 nftId) public {
        require(IERC721(nftAddr).ownerOf(nftId) == msg.sender, "Can't deposit");
        require(IERC721(nftAddr).getApproved(nftId) == address(this), "Need approve");

        IERC721(nftAddr).transferFrom(msg.sender, address(this), nftId);

        emit DepositEvent(msg.sender, nftId);
    }

    function withdraw(address targetAddr, uint256 nftId) public onlyRole(MINTER_ROLE) {
        require(targetAddr != address(0), "wrong address");
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");

        IERC721(nftAddr).transferFrom(address(this), targetAddr, nftId);

        emit WithdrawEvent(targetAddr, nftId);
    }
}
