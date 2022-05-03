const sha256 = require('sha256')
const uuidv1 = require("uuidv1");
const currentNodeUrl = process.argv[3]

// create Blockchain constructor function it is like a class object
/*
function Blockchain(){
    this.chain = [];
    this.pendingTransactions = [];

    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];

    this.CreateNewBlock(100, '0', '0')
}
*/
function Blockchain(){
    this.chain = [];
    this.pendingTransactions = [];

    this.currentNodeUrl = process.argv[3];
    this.networkNodes = [];

    this.createNewBlock(100, '0', '0')
}


Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
    const newBlock = {
        index : this.chain.length + 1, // id from new block
        timestamp : Date.now(), // when create new block
        transactions : this.pendingTransactions, // get all transactions history
        nonce : nonce, // comes from proof of work, simply just number, we create block from legitimate way, by using proof of work method
        hash : hash, // data from our new block | current hash |
        previousBlockHash : previousBlockHash, // get previous block hash
    }

    this.pendingTransactions = []; // clear all transactions | the newBlock have all transactions
    this.chain.push(newBlock); // push new block to new chain

    return newBlock;
}

// method to get last block
Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1]
}

// method to create new transaction
Blockchain.prototype.createNewTransaction = function (amount, sender, recipient){
    const newTransaction = {
      transaction_id : uuidv1().split('-').join(''),
      amount : amount, // amount which will be a mount's of the transactions or how much is being sent is this
      sender : sender, // sender address
      recipient : recipient, // recipient address
    };

    // push new transaction to newTransactions array
    this.pendingTransactions.push(newTransaction)

    return newTransaction;
}

Blockchain.prototype.addTransactionToPendingTransactions = function (transaction_object) {
    this.pendingTransactions.push(transaction_object);
    return this.getLastBlock()['index'] + 1;
}

// method get the block and hash all data
Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData)
    const hash = sha256(dataAsString)
    return hash
}

// method to validate the block
Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData){
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce)
        console.log(hash)
    }
    return nonce;
}

module.exports = Blockchain