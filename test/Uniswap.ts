import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import {
  UniswapV3Deployer,
  UniswapContractArtifacts,
} from '../utils/UniswapV3Deployer';
import { ethers } from 'hardhat';
import { Pool, Position, nearestUsableTick } from '@uniswap/v3-sdk';
import { Token, Percent } from '@uniswap/sdk-core';
import { TokenFactoryDeployer } from '../utils/TokenFactoryDeployer';
import { DEFAULT_TOKEN_CONFIG } from './TokenFactory';
import { expect } from 'chai';
import { getPoolImmutables, poolHelpers } from '../utils/poolHelpers';
import { encodePriceSqrt } from '../utils/encodePriceSqrt';

const CHAIN_ID = 31337;

describe('Uniswap', () => {
  let UniswapContracts: { [name: string]: ethers.Contract };
  let TestToken: ethers.Contract;
  let Weth: ethers.Contract;

  async function deployTokens() {
    const [deployer] = await ethers.getSigners();

    const [TestToken, Weth] = await Promise.all([
      TokenFactoryDeployer.deploy(deployer, DEFAULT_TOKEN_CONFIG),
      TokenFactoryDeployer.deploy(deployer, {
        name: 'Wrapped Ether',
        symbol: 'WETH',
        supply: '1000000000',
      }),
    ]);

    return {
      TestToken,
      Weth,
    };
  }

  async function deployPool(poolConfig: {
    token0: string;
    token1: string;
    fee: number;
  }) {
    const [deployer] = await ethers.getSigners();
    const sqrtPrice = encodePriceSqrt(1, 1);
    const existingPoolAddress = await UniswapContracts.factory
      .connect(deployer)
      .getPool(poolConfig.token0, poolConfig.token1, poolConfig.fee);
    let poolAddress, receipt;

    if (existingPoolAddress === '0x0000000000000000000000000000000000000000') {
      const tx = await UniswapContracts.positionManager
        .connect(deployer)
        .createAndInitializePoolIfNecessary(
          poolConfig.token0,
          poolConfig.token1,
          poolConfig.fee,
          sqrtPrice,
          { gasLimit: 10000000 }
        );

      receipt = await tx.wait();

      poolAddress = await UniswapContracts.factory
        .connect(deployer)
        .getPool(poolConfig.token0, poolConfig.token1, poolConfig.fee, {
          gasLimit: ethers.utils.hexlify(1000000),
        });
    } else {
      poolAddress = existingPoolAddress;
    }

    const pool = new ethers.Contract(
      poolAddress,
      IUniswapV3PoolABI.abi,
      deployer
    );

    return { receipt, pool };
  }

  async function getAddPositionToPoolParams(pool: ethers.Contract) {
    const [deployer] = await ethers.getSigners();
    const poolData = await poolHelpers(pool);
    const { tick, tickSpacing, fee, liquidity, sqrtPriceX96 } = poolData;
    console.log('Pool Data: ', poolData);

    // Construct Token instances
    const wethToken = new Token(
      CHAIN_ID,
      Weth.address,
      18,
      'WETH',
      'Wrapped Ether'
    );
    const testToken = new Token(
      CHAIN_ID,
      TestToken.address,
      18,
      DEFAULT_TOKEN_CONFIG.symbol,
      DEFAULT_TOKEN_CONFIG.name
    );

    // Initialize Pool
    const WETH_TEST_TOKEN_POOL = new Pool(
      wethToken,
      testToken,
      fee,
      sqrtPriceX96.toString(),
      liquidity.toString(),
      tick
    );

    // Initialize Position
    const position = new Position({
      pool: WETH_TEST_TOKEN_POOL,
      liquidity: ethers.utils.parseUnits('0.1', 18),
      tickLower: nearestUsableTick(tick, tickSpacing) - tickSpacing * 2,
      tickUpper: nearestUsableTick(tick, tickSpacing) + tickSpacing * 2,
    });

    const approvalAmount = ethers.utils.parseUnits('1000', 18).toString();

    // Approve spending of WETH and Tokens for PositionManager before creating a position
    await Promise.all([
      Weth.connect(deployer).approve(
        UniswapContracts.positionManager.address,
        approvalAmount
      ),
      TestToken.connect(deployer).approve(
        UniswapContracts.positionManager.address,
        approvalAmount
      ),
    ]);

    console.log('Tokens approved');

    const { amount0: amount0Desired, amount1: amount1Desired } =
      position.mintAmounts;
    const { amount0: amount0Min, amount1: amount1Min } =
      position.mintAmountsWithSlippage(new Percent(50, 10_000));

    const params = {
      token0: Weth.address,
      token1: TestToken.address,
      fee,
      tickLower: nearestUsableTick(tick, tickSpacing) - tickSpacing * 2,
      tickUpper: nearestUsableTick(tick, tickSpacing) + tickSpacing * 2,
      amount0Desired: amount0Desired.toString(),
      amount1Desired: amount1Desired.toString(),
      amount0Min: amount0Min.toString(),
      amount1Min: amount1Min.toString(),
      recipient: deployer.address,
      deadline: Math.floor(Date.now() / 1000) * 60,
    };

    console.log('Position Manager params: ', params);

    return {
      mintParams: params,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      position,
      poolData,
    };
  }

  before(async () => {
    const [deployer] = await ethers.getSigners();
    const tokens = await deployTokens();

    TestToken = tokens.TestToken;
    Weth = tokens.Weth;
    UniswapContracts = await UniswapV3Deployer.deploy(deployer, Weth);
    console.log('before hook setup completed');
  });

  it('Creates pool', async () => {
    const { pool } = await deployPool({
      token0: Weth.address,
      token1: TestToken.address,
      fee: 500,
    });

    const { token0, token1 } = await getPoolImmutables(pool);

    console.log('Created pool address: ', pool.address);
    expect(pool.address).not.to.equal(
      '0x0000000000000000000000000000000000000000'
    );
    expect(token0).to.equal(Weth.address);
    expect(token1).to.equal(TestToken.address);
  });

  it('Adds liquidity position', async () => {
    const [deployer] = await ethers.getSigners();

    const { pool } = await deployPool({
      token0: Weth.address,
      token1: TestToken.address,
      fee: 500,
    });

    const nonFungiblePositionManager = new ethers.Contract(
      UniswapContracts.positionManager.address,
      UniswapContractArtifacts.NonfungiblePositionManager.abi,
      deployer
    );

    const { mintParams, amount0Desired, amount1Desired } =
      await getAddPositionToPoolParams(pool);

    const positionMintTx = nonFungiblePositionManager
      .connect(deployer)
      .mint(mintParams, {
        gasLimit: ethers.utils.hexlify(1000000),
      });

    await expect(positionMintTx).to.emit(
      nonFungiblePositionManager,
      'IncreaseLiquidity'
    );
    await expect(positionMintTx).to.changeTokenBalance(
      Weth,
      deployer.address,
      `-${amount0Desired}`
    );
    await expect(positionMintTx).to.changeTokenBalance(
      TestToken,
      deployer.address,
      `-${amount1Desired}`
    );
  });

  it('Process ExactInputSingle Swap', async () => {
    const [deployer] = await ethers.getSigners();

    const { pool } = await deployPool({
      token0: Weth.address,
      token1: TestToken.address,
      fee: 500,
    });

    const nonFungiblePositionManager = new ethers.Contract(
      UniswapContracts.positionManager.address,
      UniswapContractArtifacts.NonfungiblePositionManager.abi,
      deployer
    );

    const { mintParams, poolData } = await getAddPositionToPoolParams(pool);

    const positionMintTx = await nonFungiblePositionManager
      .connect(deployer)
      .mint(mintParams, {
        gasLimit: ethers.utils.hexlify(1000000),
      });

    await positionMintTx.wait();

    const approvalAmount = ethers.utils.parseUnits('1000', 18).toString();

    // Approve spending of WETH and Tokens for SwapRouter before creating a swap
    await Promise.all([
      Weth.connect(deployer).approve(
        UniswapContracts.router.address,
        approvalAmount
      ),
      TestToken.connect(deployer).approve(
        UniswapContracts.router.address,
        approvalAmount
      ),
    ]);

    const poolImmutables = await getPoolImmutables(pool);
    const amountIn = ethers.utils.parseUnits('10', 18).toString();

    const swapRouter = new ethers.Contract(
      UniswapContracts.router.address,
      UniswapContractArtifacts.SwapRouter.abi,
      deployer
    );

    const quoter = new ethers.Contract(
      UniswapContracts.quoter.address,
      UniswapContractArtifacts.Quoter.abi,
      deployer
    );

    // Requesting a Quote to get quoted amount out
    const quotedAmountOut = await quoter.callStatic.quoteExactInputSingle(
      poolImmutables.token0,
      poolImmutables.token1,
      poolImmutables.fee,
      amountIn,
      0
    );

    const swapParams = {
      tokenIn: poolImmutables.token0,
      tokenOut: poolImmutables.token1,
      fee: poolImmutables.fee,
      recipient: deployer.address,
      deadline: Math.floor(Date.now() / 1000) * 60,
      amountIn: amountIn,
      amountOutMinimum: quotedAmountOut.toString(), // shouldn't be 0 in production
      sqrtPriceLimitX96: 0, // shouldn't be 0 in production
    };

    console.log('Swap Params: ', swapParams);

    const swapTx = await swapRouter
      .connect(deployer)
      .exactInputSingle(swapParams, {
        gasLimit: ethers.utils.hexlify(5000000),
      });

    await expect(swapTx).to.changeTokenBalance(
      TestToken,
      deployer.address,
      `${quotedAmountOut}`
    );
  });
});
