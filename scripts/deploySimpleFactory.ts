import { ethers } from 'hardhat';
import { ContractFactory } from 'ethers';
import { SimpleFactory } from '../typechain-types';

async function main() {
  const [deployer] = await ethers.getSigners();

  const SimpleFactoryFactory: ContractFactory = await ethers.getContractFactory('SimpleFactory');
  const simpleFactory: SimpleFactory = <SimpleFactory>await SimpleFactoryFactory.deploy();
  await simpleFactory.deployed();

  console.log('\n## SimpleTokenFactory deployed:');
  console.log(`SIMPLE_TOKEN_FACTORY_ADDRESS=${simpleFactory.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
