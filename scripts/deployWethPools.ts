import { ethers } from 'hardhat';
import { UniswapContractArtifacts } from '../utils/UniswapV3Deployer';
import { encodePriceSqrt } from '../utils/encodePriceSqrt';
import { getOrDeployPool, PoolConfig } from '../utils/getOrDeployPool';
import { FeeAmount } from '@uniswap/v3-sdk';

const WETH_ADDRESS = String(process.env.WETH_ADDRESS);
const TOKEN_A_ADDRESS = String(process.env.TOKEN_A_ADDRESS);
const TOKEN_B_ADDRESS = String(process.env.TOKEN_B_ADDRESS);
const UNISWAP_FACTORY_ADDRESS = String(process.env.UNISWAP_FACTORY_ADDRESS);
const UNISWAP_POSITION_MANAGER_ADDRESS = String(process.env.UNISWAP_POSITION_MANAGER_ADDRESS);

const poolAConfig = {
  token0: WETH_ADDRESS,
  token1: TOKEN_A_ADDRESS,
  fee: FeeAmount.LOW
};

const poolBConfig: PoolConfig = {
  token0: WETH_ADDRESS,
  token1: TOKEN_B_ADDRESS,
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
  const poolAddressWethA = await getOrDeployPool(sqrtPrice, poolAConfig, { factory, deployer, positionManager });
  const poolAddressWethB = await getOrDeployPool(sqrtPrice, poolBConfig, { factory, deployer, positionManager });

  console.log('\n## Pools WETH-A & WETH-B deployed:');
  console.log(`POOL_WETH_A_ADDRESS=${poolAddressWethA}`);
  console.log(`POOL_WETH_B_ADDRESS=${poolAddressWethB}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
