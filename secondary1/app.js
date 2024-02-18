const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

app.use(bodyParser.json());

const replicatedLog = [];

app.post('/replicate', (req, res) => {
    const message = req.body.message;
    const timestamp = req.body.timestamp;
    replicatedLog.push({id: timestamp, text: message.text});

    console.log(`Received replication request: timestamp: ${timestamp}, content ${message.text}`);

    setTimeout(() => {
        res.json({status: 'ACK'});
    }, 3000);
});

app.get('/health', (req, res) => {
    const secondaryPort = req.query.port;
    console.log('Received heartbeat from master');
    res.send(secondaryPort);
    console.log('Sent heartbeat to master');
});

app.get('/replicated-messages', (req, res) => {
    const orderedMessages = replicatedLog.sort((a, b) => a.id - b.id);
    res.json(orderedMessages);
});

app.listen(port, () => {
    console.log(`Secondary1 server listening at http://localhost:${port}`);
});
