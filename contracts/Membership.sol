// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Membership is ERC1155, AccessControl {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

  constructor(string memory uri) ERC1155(uri) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
    return AccessControl.supportsInterface(interfaceId) || ERC1155.supportsInterface(interfaceId);
  }

  function setURI(string memory uri) public onlyRole(MINTER_ROLE) {
    _setURI(uri);
  }

  function mint(
    address to,
    uint256 id,
    uint256 amount,
    bytes memory data
  ) public onlyRole(MINTER_ROLE) {
    require(id >= 0 && id < 4, "Wrong id");
    _mint(to, id, amount, data);
  }

  function burn(
    address from,
    uint256 id,
    uint256 amount
  ) public onlyRole(BURNER_ROLE) {
    require(id >= 0 && id < 4, "Wrong id");
    _burn(from, id, amount);
  }
}