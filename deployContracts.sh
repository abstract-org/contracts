#!/usr/bin/env bash

SCRIPT_DIR_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
env_file=./.env.local
network=${1:-localhost}
sleep_time=1

echo Removing ${env_file}
rm "${env_file}"

echo -e "Deploy on network [${network}]\n"
echo -n "Deploying Tokens..."
npx hardhat run scripts/deployTokens.ts --network ${network} > "${env_file}"
echo -e "Done.\nWait ${sleep_time} sec." && sleep $sleep_time

. "${env_file}"
echo -n "Deploying Uniswap contracts..."
npx hardhat run scripts/deployUniswap.ts --network ${network} >> "${env_file}"
echo -e "Done.\nWait ${sleep_time} sec." && sleep $sleep_time

. "${env_file}"
echo -n "Deploying Uniswap Pool..."
npx hardhat run scripts/deployPool.ts --network ${network} >> "${env_file}"
echo -e "Done.\nWait ${sleep_time} sec." && sleep $sleep_time

echo -e "\n[${env_file}]:"
cat ${env_file}