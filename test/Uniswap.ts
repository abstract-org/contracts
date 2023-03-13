import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json'
import {UniswapV3Deployer} from "../utils/UniswapV3Deployer";
import {ethers} from "hardhat";
import {Pool, Position, NonfungiblePositionManager, nearestUsableTick} from '@uniswap/v3-sdk'
import {Token, Percent} from '@uniswap/sdk-core';
import {TokenFactoryDeployer} from "../utils/TokenFactoryDeployer";
import {DEFAULT_TOKEN_CONFIG} from "./TokenFactory";
import {expect} from "chai";
import {getPoolData} from "../utils/getPoolData";
import {encodePriceSqrt} from "../utils/encodePriceSqrt";

const CHAIN_ID = 31337;

describe('Uniswap', () => {
    async function deployUniswapFixture() {
        const [deployer] = await ethers.getSigners();
        const uniswapContracts = await UniswapV3Deployer.deploy(deployer);
        const TestToken = await TokenFactoryDeployer.deploy(deployer, DEFAULT_TOKEN_CONFIG);

        return {Uniswap: uniswapContracts, Weth: uniswapContracts.weth9, TestToken, deployer}
    }

    async function deployPoolFixture(factory: ethers.Contract, positionManager: ethers.Contract, deployer: ethers.Signer, poolConfig: { token0: string, token1: string, fee: number }) {
        const sqrtPrice = encodePriceSqrt(1, 1);

        const tx = await positionManager
            .connect(deployer)
            .createAndInitializePoolIfNecessary(
                poolConfig.token0,
                poolConfig.token1,
                poolConfig.fee,
                sqrtPrice,
                {gasLimit: 10000000}
            );

        const receipt = await tx.wait();

        const poolAddress = await factory
            .connect(deployer)
            .getPool(
                poolConfig.token0,
                poolConfig.token1,
                poolConfig.fee
            );

        const pool = new ethers.Contract(
            poolAddress,
            IUniswapV3PoolABI.abi,
            new ethers.providers.Web3Provider(ethers.provider, CHAIN_ID)
        )

        return {receipt, poolAddress, pool}
    }

    it('Creates pool', async () => {
        const {Uniswap, TestToken, deployer} = await deployUniswapFixture();
        const {receipt, poolAddress} = await deployPoolFixture(Uniswap.factory, Uniswap.positionManager, deployer, {
            token0: Uniswap.weth9.address,
            token1: TestToken.address,
            fee: 500
        })

        console.log('Created pool address: ', poolAddress);
        expect(poolAddress).not.to.equal(0)
    })

    it('Adds liquidity position', async () => {
        const {Uniswap, TestToken, Weth, deployer} = await deployUniswapFixture();
        const {pool} = await deployPoolFixture(Uniswap.factory, Uniswap.positionManager, deployer, {
            token0: Uniswap.weth9.address,
            token1: TestToken.address,
            fee: 500
        })

        // TODO: Failing on getPoolData as response never comes, need to be fixed to move forward

        const {tick, tickSpacing, fee, liquidity, sqrtPriceX96} = await getPoolData(pool)

        // Construct Token instances
        const wethToken = new Token(CHAIN_ID, Weth.address, 18, 'WETH', 'Wrapped Ether')
        const testToken = new Token(CHAIN_ID, TestToken.address, 18, DEFAULT_TOKEN_CONFIG.symbol, DEFAULT_TOKEN_CONFIG.name)

        // Initialize Pool
        const WETH_TEST_TOKEN_POOL = new Pool(
            wethToken,
            testToken,
            fee,
            sqrtPriceX96.toString(),
            liquidity.toString(),
            tick
        );

        // Initialize Position
        const position = new Position({
            pool: WETH_TEST_TOKEN_POOL,
            liquidity: ethers.utils.parseUnits('0.01', 18),
            tickLower: nearestUsableTick(tick, tickSpacing) - tickSpacing * 2,
            tickUpper: nearestUsableTick(tick, tickSpacing) + tickSpacing * 2,
        });
        console.log('Position: ', position)

        const approvalAmount = ethers.utils.parseUnits('10', 18).toString();

        // Approve spending of WETH and Tokens for PositionManager before creating a position
        await Promise.all([
            Weth
                .connect(deployer)
                .approve(
                    Uniswap.positionManager.address,
                    approvalAmount
                ),
            TestToken
                .connect(deployer)
                .approve(
                    Uniswap.positionManager.address,
                    approvalAmount
                )
        ]);

        console.log('Tokens approved');

        const {amount0: amount0Desired, amount1: amount1Desired} = position.mintAmounts;
        const {amount0: amount0Min, amount1: amount1Min} = position.mintAmountsWithSlippage(new Percent(5));

        const params = {
            token0: Weth.address,
            token1: TestToken.address,
            fee,
            tickLower: nearestUsableTick(tick, tickSpacing) - tickSpacing * 2,
            tickUpper: nearestUsableTick(tick, tickSpacing) + tickSpacing * 2,
            amount0Desired: amount0Desired.toString(),
            amount1Desired: amount1Desired.toString(),
            amount0Min: amount0Min.toString(),
            amount1Min: amount1Min.toString(),
            recipient: deployer.address,
            deadline: Math.floor(Date.now() / 1000) * (60)
        };

        console.log('Position Manager params: ', params)

        await Uniswap.positionManager
            .connect(deployer)
            .mint(
                params,
                {gasLimit: ethers.utils.hexlify(1000000)}
            );

    })

    it('Process Buy Trade', async () => {
    })

    it('Process Sell Trade', async () => {
    })

})