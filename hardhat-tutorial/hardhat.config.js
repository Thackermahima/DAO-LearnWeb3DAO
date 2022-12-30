require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });

const url = process.env.REACT_APP_HTTP_URL;
const pk = process.env.REACT_APP_PRIVATE_KEY;

module.exports = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: url,
      accounts: [pk],
    },
  },
};
//FakeNFTMarketplace contract address : 0x18F5173Fa70B603B6359eA83dDE4D5574A02251B
//CryptoDevsDao address : 0x85dF90D9fEcC730f74D089492159C6dD709717e6
