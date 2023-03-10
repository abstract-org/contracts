// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Factory {
  event TokenCreated(address indexed token);

  function createToken(
    string memory name,
    string memory symbol,
    string memory kind,
    string memory content
  ) public returns (address) {
    bytes32 salt = keccak256(abi.encodePacked(kind, content));
    bytes memory bytecode = type(ERC20).creationCode;

    address token;
    assembly {
      token := create2(0, add(bytecode, 32), mload(bytecode), salt)

      if iszero(extcodesize(token)) {
        revert(0, 0)
      }
    }

    bytes memory constructorData = abi.encodeWithSignature(
      "initialize(string,string)",
      name,
      symbol
    );
    (bool success, ) = token.delegatecall(constructorData);
    require(success, "Failed to initialize token");

    emit TokenCreated(token);

    return token;
  }
}
