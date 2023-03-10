import {UniswapV3Deployer} from '../utils/UniswapV3Deployer'
import {ethers} from "hardhat";
import Table from "cli-table3";


// TODO: Should replace these with the proper typechain output.
// type INonfungiblePositionManager = Contract;
// type IUniswapV3Factory = Contract;

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('Deploying from: ', deployer.address)

    const contracts = await UniswapV3Deployer.deploy(deployer)

    const table = new Table({
        head: ["Contract", "Address"],
        style: { border: [] },
    });
    for (const item of Object.keys(contracts)) {
        table.push([item, contracts[item].address]);
    }
    console.info(table.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });