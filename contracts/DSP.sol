// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "./interfaces/DSCoin.sol";

contract DSP is DSCoin {
    constructor() DSCoin("DAY STARTER Point", "DSP") {}
}