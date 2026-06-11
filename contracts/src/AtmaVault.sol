// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IMockUSDY, IMockMUSD, IMockAavePool, IMockMI4} from "./interfaces/IAtmaAssets.sol";

/// @title AtmaVault — Treasury Orchestration Protocol on Mantle
/// @notice ERC-4626-style vault that accepts USDC, allocates across USDY/mUSD/Aave V3/MI4 under an off-chain
///         policy operator (the ATMA agent orchestrator), and emits ERC-8004-style attestations per decision.
/// @dev    Single-user vault per deployment (kept simple for hackathon; multi-user comes in V2).
contract AtmaVault is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────
    //  State machine
    // ─────────────────────────────────────────────────────────────────────

    enum VaultState {
        Idle,           // 0 — no active deposit
        Analyzing,      // 1 — agent reading state
        Proposing,      // 2 — agent submitted weights
        Executing,      // 3 — routing tx in flight
        Attesting,      // 4 — emitting ERC-8004 event
        Allocated,      // 5 — funds deployed
        Rebalancing,    // 6 — agent re-routing
        RiskTriggered,  // 7 — defensive exit in progress
        Withdrawing,    // 8 — user pulling out
        DefensiveExit,  // 9 — terminal: forced to USDC
        Completed       // 10 — terminal: user withdrew
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Storage
    // ─────────────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;
    IMockUSDY public immutable usdy;
    IMockMUSD public immutable mUsd;
    IMockAavePool public immutable aavePool;
    IMockMI4 public immutable mi4;

    /// @notice Off-chain operator (ATMA orchestrator) authorized to propose/execute allocations.
    address public operator;

    /// @notice ERC-8004 agent identity IDs (set after registration on Mantle Mainnet).
    uint256 public allocatorAgentId;
    uint256 public riskAgentId;
    uint256 public reporterAgentId;

    VaultState public state;
    uint256 public entryNAV;            // total USDC deposited - withdrawn
    uint256 public lastRebalanceAt;     // gas-protected cadence (24h min)

    struct Allocation {
        uint16 usdyBps;   // basis points (0-10000)
        uint16 mUsdBps;
        uint16 aaveBps;
        uint16 mi4Bps;
    }

    Allocation public proposed;
    Allocation public current;
    bytes32 public proposedReasoningHash;

    // ─────────────────────────────────────────────────────────────────────
    //  Events (indexed by ERC-8004 agent ID for queryability)
    // ─────────────────────────────────────────────────────────────────────

    event Deposited(address indexed user, uint256 usdcAmount, uint256 nav);
    event AllocationProposed(uint256 indexed agentId, Allocation weights, bytes32 reasoningHash);
    event AllocationExecuted(uint256 indexed agentId, Allocation weights, uint256 navAfter);
    event RebalanceTriggered(uint256 indexed agentId, Allocation oldW, Allocation newW, bytes32 reasoningHash);
    event RiskTriggered(uint256 indexed agentId, bytes32 riskSignalHash);
    event DefensiveExited(uint256 indexed agentId, uint256 totalRecovered);
    event WithdrawnByUser(address indexed user, uint256 usdcAmount);
    event EmergencyExited(address indexed owner, uint256 totalRecovered);

    /// @notice ERC-8004-style reputation event. Every decision emits one indexed by agent ID.
    event ReputationEvent(
        uint256 indexed agentId,
        string indexed eventType,    // "ALLOCATE" | "REBALANCE" | "RISK" | "EXIT" | "REPORT"
        bytes32 reasoningHash,
        uint256 timestamp
    );

    event AgentIdsUpdated(uint256 allocatorId, uint256 riskId, uint256 reporterId);
    event OperatorUpdated(address indexed newOperator);
    event StateChanged(VaultState indexed from, VaultState indexed to);

    // ─────────────────────────────────────────────────────────────────────
    //  Errors
    // ─────────────────────────────────────────────────────────────────────

    error NotOperator();
    error NotOwnerOrOperator();
    error InvalidState(VaultState current, VaultState expected);
    error InvalidWeights(uint256 sum);
    error ZeroAmount();
    error RebalanceTooSoon(uint256 lastAt, uint256 minInterval);
    error InsufficientNAV();

    // ─────────────────────────────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────────────────────────────

    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    modifier onlyOwnerOrOperator() {
        if (msg.sender != owner() && msg.sender != operator) revert NotOwnerOrOperator();
        _;
    }

    modifier inState(VaultState expected) {
        if (state != expected) revert InvalidState(state, expected);
        _;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _usdy,
        address _mUsd,
        address _aavePool,
        address _mi4,
        address _initialOwner,
        address _initialOperator
    ) Ownable(_initialOwner) {
        usdc = IERC20(_usdc);
        usdy = IMockUSDY(_usdy);
        mUsd = IMockMUSD(_mUsd);
        aavePool = IMockAavePool(_aavePool);
        mi4 = IMockMI4(_mi4);
        operator = _initialOperator;
        state = VaultState.Idle;
        emit OperatorUpdated(_initialOperator);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  User-facing functions
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Vault owner deposits USDC. Transitions Idle -> Analyzing.
    function deposit(uint256 amount) external whenNotPaused nonReentrant onlyOwner {
        if (amount == 0) revert ZeroAmount();
        if (state != VaultState.Idle && state != VaultState.Allocated && state != VaultState.Completed) {
            revert InvalidState(state, VaultState.Idle);
        }
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        entryNAV += amount;
        emit Deposited(msg.sender, amount, entryNAV);
        if (state == VaultState.Idle || state == VaultState.Completed) {
            _setState(VaultState.Analyzing);
        }
    }

    /// @notice Vault owner withdraws — only allowed in Allocated or DefensiveExit terminal.
    function withdraw() external whenNotPaused nonReentrant onlyOwner {
        if (state != VaultState.Allocated && state != VaultState.DefensiveExit && state != VaultState.Idle) {
            revert InvalidState(state, VaultState.Allocated);
        }
        // Unwind all positions to USDC first if we're Allocated.
        if (state == VaultState.Allocated) {
            _setState(VaultState.Withdrawing);
            _unwindAll();
        }
        uint256 bal = usdc.balanceOf(address(this));
        if (bal == 0) revert InsufficientNAV();
        usdc.safeTransfer(msg.sender, bal);
        emit WithdrawnByUser(msg.sender, bal);
        entryNAV = 0;
        current = Allocation(0, 0, 0, 0);
        _setState(VaultState.Completed);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Agent / operator functions
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Allocator agent proposes weights. State: Analyzing -> Proposing.
    function propose(Allocation calldata weights, bytes32 reasoningHash)
        external
        whenNotPaused
        onlyOperator
        inState(VaultState.Analyzing)
    {
        _checkWeights(weights);
        proposed = weights;
        proposedReasoningHash = reasoningHash;
        emit AllocationProposed(allocatorAgentId, weights, reasoningHash);
        emit ReputationEvent(allocatorAgentId, "ALLOCATE", reasoningHash, block.timestamp);
        _setState(VaultState.Proposing);
    }

    /// @notice Execute the proposed allocation. State: Proposing -> Executing -> Attesting -> Allocated.
    function executeAllocation() external whenNotPaused nonReentrant onlyOwnerOrOperator inState(VaultState.Proposing) {
        _setState(VaultState.Executing);
        Allocation memory w = proposed;
        uint256 total = usdc.balanceOf(address(this));
        if (total == 0) revert InsufficientNAV();

        uint256 toUsdy = (total * w.usdyBps) / 10_000;
        uint256 toMusd = (total * w.mUsdBps) / 10_000;
        uint256 toAave = (total * w.aaveBps) / 10_000;
        uint256 toMi4  = total - toUsdy - toMusd - toAave; // remainder accounts for rounding

        if (toUsdy > 0) { usdc.forceApprove(address(usdy), toUsdy); usdy.deposit(toUsdy); }
        if (toMusd > 0) { usdc.forceApprove(address(mUsd), toMusd); mUsd.deposit(toMusd); }
        if (toAave > 0) { usdc.forceApprove(address(aavePool), toAave); aavePool.supply(toAave); }
        if (toMi4  > 0) { usdc.forceApprove(address(mi4), toMi4);  mi4.buy(toMi4); }

        current = w;
        proposed = Allocation(0, 0, 0, 0);
        lastRebalanceAt = block.timestamp;

        _setState(VaultState.Attesting);
        emit AllocationExecuted(allocatorAgentId, w, _navInUSDC());
        emit ReputationEvent(allocatorAgentId, "ALLOCATE", proposedReasoningHash, block.timestamp);
        _setState(VaultState.Allocated);
    }

    /// @notice Rebalance into new weights (Allocated -> Rebalancing -> Allocated).
    /// @dev    Unwinds all current positions, re-routes per new weights. 24h cadence guard.
    function rebalance(Allocation calldata newWeights, bytes32 reasoningHash)
        external
        whenNotPaused
        nonReentrant
        onlyOperator
        inState(VaultState.Allocated)
    {
        if (block.timestamp < lastRebalanceAt + 24 hours) {
            revert RebalanceTooSoon(lastRebalanceAt, 24 hours);
        }
        _checkWeights(newWeights);

        Allocation memory oldW = current;
        _setState(VaultState.Rebalancing);
        _unwindAll();

        // Now apply new weights from the resulting USDC balance.
        proposed = newWeights;
        proposedReasoningHash = reasoningHash;
        Allocation memory w = newWeights;
        uint256 total = usdc.balanceOf(address(this));

        uint256 toUsdy = (total * w.usdyBps) / 10_000;
        uint256 toMusd = (total * w.mUsdBps) / 10_000;
        uint256 toAave = (total * w.aaveBps) / 10_000;
        uint256 toMi4  = total - toUsdy - toMusd - toAave;

        if (toUsdy > 0) { usdc.forceApprove(address(usdy), toUsdy); usdy.deposit(toUsdy); }
        if (toMusd > 0) { usdc.forceApprove(address(mUsd), toMusd); mUsd.deposit(toMusd); }
        if (toAave > 0) { usdc.forceApprove(address(aavePool), toAave); aavePool.supply(toAave); }
        if (toMi4  > 0) { usdc.forceApprove(address(mi4), toMi4);  mi4.buy(toMi4); }

        current = w;
        proposed = Allocation(0, 0, 0, 0);
        lastRebalanceAt = block.timestamp;

        emit RebalanceTriggered(allocatorAgentId, oldW, w, reasoningHash);
        emit ReputationEvent(allocatorAgentId, "REBALANCE", reasoningHash, block.timestamp);
        _setState(VaultState.Allocated);
    }

    /// @notice Risk agent triggers defensive exit. State: Allocated -> RiskTriggered -> DefensiveExit.
    function triggerDefensiveExit(bytes32 riskSignalHash)
        external
        whenNotPaused
        nonReentrant
        onlyOperator
        inState(VaultState.Allocated)
    {
        _setState(VaultState.RiskTriggered);
        emit RiskTriggered(riskAgentId, riskSignalHash);
        emit ReputationEvent(riskAgentId, "RISK", riskSignalHash, block.timestamp);

        _unwindAll();
        uint256 recovered = usdc.balanceOf(address(this));
        emit DefensiveExited(riskAgentId, recovered);
        emit ReputationEvent(riskAgentId, "EXIT", riskSignalHash, block.timestamp);
        current = Allocation(0, 0, 0, 0);
        _setState(VaultState.DefensiveExit);
    }

    /// @notice Reporter agent logs a snapshot — heartbeat or weekly P&L.
    function recordReport(bytes32 reportHash) external whenNotPaused onlyOperator {
        emit ReputationEvent(reporterAgentId, "REPORT", reportHash, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Owner functions
    // ─────────────────────────────────────────────────────────────────────

    function setOperator(address newOperator) external onlyOwner {
        operator = newOperator;
        emit OperatorUpdated(newOperator);
    }

    function setAgentIds(uint256 allocatorId, uint256 riskId, uint256 reporterId) external onlyOwner {
        allocatorAgentId = allocatorId;
        riskAgentId = riskId;
        reporterAgentId = reporterId;
        emit AgentIdsUpdated(allocatorId, riskId, reporterId);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Emergency: owner force-unwinds all positions to USDC regardless of state.
    function emergencyExit() external nonReentrant onlyOwner {
        _unwindAll();
        uint256 recovered = usdc.balanceOf(address(this));
        emit EmergencyExited(msg.sender, recovered);
        current = Allocation(0, 0, 0, 0);
        if (state != VaultState.Completed) {
            _setState(VaultState.DefensiveExit);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Views
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Total NAV in USDC equivalents (sum of USDC + valued USDY + valued mUSD + valued aUSDC + valued MI4).
    function nav() external view returns (uint256) {
        return _navInUSDC();
    }

    function currentAllocation() external view returns (Allocation memory) {
        return current;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Internal
    // ─────────────────────────────────────────────────────────────────────

    function _checkWeights(Allocation calldata w) internal pure {
        uint256 s = uint256(w.usdyBps) + uint256(w.mUsdBps) + uint256(w.aaveBps) + uint256(w.mi4Bps);
        if (s != 10_000) revert InvalidWeights(s);
    }

    function _setState(VaultState to) internal {
        emit StateChanged(state, to);
        state = to;
    }

    /// @notice Unwind every position into USDC.
    function _unwindAll() internal {
        // Sell MI4 first (lowest priority hold), then Aave, then mUSD, then USDY.
        uint256 mi4Bal = mi4.balanceOf(address(this));
        if (mi4Bal > 0) mi4.sell(mi4Bal);

        uint256 aaveBal = aavePool.balanceOf(address(this));
        if (aaveBal > 0) aavePool.withdrawFromPool(aaveBal);

        uint256 mUsdBal = mUsd.balanceOf(address(this));
        if (mUsdBal > 0) mUsd.withdraw(mUsdBal);

        uint256 usdyBal = usdy.balanceOf(address(this));
        if (usdyBal > 0) usdy.withdraw(usdyBal);
    }

    function _navInUSDC() internal view returns (uint256) {
        uint256 cash = usdc.balanceOf(address(this));
        uint256 fromUsdy = (usdy.balanceOf(address(this)) * usdy.pricePerShare()) / 1e18 / 1e12;
        uint256 fromMusd = (mUsd.balanceOf(address(this)) * mUsd.pricePerShare()) / 1e18 / 1e12;
        uint256 fromAave = (aavePool.balanceOf(address(this)) * aavePool.pricePerShare()) / 1e18;
        uint256 fromMi4  = (mi4.balanceOf(address(this)) * mi4.pricePerShare()) / 1e18 / 1e12;
        return cash + fromUsdy + fromMusd + fromAave + fromMi4;
    }

    /// @notice ERC-8004 stub interface — returns the 3 agent IDs (for off-chain reading).
    function agentIds() external view returns (uint256[3] memory) {
        return [allocatorAgentId, riskAgentId, reporterAgentId];
    }
}
