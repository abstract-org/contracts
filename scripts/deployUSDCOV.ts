import { ethers } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

const USDCOV_INITIAL_SUPPLY = ethers.utils.parseUnits('1000000000000', 18);
const deployer = process.env.TESTNET_DEPLOYER;

async function main() {
  const USDCOVFactory = await ethers.getContractFactory('USDCOV');
  console.log('Deploying USDCOV contract with the account:', deployer);
  const usdcovToken = await USDCOVFactory.deploy(deployer);
  await usdcovToken.deployed();
  console.log('USDCOV contract deployed at address:', usdcovToken.address);
  console.log(usdcovToken);

  console.log(`Minting ${USDCOV_INITIAL_SUPPLY} of tokens to ${deployer}`);
  await usdcovToken.mint(deployer, USDCOV_INITIAL_SUPPLY);

  // Get the balance of the contract owner
  const ownerBalance = await usdcovToken.balanceOf(deployer);
  console.log('Owner balance:', ethers.utils.formatUnits(ownerBalance, 18)); // should output "100000000"
}

main().catch((error: Error) => {
  console.error(error);
  process.exitCode = 1;
});
