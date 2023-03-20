# OpenValue Contracts

1. DeterministicERC20Factory - Creates new tokens through CREATE2
2. USDCOV - Virtual currency used for testing
3. [TBD] ERC20OV Modification of ERC20 contract that implements transferFrom which prevents rug pull and other protections

# Notes

Use Alchemy account from 1Password to define env variables as per .env.sample

Requesting ETH to your Wallet hash (requires Alchemy account to login):
https://goerlifaucet.com/

# How to start developing it:

1. Populate your .env file
   TESTNET_ALCHEMY_URL=<URL>
   TESTNET_ALCHEMY_API_KEY=<KEY>
   TESTNET_BLOCK_NUM_PIN=<BLOCK_ID>
   TESTNET_PRIVATE_KEY=<META_MASK_PRIVATE_KEY>
   TESTNET_USDCOV_DEPLOYER=<META_MASK_ADDRESS>

2. Compile contracts
   `npx hardhat compile`

3. Start local node
   `npx hardhat node`

4. Deploy Simple Factory + Token for testing
   `npx hardhat run --network goerly scripts/deploySimple.ts`

5. Deploy USDCOV Virtual Currency
   `npx hardhat run --network goerly scripts/deployUSDCOV.ts`

6. Import USDCOV to your MetaMask through deployed address
   `You should now have 1 trillion USDCOV in MetaMask`

# How to setup local contracts:

1. `npx hardhat run scripts/deployTokens.ts --network localhost`. Add `TEST_TOKEN_ADDRESS` and `WETH_ADDRESS` to `.env`
2. `npx hardhat run scripts/deployUniswap.ts --network localhost`. Add uniswap contract addresses to `.env`
3. `npx hardhat run scripts/deployPool.ts --network localhost`. Add Pool address to `.env`

After that you will be able to run tests with set up local environment. To run tests locally: `npx hardhat test --network localhost`
