import {ethers} from 'hardhat';

export const getPoolData = async (pool: ethers.Contract) => {
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
    }
}