// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract DS721 is ERC721, AccessControl {
  // 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  string private _uri = "";
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

  function setURI(string memory newuri) public onlyRole(DEFAULT_ADMIN_ROLE) {
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
  ) public {
    require(ownerOf(tokenId) == msg.sender, "Not owner");
    _burn(tokenId);
  }

  function _transfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override {
    if(_transferable) {
        super._transfer(from, to, tokenId);
    } else {
        revert("Not trasferable");
    }   
  }
}