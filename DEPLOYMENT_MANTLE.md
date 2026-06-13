# AMANA on Mantle Sepolia (live)

Deployed 2026-06-13. Chain id 5003. Explorer: https://sepolia.mantlescan.xyz

Deployer: `0xe33ac8763c031F9E14D4A3742EA56fF4ceE4CC5d`

## Contracts

| Contract | Address | Explorer |
|---|---|---|
| **AmanaVault** | `0xAC104718167145E4f315EA78c49285870bA66615` | https://sepolia.mantlescan.xyz/address/0xAC104718167145E4f315EA78c49285870bA66615 |
| MockUSDC | `0x2f616227b6628b910dc29dE88079246117b411b1` | https://sepolia.mantlescan.xyz/address/0x2f616227b6628b910dc29dE88079246117b411b1 |
| MockUSDY | `0x50a7dD6F389B26Ac6Fe7ff800a6cBb646e1CEb08` | https://sepolia.mantlescan.xyz/address/0x50a7dD6F389B26Ac6Fe7ff800a6cBb646e1CEb08 |
| MockMUSD | `0x7c35F56Fe7610E38D3e0A021425f2860aB586234` | https://sepolia.mantlescan.xyz/address/0x7c35F56Fe7610E38D3e0A021425f2860aB586234 |
| MockAavePool | `0xAE62959704f07EC09c661105176794D0C0F0F346` | https://sepolia.mantlescan.xyz/address/0xAE62959704f07EC09c661105176794D0C0F0F346 |
| MockMI4 | `0xa653e5113c6a6eD1f222D9a4713b8b0654F72917` | https://sepolia.mantlescan.xyz/address/0xa653e5113c6a6eD1f222D9a4713b8b0654F72917 |

## Agent IDs (ERC-8004)

Allocator `1001`, Risk `2002`, Reporter `3003`.

## Deploy transactions

| What | Tx hash |
|---|---|
| MockUSDC | `0x550938734cf370105e17e7f0ecbef07a222f08fda97e9e62fea2ea76708de567` |
| MockUSDY | `0x8b68d15c64c5be85430217e1e810f00c7286e6141388c73c296bf497c5ca1131` |
| MockMUSD | `0x5ae5373526630f51c1b8c4145f00233ee8974412bd52d61105783b442af8c7b1` |
| MockAavePool | `0x1ef2ac72d675ca634a5b4a5dac6d7526ea4eb376d22ece492d0346e4dcdb2c14` |
| MockMI4 | `0xd2f7c0411e9dc8edf777a1d59599717b9728812ee084bf3e9187623ad693d4b6` |
| AmanaVault | `0xfa38c3e91bec0dfaca0b97fa09407a87ab382c173dc5dc9deba5b9135a5aed35` |
| setAgentIds | `0xe99c1ba1a2e6983a2a6f75030cc5b9791d68c4c539eb5ca7c36858808c92dd52` |

## Frontend env (Vercel production)

```
NEXT_PUBLIC_CHAIN_ID=5003
NEXT_PUBLIC_AMANA_VAULT=0xAC104718167145E4f315EA78c49285870bA66615
NEXT_PUBLIC_USDC=0x2f616227b6628b910dc29dE88079246117b411b1
NEXT_PUBLIC_USDY=0x50a7dD6F389B26Ac6Fe7ff800a6cBb646e1CEb08
NEXT_PUBLIC_MUSD=0x7c35F56Fe7610E38D3e0A021425f2860aB586234
NEXT_PUBLIC_AAVE_POOL=0xAE62959704f07EC09c661105176794D0C0F0F346
NEXT_PUBLIC_MI4=0xa653e5113c6a6eD1f222D9a4713b8b0654F72917
```

## Live on-chain orchestration loop (2026-06-13)

A full agent loop was driven on-chain. State is now Allocated, NAV 1000 USDC,
allocation 34% USDY / 30% mUSD / 36% Aave. These are the ERC-8004 attestation
and allocation transactions judges can click through on Mantlescan:

| Step | Tx hash |
|---|---|
| approve USDC | `0xac37a7926843327e40c777b40210a6665aaeee6ac13790cc3d849d2d40cfb240` |
| deposit 1000 USDC | `0x010e9819e86295828149435a519ea96c7804bc4c8e345f450d1c08d1b1005d85` |
| propose (ALLOCATE attestation) | `0xcba7b76066067b14124a41bc6934c91ac1b5c264faf4277e752cdc0e9a62635c` |
| executeAllocation (routes funds + attests) | `0xc0e8bc405cbef6ad0668e4fcf504a9690f5382f34a248f094fbb2db698042601` |
| recordReport (REPORT attestation) | `0xc592f0e8e7d358df24fa2d9227876f54c81366b56fb92e041cdd2f9b637670d8` |

Allocator reasoning hash on-chain: `0x6ad4e305b8c3058bb3feed004cc213ed1f5082870b8774d10158b28233a21efe`
Reporter report hash on-chain: `0x92cde2878d56177af23c159c30b31f1781474605eecb016091fa4d387cb551c7`

Demo proof line: open the executeAllocation tx on Mantlescan and show the
ReputationEvent log. The whole loop ran end-to-end on Mantle, not in a notebook.
