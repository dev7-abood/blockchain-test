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

for (let i = 0; i < 5; ++i) {
    if (!(process.argv[3] === `http://127.0.0.1:300${i + 1}`)) {
        bitcoin.networkNodes.push(`http://127.0.0.1:300${i + 1}`)
    }
}

app.get('/blockchain', (req, res) => {
    res.send(bitcoin)
});

app.post('/transaction', (req, res) => {
    const newTransaction = req.body;
    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
    res.json({note: `Transaction will be added in block ${blockIndex}.`})
});

app.post('/transaction/broadcast', (req, res) => {
    const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    bitcoin.addTransactionToPendingTransactions(newTransaction);

    const requestPromises = [];

    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            body: newTransaction,
        };
        requestPromises.push(axios.post(requestOptions.uri, requestOptions.body));
    });

    Promise.all(requestPromises)
        .then(_ => {
            res.json({note: 'Transaction created and broadcast successfully'});
        });
})

app.get('/mine', (req, res) => {
    const lastBlock = bitcoin.getLastBlock()
    const previousBlockHash = lastBlock['hash'] ?? '';

    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1
    };

    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData)
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce)


    // bitcoin.createNewTransaction(12.5, "00", nodeAddress) // winner mine bitcoin

    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            body: {
                newBlock,
            }
        };
        requestPromises.push(axios.post(requestOptions.uri, requestOptions.body));
    });

    Promise.all(requestPromises)
        .then(data => {
            const requestOptions = {
                uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
                body: {
                    amount: 12.5,
                    sender: "00",
                    recipient: nodeAddress
                }
            };
            return axios.post(requestOptions.uri, requestOptions.body);
        }).then(data => {
        res.json({
            note: "New block mined successfully",
            block: newBlock
        })
    })
});

app.post('/receive-new-block', (req, res) => {
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    if (correctHash && correctIndex){
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];
        res.json({
            note : 'New block received and accepted.',
            newBlock
        })
    }else {
        res.json({
            note : 'The block is rejected.',
            newBlock
        })
    }

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
            .then( _ => {
                const bulkRegisterOptions = {
                    uri: newNodeUrl + '/register-nods-bulk',
                    body: {
                        allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]
                    }
                }
                return axios.post(bulkRegisterOptions.uri, bulkRegisterOptions.body)
            }).then( _ => {
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

    res.json({node: 'Bulk register successful'})
});

const port = process.argv[2]

app.listen(port, () => {
    console.log(`Listen On Port: ${port}...`)
})