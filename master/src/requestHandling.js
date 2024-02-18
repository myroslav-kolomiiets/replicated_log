const express = require('express');
const bodyParser = require('body-parser');
const logManagement = require('./logManagement');
const replication = require('./replication');
const constants = require('../constants/constants');
const utils = require("../utils/utils");

const app = express();

app.use(bodyParser.json());

async function handleAppend(req, res) {
    const message = req.body.message;
    let writeConcern = req.body.w || 1;

    writeConcern = validateWriteConcern(writeConcern);

    const hasQuorum = writeConcern <= Math.ceil(constants.secondaries.length / 2) + 1;

    if (hasQuorum) {
        if (!logManagement.replicatedLog.has(message)) {
            const timestamp = new Date().getTime();
            const messageInfo = { id: timestamp, text: message };

            logManagement.replicatedLog.set(message, messageInfo);

            await replicateMessageToSecondaries(messageInfo, timestamp);

            await handleWriteConcern(writeConcern, messageInfo, timestamp, res);

            await replication.retryFailedMessages();

            res.send('ACK');
        } else {
            handleDuplicateMessage(message, res);
        }
    } else {
        utils.logger('There is no quorum. The server is now in read-only mode.', true);
        res.status(503).send('Service Unavailable: Read only mode.');
    }
}

function validateWriteConcern(writeConcern) {
    if (writeConcern > constants.secondaries.length + 1) {
        return constants.secondaries.length + 1;
    }
    return writeConcern;
}

async function replicateMessageToSecondaries(messageInfo, timestamp) {
    const replicationPromises = constants.secondaries.map(async (secondary) => {
        try {
            await replication.replicateMessage(secondary, messageInfo, timestamp);
        } catch (error) {
            utils.logger(`Error replicating to ${secondary}: ${error.message}`, true);
            await logManagement.writeFailedMessage(messageInfo, secondary);
        }
    });

    await Promise.all(replicationPromises);
}

async function handleWriteConcern(writeConcern, messageInfo, timestamp, res) {
    try {
        if (writeConcern > 1 || (writeConcern === 3 && constants.secondaries.length > 1)) {
            await waitForReplication(messageInfo, timestamp);
        }
    } catch (error) {
        utils.logger(`Error waiting for replication: ${error.message}`, true);
        res.status(500).send('Internal Server Error');
        throw error;
    }
}

async function waitForReplication(messageInfo, timestamp) {
    const replicationPromises = constants.secondaries.map(async (secondary) => {
        try {
            await replication.replicateMessage(secondary, messageInfo, timestamp);
        } catch (error) {
            utils.logger(`Error replicating to ${secondary}: ${error.message}`, true);
        }
    });

    await Promise.all(replicationPromises);
}

function handleDuplicateMessage(message, res) {
    utils.logger(`Duplicate message: ${message}`);
    res.send('Duplicate');
}

function getMessages(req, res) {
    const orderedMessages = [...logManagement.replicatedLog.values()].sort((a, b) => a.id - b.id);
    res.json(orderedMessages);
}

module.exports = {
    handleAppend,
    getMessages,
};
