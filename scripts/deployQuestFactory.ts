import { ethers } from 'hardhat';

async function main() {
  const QuestFactory = await ethers.getContractFactory('QuestFactory');
  const questFactory = await QuestFactory.deploy();

  await questFactory.deployed();

  console.log('QuestFactory deployed to:', questFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
