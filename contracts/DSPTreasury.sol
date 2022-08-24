// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "./interfaces/DSTokenTreasury.sol";

contract DSPTreasury is DSTokenTreasury {
  constructor() DSTokenTreasury("DSPTreasury", "DSP") {}
}
