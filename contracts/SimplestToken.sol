// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimplestToken is ERC20 {
  constructor(
    uint256 initialSupply,
    string memory tokenName,
    string memory tokenSymbol
  ) ERC20(tokenName, tokenSymbol) {
    _mint(msg.sender, initialSupply);
  }
}
