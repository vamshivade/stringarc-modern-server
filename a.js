const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider('https://rpc1.fieroscan.com');

const transactionHash = '0x12a82bbe6f84bdc7eb5c9f80e0b9c2226165974a767ce9f03a1df1b8830f5fa6';

async function getTransactionByHash() {
  try {
    const transaction = await provider.getTransaction(transactionHash);
    console.log('Transaction Details:', transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
  }
}

getTransactionByHash();
