import { SimpleFactory } from '../typechain-types';
import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export async function createToken(
  simpleFactory: SimpleFactory,
  initialSupply: BigNumber,
  deployer: SignerWithAddress,
  params: Record<string, string>
): Promise<string> {
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
