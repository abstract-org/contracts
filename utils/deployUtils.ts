import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import '@nomicfoundation/hardhat-chai-matchers';
import { ethers } from 'hardhat';
import { TokenFactoryDeployer } from './TokenFactoryDeployer';
import { DEFAULT_TOKEN_CONFIG } from '../test/TokenFactory';
import { encodePriceSqrt } from './encodePriceSqrt';
import { getPoolImmutables, poolHelpers } from './poolHelpers';
import { Percent, Token } from '@uniswap/sdk-core';
import { nearestUsableTick, Pool, Position } from '@uniswap/v3-sdk';
import TokenAbi from '../artifacts/contracts/SimpleToken.sol/SimpleToken.json';
import { Contract } from 'ethers';

export async function deployTokens() {
  const [deployer] = await ethers.getSigners();

  const [TestToken, Weth] = await Promise.all([
    TokenFactoryDeployer.deploy(deployer, DEFAULT_TOKEN_CONFIG),
    TokenFactoryDeployer.deploy(deployer, {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      supply: '1000000000'
    })
  ]);

  return {
    TestToken,
    Weth
  };
}

export async function deployPool(
  UniswapContracts: any,
  poolConfig: {
    token0: string;
    token1: string;
    fee: number;
  }
) {
  const [deployer] = await ethers.getSigners();
  const sqrtPrice = encodePriceSqrt(1, 1);
  const existingPoolAddress = await UniswapContracts.factory
    .connect(deployer)
    .getPool(poolConfig.token0, poolConfig.token1, poolConfig.fee);
  let poolAddress, receipt;

  if (existingPoolAddress === '0x0000000000000000000000000000000000000000') {
    const tx = await UniswapContracts.positionManager
      .connect(deployer)
      .createAndInitializePoolIfNecessary(poolConfig.token0, poolConfig.token1, poolConfig.fee, sqrtPrice, {
        gasLimit: 10000000
      });

    receipt = await tx.wait();

    poolAddress = await UniswapContracts.factory
      .connect(deployer)
      .getPool(poolConfig.token0, poolConfig.token1, poolConfig.fee, {
        gasLimit: ethers.utils.hexlify(1000000)
      });
  } else {
    poolAddress = existingPoolAddress;
  }

  const pool = new ethers.Contract(poolAddress, IUniswapV3PoolABI.abi, deployer);

  return { receipt, pool };
}

export async function getAddPositionToPoolParams(UniswapContracts: any, pool: Contract) {
  const [deployer] = await ethers.getSigners();
  const poolData = await poolHelpers(pool);
  const poolImmutables = await getPoolImmutables(pool);
  const { tick, tickSpacing, fee, liquidity, sqrtPriceX96 } = poolData;
  console.log('Pool Data: ', poolData);

  // Construct Token instances
  const wethToken = new Token(31337, poolImmutables.token0, 18, 'WETH', 'Wrapped Ether');
  const testToken = new Token(31337, poolImmutables.token1, 18, DEFAULT_TOKEN_CONFIG.symbol, DEFAULT_TOKEN_CONFIG.name);

  // Initialize Pool
  const WETH_TEST_TOKEN_POOL = new Pool(wethToken, testToken, fee, sqrtPriceX96.toString(), liquidity.toString(), tick);

  // Initialize Position
  const position = new Position({
    pool: WETH_TEST_TOKEN_POOL,
    liquidity: ethers.utils.parseUnits('0.1', 18),
    tickLower: nearestUsableTick(tick, tickSpacing) - tickSpacing * 2,
    tickUpper: nearestUsableTick(tick, tickSpacing) + tickSpacing * 2
  });

  const approvalAmount = ethers.utils.parseUnits('1000', 18).toString();

  const token0Contract = new ethers.Contract(poolImmutables.token0, TokenAbi.abi, deployer);

  const token1Contract = new ethers.Contract(poolImmutables.token1, TokenAbi.abi, deployer);

  // Approve spending of WETH and Tokens for PositionManager before creating a position
  await Promise.all([
    token0Contract.connect(deployer).approve(UniswapContracts.positionManager.address, approvalAmount),
    token1Contract.connect(deployer).approve(UniswapContracts.positionManager.address, approvalAmount)
  ]);

  console.log('Tokens approved');

  const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts;
  const { amount0: amount0Min, amount1: amount1Min } = position.mintAmountsWithSlippage(new Percent(50, 10_000));

  const params = {
    token0: poolImmutables.token0,
    token1: poolImmutables.token1,
    fee,
    tickLower: nearestUsableTick(tick, tickSpacing) - tickSpacing * 2,
    tickUpper: nearestUsableTick(tick, tickSpacing) + tickSpacing * 2,
    amount0Desired: amount0Desired.toString(),
    amount1Desired: amount1Desired.toString(),
    amount0Min: amount0Min.toString(),
    amount1Min: amount1Min.toString(),
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) * 60
  };

  console.log('Position Manager params: ', params);

  return {
    mintParams: params,
    amount0Desired,
    amount1Desired,
    amount0Min,
    amount1Min,
    position,
    poolData
  };
}
