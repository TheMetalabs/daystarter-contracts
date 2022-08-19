// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "./interfaces/DSTNFTTreasury.sol";

contract MembershipTreasury is DSTNFTTreasury {
    constructor() DSTNFTTreasury("MembershipTreasury", "DSTMSP") {}
}
