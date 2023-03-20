import { ethers } from 'hardhat';
import { ContractFactory } from 'ethers';
import { SimpleToken, SimpleFactory } from '../typechain-types';

async function main() {
  const [deployer] = await ethers.getSigners();

  // Deploy SimpleToken contract
  const SimpleTokenFactory: ContractFactory = await ethers.getContractFactory('SimpleToken');
  const initialSupply = ethers.utils.parseUnits('1000000000', 18);
  const simpleToken: SimpleToken = <SimpleToken>(
    await SimpleTokenFactory.deploy('MyToken', 'MTK', initialSupply, deployer.address)
  );
  await simpleToken.deployed();
  console.log('SimpleToken deployed to:', simpleToken.address);

  // Deploy SimpleFactory contract
  const SimpleFactoryFactory: ContractFactory = await ethers.getContractFactory('SimpleFactory');
  const simpleFactory: SimpleFactory = <SimpleFactory>await SimpleFactoryFactory.deploy();
  await simpleFactory.deployed();
  console.log('SimpleFactory deployed to:', simpleFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
