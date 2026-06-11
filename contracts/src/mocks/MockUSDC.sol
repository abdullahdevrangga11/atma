// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Mock USDC for Mantle Sepolia testing — open mint, 6 decimals like real USDC.
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Anyone can mint mock USDC for testing.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
