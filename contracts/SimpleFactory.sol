// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./SimpleToken.sol";

contract SimpleFactory {
  address[] public tokens;
  uint public tokenCount;

  event preDeploy(string data);
  event tokenCreated(address tokenAddress, address owner);

  function createToken(
    string calldata name,
    string calldata symbol,
    uint256 totalSupply,
    address owner
  ) public returns (address) {
    emit preDeploy("Pre deploy");
    SimpleToken newToken = new SimpleToken(name, symbol, totalSupply, owner);
    tokens.push(address(newToken));
    tokenCount += 1;
    emit tokenCreated(address(newToken), owner);
    return address(newToken);
  }
}
