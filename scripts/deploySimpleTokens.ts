import { ethers } from 'hardhat';
import { SimpleFactory } from '../typechain-types';
import SimpleFactoryArtifact from '../artifacts/contracts/SimpleFactory.sol/SimpleFactory.json';
import { createToken } from '../utils/createToken';

const SIMPLE_TOKEN_FACTORY_ADDRESS = String(process.env.SIMPLE_TOKEN_FACTORY_ADDRESS);

async function main() {
  const [deployer] = await ethers.getSigners();
  const initialSupply = ethers.utils.parseUnits('1000000000', 18);

  const simpleFactory = <SimpleFactory>(
    new ethers.Contract(SIMPLE_TOKEN_FACTORY_ADDRESS, SimpleFactoryArtifact.abi, deployer)
  );

  const addressTokenB = await createToken(simpleFactory, initialSupply, deployer, {
    name: 'B'
  });
  const addressTokenA = await createToken(simpleFactory, initialSupply, deployer, {
    name: 'A'
  });

  console.log('\n## Tokens A and B deployed:');
  console.log(`TOKEN_A_ADDRESS=${addressTokenA}`);
  console.log(`TOKEN_B_ADDRESS=${addressTokenB}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
