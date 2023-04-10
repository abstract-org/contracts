import { BigNumber, Contract, ethers, Signer } from 'ethers';
import { Pool } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';

export const poolHelpers = async (pool: Contract) => {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    pool.tickSpacing(),
    pool.fee(),
    pool.liquidity(),
    pool.slot0()
  ]);

  return {
    tickSpacing,
    fee,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1]
  };
};

export const getPoolImmutables = async (pool: Contract) => {
  const [token0, token1, fee] = await Promise.all([pool.token0(), pool.token1(), pool.fee()]);

  return {
    token0,
    token1,
    fee
  };
};

export const printPool = async (pool: Contract) => {
  const state = await poolHelpers(pool);
  const immutables = await getPoolImmutables(pool);

  return {
    token0: printToken(immutables.token0),
    token1: printToken(immutables.token1),
    fee: immutables.fee,
    tickSpacing: state.tickSpacing,
    liquidity: toETH(state.liquidity),
    sqrtPriceX96: Math.sqrt(state.sqrtPriceX96 / 2 ** 96),
    tick: state.tick
  };
};

export const printToken = (token: Contract | Token | string) => {
  return typeof token === 'string' ? token : `[${token.symbol}] ${token.name} (${token.address})`;
};

export const printUniswapV3Pool = (pool: Pool) => {
  return {
    token0: printToken(pool.token0),
    token1: printToken(pool.token1),
    fee: 500,
    sqrtRatioX96: pool.sqrtRatioX96.toString(),
    liquidity: pool.liquidity.toString(),
    tickCurrent: pool.tickCurrent,
    tickDataProvider: pool.tickDataProvider
  };
};

export const toETH = (wei: string) => ethers.utils.commify(ethers.utils.formatEther(wei));

export async function getPositionIds(positionContract: Contract, ownerAddress: string): Promise<number[]> {
  if (!ownerAddress) {
    throw new Error('No ownerAddress available');
  }

  // Get number of positions
  const balance: number = await positionContract.balanceOf(ownerAddress);

  // Get all positions
  const tokenIds = [];
  for (let i = 0; i < balance; i++) {
    const tokenOfOwnerByIndex: number = await positionContract.tokenOfOwnerByIndex(ownerAddress, i);
    tokenIds.push(tokenOfOwnerByIndex);
  }

  return tokenIds;
}

export interface PositionInfo {
  tickLower: number;
  tickUpper: number;
  liquidity: BigNumber;
  feeGrowthInside0LastX128: BigNumber;
  feeGrowthInside1LastX128: BigNumber;
  tokensOwed0: BigNumber;
  tokensOwed1: BigNumber;
}

export async function getPositionInfo(tokenId: number, positionContract: Contract): Promise<PositionInfo> {
  if (!tokenId) {
    throw new Error('No tokenId available');
  }

  const position = await positionContract.positions(tokenId);

  return {
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
    liquidity: position.liquidity,
    feeGrowthInside0LastX128: position.feeGrowthInside0LastX128,
    feeGrowthInside1LastX128: position.feeGrowthInside1LastX128,
    tokensOwed0: position.tokensOwed0,
    tokensOwed1: position.tokensOwed1
  };
}

export const printSwapParams = (swapParams: any) => ({
  tokenIn: swapParams.tokenIn,
  tokenOut: swapParams.tokenOut,
  fee: swapParams.fee,
  recipient: swapParams.recipient,
  deadline: swapParams.deadline,
  amountIn: toETH(swapParams.amountIn),
  amountOutMinimum: toETH(swapParams.amountOutMinimum),
  sqrtPriceLimitX96: toETH(swapParams.sqrtPriceLimitX96)
});

export const printPositions = async (positionManagerContract: Contract, ownerAddress: string) => {
  const positionIds = await getPositionIds(positionManagerContract, ownerAddress);
  // console.log(positionIds);
  for (const posId of positionIds) {
    console.log(`# position[${posId}]:`, await getPositionInfo(posId, positionManagerContract));
  }
};
