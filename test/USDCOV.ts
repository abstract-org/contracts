import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { expect } from 'chai';
import { USDCOV } from '../typechain-types/contracts/USDCOV';

describe('Supply', function () {
  let usdcov: USDCOV;

  beforeEach(async function () {
    const _ownerAddr = '0x9894F3241F411CD2db6A3D83e374A1bF8EbfC76e';
    const USDCOVFactory = await ethers.getContractFactory('USDCOV');
    usdcov = <USDCOV>await USDCOVFactory.deploy(_ownerAddr);
  });

  it('should have the correct total supply', async function () {
    const expectedTotalSupply = ethers.BigNumber.from('1000000000000');
    const actualTotalSupply = await usdcov.totalSupply();

    expect(actualTotalSupply).to.equal(expectedTotalSupply);
  });
});

describe('Balance', function () {
  let usdcov: USDCOV;
  let owner: Signer;
  let alice: Signer;
  let bob: Signer;

  beforeEach(async function () {
    const _ownerAddr = '0x9894F3241F411CD2db6A3D83e374A1bF8EbfC76e';
    const USDCOVFactory = await ethers.getContractFactory('USDCOV');
    usdcov = (await USDCOVFactory.deploy(_ownerAddr)) as USDCOV;

    [owner, alice, bob] = await ethers.getSigners();

    // Mint some tokens to the owner
    await usdcov.mint(owner.getAddress(), ethers.utils.parseUnits('1000', 18));
  });

  it('should transfer tokens between accounts', async function () {
    // Alice transfers 100 tokens to Bob
    await usdcov.transfer(bob.getAddress(), ethers.utils.parseUnits('100', 18));

    // Check the balances of Alice and Bob
    const aliceBalance = await usdcov.balanceOf(alice.getAddress());
    const bobBalance = await usdcov.balanceOf(bob.getAddress());

    expect(aliceBalance).to.equal(ethers.utils.parseUnits('900', 18));
    expect(bobBalance).to.equal(ethers.utils.parseUnits('100', 18));
  });

  it('should not transfer tokens if sender has insufficient balance', async function () {
    // Alice tries to transfer 1000 tokens to Bob, but she only has 900
    await expect(usdcov.transfer(bob.getAddress(), ethers.utils.parseUnits('1000', 18))).to.be.revertedWith(
      'Invalid amount to transfer'
    );

    // Check the balances of Alice and Bob (they should be unchanged)
    const aliceBalance = await usdcov.balanceOf(alice.getAddress());
    const bobBalance = await usdcov.balanceOf(bob.getAddress());

    expect(aliceBalance).to.equal(ethers.utils.parseUnits('900', 18));
    expect(bobBalance).to.equal(ethers.utils.parseUnits('0', 18));
  });
});

describe('Owner', function () {
  let usdcov: USDCOV;
  let owner: Signer;
  let alice: Signer;
  let bob: Signer;

  beforeEach(async function () {
    const _ownerAddr = '0x9894F3241F411CD2db6A3D83e374A1bF8EbfC76e';
    const USDCOVFactory = await ethers.getContractFactory('USDCOV');
    usdcov = <USDCOV>await USDCOVFactory.deploy(_ownerAddr);

    [owner, alice, bob] = await ethers.getSigners();

    // Mint some tokens to the owner
    await usdcov.mint(owner.getAddress(), ethers.utils.parseUnits('1000', 18));
  });

  it('should allow the owner to transfer tokens to any address', async function () {
    // The owner transfers 500 tokens to Alice
    await usdcov.connect(owner).transfer(alice.getAddress(), ethers.utils.parseUnits('500', 18));

    // Check the balances of Alice and the owner
    const aliceBalance = await usdcov.balanceOf(alice.getAddress());
    const ownerBalance = await usdcov.balanceOf(owner.getAddress());

    expect(aliceBalance).to.equal(ethers.utils.parseUnits('500', 18));
    expect(ownerBalance).to.equal(ethers.utils.parseUnits('500', 18));
  });

  it('should not allow a non-owner to transfer tokens', async function () {
    // Bob tries to transfer 500 tokens from the owner's account to Alice
    await expect(
      usdcov.connect(bob).transfer(alice.getAddress(), ethers.utils.parseUnits('500', 18))
    ).to.be.revertedWith('Only the owner can perform this action');

    // Check the balances of Alice and the owner (they should be unchanged)
    const aliceBalance = await usdcov.balanceOf(alice.getAddress());
    const ownerBalance = await usdcov.balanceOf(owner.getAddress());

    expect(aliceBalance).to.equal(ethers.utils.parseUnits('0', 18));
    expect(ownerBalance).to.equal(ethers.utils.parseUnits('1000', 18));
  });
});

