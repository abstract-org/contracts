import { UniswapContractArtifacts } from '../utils/UniswapV3Deployer';
import '@nomicfoundation/hardhat-chai-matchers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  getPoolImmutables,
  poolHelpers,
  printPool,
  printPositions,
  printSwapParams,
  printToken,
  printUniswapV3Pool,
  toETH
} from '../utils/poolHelpers';
import TokenAbi from '../artifacts/contracts/SimpleToken.sol/SimpleToken.json';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import { Percent, Token } from '@uniswap/sdk-core';
import { DEFAULT_TOKEN_CONFIG } from './TokenFactory';
import { nearestUsableTick, Pool, Position } from '@uniswap/v3-sdk';
import { solidity } from 'ethereum-waffle';
import chai from 'chai';
import { Contract } from 'ethers';

chai.use(solidity);

const WETH_TOKEN_CONFIG = {
  name: 'Wrapped Ether',
  symbol: 'WETH',
  supply: '1000000000'
};
const TAT_TOKEN_CONFIG = DEFAULT_TOKEN_CONFIG;
describe.only('Uniswap', () => {
  let UniswapContracts: { [name: string]: Contract };
  let TestToken: Contract;
  let Weth: Contract;
  const CHAIN_ID = 31337;

  async function getAddPositionToPoolParams(pool: Contract) {
    console.log('\n#### Fn: getAddPositionToPoolParams(pool) ####\n');
    const [deployer] = await ethers.getSigners();
    console.log('\n## fetching poolData from contract: ');
    const poolData = await poolHelpers(pool);
    const poolImmutables = await getPoolImmutables(pool);
    const { tick, tickSpacing, fee, liquidity, sqrtPriceX96 } = poolData;

    console.log('\n## Construct Token instances');
    const wethToken = new Token(CHAIN_ID, poolImmutables.token0, 18, WETH_TOKEN_CONFIG.symbol, WETH_TOKEN_CONFIG.name);
    const testToken = new Token(CHAIN_ID, poolImmutables.token1, 18, TAT_TOKEN_CONFIG.symbol, TAT_TOKEN_CONFIG.name);
    console.log('# wethToken:', printToken(wethToken));
    console.log('# testToken:', printToken(testToken));

    console.log('\n## Construct Uniswap V3 Pool instance');
    const WETH_TEST_TOKEN_POOL = new Pool(
      wethToken,
      testToken,
      fee,
      sqrtPriceX96.toString(),
      liquidity.toString(),
      tick
    );
    console.log('# ', printUniswapV3Pool(WETH_TEST_TOKEN_POOL));

    console.log('\n## Construct Uniswap V3 Position instance:');
    const position = new Position({
      pool: WETH_TEST_TOKEN_POOL,
      liquidity: ethers.utils.parseEther('10'),
      tickLower: nearestUsableTick(tick, tickSpacing) - tickSpacing * 2,
      tickUpper: nearestUsableTick(tick, tickSpacing) + tickSpacing * 2
    });
    console.log('# position.pool:', printUniswapV3Pool(position.pool));
    console.log('# position.liquidity:', toETH(position.liquidity.toString()));
    console.log('# position.tickLower:', position.tickLower);
    console.log('# position.tickUpper:', position.tickUpper);

    const approvalAmount = ethers.utils.parseUnits('1000', 18).toString();

    console.log('\n## Set approval spending of WETH and Tokens for PositionManager before creating a position');
    console.log('# approvalAmount:', approvalAmount);
    await Promise.all([
      Weth.connect(deployer).approve(UniswapContracts.positionManager.address, approvalAmount),
      TestToken.connect(deployer).approve(UniswapContracts.positionManager.address, approvalAmount)
    ]);
    console.log('# Tokens approved.');

    console.log('\n## getting mintAmounts from position instance:');
    const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts;
    console.log('# amount0Desired =', amount0Desired.toString());
    console.log('# amount1Desired =', amount1Desired.toString());

    console.log('\n## getting mins from position.mintAmountsWithSlippage:');
    const { amount0: amount0Min, amount1: amount1Min } = position.mintAmountsWithSlippage(new Percent(50, 10_000));
    console.log('## amount0Min=', amount0Min.toString());
    console.log('## amount1Min=', amount1Min.toString());

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
    console.info('## Position Manager mintParams: ', params);

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

  it('get existed pool address', async () => {
    const [deployer] = await ethers.getSigners();

    const existPoolAddr = await UniswapContracts.factory
      .connect(deployer)
      .getPool(TestToken.address, Weth.address, 500, {
        gasLimit: ethers.utils.hexlify(30000000)
      });

    const pool = new ethers.Contract(existPoolAddr, IUniswapV3PoolABI.abi, deployer);

    const { token0, token1 } = await getPoolImmutables(pool);

    expect(pool.address).not.to.equal('0x0000000000000000000000000000000000000000');
    expect(token0).to.equal(Weth.address);
    expect(token1).to.equal(TestToken.address);
  });

  it('WETH-TEST pool deployed', async () => {
    const [deployer] = await ethers.getSigners();

    const pool = new ethers.Contract(String(process.env.WETH_TEST_TOKEN_POOL_ADDRESS), IUniswapV3PoolABI.abi, deployer);

    const { token0, token1 } = await getPoolImmutables(pool);

    expect(pool.address).not.to.equal('0x0000000000000000000000000000000000000000');
    expect(token0).to.equal(Weth.address);
    expect(token1).to.equal(TestToken.address);
  });

  // it('Creates position', async () => {
  it('Creates position', async () => {
    console.log('###### it(Creates position) ######\n');
    const [deployer] = await ethers.getSigners();

    const pool = new ethers.Contract(String(process.env.WETH_TEST_TOKEN_POOL_ADDRESS), IUniswapV3PoolABI.abi, deployer);

    const { mintParams, amount0Desired, amount1Desired } = await getAddPositionToPoolParams(pool);
    console.log('## Position Manager minting position with mintParams...');
    const positionMintTx = UniswapContracts.positionManager.connect(deployer).mint(mintParams, {
      gasLimit: ethers.utils.hexlify(30000000)
    });

    await expect(positionMintTx).to.emit(UniswapContracts.positionManager, 'IncreaseLiquidity');
    await expect(positionMintTx).to.changeTokenBalance(Weth, deployer.address, `-${amount0Desired}`);
    await expect(positionMintTx).to.changeTokenBalance(TestToken, deployer.address, `-${amount1Desired}`);
    console.log('###### it(Creates position) END ######\n');
  });

  it('Increases Liquidity', async () => {
    const [deployer] = await ethers.getSigners();

    const pool = new ethers.Contract(String(process.env.WETH_TEST_TOKEN_POOL_ADDRESS), IUniswapV3PoolABI.abi, deployer);
    const positionState = await UniswapContracts.positionManager.connect(deployer).positions(1);

    const increaseLiquidityParams = {
      tokenId: 1,
      amount0Desired: ethers.utils.parseEther('1'),
      amount1Desired: ethers.utils.parseEther('1'),
      amount0Min: 0,
      amount1Min: 0,
      deadline: Math.floor(Date.now() / 1000) * 60
    };
    console.log('Liquidity BEFORE: ', ethers.utils.formatEther(positionState.liquidity));

    const increaseLiquidityTx = UniswapContracts.positionManager
      .connect(deployer)
      .increaseLiquidity(increaseLiquidityParams, {
        gasLimit: ethers.utils.hexlify(30000000)
      });

    await expect(increaseLiquidityTx).to.emit(UniswapContracts.positionManager, 'IncreaseLiquidity');

    const positionStateAfter = await UniswapContracts.positionManager.connect(deployer).positions(1);

    console.log('Liquidity AFTER: ', ethers.utils.formatEther(positionStateAfter.liquidity));
    console.log('Pool contract', await printPool(pool));

    await expect(increaseLiquidityTx).to.changeTokenBalance(
      Weth,
      deployer.address,
      `-${increaseLiquidityParams.amount0Desired}`
    );

    // await expect(increaseLiquidityTx).to.changeTokenBalance(
    //   TestToken,
    //   deployer.address,
    //   `-${increaseLiquidityParams.amount1Desired}`
    // );
  });

  it('Decreases Liquidity', async () => {
    const [deployer] = await ethers.getSigners();

    const pool = new ethers.Contract(String(process.env.WETH_TEST_TOKEN_POOL_ADDRESS), IUniswapV3PoolABI.abi, deployer);
    const positionState = await UniswapContracts.positionManager.connect(deployer).positions(1);

    const decreaseLiquidityParams = {
      tokenId: 1,
      liquidity: ethers.BigNumber.from(positionState.liquidity).div(2),
      amount0Min: 0,
      amount1Min: 0,
      deadline: Math.floor(Date.now() / 1000) * 60
    };
    console.log('Liquidity BEFORE: ', ethers.utils.formatEther(positionState.liquidity));
    console.log('DecreaseLiquidityParams: ', decreaseLiquidityParams);

    const decreaseLiquidityTx = UniswapContracts.positionManager
      .connect(deployer)
      .decreaseLiquidity(decreaseLiquidityParams, {
        gasLimit: ethers.utils.hexlify(30000000)
      });

    await expect(decreaseLiquidityTx).to.emit(UniswapContracts.positionManager, 'DecreaseLiquidity');

    const positionStateAfter = await UniswapContracts.positionManager.connect(deployer).positions(1);

    await UniswapContracts.positionManager.connect(deployer);

    console.log('Liquidity AFTER: ', ethers.utils.formatEther(positionStateAfter.liquidity));
    console.log('Pool contract', await printPool(pool));
  });

  it('Process ExactInputSingle Swap', async () => {
    console.log('###### it(Process ExactInputSingle Swap) ######\n');
    const [deployer] = await ethers.getSigners();

    const pool = new ethers.Contract(String(process.env.WETH_TEST_TOKEN_POOL_ADDRESS), IUniswapV3PoolABI.abi, deployer);
    console.log('## instatiated pool contract', await printPool(pool));

    const approvalAmount = ethers.utils.parseUnits('1000', 18).toString();

    console.log('## Approve spending of WETH and Tokens for SwapRouter before creating a swap');
    console.log('# approvalAmount:', approvalAmount);
    await Promise.all([
      Weth.connect(deployer).approve(UniswapContracts.router.address, approvalAmount),
      TestToken.connect(deployer).approve(UniswapContracts.router.address, approvalAmount)
    ]);

    const poolImmutables = await getPoolImmutables(pool);
    const amountIn = ethers.utils.parseUnits('0.001', 18).toString();
    console.log('# pool.liquidity before Quote:', toETH(await pool.liquidity()));

    console.log('## Requesting a Quote to get quoted amount out for amountIn=', toETH(amountIn));
    const quotedAmountOut = await UniswapContracts.quoter.callStatic.quoteExactInputSingle(
      poolImmutables.token0,
      poolImmutables.token1,
      poolImmutables.fee,
      amountIn,
      0
    );
    console.log('# quotedAmountOut:', toETH(quotedAmountOut.toString()));
    console.log('# pool.liquidity after Quote:', toETH(await pool.liquidity()));
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

    console.log('## Executing exactInputSingle with params:');
    console.log('# ', printSwapParams(swapParams));
    const printedPoolBefore = await printPool(pool);
    const poolPriceBefore = printedPoolBefore.sqrtPriceX96;
    console.log('## BEFORE: pool.price =', poolPriceBefore);
    console.info('\n# Pool before tx:', printedPoolBefore);
    console.log('--- pool.liquidity before Swap:', toETH(await pool.liquidity()));
    console.log('\n$$ executing swap $$\n');
    // console.log(`# expecting TestToken balance of wallet[${deployer.address}] changed by:`, toETH(quotedAmountOut));
    await expect(
      UniswapContracts.router.connect(deployer).exactInputSingle(swapParams, {
        gasLimit: ethers.utils.hexlify(30000000)
      })
    ).to.changeTokenBalance(TestToken, deployer.address, `${quotedAmountOut}`);
    const printedPoolAfter = await printPool(pool);
    const poolPriceAfter = printedPoolAfter.sqrtPriceX96;
    console.log('## AFTER: pool.price =', poolPriceAfter);
    console.log('## price diff: before-after=', poolPriceBefore - poolPriceAfter);
    console.info('\n# Pool after tx:', printedPoolAfter);
    console.log('--- pool.liquidity after swap:', toETH(await pool.liquidity()));
    await printPositions(UniswapContracts.positionManager, deployer.address);
    console.log('###### it(Process ExactInputSingle Swap) END ######\n');
  });
});
