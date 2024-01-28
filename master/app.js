const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

const secondaries = [
    '172.17.0.1:3001',
    '172.17.0.1:3002',
];

app.use(bodyParser.json());

const replicatedLog = new Map();

app.post('/append', async (req, res) => {
    const message = req.body.message;
    const writeConcern = req.body.w;

    if (!replicatedLog.has(message)) {
        const timestamp = new Date().getTime();
        const messageInfo = {id: timestamp, text: message};
        replicatedLog.set(message, messageInfo);

        const replicationPromises = secondaries.map(async (secondary) => {
            try {
                await replicateMessage(secondary, messageInfo, timestamp);
            } catch (error) {
                console.error(`Error replicating to ${secondary}: ${error.message}`);
            }
        });

        await Promise.all(replicationPromises.slice(0, writeConcern - 1));
        res.send('ACK');
    } else {
        console.log(`Duplicate message: ${message}`);
        res.send('Duplicate');
    }
});

app.get('/messages', (req, res) => {
    const orderedMessages = [...replicatedLog.values()].sort((a, b) => a.id - b.id);
    res.json(orderedMessages);
});

async function replicateMessage(secondaryIP, message, timestamp) {
    try {
        const url = `http://${secondaryIP}/replicate`;
        console.log(`Attempting to replicate to ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({message, timestamp}),
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
