const failedMessages = [];
const logManagement = require('./logManagement');
const constants = require('../constants/constants');
const utils = require("../utils/utils");

async function replicateMessage(secondaryIP, message, timestamp) {
    try {
        const url = `${secondaryIP}/replicate`;
        utils.logger(`Attempting to replicate to ${url}`);

        const response = await sendReplicationRequest(url, message, timestamp);

        await handleReplicationResponse(response, secondaryIP, message);
    } catch (error) {
        handleErrorDuringReplication(error, secondaryIP);
    }
}

async function sendReplicationRequest(url, message, timestamp) {
    let retryCount = 0;

    while (retryCount < constants.maxRetries) {
        try {
            return await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({message, timestamp}),
            });
        } catch (error) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, constants.retryDelay));
        }
    }

    throw new Error(`Max retry attempts reached for replicating to ${url}`);
}

async function handleReplicationResponse(response, secondaryIP, message) {
    try {
        const responseData = await response.json();
        utils.logger(responseData);

        if (response.ok && responseData.status === 'ACK') {
            utils.logger(`Replication to ${response.url} successful`);
        } else {
            await handleReplicationError(response, secondaryIP, message);
        }
    } catch (error) {
        utils.logger(`Error parsing replication response: ${error.message}`, true);
    }
}

async function handleReplicationError(response, secondaryIP, message) {
    const errorMessage = `Error replicating to ${secondaryIP}: ${response.statusText}`;
    utils.logger(errorMessage, true);

    switch (response.status) {
        case 500:
            utils.logger("Internal Server Error", true);
            await logManagement.writeFailedMessage(message, secondaryIP);
            break;
    }
}

function handleErrorDuringReplication(error, secondaryIP) {
    utils.logger(`Unexpected error during replication to ${secondaryIP}: ${error.message}`, true);
    throw error;
}


async function retryFailedMessages() {
    if (!failedMessages) {
        return;
    }

    for (const failedMessage of failedMessages) {
        const {messageInfo, secondary} = failedMessage;
        try {
            await replicateMessage(secondary, messageInfo, messageInfo.id);
        } catch (error) {
            utils.logger(`Error replicating to ${secondary}: ${error.message}`, true);
        }
    }

    failedMessages.length = 0;
}

async function sendHeartbeats(secondaryIP) {
    const url = `${secondaryIP}/health?port=${secondaryIP}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
        });

        if (response.ok) {
            const responseBody = await response.text();
            utils.logger(`Heartbeat sent to ${url}`);
            utils.logger(`Heartbeat received from ${responseBody}`);
            // await handleHeartbeatResponse(secondaryIP, response);
        } else {
            utils.logger(`Error sending heartbeat to ${url}: ${response.statusText}`, true);
        }
    } catch (error) {
        utils.logger(`Error sending heartbeat to ${url}: ${error.message}`, true);
    }
}

module.exports = {
    replicateMessage,
    sendHeartbeats,
    retryFailedMessages,
    failedMessages,
};
