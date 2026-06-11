// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Mock Aave V3 USDC supply pool — returns aUSDC 1:1 with yield via price drift.
/// Mirrors Aave V3 supply() / withdraw() interface for compatibility.
contract MockAavePool is ERC20 {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    uint256 public pricePerShare;

    event Supplied(address indexed user, uint256 usdcIn, uint256 aUsdcOut);
    event WithdrawnFromPool(address indexed user, uint256 aUsdcIn, uint256 usdcOut);

    constructor(address _usdc) ERC20("Mock Aave USDC", "aUSDC") {
        usdc = IERC20(_usdc);
        pricePerShare = 1e18;
    }

    function decimals() public pure override returns (uint8) {
        return 6; // match underlying
    }

    /// @notice Aave-style supply.
    function supply(uint256 usdcAmount) external returns (uint256 aUsdcOut) {
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        aUsdcOut = (usdcAmount * 1e18) / pricePerShare;
        _mint(msg.sender, aUsdcOut);
        emit Supplied(msg.sender, usdcAmount, aUsdcOut);
    }

    /// @notice Aave-style withdraw.
    function withdrawFromPool(uint256 aUsdcAmount) external returns (uint256 usdcOut) {
        _burn(msg.sender, aUsdcAmount);
        usdcOut = (aUsdcAmount * pricePerShare) / 1e18;
        usdc.safeTransfer(msg.sender, usdcOut);
        emit WithdrawnFromPool(msg.sender, aUsdcAmount, usdcOut);
    }

    function simulateYield(uint256 bps) external {
        pricePerShare = pricePerShare + (pricePerShare * bps) / 10_000;
    }
}
