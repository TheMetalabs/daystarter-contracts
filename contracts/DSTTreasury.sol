
// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

interface Token {
    function balanceOf(address owner) external view returns (uint256 balance);
    function allowance(address owner, address spender) external view returns (uint256 balance);
    function transfer(address recipient, uint256 amount) external returns (bool result);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool result);
    function approve(address spender, uint256 value) external returns (bool result);
}

contract DSTTreasury is Ownable {
    event DepositEvent(address addr, uint256 balance); // 입금 이벤트
    event WithdrawEvent(address addr, uint256 balance); // 출금 이벤트

    address public addr;

    function setAddress(address _addr) public onlyOwner {
        addr = _addr;
    }

    function deposit(uint256 balance) public {
        // 컨트랙트 호출자의 토큰 잔량 체크
        uint256 userBalance = Token(addr).balanceOf(msg.sender);
        uint256 allowance = Token(addr).allowance(msg.sender, address(this));

        require(allowance >= balance && balance > 0 && userBalance >= balance, 'wrong balance');

        // 토큰 전송 : 컨트랙트 호출자 -> 트레저리 컨트랙트
        Token(addr).transferFrom(msg.sender, address(this), balance);

        emit DepositEvent(msg.sender, balance);
    }

    function withdraw(address targetAddr, uint256 balance) public onlyOwner {
        Token(addr).transfer(targetAddr, balance);

        emit WithdrawEvent(targetAddr, balance);
    }
}