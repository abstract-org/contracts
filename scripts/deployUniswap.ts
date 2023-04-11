import { UniswapV3Deployer } from '../utils/UniswapV3Deployer';
import { ethers } from 'hardhat';

const WETH_ADDRESS = String(process.env.WETH_ADDRESS);

async function main() {
  const [deployer] = await ethers.getSigners();

  const contracts = await UniswapV3Deployer.deploy(deployer, WETH_ADDRESS);

  // console.info(UniswapV3Deployer.toTable(contracts));
  console.log(`\n## Uniswap V3 contracts deployed:
UNISWAP_FACTORY_ADDRESS=${contracts.factory.address}
UNISWAP_ROUTER_ADDRESS=${contracts.router.address}
UNISWAP_QUOTER_ADDRESS=${contracts.quoter.address}
UNISWAP_NFT_DESCRIPTOR_LIBRARY_ADDRESS=${contracts.nftDescriptorLibrary.address}
UNISWAP_POSITION_DESCRIPTOR_ADDRESS=${contracts.positionDescriptor.address}
UNISWAP_POSITION_MANAGER_ADDRESS=${contracts.positionManager.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
