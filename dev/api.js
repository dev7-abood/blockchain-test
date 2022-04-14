const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
var uuidv1 = require('uuidv1')

const nodeAddress = uuidv1().split('-').join('')

const app = new express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended : false }))

const bitcoin = new Blockchain();
app.get('/blockchain', (req, res) => {
    res.send(bitcoin)
});

app.post('/transaction', (req, res) => {
   const blockIndex = bitcoin.CreateNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
   res.json({note : `Transaction will be added in block ${blockIndex}.`})
});

app.get('/mine', (req, res) => {
    const lastBlock = bitcoin.GetLastBlock()
    const previousBlockHash = lastBlock['hash'] ?? '';

    const currentBlockData = {
        transactions : bitcoin.pendingTransactions,
        index : lastBlock['index'] + 1
    };

    const nonce = bitcoin.ProofOfWork(previousBlockHash, currentBlockData)
    const blockHash = bitcoin.HashBlock(previousBlockHash, currentBlockData, nonce)


    bitcoin.CreateNewTransaction(12.5, "00", nodeAddress) // winner mine bitcoin

    const newBlock = bitcoin.CreateNewBlock(nonce, previousBlockHash, blockHash)

    res.json({
        note : "New block mined successfully",
        block : newBlock
    })
});

const port = 3000

app.listen(port, () => {
    console.log(`Listen On Port: ${port}...`)
})