// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./SimpleToken.sol";

contract SimpleFactory {
    address[] public tokens;

    event tokenCreated(address tokenAddress, address owner);

    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        address owner
    ) public returns (address) {
        SimpleToken newToken = new SimpleToken(name, symbol, totalSupply, owner);
        tokens.push(address(newToken));
        emit tokenCreated(address(newToken), owner);
        return address(newToken);
    }

    function getTokenCount() public view returns (uint) {
        return tokens.length;
    }
}
