var Bitcoin = require("bitcoinjs-lib");

var header = "♥";
var headerHex = "e299a5";

var signFromPrivateKeyWIF = function(privateKeyWIF) {
  return function(tx, callback) {
    var key = Bitcoin.ECKey.fromWIF(privateKeyWIF);
    tx.sign(0, key); 
    callback(false, tx);
  }
};

var signFromTransactionHex = function(signTransactionHex) {
  if (!signTransactionHex) {
    return false;
  }
  return function(tx, callback) {
    var txHex = tx.tx.toHex();
    signTransactionHex(txHex, function(error, signedTxHex) {
      var signedTx = Bitcoin.TransactionBuilder.fromTransaction(Bitcoin.Transaction.fromHex(signedTxHex));
      callback(error, signedTx);
    });
  };
};

var prove = function(options, callback) {
  var propagateTransaction = options.propagateTransaction;
  var signTransaction = options.signTransaction || signFromTransactionHex(options.signTransactionHex) || signFromPrivateKeyWIF(options.privateKeyWIF);
  options.signTransaction = signTransaction;
  var from = options.from;
  var to = options.to;
  var data = new Buffer(from + header + to, "utf8");
  if (data.length > 40) {
    callback("too large", false);
    return;
  };
  var address = options.address;
  var fee = options.fee || 1000;
  var privateKeyWIF = options.privateKeyWIF;
  var payloadScript = Bitcoin.Script.fromChunks([Bitcoin.opcodes.OP_RETURN, data]);
  var tx = new Bitcoin.TransactionBuilder();
  var unspentOutputs = options.unspentOutputs;
  var unspentValue = 0;
  for (var i = unspentOutputs.length - 1; i >= 0; i--) {
    var unspentOutput = unspentOutputs[i];
    unspentValue += unspentOutput.value;
    tx.addInput(unspentOutput.txHash, unspentOutput.index);
    if (unspentValue - fee >= 0) {
      break;
    }
  };
  tx.addOutput(payloadScript, 0);
  tx.addOutput(address, unspentValue - fee);
  signTransaction(tx, function(err, signedTx) {
    if (err) {
      callback(err, false);
      return;
    }
    var signedTxBuilt = signedTx.build();
    var signedTxHex = signedTxBuilt.toHex();
    var txHash = signedTxBuilt.getId();
    propagateTransaction(signedTxHex, function(err, res) {
      var propagateResponse;
      if (err) {
        propagateResponse = "failure";
      }
      else {
        propagateResponse = "success";
      }
      callback(err, {
        propagateResponse: propagateResponse,
        txHash: txHash,
        from: from,
        to: to,
        signedTxHex: signedTxHex
      })
    });
  });
};

var scanHex = function(hexData) {
  var bufferData = new Buffer(hexData, "hex");
  var message = bufferData.toString('utf8');
  var parsedMessage = message.split(header);
  var from = parsedMessage[0];
  var to = parsedMessage[1];
  if (from.length < 1 && to.length < 1) {
    return false;
  }
  return {
    from: from,
    to: to
  }
};

var scan = function(tx, callback) {
  var hexData;
  tx.outputs.forEach(function(output) {
    if (output.type == 'nulldata') {
      var scriptPubKey = output.scriptPubKey;
      if (scriptPubKey.slice(0,2) == "6a") {
        hexData = scriptPubKey.slice(4, 84);
      }
    }
  });
  var scan = scanHex(hexData);
  if (scan) {
    tx.from = scan.from;
    tx.to = scan.to;
  }
  callback(false, tx);
};

var love = {
  prove: prove,
  scan: scan,
  scanHex: scanHex
}

module.exports = love;