import { ethers } from 'hardhat';
import { expect } from 'chai';

describe('QuestFactory', function () {
  let questFactory, QuestFactory;
  let deployer;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();

    QuestFactory = await ethers.getContractFactory('QuestFactory');
    questFactory = await QuestFactory.deploy();
    await questFactory.deployed();
  });

  it('should predict the correct address for a token using create2', async function () {
    const name = 'Example Token';
    const symbol = 'EXT';
    const kind = 'TITLE';
    const content = 'Example Content';
    const totalSupply = ethers.utils.parseEther('1000');

    const SimpleToken = await ethers.getContractFactory('SimpleToken');
    const constructorData = SimpleToken.interface.encodeDeploy([name, symbol, totalSupply, deployer.address]);
    const tokenBytecode = `${SimpleToken.bytecode}${constructorData.slice(2)}`;

    const salt = ethers.utils.solidityKeccak256(['string', 'string'], [kind, content]);
    const initCodeHash = ethers.utils.keccak256(tokenBytecode);

    const create2Address = ethers.utils.getCreate2Address(questFactory.address, salt, initCodeHash);

    await questFactory.connect(deployer).createToken(name, symbol, totalSupply, deployer.address, kind, content);

    const deployedTokenAddress = await questFactory.tokens(0);
    expect(deployedTokenAddress).to.equal(create2Address);
  });
});
