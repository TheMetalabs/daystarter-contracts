
// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DSTTreasury is AccessControl {
    event DepositEvent(address sender, uint256 balance); // 입금 이벤트
    event WithdrawEvent(address receiver, uint256 balance); // 출금 이벤트

    // 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    address public tokenAddr;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
    }

    function setTokenAddress(address addr) public {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        tokenAddr = addr;
    }

    function deposit(uint256 balance) public payable {
        // 컨트랙트 호출자의 토큰 잔량 체크
        uint256 userBalance = IERC20(tokenAddr).balanceOf(msg.sender);
        uint256 allowance = IERC20(tokenAddr).allowance(msg.sender, address(this));

        require(allowance >= balance && balance > 0 && userBalance >= balance, "wrong balance");

        // 토큰 전송 : 컨트랙트 호출자 -> 트레저리 컨트랙트
        IERC20(tokenAddr).transferFrom(msg.sender, address(this), balance);

        emit DepositEvent(msg.sender, balance);
    }

    function withdraw(address targetAddr, uint256 balance) public {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");

        IERC20(tokenAddr).transfer(targetAddr, balance);

        emit WithdrawEvent(targetAddr, balance);
    }
}