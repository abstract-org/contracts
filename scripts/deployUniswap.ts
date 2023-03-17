import { UniswapV3Deployer } from '../utils/UniswapV3Deployer';
import { ethers } from 'hardhat';

const WETH_ADDRESS = process.env.WETH_ADDRESS;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying from: ', deployer.address);

  const contracts = await UniswapV3Deployer.deploy(deployer, WETH_ADDRESS);

  console.info(UniswapV3Deployer.toTable(contracts));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
