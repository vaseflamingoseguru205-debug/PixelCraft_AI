const crypto = require('crypto');

crypto.generateKeyPair('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
}, (err, publicKey, privateKey) => {
  if (err) throw err;
  console.log("=== PUBLIC KEY ===");
  console.log(publicKey);
  console.log("=== PRIVATE KEY ===");
  console.log(privateKey);
});