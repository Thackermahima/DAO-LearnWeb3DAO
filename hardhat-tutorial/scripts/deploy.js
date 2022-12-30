// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const { CRYPTODEVSNFT_CONTRACT_ADDRESS} = require("../constant");
async function main() {
  
  const fakeNFTMarketpace = await hre.ethers.getContractFactory("FakeNFTMarketplace");
  const fakeMarketpace = await fakeNFTMarketpace.deploy();

  await fakeMarketpace.deployed();

  console.log(
`FakeNFTMarketplace contract address : ${fakeMarketpace.address}` 
    );
    const CryptoDevsDao = await hre.ethers.getContractFactory("CryptoDevsDao");
    const cryptodevsdao = await CryptoDevsDao.deploy(
      fakeMarketpace.address,
      CRYPTODEVSNFT_CONTRACT_ADDRESS,
      {
        value: hre.ethers.utils.parseEther("0.001"),
      }
    );
    await cryptodevsdao.deployed();
    console.log(`CryptoDevsDao address : ${cryptodevsdao.address}`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
