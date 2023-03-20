import { Contract, ContractFactory, Signer } from 'ethers';
import { linkLibraries } from './linkLibraries';
import Table from 'cli-table3';

type ContractJson = { abi: any; bytecode: string };

export const UniswapContractArtifacts: { [name: string]: ContractJson } = {
  Quoter: require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'),
  UniswapV3Factory: require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'),
  SwapRouter: require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json'),
  NFTDescriptor: require('@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json'),
  NonfungibleTokenPositionDescriptor: require('@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json'),
  NonfungiblePositionManager: require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'),
};

export class UniswapV3Deployer {
  static async deploy(
    actor: Signer,
    wethAddress: string
  ): Promise<{
    factory: Contract;
    router: Contract;
    nftDescriptorLibrary: Contract;
    positionDescriptor: Contract;
    positionManager: Contract;
    quoter: Contract;
  }> {
    const deployer = new UniswapV3Deployer(actor);

    const factory = await deployer.deployFactory();
    const quoter = await deployer.deployQuoter(factory.address, wethAddress);
    const router = await deployer.deployRouter(factory.address, wethAddress);
    const nftDescriptorLibrary = await deployer.deployNFTDescriptorLibrary();
    const positionDescriptor = await deployer.deployPositionDescriptor(
      nftDescriptorLibrary.address,
      wethAddress
    );
    const positionManager = await deployer.deployNonfungiblePositionManager(
      factory.address,
      wethAddress,
      positionDescriptor.address
    );

    return {
      factory,
      router,
      quoter,
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
      UniswapContractArtifacts.UniswapV3Factory.abi,
      UniswapContractArtifacts.UniswapV3Factory.bytecode,
      [],
      this.deployer
    );
  }

  async deployRouter(factoryAddress: string, weth9Address: string) {
    return await this.deployContract<Contract>(
      UniswapContractArtifacts.SwapRouter.abi,
      UniswapContractArtifacts.SwapRouter.bytecode,
      [factoryAddress, weth9Address],
      this.deployer
    );
  }

  async deployNFTDescriptorLibrary() {
    return await this.deployContract<Contract>(
      UniswapContractArtifacts.NFTDescriptor.abi,
      UniswapContractArtifacts.NFTDescriptor.bytecode,
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
        bytecode:
          UniswapContractArtifacts.NonfungibleTokenPositionDescriptor.bytecode,
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
      UniswapContractArtifacts.NonfungibleTokenPositionDescriptor.abi,
      linkedBytecode,
      [
        weth9Address,
        '0x4554480000000000000000000000000000000000000000000000000000000000',
      ],
      this.deployer
    )) as Contract;
  }

  async deployQuoter(factoryAddress: string, weth9Address: string) {
    return await this.deployContract<Contract>(
      UniswapContractArtifacts.Quoter.abi,
      UniswapContractArtifacts.Quoter.bytecode,
      [factoryAddress, weth9Address],
      this.deployer
    );
  }

  async deployNonfungiblePositionManager(
    factoryAddress: string,
    weth9Address: string,
    positionDescriptorAddress: string
  ) {
    return await this.deployContract<Contract>(
      UniswapContractArtifacts.NonfungiblePositionManager.abi,
      UniswapContractArtifacts.NonfungiblePositionManager.bytecode,
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
