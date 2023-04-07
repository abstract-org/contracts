#!/usr/bin/env bash

#SCRIPT_DIR_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

env_file=./.env.local
network=localhost
sleep_time=1
execute_all=false

print_help() {
  echo -e "\nUsage:"
  echo -e "  deployContracts.sh --all\n    - this will deploy everything including pools WET-TEST and pool A-B\n"
  echo -e "  deployContracts.sh --network {hardhat network name}\n    - this will exec deploys on predefined Hardhat network from hardhat.config.ts\n"
}

for arg in "$@"
do
    case $arg in
        --all)
            execute_all=true
            shift
            ;;
        --network)
            network="$2"
            shift 2
            ;;
        --help)
            print_help
            exit 0
            ;;
        *)
            echo "Unknown argument: $arg"
            echo ""
            print_help
            exit 1
            ;;
    esac
done

echo Removing ${env_file}
rm "${env_file}"

echo -e "Deploy on network [${network}]\n"

echo -e "## [${env_file}]\n" > "${env_file}"

echo -n "Deploying Tokens..."
npx hardhat run scripts/deployTokens.ts --network ${network} >> "${env_file}"
echo -e "Done.\nWait ${sleep_time} sec." && sleep $sleep_time

echo -n "Deploying Uniswap contracts..."
npx hardhat run scripts/deployUniswap.ts --network ${network} >> "${env_file}"
echo -e "Done.\nWait 5 sec." && sleep 5

echo -n "Deploying SimpleTokenFactory..."
npx hardhat run scripts/deploySimple.ts --network ${network} >> "${env_file}"
echo -e "Done.\nWait 5 sec." && sleep 5

if $execute_all; then
  echo -n "Deploying Uniswap CrossPool A-B..."
  npx hardhat run scripts/deployCrossPool.ts --network ${network} >> "${env_file}"
  echo -e "Done.\nWait ${sleep_time} sec." && sleep $sleep_time

  echo -n "Deploying Uniswap Pool..."
  npx hardhat run scripts/deployPool.ts --network ${network} >> "${env_file}"
  echo -e "Done.\nWait ${sleep_time} sec." && sleep $sleep_time
fi

echo -e "\n[${env_file}]:"
cat ${env_file}