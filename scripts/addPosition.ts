import { ethers } from 'hardhat';
import { UniswapContractArtifacts } from '../utils/UniswapV3Deployer';
import { DEFAULT_TOKEN_CONFIG } from '../test/TokenFactory';
import { encodePriceSqrt } from '../utils/encodePriceSqrt';

const TEST_TOKEN_ADDRESS = '';
const WETH_ADDRESS = '';
const UNISWAP_FACTORY_ADDRESS = '';
const UNISWAP_POSITION_MANAGER_ADDRESS = '';

const poolConfig = {
  token0: WETH_ADDRESS,
  token1: TEST_TOKEN_ADDRESS,
  fee: 500,
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const sqrtPrice = encodePriceSqrt(1, 1);

  const factory = new ethers.Contract(
    UniswapContractArtifacts.UniswapV3Factory.abi,
    UniswapContractArtifacts.UniswapV3Factory.bytecode,
    deployer
  );

  const positionManager = new ethers.Contract(
    UniswapContractArtifacts.NonfungiblePositionManager.abi,
    UniswapContractArtifacts.NonfungiblePositionManager.bytecode,
    deployer
  );

  const existingPoolAddress = await factory
    .connect(deployer)
    .getPool(poolConfig.token0, poolConfig.token1, poolConfig.fee);

  let poolAddress, receipt;

  if (existingPoolAddress === '0x0000000000000000000000000000000000000000') {
    const tx = await positionManager
      .connect(deployer)
      .createAndInitializePoolIfNecessary(
        poolConfig.token0,
        poolConfig.token1,
        poolConfig.fee,
        sqrtPrice,
        { gasLimit: 10000000 }
      );

    await tx.wait();

    poolAddress = await factory
      .connect(deployer)
      .getPool(poolConfig.token0, poolConfig.token1, poolConfig.fee, {
        gasLimit: ethers.utils.hexlify(1000000),
      });
  } else {
    poolAddress = existingPoolAddress;
  }

  console.log('WETH/TEST_TOKEN Pool is deployed on address: ', poolAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
