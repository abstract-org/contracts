import { ethers } from 'hardhat';
import { SimpleFactory } from '../typechain-types';
import { createToken } from '../utils/createToken';
import SimpleFactoryArtifact from '../artifacts/contracts/SimpleFactory.sol/SimpleFactory.json';

const SIMPLE_TOKEN_FACTORY_ADDRESS = String(process.env.SIMPLE_TOKEN_FACTORY_ADDRESS);

async function main() {
  const [deployer] = await ethers.getSigners();
  const initialSupply = ethers.utils.parseUnits('1000000000', 18);

  const simpleFactory = <SimpleFactory>(
    new ethers.Contract(SIMPLE_TOKEN_FACTORY_ADDRESS, SimpleFactoryArtifact.abi, deployer)
  );

  const someTokenAddress = await createToken(simpleFactory, initialSupply, deployer, {
    name: 'ANY' + Math.round(Math.random() * 1000)
  });
  const wethTokenAddress = await createToken(simpleFactory, initialSupply, deployer, { name: 'WETH' });
  console.log('\n## Token WETH deployed');
  console.log(`WETH_ADDRESS=${wethTokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
