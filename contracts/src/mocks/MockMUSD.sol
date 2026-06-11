// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Mock mUSD (rebasing USDY wrapper) for Mantle Sepolia.
/// Same yield mechanism as USDY but exposes as rebasing — share-based accounting.
contract MockMUSD is ERC20 {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    uint256 public pricePerShare;

    event Deposited(address indexed user, uint256 usdcIn, uint256 musdOut);
    event Withdrawn(address indexed user, uint256 musdIn, uint256 usdcOut);

    constructor(address _usdc) ERC20("Mock Mantle USD", "mUSD") {
        usdc = IERC20(_usdc);
        pricePerShare = 1e18;
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function deposit(uint256 usdcAmount) external returns (uint256 musdOut) {
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        musdOut = (usdcAmount * 1e12 * 1e18) / pricePerShare;
        _mint(msg.sender, musdOut);
        emit Deposited(msg.sender, usdcAmount, musdOut);
    }

    function withdraw(uint256 musdAmount) external returns (uint256 usdcOut) {
        _burn(msg.sender, musdAmount);
        usdcOut = (musdAmount * pricePerShare) / 1e18 / 1e12;
        usdc.safeTransfer(msg.sender, usdcOut);
        emit Withdrawn(msg.sender, musdAmount, usdcOut);
    }

    function simulateYield(uint256 bps) external {
        pricePerShare = pricePerShare + (pricePerShare * bps) / 10_000;
    }
}
