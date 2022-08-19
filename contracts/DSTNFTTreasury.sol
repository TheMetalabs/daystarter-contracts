
// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract DSTNFTTreasury is AccessControl {
    event DepositEvent(address nftAddr, uint256 nftId); // 입금 이벤트
    event WithdrawEvent(address nftAddr, uint256 nftId); // 출금 이벤트

    // 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    address public nftAddr;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
    }

    function setAddress(address addr) public onlyRole(MINTER_ROLE)
        require(IERC721(addr).supportsInterface(0x80ac58cd), "Only ERC721 is supported");{
        nftAddr = addr;
    }

    function deposit(uint256 nftId) public {
        // 컨트랙트 호출자의 토큰 잔량 체크
        require(IERC721(nftAddr).ownerOf(nftId) == msg.sender, "Can't deposit"); // 해당 NFT의 주인만 컨트랙트 실행 가능
        require(IERC721(nftAddr).getApproved(nftId) == address(this), "Need approve"); // 승인 체크

        // 토큰 전송 : 컨트랙트 호출자 -> 트레저리 컨트랙트
        IERC721(nftAddr).transferFrom(msg.sender, address(this), nftId);

        emit DepositEvent(msg.sender, nftId);
    }

    function withdraw(address targetAddr, uint256 nftId) public onlyRole(MINTER_ROLE) {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");

        // 토큰 전송 : 트레저리 컨트랙트 -> 타겟 어드레스
        IERC721(nftAddr).transferFrom(address(this), targetAddr, nftId);

        emit WithdrawEvent(targetAddr, nftId);
    }
}
