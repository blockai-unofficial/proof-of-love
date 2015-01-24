Proof of Love
===

Declare your love for all time on the blockchain.

```
npm install proof-of-love
```

Proving our Love
---

In our examples we're going to use the ```bitcoinjs-lib``` and the ```helloblock-js``` test faucet to get and process our private key, public address and unspent outputs.

```javascript
var Bitcoin = require("bitcoinjs-lib");

var helloblock = require("helloblock-js")({
  network: 'testnet'
});

helloblock.faucet.get(1, function(err, res, body) {

  var privateKeyWIF = body.privateKeyWIF;
  var address = body.address;
  var unspentOutputs = body.unspents;
  
  // ...
  
});
```

We'll need to provide a few of your own functions.

Signing a transaction:
```javascript
var signFromPrivateKeyWIF = function(privateKeyWIF) {
  return function(tx, callback) {
    var key = Bitcoin.ECKey.fromWIF(privateKeyWIF);
    tx.sign(0, key); 
    callback(false, tx);
  }
};
var signTransaction = signFromPrivateKeyWIF(privateKeyWIF);
```

Propagating a transaction:
```javascript
var propagateTransaction = function(tx, callback) {
  helloblock.transactions.propagate(tx, function(err, res, body) {
    callback(err, res);
  });
};
```

Looking up and parsing a transaction:
```javascript
var getTransaction = function(txHash, callback) {
  helloblock.transactions.get(txHash, function(err, res, tx) {
    callback(err, tx);
  });
};
```

And finally we're ready to prove our love.

```javascript
love.prove({
  from: "one",
  to: "another",
  address: address,
  unspentOutputs: unspentOutputs,
  propagateTransaction: propagateTransaction,
  signTransaction: signTransaction
}, function(error, proofOfLove) {
  console.log(proofOfLove.from, "♥", proofOfLove.to);
});
```

Finding Love
---

```javascript
var txHash = "2756d3fec97c76227171c88d568b7e524b45f129e642e6c9b5b8dcff50e4a091";
getTransaction(txHash, function(err, tx) {
  love.scan(tx, function(err, proofOfLove) {
    console.log(proofOfLove.from, "♥", proofOfLove.to);
  });
});
```