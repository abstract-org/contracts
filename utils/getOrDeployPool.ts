import { BigNumber, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';

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
  const token0BigInt = BigInt(poolConfig.token0);
  const token1BigInt = BigInt(poolConfig.token1);

  if (token0BigInt > token1BigInt) {
    [poolConfig.token0, poolConfig.token1] = [poolConfig.token1, poolConfig.token0];
    console.log(`## Deploying ${poolConfig.token0}/${poolConfig.token1} inverted order`);
  }

  const { token0, token1, fee } = poolConfig;
  const { factory, deployer, positionManager } = ctx;

  const existingPoolAddress = await factory.connect(deployer).getPool(token0, token1, fee);

  if (existingPoolAddress === ethers.constants.AddressZero) {
    const tx = await positionManager
      .connect(deployer)
      .createAndInitializePoolIfNecessary(token0, token1, fee, sqrtPrice, {
        gasLimit: 30000000
      });

    await tx.wait();

    return await factory.connect(deployer).getPool(token0, token1, fee, {
      gasLimit: ethers.utils.hexlify(30000000)
    });
  } else {
    return existingPoolAddress;
  }
}
