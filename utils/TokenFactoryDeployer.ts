import {Contract, ContractFactory, Signer} from "ethers";
import {SimpleToken, SimpleFactory} from '../typechain-types';
import {ethers} from "hardhat";

export class TokenFactoryDeployer {
    deployer: Signer;

    constructor(deployer: Signer) {
        this.deployer = deployer;
    }

    static async deploy(actor: Signer, tokenConfig: { name: string, symbol: string, supply: string }): Promise<Contract> {
        const tokenFactory = await ethers.getContractFactory('SimpleToken');
        const result = await tokenFactory.deploy(
            tokenConfig.name,
            tokenConfig.symbol,
            ethers.utils.parseUnits(tokenConfig.supply, 18),
            actor.getAddress()
        );

        await result.deployed();

        return result;
    }
}
