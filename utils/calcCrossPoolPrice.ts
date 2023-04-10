import { ethers } from 'ethers';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { poolHelpers } from './poolHelpers';
import { Fraction, JSBI, Price } from '@uniswap/sdk';
import { priceToClosestTick, TickMath } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';

export async function calcCrossPoolPrice(poolA: string, poolB: string, deployer: SignerWithAddress): Promise<any> {
  const poolWethAContract = new ethers.Contract(poolA, IUniswapV3PoolABI.abi, deployer);
  const poolWethBContract = new ethers.Contract(poolA, IUniswapV3PoolABI.abi, deployer);

  const { sqrtPriceX96: sqrtPriceAX } = await poolHelpers(poolWethAContract);
  const { sqrtPriceX96: sqrtPriceBX } = await poolHelpers(poolWethBContract);

  // Calculate the price of token A relative to WETH and the price of token B relative to WETH
  const priceAWeth = new Fraction(
    TickMath.getSqrtRatioAtTick(TickMath.getTickAtSqrtRatio(sqrtPriceAX)),
    JSBI.BigInt(1)
  ).toSignificant(6);
  const priceBWeth = new Fraction(
    TickMath.getSqrtRatioAtTick(TickMath.getTickAtSqrtRatio(sqrtPriceBX)),
    JSBI.BigInt(1)
  ).toSignificant(6);

  // const tokenA = new Token(); // TODO: get A TokenInstance from Pool WETH-A
  // const tokenB = null;
  //
  // const priceAB = parseFloat(priceAWeth) / parseFloat(priceBWeth);
  // const priceABObj = new Price(tokenA, tokenB, JSBI.BigInt(1), JSBI.BigInt(Math.round(1 / priceAB)));
  //
  // return TickMath.getSqrtRatioAtTick(priceToClosestTick(priceABObj));
}