describe('Burn', function () {
  let usdcov: USDCOV;
  let owner: Signer;
  let alice: Signer;
  let bob: Signer;

  beforeEach(async function () {
    const _ownerAddr = '0x9894F3241F411CD2db6A3D83e374A1bF8EbfC76e';
    const USDCOVFactory = await ethers.getContractFactory('USDCOV');
    usdcov = <USDCOV>await USDCOVFactory.deploy(_ownerAddr);

    [owner, alice, bob] = await ethers.getSigners();

    // Mint some tokens to the owner
    await usdcov.mint(owner.getAddress(), ethers.utils.parseUnits('1000', 18));
  });

  it('should allow the owner to burn their own tokens', async function () {
    // The owner burns 500 tokens
    await usdcov.connect(owner).burn(ethers.utils.parseUnits('500', 18));

    // Check the balance of the owner
    const ownerBalance = await usdcov.balanceOf(owner.getAddress());

    expect(ownerBalance).to.equal(ethers.utils.parseUnits('500', 18));
  });

  it('should not allow a non-owner to burn tokens', async function () {
    // Bob tries to burn 500 tokens from the owner's account
    await expect(usdcov.connect(bob).burn(ethers.utils.parseUnits('500', 18))).to.be.revertedWith(
      'Only the owner can perform this action'
    );

    // Check the balance of the owner (it should be unchanged)
    const ownerBalance = await usdcov.balanceOf(owner.getAddress());

    expect(ownerBalance).to.equal(ethers.utils.parseUnits('1000', 18));
  });
});

describe('Mint', function () {
  let usdcov: USDCOV;
  let owner: Signer;
  let alice: Signer;
  let bob: Signer;

  beforeEach(async function () {
    const _ownerAddr = '0x9894F3241F411CD2db6A3D83e374A1bF8EbfC76e';
    const USDCOVFactory = await ethers.getContractFactory('USDCOV');
    usdcov = <USDCOV>await USDCOVFactory.deploy(_ownerAddr);

    [owner, alice, bob] = await ethers.getSigners();

    // Mint some tokens to the owner
    await usdcov.mint(owner.getAddress(), ethers.utils.parseUnits('1000', 18));
  });

  it('should allow the owner to mint new tokens', async function () {
    // The owner mints 500 new tokens to Alice
    await usdcov.connect(owner).mint(alice.getAddress(), ethers.utils.parseUnits('500', 18));

    // Check the balances of Alice and the owner
    const aliceBalance = await usdcov.balanceOf(alice.getAddress());
    const ownerBalance = await usdcov.balanceOf(owner.getAddress());

    expect(aliceBalance).to.equal(ethers.utils.parseUnits('500', 18));
    expect(ownerBalance).to.equal(ethers.utils.parseUnits('1500', 18));
  });

  it('should not allow a non-owner to mint new tokens', async function () {
    // Bob tries to mint 500 new tokens to Alice
    await expect(usdcov.connect(bob).mint(alice.getAddress(), ethers.utils.parseUnits('500', 18))).to.be.revertedWith(
      'Only the owner can perform this action'
    );

    // Check the balances of Alice and the owner (they should be unchanged)
    const aliceBalance = await usdcov.balanceOf(alice.getAddress());
    const ownerBalance = await usdcov.balanceOf(owner.getAddress());

    expect(aliceBalance).to.equal(ethers.utils.parseUnits('0', 18));
    expect(ownerBalance).to.equal(ethers.utils.parseUnits('1000', 18));
  });
});
