import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-gas-reporter';
import 'hardhat-ethernal';
import dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: '0.8.9',
  defaultNetwork: 'goerli',
  // ethernal: {
  //   uploadAst: true,
  //   workspace: 'Abstract',
  //   resetOnStart: 'Abstract',
  // },
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
      url: 'https://nd-859-124-678.p2pify.com/a7da82774e6a23d13ac2d631d640a48c',
      // url:
      //   process.env.TESTNET_ALCHEMY_URL! + process.env.TESTNET_ALCHEMY_API_KEY!,
      // accounts: [`0x${process.env.TESTNET_PRIVATE_KEY}`],
      // forking: {
      //   url:
      //     process.env.TESTNET_ALCHEMY_URL! +
      //     process.env.TESTNET_ALCHEMY_API_KEY!,
      //   blockNumber: Number(process.env.TESTNET_BLOCK_NUM_PIN!),
      // },
    },
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
  gasReporter: {
    enabled: true,
    remoteContracts: [],
  },
};

export default config;
