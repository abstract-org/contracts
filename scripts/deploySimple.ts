import { ethers } from 'hardhat';
import { BigNumber, ContractFactory } from 'ethers';
import { SimpleToken, SimpleFactory } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

async function createToken(
  simpleFactory: SimpleFactory,
  initialSupply: BigNumber,
  deployer: SignerWithAddress,
  params: Record<string, string>
) {
  // Deploy Simple tokens with SimpleFactory
  const tx = await simpleFactory.createToken(
    params.name,
    params.symbol || params.name.toUpperCase() + 'SIMPL',
    initialSupply,
    deployer.address
  );
  await tx.wait();
  const receipt = await tx.wait();

  const tokenCreatedEvent = receipt.events?.find(
    (event) => event.event === 'tokenCreated' && event.args?.length && event.args[1].toString() === deployer.address
  );

  if (!tokenCreatedEvent) {
    console.log('## Token creation event not found. Address cannot be fetched');
    throw new Error();
  }

  const [tokenAddress] = tokenCreatedEvent.args || [];
  return tokenAddress;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const initialSupply = ethers.utils.parseUnits('1000000000', 18);

  // Deploy SimpleToken contract
  // const SimpleTokenFactory: ContractFactory = await ethers.getContractFactory('SimpleToken');
  // const simpleToken: SimpleToken = <SimpleToken>(
  //   await SimpleTokenFactory.deploy('MyToken', 'MTK', initialSupply, deployer.address)
  // );
  // await simpleToken.deployed();
  // console.log('## SimpleToken deployed to:', simpleToken.address);

  // Deploy SimpleFactory contract
  const SimpleFactoryFactory: ContractFactory = await ethers.getContractFactory('SimpleFactory');
  const simpleFactory: SimpleFactory = <SimpleFactory>await SimpleFactoryFactory.deploy();
  await simpleFactory.deployed();
  console.log('## SimpleTokenFactory deployed:');
  console.log(`SIMPLE_TOKEN_FACTORY_ADDRESS=${simpleFactory.address}`);

  const addressTokenA = await createToken(simpleFactory, initialSupply, deployer, {
    name: 'A'
  });
  console.log(`TOKEN_A_ADDRESS=${addressTokenA}`);

  const addressTokenB = await createToken(simpleFactory, initialSupply, deployer, {
    name: 'B'
  });
  console.log(`TOKEN_B_ADDRESS=${addressTokenB}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
