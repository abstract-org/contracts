import { Contract } from 'ethers';

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
