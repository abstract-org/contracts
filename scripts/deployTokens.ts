import { ethers } from 'hardhat';
import { TokenFactoryDeployer } from '../utils/TokenFactoryDeployer';

async function main() {
  const [deployer] = await ethers.getSigners();

  const [TestToken, Weth] = await Promise.all([
    TokenFactoryDeployer.deploy(deployer, {
      name: 'TEST_ABSTRACT_TOKEN',
      symbol: 'TAT',
      supply: '1000000000'
    }),
    TokenFactoryDeployer.deploy(deployer, {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      supply: '1000000000'
    })
  ]);

  console.log('TestToken and Weth deployed. Copy-paste to .env:');
  console.log(`TEST_TOKEN_ADDRESS=${TestToken.address}`);
  console.log(`WETH_ADDRESS=${Weth.address}`);

  return {
    TestToken,
    Weth
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
