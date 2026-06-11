// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Mock USDY (Ondo tokenized US Treasuries) for Mantle Sepolia.
/// Real USDY pays ~4.65% APY via on-chain price increase. This mock provides:
///   - deposit(USDC) -> USDY 1:1
///   - withdraw(USDY) -> USDC + yield since deposit (simulated)
///   - simulateYield() -> bumps price for testing
contract MockUSDY is ERC20 {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    uint256 public pricePerShare; // 1e18 scaled — 1.0 USD = 1e18

    event Deposited(address indexed user, uint256 usdcIn, uint256 usdyOut);
    event Withdrawn(address indexed user, uint256 usdyIn, uint256 usdcOut);
    event YieldSimulated(uint256 newPrice);

    constructor(address _usdc) ERC20("Mock USD Yield", "USDY") {
        usdc = IERC20(_usdc);
        pricePerShare = 1e18; // initial 1:1
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function deposit(uint256 usdcAmount) external returns (uint256 usdyOut) {
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        // Scale 6 -> 18 decimals: usdcAmount * 1e12. Then divide by current price.
        usdyOut = (usdcAmount * 1e12 * 1e18) / pricePerShare;
        _mint(msg.sender, usdyOut);
        emit Deposited(msg.sender, usdcAmount, usdyOut);
    }

    function withdraw(uint256 usdyAmount) external returns (uint256 usdcOut) {
        _burn(msg.sender, usdyAmount);
        // Convert usdy (18 dec) to usdc (6 dec) at current price.
        usdcOut = (usdyAmount * pricePerShare) / 1e18 / 1e12;
        usdc.safeTransfer(msg.sender, usdcOut);
        emit Withdrawn(msg.sender, usdyAmount, usdcOut);
    }

    /// @notice Anyone can simulate yield accrual for testing.
    function simulateYield(uint256 bps) external {
        // bumps price by bps basis points (e.g. 100 = 1%)
        pricePerShare = pricePerShare + (pricePerShare * bps) / 10_000;
        emit YieldSimulated(pricePerShare);
    }
}
