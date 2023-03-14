import { UniswapV3Deployer } from '../utils/UniswapV3Deployer';
import { ethers } from 'hardhat';
import { TokenFactoryDeployer } from '../utils/TokenFactoryDeployer';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying from: ', deployer.address);

  const Weth = await TokenFactoryDeployer.deploy(deployer, {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    supply: '1000000000',
  });

  const contracts = await UniswapV3Deployer.deploy(deployer, Weth);

  console.info(UniswapV3Deployer.toTable(contracts));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
