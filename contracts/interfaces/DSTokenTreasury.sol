
// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

abstract contract DSTokenTreasury is AccessControl {
    event DepositEvent(address sender, uint256 balance, string symbol); // 입금 이벤트
    event WithdrawEvent(address receiver, uint256 balance, string symbol); // 출금 이벤트

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
        tokenAddr = addr;
    }

    function deposit(uint256 balance_) public {
        // 컨트랙트 호출자의 토큰 잔량 체크
        uint256 userBalance = IERC20(tokenAddr).balanceOf(msg.sender);
        uint256 allowance = IERC20(tokenAddr).allowance(msg.sender, address(this));

        console.log(Strings.toString(balance_));
        console.log(Strings.toString(userBalance));
        console.log(Strings.toString(allowance));

        require(allowance >= balance_ && userBalance >= balance_, "wrong balance");

        // 토큰 전송 : 컨트랙트 호출자 -> 트레저리 컨트랙트
        IERC20(tokenAddr).transferFrom(msg.sender, address(this), balance_);

        emit DepositEvent(msg.sender, balance_, _symbol);
    }

    function balance() public view {
        uint256 balance_ = address(this).balance;
        console.log(Strings.toString(balance_));
    }

    function withdraw(address targetAddr, uint256 balance_) public {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");

        IERC20(tokenAddr).transfer(targetAddr, balance_);

        emit WithdrawEvent(targetAddr, balance_, _symbol);
    }
}
