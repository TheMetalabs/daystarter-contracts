// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Membership is ERC721, AccessControl {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

  string private _uri = "";

  constructor() ERC721("DAYSTARTER Membership", "DSTMSP") {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
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
  ) public onlyRole(BURNER_ROLE) {
    _burn(tokenId);
  }
}