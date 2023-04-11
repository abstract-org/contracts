import { ethers } from 'hardhat';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-gas-reporter';
import '@nomiclabs/hardhat-etherscan';
import dotenv from 'dotenv';
import { RemoteContract } from 'hardhat-gas-reporter/dist/src/types';
dotenv.config();
dotenv.config({ path: '.env.local' });

import { privateKey } from './secrets.json';

type ContractJson = { abi: any; bytecode: string };
const UniswapContractArtifacts: { [name: string]: ContractJson } = {
  Quoter: require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'),
  UniswapV3Factory: require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'),
  SwapRouter: require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json'),
  NFTDescriptor: require('@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json'),
  NonfungibleTokenPositionDescriptor: require('@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json'),
  NonfungiblePositionManager: require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json')
};
const getRemoteContract = (contractName: string, envName: string) => {
  const address = process.env[envName];

  return !address
    ? []
    : [
        {
          address,
          abi: UniswapContractArtifacts[contractName].abi,
          name: contractName
        }
      ];
};

const remoteContracts: RemoteContract[] = [
  ...getRemoteContract('UniswapV3Factory', 'UNISWAP_FACTORY_ADDRESS'),
  ...getRemoteContract('SwapRouter', 'UNISWAP_ROUTER_ADDRESS'),
  ...getRemoteContract('Quoter', 'UNISWAP_QUOTER_ADDRESS'),
  ...getRemoteContract('NFTDescriptor', 'UNISWAP_NFT_DESCRIPTOR_LIBRARY_ADDRESS'),
  ...getRemoteContract('NonfungibleTokenPositionDescriptor', 'UNISWAP_POSITION_DESCRIPTOR_ADDRESS'),
  ...getRemoteContract('NonfungiblePositionManager', 'UNISWAP_POSITION_MANAGER_ADDRESS')
];

const config: HardhatUserConfig = {
  solidity: '0.8.9',
  defaultNetwork: 'ov',
  // ethernal: {
  //   uploadAst: true,
  //   workspace: 'Abstract',
  //   resetOnStart: 'Abstract',
  // },
  networks: {
    hardhat: {
      chainId: 1337,
      initialBaseFeePerGas: 0,
      mining: {
        mempool: {
          order: 'fifo'
        }
      },
      accounts: [
        {
          privateKey: `0x${process.env.TESTNET_PRIVATE_KEY}`,
          balance: '10000000000000000000000' // 10000 ETH,
        }
      ]
    },
    ov: {
      url: 'http://3.74.234.206:8077',
      chainId: 42,
      accounts: [privateKey],
      gas: 1000000,
      gasPrice: 20000000000
    }
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test'
  },
  gasReporter: {
    enabled: true,
    remoteContracts: remoteContracts
  }
};

export default config;
