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

    setTimeout(() => {
        res.json({status: 'ACK'});
    }, 5000);
});

app.get('/replicated-messages', (req, res) => {
    res.json(replicatedLog);
});

app.listen(port, () => {
    console.log(`Secondary2 server listening at http://localhost:${port}`);
});
