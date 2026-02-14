var CryptoJS = require("crypto-js");
var config = require("config");

// Function to encrypt data
exports.encryptionData = (data) => {
    var ciphertext = CryptoJS.AES.encrypt(data, process.env.encryptionKey).toString();
    return ciphertext;
}

// Function to decrypt data
exports.decryptionData = (ciphertext) => {
    var bytes  = CryptoJS.AES.decrypt(ciphertext, process.env.encryptionKey);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
}
