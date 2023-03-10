import { Contract, ContractFactory, Signer } from 'ethers';
import { linkLibraries } from './linkLibraries';
import WETH9 from './WETH9.json';
import Table from 'cli-table3';

type ContractJson = { abi: any; bytecode: string };

const artifacts: { [name: string]: ContractJson } = {
  UniswapV3Factory: require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'),
  SwapRouter: require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json'),
  NFTDescriptor: require('@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json'),
  NonfungibleTokenPositionDescriptor: require('@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json'),
  NonfungiblePositionManager: require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'),
  WETH9,
};

export class UniswapV3Deployer {
  static async deploy(
    actor: Signer,
    Weth: Contract
  ): Promise<{
    factory: Contract;
    router: Contract;
    nftDescriptorLibrary: Contract;
    positionDescriptor: Contract;
    positionManager: Contract;
  }> {
    const deployer = new UniswapV3Deployer(actor);

    const factory = await deployer.deployFactory();
    const router = await deployer.deployRouter(factory.address, Weth.address);
    const nftDescriptorLibrary = await deployer.deployNFTDescriptorLibrary();
    const positionDescriptor = await deployer.deployPositionDescriptor(
      nftDescriptorLibrary.address,
      Weth.address
    );
    const positionManager = await deployer.deployNonfungiblePositionManager(
      factory.address,
      Weth.address,
      positionDescriptor.address
    );

    return {
      factory,
      router,
      nftDescriptorLibrary,
      positionDescriptor,
      positionManager,
    };
  }

  static toTable(contracts: { [name: string]: Contract }) {
    const table = new Table({
      head: ['Contract', 'Address'],
      style: { border: [] },
    });
    for (const item of Object.keys(contracts)) {
      table.push([item, contracts[item].address]);
    }

    return table.toString();
  }

  deployer: Signer;

  constructor(deployer: Signer) {
    this.deployer = deployer;
  }

  async deployFactory() {
    return await this.deployContract<Contract>(
      artifacts.UniswapV3Factory.abi,
      artifacts.UniswapV3Factory.bytecode,
      [],
      this.deployer
    );
  }

  async deployWETH9() {
    return await this.deployContract<Contract>(
      artifacts.WETH9.abi,
      artifacts.WETH9.bytecode,
      [],
      this.deployer
    );
  }

  async deployRouter(factoryAddress: string, weth9Address: string) {
    return await this.deployContract<Contract>(
      artifacts.SwapRouter.abi,
      artifacts.SwapRouter.bytecode,
      [factoryAddress, weth9Address],
      this.deployer
    );
  }

  async deployNFTDescriptorLibrary() {
    return await this.deployContract<Contract>(
      artifacts.NFTDescriptor.abi,
      artifacts.NFTDescriptor.bytecode,
      [],
      this.deployer
    );
  }

  async deployPositionDescriptor(
    nftDescriptorLibraryAddress: string,
    weth9Address: string
  ) {
    const linkedBytecode = linkLibraries(
      {
        bytecode: artifacts.NonfungibleTokenPositionDescriptor.bytecode,
        linkReferences: {
          'NFTDescriptor.sol': {
            NFTDescriptor: [
              {
                length: 20,
                start: 1681,
              },
            ],
          },
        },
      },
      {
        NFTDescriptor: nftDescriptorLibraryAddress,
      }
    );

    return (await this.deployContract(
      artifacts.NonfungibleTokenPositionDescriptor.abi,
      linkedBytecode,
      [
        weth9Address,
        '0x4554480000000000000000000000000000000000000000000000000000000000',
      ],
      this.deployer
    )) as Contract;
  }

  async deployNonfungiblePositionManager(
    factoryAddress: string,
    weth9Address: string,
    positionDescriptorAddress: string
  ) {
    return await this.deployContract<Contract>(
      artifacts.NonfungiblePositionManager.abi,
      artifacts.NonfungiblePositionManager.bytecode,
      [factoryAddress, weth9Address, positionDescriptorAddress],
      this.deployer
    );
  }

  private async deployContract<T>(
    abi: any,
    bytecode: string,
    deployParams: Array<any>,
    actor: Signer
  ) {
    const factory = new ContractFactory(abi, bytecode, actor);
    const res = await factory.deploy(...deployParams);
    await res.deployed();
    return res;
  }
}
