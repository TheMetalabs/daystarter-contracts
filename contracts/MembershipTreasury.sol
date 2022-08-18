
// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface NFT {
    function ownerOf(uint256 nftId) external view returns (address owner);
    function getApproved(uint256 tokenId) external view returns (address addr);
    function transferFrom(address sender, address recipient, uint256 nftId) external returns (bool result);
}

contract MembershipTreasury is AccessControl {
    event DepositEvent(address nftAddr, uint256 nftId); // 입금 이벤트
    event WithdrawEvent(address nftAddr, uint256 nftId); // 출금 이벤트

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    address public nftAddr;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
    }

    function setAddress(address addr) public {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        nftAddr = addr;
    }

    function deposit(uint256 nftId) public {
        // 컨트랙트 호출자의 토큰 잔량 체크
        require(NFT(nftAddr).ownerOf(nftId) == msg.sender, "can't deposit"); // 해당 NFT의 주인만 컨트랙트 실행 가능
        require(NFT(nftAddr).getApproved(nftId) == address(this), "need approve"); // 승인 체크
        
        // 토큰 전송 : 컨트랙트 호출자 -> 트레저리 컨트랙트
        NFT(nftAddr).transferFrom(msg.sender, address(this), nftId);

        emit DepositEvent(msg.sender, nftId);
    }

    function withdraw(address targetAddr, uint256 nftId) public {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");

        NFT(nftAddr).transferFrom(address(this), targetAddr, nftId);

        emit WithdrawEvent(targetAddr, nftId);
    }
}