// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "./interfaces/DS721.sol";
/*
  Achievement NFT
  Achievement is not transferable. Owners only can burn their own.
*/
contract Achievement is DS721 {
  constructor() DS721("DAYSTARTER Achievement", "DSTACH", false) {}

  function burn(
    uint256 tokenId
  ) public override {
    require(ownerOf(tokenId) == msg.sender, "Not owner");
    _burn(tokenId);
  }
}
