import { ethers } from 'hardhat';
import { TokenFactoryDeployer } from '../utils/TokenFactoryDeployer';

async function main() {
  const [deployer] = await ethers.getSigners();

  const [TestToken, Weth] = await Promise.all([
    TokenFactoryDeployer.deploy(deployer, {
      name: 'TEST_ABSTRACT_TOKEN',
      symbol: 'TAT',
      supply: '1000000000',
    }),
    TokenFactoryDeployer.deploy(deployer, {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      supply: '1000000000',
    }),
  ]);

  console.log('TestToken deployed to address: ', TestToken.address);
  console.log('Weth deployed to address: ', Weth.address);

  return {
    TestToken,
    Weth,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
