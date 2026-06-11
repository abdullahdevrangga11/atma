// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Mock MI4 (Mantle Index Four — BTC/ETH/SOL/stables). Price drifts via simulate.
contract MockMI4 is ERC20 {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    uint256 public pricePerShare;

    event Bought(address indexed user, uint256 usdcIn, uint256 mi4Out);
    event Sold(address indexed user, uint256 mi4In, uint256 usdcOut);

    constructor(address _usdc) ERC20("Mock Mantle Index Four", "MI4") {
        usdc = IERC20(_usdc);
        pricePerShare = 1e18;
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function buy(uint256 usdcAmount) external returns (uint256 mi4Out) {
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        mi4Out = (usdcAmount * 1e12 * 1e18) / pricePerShare;
        _mint(msg.sender, mi4Out);
        emit Bought(msg.sender, usdcAmount, mi4Out);
    }

    function sell(uint256 mi4Amount) external returns (uint256 usdcOut) {
        _burn(msg.sender, mi4Amount);
        usdcOut = (mi4Amount * pricePerShare) / 1e18 / 1e12;
        usdc.safeTransfer(msg.sender, usdcOut);
        emit Sold(msg.sender, mi4Amount, usdcOut);
    }

    function simulateMove(int256 bps) external {
        if (bps > 0) {
            pricePerShare = pricePerShare + (pricePerShare * uint256(bps)) / 10_000;
        } else if (bps < 0) {
            uint256 drop = (pricePerShare * uint256(-bps)) / 10_000;
            pricePerShare = drop >= pricePerShare ? 1 : pricePerShare - drop;
        }
    }
}
