// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {AmanaVault} from "../src/AmanaVault.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {MockUSDY} from "../src/mocks/MockUSDY.sol";
import {MockMUSD} from "../src/mocks/MockMUSD.sol";
import {MockAavePool} from "../src/mocks/MockAavePool.sol";
import {MockMI4} from "../src/mocks/MockMI4.sol";

contract AmanaVaultTest is Test {
    AmanaVault public vault;
    MockUSDC public usdc;
    MockUSDY public usdy;
    MockMUSD public mUsd;
    MockAavePool public aave;
    MockMI4 public mi4;

    address public owner = makeAddr("owner");
    address public operator = makeAddr("operator");
    address public stranger = makeAddr("stranger");

    uint256 constant ONE_USDC = 1e6;
    uint256 constant TEN_K = 10_000 * ONE_USDC;

    function setUp() public {
        // Deploy mock assets
        usdc = new MockUSDC();
        usdy = new MockUSDY(address(usdc));
        mUsd = new MockMUSD(address(usdc));
        aave = new MockAavePool(address(usdc));
        mi4  = new MockMI4(address(usdc));

        // Deploy vault
        vault = new AmanaVault(
            address(usdc),
            address(usdy),
            address(mUsd),
            address(aave),
            address(mi4),
            owner,
            operator
        );

        // Pre-fund mock asset pools with USDC liquidity (so they can pay out yield)
        usdc.mint(address(usdy), 100_000 * ONE_USDC);
        usdc.mint(address(mUsd), 100_000 * ONE_USDC);
        usdc.mint(address(aave), 100_000 * ONE_USDC);
        usdc.mint(address(mi4), 100_000 * ONE_USDC);

        // Mint USDC to owner for tests
        usdc.mint(owner, 1_000_000 * ONE_USDC);
    }

    // ─────────────────── Deploy / state ───────────────────

    function test_initial_state_is_Idle() public view {
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.Idle));
    }

    function test_owner_set_correctly() public view {
        assertEq(vault.owner(), owner);
    }

    function test_operator_set_correctly() public view {
        assertEq(vault.operator(), operator);
    }

    function test_assets_immutable() public view {
        assertEq(address(vault.usdc()), address(usdc));
        assertEq(address(vault.usdy()), address(usdy));
        assertEq(address(vault.mUsd()), address(mUsd));
        assertEq(address(vault.aavePool()), address(aave));
        assertEq(address(vault.mi4()), address(mi4));
    }

    // ─────────────────── Deposit ───────────────────

    function test_deposit_happyPath() public {
        vm.startPrank(owner);
        usdc.approve(address(vault), TEN_K);
        vault.deposit(TEN_K);
        vm.stopPrank();

        assertEq(usdc.balanceOf(address(vault)), TEN_K);
        assertEq(vault.entryNAV(), TEN_K);
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.Analyzing));
    }

    function test_deposit_emits_event() public {
        vm.startPrank(owner);
        usdc.approve(address(vault), TEN_K);
        vm.expectEmit(true, false, false, true);
        emit AmanaVault.Deposited(owner, TEN_K, TEN_K);
        vault.deposit(TEN_K);
        vm.stopPrank();
    }

    function test_deposit_zeroAmount_reverts() public {
        vm.prank(owner);
        vm.expectRevert(AmanaVault.ZeroAmount.selector);
        vault.deposit(0);
    }

    function test_deposit_byNonOwner_reverts() public {
        vm.prank(stranger);
        vm.expectRevert();
        vault.deposit(TEN_K);
    }

    function test_deposit_withoutApproval_reverts() public {
        vm.prank(owner);
        vm.expectRevert();
        vault.deposit(TEN_K);
    }

    // ─────────────────── Propose ───────────────────

    function _depositOnly(uint256 amount) internal {
        vm.startPrank(owner);
        usdc.approve(address(vault), amount);
        vault.deposit(amount);
        vm.stopPrank();
    }

    function _validWeights() internal pure returns (AmanaVault.Allocation memory) {
        return AmanaVault.Allocation({usdyBps: 3408, mUsdBps: 3000, aaveBps: 3592, mi4Bps: 0});
    }

    function test_propose_happyPath() public {
        _depositOnly(TEN_K);
        AmanaVault.Allocation memory w = _validWeights();
        vm.prank(operator);
        vault.propose(w, keccak256("reasoning-1"));
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.Proposing));
    }

    function test_propose_emits_AllocationProposed() public {
        _depositOnly(TEN_K);
        AmanaVault.Allocation memory w = _validWeights();
        bytes32 r = keccak256("reasoning-1");
        vm.prank(operator);
        vm.expectEmit(true, false, false, true);
        emit AmanaVault.AllocationProposed(0, w, r); // allocatorAgentId not set yet -> 0
        vault.propose(w, r);
    }

    function test_propose_byNonOperator_reverts() public {
        _depositOnly(TEN_K);
        AmanaVault.Allocation memory w = _validWeights();
        vm.prank(stranger);
        vm.expectRevert(AmanaVault.NotOperator.selector);
        vault.propose(w, bytes32(0));
    }

    function test_propose_invalidWeights_reverts() public {
        _depositOnly(TEN_K);
        AmanaVault.Allocation memory bad = AmanaVault.Allocation({usdyBps: 5000, mUsdBps: 3000, aaveBps: 1000, mi4Bps: 0});
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(AmanaVault.InvalidWeights.selector, 9000));
        vault.propose(bad, bytes32(0));
    }

    function test_propose_wrongState_reverts() public {
        // No deposit yet — state is Idle, not Analyzing.
        AmanaVault.Allocation memory w = _validWeights();
        vm.prank(operator);
        vm.expectRevert(
            abi.encodeWithSelector(AmanaVault.InvalidState.selector, AmanaVault.VaultState.Idle, AmanaVault.VaultState.Analyzing)
        );
        vault.propose(w, bytes32(0));
    }

    // ─────────────────── Execute ───────────────────

    function _depositAndPropose(uint256 amount) internal returns (AmanaVault.Allocation memory) {
        _depositOnly(amount);
        AmanaVault.Allocation memory w = _validWeights();
        vm.prank(operator);
        vault.propose(w, keccak256("r1"));
        return w;
    }

    function test_execute_happyPath() public {
        _depositAndPropose(TEN_K);
        vm.prank(operator);
        vault.executeAllocation();
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.Allocated));

        // Vault should have ~0 USDC and balances of allocated assets
        assertLt(usdc.balanceOf(address(vault)), 10); // rounding dust ok
        assertGt(usdy.balanceOf(address(vault)), 0);
        assertGt(mUsd.balanceOf(address(vault)), 0);
        assertGt(aave.balanceOf(address(vault)), 0);
        assertEq(mi4.balanceOf(address(vault)), 0); // mi4Bps = 0 in default
    }

    function test_execute_byOwner_works() public {
        _depositAndPropose(TEN_K);
        vm.prank(owner);
        vault.executeAllocation();
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.Allocated));
    }

    function test_execute_byStranger_reverts() public {
        _depositAndPropose(TEN_K);
        vm.prank(stranger);
        vm.expectRevert(AmanaVault.NotOwnerOrOperator.selector);
        vault.executeAllocation();
    }

    function test_execute_wrongState_reverts() public {
        _depositOnly(TEN_K);
        // Skip propose, jump to execute
        vm.prank(operator);
        vm.expectRevert();
        vault.executeAllocation();
    }

    function test_execute_setsCurrentAllocation() public {
        _depositAndPropose(TEN_K);
        vm.prank(operator);
        vault.executeAllocation();
        AmanaVault.Allocation memory c = vault.currentAllocation();
        assertEq(c.usdyBps, 3408);
        assertEq(c.mUsdBps, 3000);
        assertEq(c.aaveBps, 3592);
    }

    function test_execute_clearsProposed() public {
        _depositAndPropose(TEN_K);
        vm.prank(operator);
        vault.executeAllocation();
        (uint16 u, uint16 m, uint16 a, uint16 i) = vault.proposed();
        assertEq(u, 0); assertEq(m, 0); assertEq(a, 0); assertEq(i, 0);
    }

    // ─────────────────── NAV ───────────────────

    function test_nav_reflects_deposit() public {
        _depositOnly(TEN_K);
        assertEq(vault.nav(), TEN_K);
    }

    function test_nav_preserved_after_allocation() public {
        _depositAndPropose(TEN_K);
        vm.prank(operator);
        vault.executeAllocation();
        // NAV should be roughly equal to deposit (mocks 1:1 at start)
        uint256 n = vault.nav();
        assertApproxEqRel(n, TEN_K, 1e16); // within 1%
    }

    function test_nav_grows_after_yield() public {
        _depositAndPropose(TEN_K);
        vm.prank(operator);
        vault.executeAllocation();
        uint256 navBefore = vault.nav();

        // simulate 100 bps yield on USDY + mUSD + Aave
        usdy.simulateYield(100);
        mUsd.simulateYield(100);
        aave.simulateYield(100);

        uint256 navAfter = vault.nav();
        assertGt(navAfter, navBefore);
    }

    // ─────────────────── Rebalance ───────────────────

    function _fullAllocate() internal {
        _depositAndPropose(TEN_K);
        vm.prank(operator);
        vault.executeAllocation();
    }

    function test_rebalance_too_soon_reverts() public {
        _fullAllocate();
        AmanaVault.Allocation memory w2 = AmanaVault.Allocation({usdyBps: 5000, mUsdBps: 5000, aaveBps: 0, mi4Bps: 0});
        vm.prank(operator);
        vm.expectRevert();
        vault.rebalance(w2, keccak256("r2"));
    }

    function test_rebalance_after_24h_works() public {
        _fullAllocate();
        vm.warp(block.timestamp + 24 hours + 1);
        AmanaVault.Allocation memory w2 = AmanaVault.Allocation({usdyBps: 5000, mUsdBps: 5000, aaveBps: 0, mi4Bps: 0});
        vm.prank(operator);
        vault.rebalance(w2, keccak256("r2"));
        AmanaVault.Allocation memory c = vault.currentAllocation();
        assertEq(c.usdyBps, 5000);
        assertEq(c.mUsdBps, 5000);
        assertEq(c.aaveBps, 0);
    }

    function test_rebalance_byStranger_reverts() public {
        _fullAllocate();
        vm.warp(block.timestamp + 24 hours + 1);
        AmanaVault.Allocation memory w2 = AmanaVault.Allocation({usdyBps: 5000, mUsdBps: 5000, aaveBps: 0, mi4Bps: 0});
        vm.prank(stranger);
        vm.expectRevert(AmanaVault.NotOperator.selector);
        vault.rebalance(w2, bytes32(0));
    }

    function test_rebalance_invalidWeights_reverts() public {
        _fullAllocate();
        vm.warp(block.timestamp + 24 hours + 1);
        AmanaVault.Allocation memory bad = AmanaVault.Allocation({usdyBps: 5000, mUsdBps: 5000, aaveBps: 100, mi4Bps: 0});
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(AmanaVault.InvalidWeights.selector, 10100));
        vault.rebalance(bad, bytes32(0));
    }

    // ─────────────────── Defensive Exit ───────────────────

    function test_defensiveExit_happyPath() public {
        _fullAllocate();
        bytes32 riskHash = keccak256("usdy-depeg");
        vm.prank(operator);
        vault.triggerDefensiveExit(riskHash);
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.DefensiveExit));
        // all USDC recovered (within rounding)
        assertApproxEqRel(usdc.balanceOf(address(vault)), TEN_K, 1e16);
    }

    function test_defensiveExit_emits_RiskTriggered() public {
        _fullAllocate();
        bytes32 riskHash = keccak256("usdy-depeg");
        vm.prank(operator);
        vm.expectEmit(true, false, false, true);
        emit AmanaVault.RiskTriggered(0, riskHash);
        vault.triggerDefensiveExit(riskHash);
    }

    function test_defensiveExit_byStranger_reverts() public {
        _fullAllocate();
        vm.prank(stranger);
        vm.expectRevert(AmanaVault.NotOperator.selector);
        vault.triggerDefensiveExit(bytes32(0));
    }

    function test_defensiveExit_wrongState_reverts() public {
        _depositOnly(TEN_K);
        vm.prank(operator);
        vm.expectRevert();
        vault.triggerDefensiveExit(bytes32(0));
    }

    // ─────────────────── Withdraw ───────────────────

    function test_withdraw_afterAllocate_unwindsAndPays() public {
        _fullAllocate();
        uint256 ownerBalBefore = usdc.balanceOf(owner);
        vm.prank(owner);
        vault.withdraw();
        uint256 ownerBalAfter = usdc.balanceOf(owner);
        // recovered ~10K USDC
        assertApproxEqRel(ownerBalAfter - ownerBalBefore, TEN_K, 1e16);
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.Completed));
    }

    function test_withdraw_afterDefensiveExit_pays() public {
        _fullAllocate();
        vm.prank(operator);
        vault.triggerDefensiveExit(bytes32(0));
        uint256 ownerBalBefore = usdc.balanceOf(owner);
        vm.prank(owner);
        vault.withdraw();
        assertGt(usdc.balanceOf(owner), ownerBalBefore);
    }

    function test_withdraw_byStranger_reverts() public {
        _fullAllocate();
        vm.prank(stranger);
        vm.expectRevert();
        vault.withdraw();
    }

    // ─────────────────── Owner functions ───────────────────

    function test_setOperator_byOwner_works() public {
        address newOp = makeAddr("newOp");
        vm.prank(owner);
        vault.setOperator(newOp);
        assertEq(vault.operator(), newOp);
    }

    function test_setOperator_byStranger_reverts() public {
        vm.prank(stranger);
        vm.expectRevert();
        vault.setOperator(stranger);
    }

    function test_setAgentIds_byOwner_works() public {
        vm.prank(owner);
        vault.setAgentIds(1001, 2002, 3003);
        assertEq(vault.allocatorAgentId(), 1001);
        assertEq(vault.riskAgentId(), 2002);
        assertEq(vault.reporterAgentId(), 3003);
        uint256[3] memory ids = vault.agentIds();
        assertEq(ids[0], 1001);
        assertEq(ids[1], 2002);
        assertEq(ids[2], 3003);
    }

    function test_setAgentIds_byStranger_reverts() public {
        vm.prank(stranger);
        vm.expectRevert();
        vault.setAgentIds(1, 2, 3);
    }

    function test_pause_unpause_byOwner() public {
        vm.prank(owner);
        vault.pause();
        assertTrue(vault.paused());

        vm.startPrank(owner);
        usdc.approve(address(vault), TEN_K);
        vm.expectRevert();
        vault.deposit(TEN_K);
        vm.stopPrank();

        vm.prank(owner);
        vault.unpause();
        assertFalse(vault.paused());
    }

    function test_emergencyExit_byOwner_unwindsAll() public {
        _fullAllocate();
        vm.prank(owner);
        vault.emergencyExit();
        assertApproxEqRel(usdc.balanceOf(address(vault)), TEN_K, 1e16);
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.DefensiveExit));
    }

    function test_emergencyExit_byStranger_reverts() public {
        _fullAllocate();
        vm.prank(stranger);
        vm.expectRevert();
        vault.emergencyExit();
    }

    // ─────────────────── Reporter ───────────────────

    function test_recordReport_byOperator_emits_event() public {
        bytes32 h = keccak256("week-1");
        vm.prank(operator);
        vm.expectEmit(true, true, false, true);
        emit AmanaVault.ReputationEvent(0, "REPORT", h, block.timestamp);
        vault.recordReport(h);
    }

    function test_recordReport_byStranger_reverts() public {
        vm.prank(stranger);
        vm.expectRevert(AmanaVault.NotOperator.selector);
        vault.recordReport(bytes32(0));
    }

    // ─────────────────── State machine traces ───────────────────

    function test_fullCycle_idle_to_completed() public {
        // Idle -> Analyzing
        _depositOnly(TEN_K);
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.Analyzing));

        // Analyzing -> Proposing
        AmanaVault.Allocation memory w = _validWeights();
        vm.prank(operator);
        vault.propose(w, keccak256("r"));
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.Proposing));

        // Proposing -> Executing -> Attesting -> Allocated
        vm.prank(operator);
        vault.executeAllocation();
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.Allocated));

        // Allocated -> Withdrawing -> Completed
        vm.prank(owner);
        vault.withdraw();
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.Completed));
    }

    function test_deposit_after_completed_resets_to_analyzing() public {
        _fullAllocate();
        vm.prank(owner);
        vault.withdraw();
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.Completed));

        // New deposit re-enters Analyzing
        vm.startPrank(owner);
        usdc.approve(address(vault), TEN_K);
        vault.deposit(TEN_K);
        vm.stopPrank();
        assertEq(uint256(vault.state()), uint256(AmanaVault.VaultState.Analyzing));
    }
}
