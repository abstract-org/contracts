import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from 'dotenv'

dotenv.config()

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  defaultNetwork: "goerly",
  networks: {
    goerly: {
      url: process.env.TESTNET_ALCHEMY_URL!+process.env.TESTNET_ALCHEMY_API_KEY!,
      accounts: [`0x${process.env.TESTNET_PRIVATE_KEY}`],
      forking: {
        url: 
          process.env.TESTNET_ALCHEMY_URL!+process.env.TESTNET_ALCHEMY_API_KEY!,
          blockNumber: Number(process.env.TESTNET_BLOCK_NUM_PIN!)
      }
    }
  }
};

export default config;
