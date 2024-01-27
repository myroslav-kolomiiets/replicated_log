const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3002;

app.use(bodyParser.json());

const replicatedLog = [];

app.post('/replicate', (req, res) => {
    const message = req.body.message;
    replicatedLog.push(message);

    console.log(`Received replication request: ${message}`);

    res.json({ status: 'ACK' });
});

app.get('/replicated-messages', (req, res) => {
    res.json(replicatedLog);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Secondary1 server listening at http://localhost:${port}`);
});
