// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "./interfaces/DSCoin.sol";

contract DST is DSCoin {
    constructor() DSCoin("DAY STARTER Token", "DST") {
        _mint(msg.sender, 1000000000 * 10 ** decimals());
    }
}