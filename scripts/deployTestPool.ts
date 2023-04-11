import { ethers } from 'hardhat';
import { UniswapContractArtifacts } from '../utils/UniswapV3Deployer';
import { encodePriceSqrt } from '../utils/encodePriceSqrt';
import { getOrDeployPool } from '../utils/getOrDeployPool';
import { FeeAmount } from '@uniswap/v3-sdk';

const WETH_ADDRESS = String(process.env.WETH_ADDRESS);
const TEST_TOKEN_ADDRESS = String(process.env.TEST_TOKEN_ADDRESS);
const UNISWAP_FACTORY_ADDRESS = String(process.env.UNISWAP_FACTORY_ADDRESS);
const UNISWAP_POSITION_MANAGER_ADDRESS = String(process.env.UNISWAP_POSITION_MANAGER_ADDRESS);

const poolConfig = {
  token0: WETH_ADDRESS,
  token1: TEST_TOKEN_ADDRESS,
  fee: FeeAmount.LOW
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const factory = new ethers.Contract(UNISWAP_FACTORY_ADDRESS, UniswapContractArtifacts.UniswapV3Factory.abi, deployer);
  const positionManager = new ethers.Contract(
    UNISWAP_POSITION_MANAGER_ADDRESS,
    UniswapContractArtifacts.NonfungiblePositionManager.abi,
    deployer
  );

  const sqrtPrice = encodePriceSqrt(1, 1);
  const poolAddress = await getOrDeployPool(sqrtPrice, poolConfig, { factory, deployer, positionManager });

  console.log('\n## Pool WETH-TEST deployed:');
  console.log(`WETH_TEST_TOKEN_POOL_ADDRESS=${poolAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
