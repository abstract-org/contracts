import { UniswapContractArtifacts } from '../utils/UniswapV3Deployer';
import '@nomicfoundation/hardhat-chai-matchers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { getPoolImmutables, poolHelpers } from '../utils/poolHelpers';
import TokenAbi from '../artifacts/contracts/SimpleToken.sol/SimpleToken.json';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import { Percent, Token } from '@uniswap/sdk-core';
import { DEFAULT_TOKEN_CONFIG } from './TokenFactory';
import { nearestUsableTick, Pool, Position } from '@uniswap/v3-sdk';
import { solidity } from 'ethereum-waffle';
import chai from 'chai';
import { Contract } from 'ethers';
chai.use(solidity);

describe('Uniswap', () => {
  let UniswapContracts: { [name: string]: Contract };
  let TestToken: Contract;
  let Weth: Contract;

  before(async () => {
    const [deployer] = await ethers.getSigners();

    TestToken = new ethers.Contract(String(process.env.TEST_TOKEN_ADDRESS), TokenAbi.abi, deployer);
    Weth = new ethers.Contract(String(process.env.WETH_ADDRESS), TokenAbi.abi, deployer);
    UniswapContracts = {
      factory: new ethers.Contract(
        String(process.env.UNISWAP_FACTORY_ADDRESS),
        UniswapContractArtifacts.UniswapV3Factory.abi,
        deployer
      ),
      router: new ethers.Contract(
        String(process.env.UNISWAP_ROUTER_ADDRESS),
        UniswapContractArtifacts.SwapRouter.abi,
        deployer
      ),
      quoter: new ethers.Contract(
        String(process.env.UNISWAP_QUOTER_ADDRESS),
        UniswapContractArtifacts.Quoter.abi,
        deployer
      ),
      nftDescriptorLibrary: new ethers.Contract(
        String(process.env.UNISWAP_NFT_DESCRIPTOR_LIBRARY_ADDRESS),
        UniswapContractArtifacts.NFTDescriptor.abi,
        deployer
      ),
      positionDescriptor: new ethers.Contract(
        String(process.env.UNISWAP_POSITION_DESCRIPTOR_ADDRESS),
        UniswapContractArtifacts.NonfungibleTokenPositionDescriptor.abi,
        deployer
      ),
      positionManager: new ethers.Contract(
        String(process.env.UNISWAP_POSITION_MANAGER_ADDRESS),
        UniswapContractArtifacts.NonfungiblePositionManager.abi,
        deployer
      )
    };
    console.log('before hook setup completed');
  });

  async function getAddPositionToPoolParams(pool: Contract) {
    const [deployer] = await ethers.getSigners();
    const poolData = await poolHelpers(pool);
    const poolImmutables = await getPoolImmutables(pool);
    const { tick, tickSpacing, fee, liquidity, sqrtPriceX96 } = poolData;
    console.log('Pool Data: ', poolData);

    // Construct Token instances
    const wethToken = new Token(31337, poolImmutables.token0, 18, 'WETH', 'Wrapped Ether');
    const testToken = new Token(
      31337,
      poolImmutables.token1,
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
      tickUpper: nearestUsableTick(tick, tickSpacing) + tickSpacing * 2
    });

    const approvalAmount = ethers.utils.parseUnits('1000', 18).toString();

    // Approve spending of WETH and Tokens for PositionManager before creating a position
    await Promise.all([
      Weth.connect(deployer).approve(UniswapContracts.positionManager.address, approvalAmount),
      TestToken.connect(deployer).approve(UniswapContracts.positionManager.address, approvalAmount)
    ]);

    console.log('Tokens approved');

    const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts;
    const { amount0: amount0Min, amount1: amount1Min } = position.mintAmountsWithSlippage(new Percent(50, 10_000));

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

  it('Creates pool', async () => {
    const [deployer] = await ethers.getSigners();

    const pool = new ethers.Contract(String(process.env.WETH_TEST_TOKEN_POOL_ADDRESS), IUniswapV3PoolABI.abi, deployer);

    const { token0, token1 } = await getPoolImmutables(pool);

    expect(pool.address).not.to.equal('0x0000000000000000000000000000000000000000');
    expect(token0).to.equal(Weth.address);
    expect(token1).to.equal(TestToken.address);
  });

  it('Creates position', async () => {
    const [deployer] = await ethers.getSigners();

    const pool = new ethers.Contract(String(process.env.WETH_TEST_TOKEN_POOL_ADDRESS), IUniswapV3PoolABI.abi, deployer);

    const { mintParams, amount0Desired, amount1Desired } = await getAddPositionToPoolParams(pool);

    const positionMintTx = UniswapContracts.positionManager.connect(deployer).mint(mintParams, {
      gasLimit: ethers.utils.hexlify(1000000)
    });

    await expect(positionMintTx).to.emit(UniswapContracts.positionManager, 'IncreaseLiquidity');
    await expect(positionMintTx).to.changeTokenBalance(Weth, deployer.address, `-${amount0Desired}`);
    await expect(positionMintTx).to.changeTokenBalance(TestToken, deployer.address, `-${amount1Desired}`);
  });

  it('Process ExactInputSingle Swap', async () => {
    const [deployer] = await ethers.getSigners();

    const pool = new ethers.Contract(String(process.env.WETH_TEST_TOKEN_POOL_ADDRESS), IUniswapV3PoolABI.abi, deployer);

    const { mintParams } = await getAddPositionToPoolParams(pool);

    const positionMintTx = await UniswapContracts.positionManager.connect(deployer).mint(mintParams, {
      gasLimit: ethers.utils.hexlify(1000000)
    });

    await positionMintTx.wait();

    const approvalAmount = ethers.utils.parseUnits('1000', 18).toString();

    // Approve spending of WETH and Tokens for SwapRouter before creating a swap
    await Promise.all([
      Weth.connect(deployer).approve(UniswapContracts.router.address, approvalAmount),
      TestToken.connect(deployer).approve(UniswapContracts.router.address, approvalAmount)
    ]);

    const poolImmutables = await getPoolImmutables(pool);
    const amountIn = ethers.utils.parseUnits('10', 18).toString();

    // Requesting a Quote to get quoted amount out
    const quotedAmountOut = await UniswapContracts.quoter.callStatic.quoteExactInputSingle(
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
      sqrtPriceLimitX96: 0 // shouldn't be 0 in production
    };

    console.log('Swap Params: ', swapParams);

    const swapTx = UniswapContracts.router.connect(deployer).exactInputSingle(swapParams, {
      gasLimit: ethers.utils.hexlify(5000000)
    });

    await expect(swapTx).to.changeTokenBalance(TestToken, deployer.address, `${quotedAmountOut}`);
  });
});
