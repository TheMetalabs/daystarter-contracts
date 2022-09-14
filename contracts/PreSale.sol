// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PreSale is Ownable {
  event SaleEvent(address addr, uint256 balance, uint256 remainBalance);
  
    

  // DST ERC20 token address
  address dstAddress;
  // foundation Address
  address foundAddress;

  // PreSaleInfo
  struct PreSaleInfo {
    // first preSale block number
    uint256 preSale1Height;
    // second preSale block number
    uint256 preSale2Height;
    // publicSale block number
    uint256 publicSaleHeight;
    // sale price
    uint256 salePrice;
  }

  // Pre-sale Account
  struct PreSaleAccount {
    // total able claim balance
    uint256 totalClaimBalance;
    // claimed balance
    uint256 claimedBalance;
    // exist check
    bool isExist;
  }

  mapping(uint8 => PreSaleInfo) public preSaleInfo;
  mapping(address => PreSaleAccount) public preSaleAccounts;

  // [관리자] 프리세일 일정 정보 입력(판매가격, 1차 프리세일 시작 시점, 2차 프리세일 시작 시점, 퍼블릭 세일 시작 시점)
  function setPresaleInfo(uint256 _salePrice, uint256 _preSale1Height, uint256 _preSale2Height, uint256 _publicSaleHeight ) public onlyOwner {
    require(_preSale2Height > _preSale1Height, "presale2 more than presale1");
    require(_publicSaleHeight > _preSale2Height, "publicSale more than presale2");
    preSaleInfo[0] = PreSaleInfo({
      salePrice: _salePrice,
      preSale1Height: _preSale1Height,
      preSale2Height: _preSale2Height,
      publicSaleHeight: _publicSaleHeight
    });

  }


  // [관리자] 재단 지갑 입력
  function setFoundAddress(address _addr) public onlyOwner {
    // Check address is ERC20
    foundAddress = _addr;
  }

  // [관리자] 코인 컨트랙트 입력
  function setDSTAddress(address _addr) public onlyOwner {
    // Check address is ERC20
    IERC20(_addr).balanceOf(_addr);
    dstAddress = _addr;
  }

  // AddPresale Accounts
  // Params: addressList:["0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"],  balanceList:[123]
  // [관리자] 프리세일 스냅샷을 기반으로하는 클레임 정보 입력(주소, DST 클레임 가능한 양)
  function addPresaleAccounts(address[] memory _addressList, uint256[] memory _balanceList) public onlyOwner {
    require(_addressList.length == _balanceList.length, "need same length");
    for (uint i=0; i<_addressList.length; i++) {
      if(!preSaleAccounts[_addressList[i]].isExist) {
        preSaleAccounts[_addressList[i]] = PreSaleAccount({
          totalClaimBalance: _balanceList[i],
          claimedBalance: 0,
          isExist: true
        });
      }
    }
  }  



  // [관리자] 컨트랙트 ETH 잔액 조회
  function getEthBalance( ) public view returns(uint256){
    return address(this).balance;
  }

  // [관리자] 컨트랙트 DST 잔액 조회
  function getDstBalance() public view returns(uint256){
    return IERC20(dstAddress).balanceOf(address(this));
  }



// [관리자] 재단 지갑으로 ETH 출금
  function withdrawETH( ) public onlyOwner {
    require(foundAddress != address(0), "no foundation address");
    // Transfer Eth to Foundation address
    payable(foundAddress).transfer(address(this).balance);
  }

  // [관리자] 재단 지갑으로 DST 출금
  function withdrawDST( ) public onlyOwner {
    require(foundAddress != address(0), "no foundation address");
    // Transfer DST: Contract -> Foundation address
    IERC20(dstAddress).transfer(foundAddress, IERC20(dstAddress).balanceOf(address(this)));
  }



// [유저] ETH로 DST 구매
  function sale( ) public payable{
    uint price = msg.value;
    PreSaleInfo memory saleInfo = preSaleInfo[0];

    require(saleInfo.salePrice > 0, "sale price more than zero");
    require(price > 0, "price more than zero");
    require(price % saleInfo.salePrice == 0, "price error");

    uint blockNumber = block.number;
    uint256 amount = price / saleInfo.salePrice;
    if(blockNumber >= saleInfo.preSale1Height && blockNumber < saleInfo.preSale2Height )     {
      // 1차 판매중
      PreSaleAccount storage account = preSaleAccounts[msg.sender];
      require(account.totalClaimBalance - account.claimedBalance > amount, "Not enough quantity available to sale");
      IERC20(dstAddress).transfer(msg.sender, amount);
      account.claimedBalance += amount;
    } else if(blockNumber >= saleInfo.preSale2Height && blockNumber < saleInfo.publicSaleHeight )     {
      // 2차판매
      require(preSaleAccounts[msg.sender].isExist, "Not exist whitelist");
      uint balance = IERC20(dstAddress).balanceOf(address(this));
      require(balance > amount, "Insufficient quantity.");
      IERC20(dstAddress).transfer(msg.sender, amount);
    } else if(blockNumber >= saleInfo.publicSaleHeight) {
      // 퍼블릭세일
      revert("not saled");
    } else {
      revert("not saled");
    }
  }

}

