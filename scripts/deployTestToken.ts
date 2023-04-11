import { ethers } from 'hardhat';
import { TokenFactoryDeployer } from '../utils/TokenFactoryDeployer';

async function main() {
  const [deployer] = await ethers.getSigners();
  const TestToken = await TokenFactoryDeployer.deploy(deployer, {
    name: 'TEST_ABSTRACT_TOKEN',
    symbol: 'TAT',
    supply: '1000000000'
  });

  console.log('\n## Token TEST deployed:');
  console.log(`TEST_TOKEN_ADDRESS=${TestToken.address}`);

  return {
    TestToken
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
