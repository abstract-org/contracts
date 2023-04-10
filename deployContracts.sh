#!/usr/bin/env bash

#SCRIPT_DIR_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

env_file=./.env.local
network=localhost
short=1
long=5
execute_all=false

print_help() {
  echo -e "\nUsage:"
  echo -e "  deployContracts.sh --all\n    - this will deploy everything including pools WET-TEST and pool A-B\n"
  echo -e "  deployContracts.sh --network {hardhat network name}\n    - this will exec deploys on predefined Hardhat network from hardhat.config.ts\n"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --all)
            execute_all=true
            shift
            ;;
        --network)
            if [ -n "$2" ] && [[ ! $2 =~ ^-- ]]; then
                network="$2"
                shift
            else
                echo "Error: argument --network should have value: name of network"
                exit 1
            fi
            shift
            ;;
        *)
            echo "Error: unknown argument [$1]"
            shift
            ;;
    esac
done

echo Removing ${env_file}
rm "${env_file}"

echo -e "\nDeploying on network: [${network}]\n"

echo -e "## [${env_file}]\n" > "${env_file}"

echo -en "\nDeploying Tokens..."
npx hardhat run scripts/deployTokens.ts --network ${network} >> "${env_file}"
echo -e "Done.\nWait ${short} sec." && sleep $short

echo -en "\nDeploying Uniswap contracts..."
npx hardhat run scripts/deployUniswap.ts --network ${network} >> "${env_file}"
echo -e "Done.\nWait $short sec." && sleep $short

echo -en "\nDeploying SimpleTokenFactory..."
npx hardhat run scripts/deploySimple.ts --network ${network} >> "${env_file}"
echo -e "Done.\nWait $long sec." && sleep $long

if $execute_all; then
  echo -en "\nDeploying Uniswap CrossPool A-B..."
  npx hardhat run scripts/deployCrossPool.ts --network ${network} >> "${env_file}"
  echo -e "Done.\nWait $long sec." && sleep $long

  echo -en "\nDeploying Uniswap Pool..."
  npx hardhat run scripts/deployPool.ts --network ${network} >> "${env_file}"
  echo -e "Done.\nWait $long sec." && sleep $long
fi

echo -e "\n[${env_file}]:"
cat ${env_file}