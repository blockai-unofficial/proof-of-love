jasmine.getEnv().defaultTimeoutInterval = 50000;

var love = require("../src/index");

var Bitcoin = require("bitcoinjs-lib");

var helloblock = require("helloblock-js")({
  network: 'testnet'
});

var signFromPrivateKeyWIF = function(privateKeyWIF) {
  return function(tx, callback) {
    var key = Bitcoin.ECKey.fromWIF(privateKeyWIF);
    tx.sign(0, key); 
    callback(false, tx);
  }
};

var propagateTransaction = function(tx, callback) {
  helloblock.transactions.propagate(tx, function(err, res, body) {
    callback(err, res);
  });
};

var getTransaction = function(txHash, callback) {
  helloblock.transactions.get(txHash, function(err, res, tx) {
    callback(err, tx);
  });
};

describe("proof-of-love", function() {

  it("should prove that love exists", function(done) {
    var from = "one";
    var to = "another";
    helloblock.faucet.get(1, function(err, res, body) {
      if (err) {
        return done(err);
      }
      var privateKeyWIF = body.privateKeyWIF;
      var address = body.address;
      var unspentOutputs = body.unspents;
      var signTransaction = signFromPrivateKeyWIF(privateKeyWIF);
      love.prove({
        from: from,
        to: to,
        address: address,
        unspentOutputs: unspentOutputs,
        propagateTransaction: propagateTransaction,
        signTransaction: signTransaction
      }, function(error, loveTx) {
        expect(loveTx.from).toBe(from);
        expect(loveTx.to).toBe(to);
        expect(loveTx.txHash).toBeDefined();
        getTransaction(loveTx.txHash, function(err, tx) {
          love.scan(tx, function(err, proofOfLove) {
            expect(proofOfLove.from).toBe(from);
            expect(proofOfLove.to).toBe(to);
            done();
          });
        });
      });
    });
  });

  it("should find existing proof that love exists", function(done) {
    var from = "one";
    var to = "another";
    var txHash = "2756d3fec97c76227171c88d568b7e524b45f129e642e6c9b5b8dcff50e4a091";
    getTransaction(txHash, function(err, tx) {
      love.scan(tx, function(err, proofOfLove) {
        expect(proofOfLove.from).toBe(from);
        expect(proofOfLove.to).toBe(to);
        done();
      });
    });
  });

  it("should not allow too much love", function(done) {
    var from = "one";
    var to = "another that is waaaaay tooooo much";
    love.prove({
      from: from,
      to: to,
      address: "",
      unspentOutputs: [],
      propagateTransaction: function() {},
      signTransaction: function() {}
    }, function(error, loveTx) {
      expect(error).toBe("too large");
      done();
    });
  });

});