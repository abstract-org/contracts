// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./SimpleToken.sol";

contract QuestFactory {
  address[] public tokens;

  event TokenCreated(address tokenAddress, address owner);

  function createToken(
    string calldata name,
    string calldata symbol,
    uint256 totalSupply,
    address owner,
    string calldata kind,
    string calldata content
  ) public returns (address) {
    // Compute the salt using the kind and content parameters
    bytes32 salt = keccak256(abi.encodePacked(kind, content));

    // Create the contract using create2 with the salt
    address payable addr;
    bytes memory bytecodeWithConstructor = abi.encodePacked(
      type(SimpleToken).creationCode,
      abi.encode(name, symbol, totalSupply, owner)
    );
    assembly {
      addr := create2(
        0,
        add(bytecodeWithConstructor, 32),
        mload(bytecodeWithConstructor),
        salt
      )
      if iszero(extcodesize(addr)) {
        revert(0, 0)
      }
    }

    tokens.push(addr);
    emit TokenCreated(addr, owner);
    return addr;
  }

  function getTokenCount() public view returns (uint) {
    return tokens.length;
  }

  function computeAddress(
    string calldata kind,
    string calldata content,
    bytes32 initCodeHash
  ) public view returns (address) {
    bytes32 salt = keccak256(abi.encodePacked(kind, content));
    return
      address(
        uint160(
          uint(
            keccak256(
              abi.encodePacked(bytes1(0xff), address(this), salt, initCodeHash)
            )
          )
        )
      );
  }
}
