import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import { UniswapV3Deployer } from '../utils/UniswapV3Deployer';
import { ethers } from 'hardhat';
import {
  Pool,
  Position,
  NonfungiblePositionManager,
  nearestUsableTick,
} from '@uniswap/v3-sdk';
import { Token, Percent } from '@uniswap/sdk-core';
import { TokenFactoryDeployer } from '../utils/TokenFactoryDeployer';
import { DEFAULT_TOKEN_CONFIG } from './TokenFactory';
import { expect } from 'chai';
import { getPoolData } from '../utils/getPoolData';
import { encodePriceSqrt } from '../utils/encodePriceSqrt';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

const CHAIN_ID = 31337;

describe('Uniswap', () => {
  async function deployUniswapFixture() {
    const [deployer] = await ethers.getSigners();
    const TestToken = await TokenFactoryDeployer.deploy(
      deployer,
      DEFAULT_TOKEN_CONFIG
    );
    const Weth = await TokenFactoryDeployer.deploy(deployer, {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      supply: '1000000000',
    });

    const uniswapContracts = await UniswapV3Deployer.deploy(deployer, Weth);

    console.info(UniswapV3Deployer.toTable(uniswapContracts));

    return { Uniswap: uniswapContracts, Weth, TestToken, deployer };
  }

  async function deployPool(
    factory: ethers.Contract,
    positionManager: ethers.Contract,
    deployer: ethers.Signer,
    poolConfig: { token0: string; token1: string; fee: number }
  ) {
    const sqrtPrice = encodePriceSqrt(1, 1);
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

      receipt = await tx.wait();

      poolAddress = await factory
        .connect(deployer)
        .getPool(poolConfig.token0, poolConfig.token1, poolConfig.fee, {
          gasLimit: ethers.utils.hexlify(1000000),
        });
    }

    const pool = new ethers.Contract(
      poolAddress,
      IUniswapV3PoolABI.abi,
      deployer
    );

    return { receipt, poolAddress, pool };
  }

  it('Creates pool', async () => {
    const { Uniswap, Weth, TestToken, deployer } = await loadFixture(
      deployUniswapFixture
    );
    const deployPoolFixture = async () =>
      deployPool(Uniswap.factory, Uniswap.positionManager, deployer, {
        token0: Weth.address,
        token1: TestToken.address,
        fee: 500,
      });
    const { receipt, pool } = await loadFixture(deployPoolFixture);

    const [token0, token1] = await Promise.all([pool.token0(), pool.token1()]);

    console.log('Created pool address: ', pool.address);
    expect(pool.address).not.to.equal(
      '0x0000000000000000000000000000000000000000'
    );
    expect(token0).to.equal(Weth.address);
    expect(token1).to.equal(TestToken.address);
  });

  it('Adds liquidity position', async () => {
    const { Uniswap, TestToken, Weth, deployer } = await loadFixture(
      deployUniswapFixture
    );
    const deployPoolFixture = async () =>
      deployPool(Uniswap.factory, Uniswap.positionManager, deployer, {
        token0: Weth.address,
        token1: TestToken.address,
        fee: 500,
      });
    const { pool } = await loadFixture(deployPoolFixture);

    const { tick, tickSpacing, fee, liquidity, sqrtPriceX96 } =
      await getPoolData(pool);

    console.log('Pool Data: ', {
      tick,
      tickSpacing,
      fee,
      liquidity,
      sqrtPriceX96,
    });

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

    const approvalAmount = ethers.utils.parseUnits('10', 18).toString();

    // Approve spending of WETH and Tokens for PositionManager before creating a position
    await Promise.all([
      Weth.connect(deployer).approve(
        Uniswap.positionManager.address,
        approvalAmount
      ),
      TestToken.connect(deployer).approve(
        Uniswap.positionManager.address,
        approvalAmount
      ),
    ]);

    console.log('Tokens approved');

    await Promise.all([
      Weth.connect(deployer).transfer(Uniswap.positionManager.address, 1),
      TestToken.connect(deployer).transfer(Uniswap.positionManager.address, 1),
    ]);

    console.log('Tokens transferred to Position Manager');

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
      amount0Min: amount0Desired.toString(),
      amount1Min: amount1Desired.toString(),
      recipient: deployer.address,
      deadline: Math.floor(Date.now() / 1000) * 60,
    };

    console.log(ethers.utils.formatEther(params.amount0Desired));
    console.log('Position Manager params: ', params);

    const [wethBalance, testTokenBalance] = await Promise.all([
      Weth.balanceOf(deployer.address),
      TestToken.balanceOf(deployer.address),
    ]);

    const { calldata, value } = NonfungiblePositionManager.addCallParameters(
      position,
      {
        recipient: deployer.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20,
        slippageTolerance: new Percent(50, 10_000),
      }
    );

    await deployer.sendTransaction({
      data: calldata,
      to: Uniswap.positionManager.address,
      value: value,
      from: deployer.address,
      gasLimit: ethers.utils.hexlify(1000000),
    });

    // const positionMintResponse = await Uniswap.positionManager
    //   .connect(deployer)
    //   .mint(params, {
    //     gasLimit: ethers.utils.hexlify(1000000),
    //   });

    // await positionMintResponse.wait();

    // Balances stay the same
    console.log('ETH Balance: ', await deployer.getBalance());
    console.log('After WETH Balance: ', ethers.utils.formatEther(wethBalance));
    console.log(
      'After Token Balance: ',
      ethers.utils.formatEther(testTokenBalance)
    );
  });

  it('Process Buy Trade', async () => {});

  it('Process Sell Trade', async () => {});
});
