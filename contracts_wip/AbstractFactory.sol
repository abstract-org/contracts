// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

contract AbstractFactory is Ownable {
  using SafeERC20 for ERC20;

  bool public migrated;
  mapping(string => address) public tokenAddr;
  mapping(string => address) public usdcPoolAddr;
  address public usdcTokenAddr;

  constructor(address _usdcTokenAddr) {
    usdcTokenAddr = _usdcTokenAddr;
  }

  event AbstractTokenDeployed(
    address indexed tokenAddr,
    address indexed usdcPoolAddr
  );

  function deployAbstractTokenByHash(
    string memory name,
    string memory symbol,
    uint256 initialSupply,
    address usdcPool
  ) external returns (address, address) {
    require(!migrated, "Contract has been migrated");

    ERC20 token = new ERC20(name, symbol);
    tokenAddr[hash] = address(token);
    usdcPoolAddr[hash] = address(0x123456789);

    emit AbstractTokenDeployed(address(token), usdcPoolAddr[hash]);

    return (address(token), usdcPoolAddr[hash]);
  }

  function getAbstractTokenByHash(
    string memory hash
  ) external view returns (address, address) {
    require(tokenAddr[hash] != address(0), "Token not found");

    return (tokenAddr[hash], usdcPoolAddr[hash]);
  }

  function addLiquidityToValueLinkByHashes(
    string memory hash1,
    string memory hash2,
    uint256 amount,
    uint256 maxPrice,
    uint256 minPrice
  ) external returns (uint256) {
    require(!migrated, "Contract has been migrated");
    require(msg.sender == owner(), "Not authorized");
    require(gasleft() > 200000, "Gas limit too low");

    address token1Addr = tokenAddr[hash1];
    address token2Addr = tokenAddr[hash2];

    require(token1Addr != address(0), "Token 1 not found");
    require(token2Addr != address(0), "Token 2 not found");

    ERC20 token1 = ERC20(token1Addr);
    ERC20 token2 = ERC20(token2Addr);

    token1.safeTransferFrom(msg.sender, address(this), amount);
    token2.safeTransferFrom(msg.sender, address(this), amount);

    IUniswapV3Pool pool = IUniswapV3Pool(usdcPoolAddr[hash1]);
    (uint160 sqrtPriceX96, , , , , , ) = pool.slot0();

    (uint160 sqrtPriceLimitX96, , , , , , ) = pool.slot0();
    sqrtPriceLimitX96 = sqrtPriceX96 + sqrtPriceX96 / 10;

    INonfungiblePositionManager positionManager = INonfungiblePositionManager(
      address(usdcTokenAddr)
    );

    (address token0, address token1) = token1Addr < token2Addr
      ? (token1Addr, token2Addr)
      : (token2Addr, token1Addr);

    bytes32 poolKey = keccak256(abi.encodePacked(token0, token1));
    address poolAddr = address(
      uint256(usdcPoolAddr[hash1]) +
        (poolKey & 0xffffffffffffffffffffffffffffffffffffffff)
    );

    if (poolAddress != address(0)) {
      return
        INonfungiblePositionManager(positionManager).mint(
          INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: 3000,
            tickLower: int24(-500),
            tickUpper: int24(500),
            amount0Desired: amount,
            amount1Desired: amount,
            amount0Min: 0,
            amount1Min: 0,
            recipient: msg.sender,
            deadline: block.timestamp + 120,
            sqrtPriceLimitX96: sqrtPriceLimitX96
          })
        );
    } else {
      // pool doesn't exist, create new pool
      uint160 initialSqrtPriceX96 = sqrtPriceX96;
      pool = IUniswapV3Pool(
        INonfungiblePositionManager(positionManager)
          .createAndInitializePoolIfNecessary(
            token0,
            token1,
            3000,
            initialSqrtPriceX96
          )
      );

      // mint LP tokens in the new pool
      uint256 tokenId = INonfungiblePositionManager(positionManager).mint(
        INonfungiblePositionManager.MintParams({
          token0: token0,
          token1: token1,
          fee: 3000,
          tickLower: int24(-500),
          tickUpper: int24(500),
          amount0Desired: amount,
          amount1Desired: amount,
          amount0Min: 0,
          amount1Min: 0,
          recipient: address(this),
          deadline: block.timestamp + 120,
          sqrtPriceLimitX96: sqrtPriceLimitX96
        })
      );

      // transfer LP tokens to the sender
      positionManager.safeTransferFrom(address(this), msg.sender, tokenId);

      // store the new pool address
      usdcPoolAddr[hash1] = address(pool);

      // emit an event signaling the creation of a new value link
      emit ValueLinkCreated(hash1, hash2, address(pool), tokenId);

      return tokenId;
    }
  }

  function migrate(address newImpl) external {
    require(msg.sender == owner(), "Not authorized");

    migrated = true;
    AbstractFactory newFactory = AbstractFactory(newImpl);
    newFactory.migrate(tokenAddr, usdcPoolAddr);
  }

  function migrate(
    mapping(string => address) calldata _tokenAddr,
    mapping(string => address) calldata _usdcPoolAddr
  ) external {
    require(msg.sender == owner(), "Not authorized");

    tokenAddr = _tokenAddr;
    usdcPoolAddr = _usdcPoolAddr;
  }
}
