import { readFileSync } from 'fs';
import { ethers } from 'hardhat';
import { join } from 'path';

const WETH9PATH = join(__dirname, '..', 'utils', 'WETH9.json');
const WETH9JSON = JSON.parse(readFileSync(WETH9PATH, 'utf8'));
const WETH_ABI = WETH9JSON.abi;
const WETH_BYTECODE = WETH9JSON.bytecode;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying WETH with the account:', deployer.address);

  const WETHFactory = new ethers.ContractFactory(WETH_ABI, WETH_BYTECODE, deployer);
  const weth = await WETHFactory.deploy();

  console.log('WETH deployed to:', weth.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
