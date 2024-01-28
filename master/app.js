const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

const secondaries = [
    '172.17.0.1:3001',
    '172.17.0.1:3002',
];

app.use(bodyParser.json());

const replicatedLog = [];

app.post('/append', async (req, res) => {
    const message = req.body.message;
    replicatedLog.push(message);

    const replicationPromises = secondaries.map(async (secondary) => {
        try {
            await replicateMessage(secondary, message);
        } catch (error) {
            console.error(`Error replicating to ${secondary}: ${error.message}`);
        }
    });

    await Promise.all(replicationPromises);

    res.send('ACK');
});

app.get('/messages', (req, res) => {
    res.json(replicatedLog);
});

async function replicateMessage(secondaryIP, message) {
    try {
        const url = `http://${secondaryIP}/replicate`;
        console.log(`Attempting to replicate to ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({message}),
        });

        const responseData = await response.json();
        console.log(responseData);

        if (response.ok && responseData.status === 'ACK') {
            console.log(`Replication to ${url} successful`);
        } else {
            console.error(`Replication to ${url} failed: Unexpected response`);
        }
    } catch (error) {
        console.error(`Error replicating to ${secondaryIP}: ${error.message}`);
        throw error;
    }
}

app.listen(port, () => {
    console.log(`Master server listening at http://localhost:${port}`);
});
