// Import necessary libraries
const config = require("config");
const bip39 = require("bip39");
const ethers = require("ethers");
const { hdkey } = require("ethereumjs-wallet");
const { Keypair } = require("@solana/web3.js");


exports.generateWallet = (count) => {
  try {
    // Generate Solana Wallet
    const solanaWallet = Keypair.generate();
    console.log(solanaWallet,"solanaWallet");
    
    const solAddress = solanaWallet.publicKey.toString();
    const solPrivateKey = Buffer.from(solanaWallet.secretKey).toString('hex');

    const obj = {
      address: solAddress,
      privateKey: solPrivateKey,
    };

    return {
      status: true,
      message: "Wallet Generated Successfully",
      data: obj,
    };
  } catch (error) {
    console.log("🚀 ~ file: solanaWallet.js:14 ~ exports.generateWallet ~ error:", error);

    return { status: false, message: error.message };
  }
};
