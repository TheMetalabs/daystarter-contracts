// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vesting is Ownable {
  event AddVestingEvent(address addr, uint8 vestingType, uint256 balance);
  event ClaimEvent(address addr, uint8 vestingType, uint256 balance);

  enum VestingType {
    PRIVATE_SALE,
    TEAM,
    MARKETING,
    TREASURY
  }

  // DST ERC20 token address
  address public dstAddress;

  // Vesting info per type
  struct VestingInfo {
    // Start time
    uint256 startTime;
    // vesting start time = start time + vesting month
    uint8 vestingStartMonth;
    // maximum addable balance
    uint256 totalBalance;
      // current added balance
    uint256 addedBalance;
    // current claimed balance
    uint256 claimedBalance;
    // bias point for initial release. Initial release amount is total vesting balance * initialBp / 10000
    uint16 initialBp;
    // bias point for periodic release. Periodic release amount is total vesting balance * (number of passed month * periodBp) / 10000
    uint16 periodBp;
  }

  // Vesting info per address
  struct VestingAccountInfo {
    uint8 vestingType;
    uint256 totalBalance;
    uint256 claimedBalance;
    uint256 createdTime;
    uint256 lastClaimedTime;
  }

  mapping(uint8 => VestingInfo) public vestingInfos;
  mapping(address => VestingAccountInfo) public vestingAccountInfos;

  constructor() {
    vestingInfos[uint8(VestingType.PRIVATE_SALE)] = VestingInfo({
      startTime: 0,
      vestingStartMonth: 6,
      totalBalance: 165000000 * 10 ** 18,
      addedBalance: 0,
      claimedBalance: 0,
      initialBp: 500, // 5%
      periodBp: 400 // 4%
    });

    vestingInfos[uint8(VestingType.TEAM)] = VestingInfo({
      startTime: 0,
      vestingStartMonth: 12,
      totalBalance: 80000000 * 10 ** 18,
      addedBalance: 0,
      claimedBalance: 0,
      initialBp: 0, // 0%
      periodBp: 280 // 2.8%
    });

    vestingInfos[uint8(VestingType.MARKETING)] = VestingInfo({
      startTime: 0,
      vestingStartMonth: 0,
      totalBalance: 55000000 * 10 ** 18,
      addedBalance: 0,
      claimedBalance: 0,
      initialBp: 1000, // 10%
      periodBp: 1000 // 10%
    });

    vestingInfos[uint8(VestingType.TREASURY)] = VestingInfo({
      startTime: 0,
      vestingStartMonth: 1,
      totalBalance: 290000000 * 10 ** 18,
      addedBalance: 0,
      claimedBalance: 0,
      initialBp: 285, // 2.85%
      periodBp: 100 // 1%
    });
  }

  function setDSTAddress(address addr) public onlyOwner {
    dstAddress = addr;
  }

  function setStartTime(uint8 vestingType, uint256 timestamp) public onlyOwner {
    // Check vesting type
    require(vestingType >= uint8(VestingType.PRIVATE_SALE) && vestingType <= uint8(VestingType.TREASURY), "wrong vesting type");

    // Check timestamp
    require(timestamp > block.timestamp, "should be future");

    VestingInfo storage vestingInfo_ = vestingInfos[vestingType];

    // Can't set start time twice
    require(vestingInfo_.startTime == 0, "already set start time");

    vestingInfo_.startTime = timestamp;
  }

  function add(uint8 vestingType, uint256 balance, address addr) public onlyOwner {
    // Check vesting type
    require(vestingType >= uint8(VestingType.PRIVATE_SALE) && vestingType <= uint8(VestingType.TREASURY), "wrong vesting type");

    // Check total balance
    VestingInfo storage vestingInfo_ = vestingInfos[vestingType];
    require(vestingInfo_.totalBalance >= vestingInfo_.addedBalance + balance, "over total balance");

    // Check admin's DST balance
    uint256 adminBalance = IERC20(dstAddress).balanceOf(msg.sender);
    uint256 allowance = IERC20(dstAddress).allowance(msg.sender, address(this));
    require(allowance >= balance && balance > 0 && adminBalance >= balance, "not enough balance");

    // Check address's vesting info
    require(vestingAccountInfos[addr].createdTime == 0, "alreay added address");

    vestingAccountInfos[addr] = VestingAccountInfo({
      vestingType: vestingType,
      totalBalance: balance,
      claimedBalance: 0,
      createdTime: block.timestamp,
      lastClaimedTime: 0
    });

    // Transfer DST: Contract caller(Admin) -> Contract
    IERC20(dstAddress).transferFrom(msg.sender, address(this), balance);

    // Update added balance
    vestingInfo_.addedBalance += balance;

    // Update vesting account info
    vestingAccountInfos[addr].vestingType = vestingType;
    vestingAccountInfos[addr].totalBalance = balance;

    emit AddVestingEvent(addr, vestingType, balance);
  }

  function claim() public {
    // Check existence of vesting account info
    require(vestingAccountInfos[msg.sender].createdTime > 0, "no vesting");

    // Check vesting is started
    VestingInfo storage vestingInfo = vestingInfos[vestingAccountInfos[msg.sender].vestingType];
    require(vestingInfo.startTime > 0 && vestingInfo.startTime <= block.timestamp, "not started yet");

    // Check claimable balance
    uint256 balance = getClaimableBalance(msg.sender);
    require(balance > 0, "no balance");

    // Transfer DST: Contract -> Contract caller
    IERC20(dstAddress).transfer(msg.sender, balance);

    // Update claimed balance of total vesting
    vestingInfo.claimedBalance += balance;

    // Update claimed balance of account
    vestingAccountInfos[msg.sender].claimedBalance += balance;
    vestingAccountInfos[msg.sender].lastClaimedTime = block.timestamp;

    emit ClaimEvent(msg.sender, vestingAccountInfos[msg.sender].vestingType, balance);
  }

  // Calculate claimable token
  function getClaimableBalance(address addr) public view returns (uint256) {
    require(vestingAccountInfos[addr].createdTime > 0, "no account info");
    uint256 balance = _getClaimableBalance(vestingAccountInfos[addr].vestingType, vestingAccountInfos[addr].totalBalance, vestingAccountInfos[addr].claimedBalance, block.timestamp);

    return balance;
  }

  // 테스트를 위해서 클레임 가능 토큰 계산 로직 분리
  function _getClaimableBalance(uint8 vestingType, uint256 totalBalance, uint256 claimedBalance, uint256 time) public view returns (uint256) {
    // Check vesting type
    require(vestingType >= uint8(VestingType.PRIVATE_SALE) && vestingType <= uint8(VestingType.TREASURY), "wrong vesting type");
    if (vestingInfos[vestingType].startTime == 0 || time < vestingInfos[vestingType].startTime) {
      return 0;
    }

    uint256 balance = 0;
    if (vestingType == uint8(VestingType.MARKETING)) {
      // Add initial released amount;
      balance += totalBalance / 10000 * vestingInfos[vestingType].initialBp ;

      // Marketing vesting amount is released by 10% every 4 months.
      uint256 monthDiff = (time - vestingInfos[vestingType].startTime) / 120 days; // 10368000 is 120 days in seconds
      balance += totalBalance * vestingInfos[vestingType].periodBp * monthDiff;
    } else {
      // Add initial released amount;
      balance += totalBalance / 10000 * vestingInfos[vestingType].initialBp;
      uint256 vestingStartTime = vestingInfos[vestingType].startTime + vestingInfos[vestingType].vestingStartMonth * 30 days;
      // // Vesting amount except markting is released by periodic bias percent every each month.
      if (time > vestingStartTime) {
        uint monthDiff = (time - vestingStartTime) / 30 days + 1;
        balance += totalBalance / 10000 * vestingInfos[vestingType].periodBp * monthDiff;
      }
    }

    // Subtract claimed amount
    balance -= claimedBalance;

    if (balance < 0) {
      return 0;
    }

    // Check balance is over total balance
    if (balance > totalBalance - claimedBalance) {
      balance = totalBalance - claimedBalance;
    }

    return balance;
  }

  function getVestingInfo(uint8 vestingType) public view returns (VestingInfo memory) {
    // Check vesting type
    require(vestingType >= uint8(VestingType.PRIVATE_SALE) && vestingType <= uint8(VestingType.TREASURY), "wrong vesting type");
    return vestingInfos[vestingType];
  }

  function getVestingAccountInfo(address addr) public view returns (VestingAccountInfo memory) {
    return vestingAccountInfos[addr];
  }
}