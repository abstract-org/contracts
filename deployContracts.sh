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


HardhatRun() {
    local scriptPath="$1"
    local description=${2:-"Running $1"}
    local sleepTime=${3:-$short}
    if [[ ! -f "$scriptPath" ]]; then
        echo -e "\nScript not found: $scriptPath \n"
        return 1
    fi
    echo -en "\n${description}..."
    npx hardhat run "${scriptPath}" --network ${network} >> "${env_file}"
    echo -e "Done.\nWait $sleepTime sec." && sleep $sleepTime
}

echo Removing ${env_file}
rm "${env_file}"

echo -e "\nDeploying on network: [${network}]\n"
echo -e "## [${env_file}]" > "${env_file}"

# the order of execution is important for those 3 deploys:
HardhatRun scripts/deploySimpleFactory.ts "Deploying SimpleTokenFactory" $long
HardhatRun scripts/deployWethToken.ts "Deploying WETH Token"
HardhatRun scripts/deployUniswap.ts "Deploying Uniswap contracts" $long

HardhatRun scripts/deployTestToken.ts "Deploying TEST Token"
HardhatRun scripts/deploySimpleTokens.ts "Deploying Simple Tokens A and B"

if $execute_all; then
  HardhatRun scripts/deployWethPools.ts "Deploying Pools WETH-A and WETH-B" $long
  HardhatRun scripts/deployCrossPool.ts "Deploying CrossPool A-B" $long
  HardhatRun scripts/deployTestPool.ts "Deploying Pool WETH-TEST" $long
fi

echo -e "\n[${env_file}]:"
cat ${env_file}