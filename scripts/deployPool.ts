import { ethers } from 'hardhat';
import { UniswapContractArtifacts } from '../utils/UniswapV3Deployer';
import { encodePriceSqrt } from '../utils/encodePriceSqrt';

const TEST_TOKEN_ADDRESS = String(process.env.TEST_TOKEN_ADDRESS);
const WETH_ADDRESS = String(process.env.WETH_ADDRESS);
const UNISWAP_FACTORY_ADDRESS = String(process.env.UNISWAP_FACTORY_ADDRESS);
const UNISWAP_POSITION_MANAGER_ADDRESS = String(process.env.UNISWAP_POSITION_MANAGER_ADDRESS);

const poolConfig = {
  token0: WETH_ADDRESS,
  token1: TEST_TOKEN_ADDRESS,
  fee: 500
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const sqrtPrice = encodePriceSqrt(1, 1);

  const factory = new ethers.Contract(UNISWAP_FACTORY_ADDRESS, UniswapContractArtifacts.UniswapV3Factory.abi, deployer);

  const positionManager = new ethers.Contract(
    UNISWAP_POSITION_MANAGER_ADDRESS,
    UniswapContractArtifacts.NonfungiblePositionManager.abi,
    deployer
  );

  const existingPoolAddress = await factory
    .connect(deployer)
    .getPool(poolConfig.token0, poolConfig.token1, poolConfig.fee);
  let poolAddress;

  if (existingPoolAddress === '0x0000000000000000000000000000000000000000') {
    const tx = await positionManager
      .connect(deployer)
      .createAndInitializePoolIfNecessary(poolConfig.token0, poolConfig.token1, poolConfig.fee, sqrtPrice, {
        gasLimit: 10000000
      });

    await tx.wait();

    poolAddress = await factory.connect(deployer).getPool(poolConfig.token0, poolConfig.token1, poolConfig.fee, {
      gasLimit: ethers.utils.hexlify(1000000)
    });
  } else {
    poolAddress = existingPoolAddress;
  }

  console.log('## WETH/TEST_TOKEN Pool deployed:');
  console.log(`WETH_TEST_TOKEN_POOL_ADDRESS=${poolAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
