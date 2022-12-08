
// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/*
  Base ERC20 treasury implmentation for DAYSTARTER Tokens - DST(DAYSTARTER Token) and DSP(DAYSTARTER Point).

  Token owners should deposit their tokens to ERC20 treasury for using their tokens in DAYSTARTER offchain application.
  Token Owners can
    - buy NFT
    - request withdraw
  After withdraw, Users own their tokens but can't use them in DAYSTARTER offchain application.

  Minter can
    - set ERC20 address to deposit
    - withdraw tokens in treasury to any address
*/
abstract contract DSTokenTreasury is AccessControl {
    event DepositEvent(address sender, uint256 balance, string symbol);
    event WithdrawEvent(address receiver, uint256 balance, string symbol);
    event AddressChangeEvent(address addr);

    // 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    address public tokenAddr;

    // Contract name
    string private _name;

    // Token symbol
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _name = name_;
        _symbol = symbol_;
    }

    function setTokenAddress(address addr) public onlyRole(MINTER_ROLE) {
        require(addr != address(0), "wrong address");
        tokenAddr = addr;
        emit AddressChangeEvent(addr);
    }

    function deposit(uint256 balance_) public {
        uint256 userBalance = IERC20(tokenAddr).balanceOf(msg.sender);
        uint256 allowance = IERC20(tokenAddr).allowance(msg.sender, address(this));

        require(allowance >= balance_ && userBalance >= balance_, "wrong balance");

        IERC20(tokenAddr).transferFrom(msg.sender, address(this), balance_);

        emit DepositEvent(msg.sender, balance_, _symbol);
    }

    function withdraw(address targetAddr, uint256 balance_) public onlyRole(MINTER_ROLE) {
        IERC20(tokenAddr).transfer(targetAddr, balance_);

        emit WithdrawEvent(targetAddr, balance_, _symbol);
    }
}
