import { TokenFactoryDeployer } from '../utils/TokenFactoryDeployer';
import { ethers } from 'hardhat';

export const DEFAULT_TOKEN_CONFIG = {
  name: 'TEST_ABSTRACT_TOKEN',
  symbol: 'TAT',
  supply: '1000000000',
};

describe('TokenFactory', () => {
  let tokenContract;

  before(async () => {
    const [deployer] = await ethers.getSigners();
    tokenContract = await TokenFactoryDeployer.deploy(
      deployer,
      DEFAULT_TOKEN_CONFIG
    );
  });

  it('Deploys successfully', async () => {});
  it('Sets name, symbol, supply correctly', async () => {});
  it('Mint tokens to deployer', async () => {});
});
