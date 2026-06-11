// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMockUSDY is IERC20 {
    function deposit(uint256 usdcAmount) external returns (uint256);
    function withdraw(uint256 usdyAmount) external returns (uint256);
    function pricePerShare() external view returns (uint256);
}

interface IMockMUSD is IERC20 {
    function deposit(uint256 usdcAmount) external returns (uint256);
    function withdraw(uint256 musdAmount) external returns (uint256);
    function pricePerShare() external view returns (uint256);
}

interface IMockAavePool is IERC20 {
    function supply(uint256 usdcAmount) external returns (uint256);
    function withdrawFromPool(uint256 aUsdcAmount) external returns (uint256);
    function pricePerShare() external view returns (uint256);
}

interface IMockMI4 is IERC20 {
    function buy(uint256 usdcAmount) external returns (uint256);
    function sell(uint256 mi4Amount) external returns (uint256);
    function pricePerShare() external view returns (uint256);
}
