import { ethers } from 'hardhat';
import { ERC20Factory } from '../typechain-types';

async function main() {
  const factory = await ethers.getContractFactory('ERC20Factory');
  const erc20Factory = (await factory.deploy()) as ERC20Factory;
  await erc20Factory.deployed();
  console.log('ERC20Factory deployed to:', erc20Factory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
