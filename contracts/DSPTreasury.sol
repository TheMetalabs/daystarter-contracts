
// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface Token {
    function balanceOf(address owner) external view returns (uint256 balance);
    function allowance(address owner, address spender) external view returns (uint256 balance);
    function transfer(address recipient, uint256 amount) external returns (bool result);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool result);
}

contract DSPTreasury is AccessControl {
    event DepositEvent(address tokenAddr, uint256 balance); // 입금 이벤트
    event WithdrawEvent(address tokenAddr, uint256 balance); // 출금 이벤트

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    address public tokenAddr;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
    }

    function setAddress(address addr) public {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        tokenAddr = addr;
    }

    function deposit(uint256 balance) public {
        // 컨트랙트 호출자의 토큰 잔량 체크
        uint256 userBalance = Token(tokenAddr).balanceOf(msg.sender);
        uint256 allowance = Token(tokenAddr).allowance(msg.sender, address(this));

        require(allowance >= balance && balance > 0 && userBalance >= balance, "wrong balance");
        
        // 토큰 전송 : 컨트랙트 호출자 -> 트레저리 컨트랙트
        Token(tokenAddr).transferFrom(msg.sender, address(this), balance);

        emit DepositEvent(msg.sender, balance);
    }

    function withdraw(address targetAddr, uint256 balance) public {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");

        Token(tokenAddr).transfer(targetAddr, balance);

        emit WithdrawEvent(targetAddr, balance);
    }
}