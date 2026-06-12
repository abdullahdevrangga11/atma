// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AmanaVault} from "../src/AmanaVault.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {MockUSDY} from "../src/mocks/MockUSDY.sol";
import {MockMUSD} from "../src/mocks/MockMUSD.sol";
import {MockAavePool} from "../src/mocks/MockAavePool.sol";
import {MockMI4} from "../src/mocks/MockMI4.sol";

/// @notice Deploy AMANA on Mantle Sepolia.
/// Usage: forge script script/Deploy.s.sol --rpc-url mantle_sepolia --broadcast --verify
contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerKey);

        // 1) Deploy mock assets
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC:", address(usdc));

        MockUSDY usdy = new MockUSDY(address(usdc));
        console.log("MockUSDY:", address(usdy));

        MockMUSD mUsd = new MockMUSD(address(usdc));
        console.log("MockMUSD:", address(mUsd));

        MockAavePool aave = new MockAavePool(address(usdc));
        console.log("MockAavePool:", address(aave));

        MockMI4 mi4 = new MockMI4(address(usdc));
        console.log("MockMI4:", address(mi4));

        // 2) Seed pools with USDC liquidity for yield payouts
        usdc.mint(address(usdy), 100_000 * 1e6);
        usdc.mint(address(mUsd), 100_000 * 1e6);
        usdc.mint(address(aave), 100_000 * 1e6);
        usdc.mint(address(mi4), 100_000 * 1e6);

        // 3) Mint demo USDC to deployer (10K)
        usdc.mint(deployer, 10_000 * 1e6);

        // 4) Deploy vault — deployer is owner + operator initially
        AmanaVault vault = new AmanaVault(
            address(usdc),
            address(usdy),
            address(mUsd),
            address(aave),
            address(mi4),
            deployer,
            deployer
        );
        console.log("AmanaVault:", address(vault));

        // 5) Stub ERC-8004 agent IDs (real registration on Mantle Mainnet would replace these)
        vault.setAgentIds(1001, 2002, 3003);
        console.log("Agent IDs set: Allocator=1001, Risk=2002, Reporter=3003");

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Add these to .env.local:");
        console.log("NEXT_PUBLIC_MOCK_USDC_ADDRESS=%s", address(usdc));
        console.log("NEXT_PUBLIC_MOCK_USDY_ADDRESS=%s", address(usdy));
        console.log("NEXT_PUBLIC_MOCK_MUSD_ADDRESS=%s", address(mUsd));
        console.log("NEXT_PUBLIC_MOCK_AAVE_ADDRESS=%s", address(aave));
        console.log("NEXT_PUBLIC_MOCK_MI4_ADDRESS=%s", address(mi4));
        console.log("NEXT_PUBLIC_AMANA_VAULT_ADDRESS=%s", address(vault));
        console.log("NEXT_PUBLIC_ALLOCATOR_AGENT_ID=1001");
        console.log("NEXT_PUBLIC_RISK_AGENT_ID=2002");
        console.log("NEXT_PUBLIC_REPORTER_AGENT_ID=3003");
    }
}
