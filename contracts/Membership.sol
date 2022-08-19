// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "./interfaces/DS721.sol";

contract Membership is DS721 {
  constructor() DS721("DAYSTARTER Membership", "DSTMSP", true) {}
}