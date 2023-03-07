import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.7.6',
      },
      {
        version: '0.8.9',
      },
    ],
  },
  defaultNetwork: 'goerly',
  networks: {
    goerly: {
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
