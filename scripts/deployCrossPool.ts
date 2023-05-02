import { ethers } from 'hardhat';
import { UniswapContractArtifacts } from '../utils/UniswapV3Deployer';
import { encodePriceSqrt } from '../utils/encodePriceSqrt';
import { getOrDeployPool } from '../utils/getOrDeployPool';
import { calcCrossPoolPrice } from '../utils/calcCrossPoolPrice';

const TOKEN_A_ADDRESS = String(process.env.TOKEN_A_ADDRESS);
const TOKEN_B_ADDRESS = String(process.env.TOKEN_B_ADDRESS);
const POOL_WETH_A_ADDRESS = String(process.env.POOL_WETH_A_ADDRESS);
const POOL_WETH_B_ADDRESS = String(process.env.POOL_WETH_B_ADDRESS);
const UNISWAP_FACTORY_ADDRESS = String(process.env.UNISWAP_FACTORY_ADDRESS);
const UNISWAP_POSITION_MANAGER_ADDRESS = String(process.env.UNISWAP_POSITION_MANAGER_ADDRESS);

const poolConfig = {
  token0: TOKEN_A_ADDRESS,
  token1: TOKEN_B_ADDRESS,
  fee: 500
};

const token0BigInt = BigInt(poolConfig.token0);
const token1BigInt = BigInt(poolConfig.token1);

if (token0BigInt > token1BigInt) {
  [poolConfig.token0, poolConfig.token1] = [poolConfig.token1, poolConfig.token0];
  console.log(`## Deploying ${poolConfig.token0}/${poolConfig.token1} inverted order`);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const factory = new ethers.Contract(UNISWAP_FACTORY_ADDRESS, UniswapContractArtifacts.UniswapV3Factory.abi, deployer);
  const positionManager = new ethers.Contract(
    UNISWAP_POSITION_MANAGER_ADDRESS,
    UniswapContractArtifacts.NonfungiblePositionManager.abi,
    deployer
  );

  const sqrtPrice = encodePriceSqrt(1, 1);
  // const sqrtPrice = await calcCrossPoolPrice(POOL_WETH_A_ADDRESS, POOL_WETH_B_ADDRESS, deployer)

  const poolAddress = await getOrDeployPool(sqrtPrice, poolConfig, { deployer, factory, positionManager });

  console.log('\n## Cross Pool A-B deployed:');
  console.log(`POOL_A_B_ADDRESS=${poolAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
