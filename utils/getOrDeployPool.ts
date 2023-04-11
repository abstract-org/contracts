import { BigNumber, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { addressComparator } from './addressComparator';

export type PoolConfig = {
  token0: string;
  token1: string;
  fee: number;
};

type UniswapCtx = {
  factory: Contract;
  deployer: SignerWithAddress;
  positionManager: Contract;
};

export async function getOrDeployPool(sqrtPrice: BigNumber, poolConfig: PoolConfig, ctx: UniswapCtx): Promise<string> {
  const { token0, token1, fee } = poolConfig;
  const { factory, deployer, positionManager } = ctx;

  const [left, right] = [token0, token1].sort(addressComparator);
  if (left !== token0) console.log('## DBG: swapped token0 and token1');

  let existingPoolAddress;
  try {
    existingPoolAddress = await factory.connect(deployer).getPool(left, right, fee);
  } catch (err) {
    console.log("## DBG: Didn't find the pool, will create a new one");
  }

  if (!existingPoolAddress || existingPoolAddress === ethers.constants.AddressZero) {
    const tx = await positionManager.connect(deployer).createAndInitializePoolIfNecessary(left, right, fee, sqrtPrice, {
      gasLimit: 10000000
    });

    await tx.wait();

    return await factory.connect(deployer).getPool(left, right, fee, {
      gasLimit: ethers.utils.hexlify(1000000)
    });
  } else {
    return existingPoolAddress;
  }
}
