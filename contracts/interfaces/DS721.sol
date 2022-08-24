// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/*
  Base NFT implmentation for DAYSTARTER NFTs - Membership, Benefit and Achievement.

  NFT owners should deposit their NFTs to NFT treasury for using their NFTs in DAYSTARTER offchain application.
  Minter can
    - mint new NFT
    - set NFT metadata URI

  Burner can
    - burn Membership and Benefit but can't burn Achievement

  NFT owners can
    - burn owned NFTs
    - transfer Membership and Benefit but can't transfer Achievement
  After withdraw, Users own their NFTs but can't use them in DAYSTARTER offchain application.

  Transfer
    Membership and Benefit are trasferable but Achievement is not transferable.
*/
abstract contract DS721 is ERC721, AccessControl {
  // 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  // 0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848
  bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

  // URI for metadata
  string private _uri = "";
  // Some NFT is not transferable like SBT
  bool private _transferable = true;

  constructor(string memory name_, string memory symbol_, bool transferable_) ERC721(name_, symbol_) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(MINTER_ROLE, msg.sender);
    _transferable = transferable_;
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
    return AccessControl.supportsInterface(interfaceId) ||
      ERC721.supportsInterface(interfaceId) ||
      super.supportsInterface(interfaceId);
  }

  function setURI(string memory newuri) public onlyRole(MINTER_ROLE) {
    _uri = newuri;
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    _requireMinted(tokenId);
    return bytes(_uri).length > 0 ? string(abi.encodePacked(_uri, "/", Strings.toString(tokenId), ".json")) : "";
  }

  function mint(
    address to,
    uint256 tokenId,
    bytes memory data
  ) public onlyRole(MINTER_ROLE) {
    _safeMint(to, tokenId, data);
  }

  function burn(
    uint256 tokenId
  ) public virtual {
    require(ownerOf(tokenId) == msg.sender || hasRole(BURNER_ROLE, msg.sender), "No permission to burn");
    _burn(tokenId);
  }

  function _transfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override {
    if (_transferable) {
        super._transfer(from, to, tokenId);
    } else {
        revert("Not trasferable");
    }
  }
}
