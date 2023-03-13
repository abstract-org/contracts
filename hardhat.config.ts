import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-ethers';
import dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: '0.8.9',
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 1337,
      initialBaseFeePerGas: 0,
      accounts: [
        {
          privateKey: `0x${process.env.TESTNET_PRIVATE_KEY}`,
          balance: '10000000000000000000000', // 10000 ETH,
        },
      ],
    },
    goerli: {
      url:
        process.env.TESTNET_ALCHEMY_URL! + process.env.TESTNET_ALCHEMY_API_KEY!,
      accounts: [`0x${process.env.TESTNET_PRIVATE_KEY}`],
      forking: {
        url:
          process.env.TESTNET_ALCHEMY_URL! +
          process.env.TESTNET_ALCHEMY_API_KEY!,
        blockNumber: Number(process.env.TESTNET_BLOCK_NUM_PIN!),
      },
    },
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
};

export default config;
