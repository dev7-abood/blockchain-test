// create Blockchain constructor function it is like a class object

function Blockchain(){
    this.chain = [];
    this.pendingTransactions = [];
}

Blockchain.prototype.CreateNewBlock = function (nonce, previousBlockHash, hash) {
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
Blockchain.prototype.CreateNewTransaction = function (amount, sender, recipient){
    const newTransaction = {
      amount : amount, // amount which will be a mount's of the transactions or how much is being sent is this
      sender : sender, // sender address
      recipient : recipient, // recipient address
    };

    // push new transaction to newTransactions array
    this.pendingTransactions.push(newTransaction)

    return this.getLastBlock()['index'] + 1 // get last block in the chain
}

module.exports = Blockchain