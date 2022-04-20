const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuidv1 = require('uuidv1');
const axios = require('axios')

const nodeAddress = uuidv1().split('-').join('')

const app = new express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

const bitcoin = new Blockchain();
app.get('/blockchain', (req, res) => {
    res.send(bitcoin)
});

app.post('/transaction', (req, res) => {
    const blockIndex = bitcoin.CreateNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    res.json({note: `Transaction will be added in block ${blockIndex}.`})
});

app.get('/mine', (req, res) => {
    const lastBlock = bitcoin.GetLastBlock()
    const previousBlockHash = lastBlock['hash'] ?? '';

    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1
    };

    const nonce = bitcoin.ProofOfWork(previousBlockHash, currentBlockData)
    const blockHash = bitcoin.HashBlock(previousBlockHash, currentBlockData, nonce)


    bitcoin.CreateNewTransaction(12.5, "00", nodeAddress) // winner mine bitcoin

    const newBlock = bitcoin.CreateNewBlock(nonce, previousBlockHash, blockHash)

    res.json({
        note: "New block mined successfully",
        block: newBlock
    })
});


// register a node and  all nodes broadcast it the network
app.post('/register-and-broadcast-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    if (bitcoin.networkNodes.indexOf(newNodeUrl) === -1) bitcoin.networkNodes.push(newNodeUrl);

    const reqNodesPromises = []
    bitcoin.networkNodes.forEach(newNodeUrl => {
        const requestOptions = {
            uri: newNodeUrl + '/register-node',
            body: {
                newNodeUrl: newNodeUrl,
            }
        };

        reqNodesPromises.push(axios.post(requestOptions.uri, requestOptions.body));
        Promise.all(reqNodesPromises)
            .then(data => {
                const bulkRegisterOptions = {
                    uri: newNodeUrl + '/register-nods-bulk',
                    body: {
                        allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]
                    }
                }
                return axios.post(bulkRegisterOptions.uri, bulkRegisterOptions.body)
            }).then(data => {
                return res.json({note: 'New node registered with network successfully.'})
        })
    });

});

// register a node with the network
app.post('/register-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNoteAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) === -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    if (nodeNoteAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(newNodeUrl);
    res.json({note: 'New node registered successfully with node.'});
});

// register multiple nodes at once
app.post('/register-nods-bulk', (req, res) => {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) === -1;
        const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(networkNodeUrl)
    });

    res.json({node : 'Bulk register successful'})
});

const port = process.argv[2]

app.listen(port, () => {
    console.log(`Listen On Port: ${port}...`)
})