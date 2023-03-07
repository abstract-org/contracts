// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract USDCOV {
  string public name = "USDCOV";
  string public symbol = "USDCOV";
  uint256 public totalSupply = 1000000000000; // one trillion tokens
  uint8 public decimals = 18;

  mapping(address => uint256) public balanceOf;

  address public owner;

  constructor(address _owner) {
    owner = _owner;
    balanceOf[_owner] = totalSupply;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Only the owner can perform this action");
    _;
  }

  function transfer(address to, uint256 value) external returns (bool) {
    require(
      value > 0 && value <= balanceOf[msg.sender],
      "Invalid amount to transfer"
    );
    balanceOf[msg.sender] -= value;
    balanceOf[to] += value;
    emit Transfer(msg.sender, to, value);
    return true;
  }

  function transferFrom(
    address from,
    address to,
    uint256 value
  ) external returns (bool) {
    require(
      value > 0 && value <= balanceOf[from],
      "Invalid amount to transfer"
    );
    balanceOf[from] -= value;
    balanceOf[to] += value;
    emit Transfer(from, to, value);
    return true;
  }

  function mint(address to, uint256 value) external onlyOwner returns (bool) {
    require(value > 0, "Invalid amount to mint");
    balanceOf[to] += value;
    totalSupply += value;
    emit Transfer(address(0), to, value);
    return true;
  }

  function burn(uint256 value) external returns (bool) {
    require(
      value > 0 && value <= balanceOf[msg.sender],
      "Invalid amount to burn"
    );
    balanceOf[msg.sender] -= value;
    totalSupply -= value;
    emit Transfer(msg.sender, address(0), value);
    return true;
  }

  event Transfer(address indexed from, address indexed to, uint256 value);
}
