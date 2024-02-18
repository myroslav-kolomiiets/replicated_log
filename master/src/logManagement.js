const replicatedLog = new Map();
const failedMessages = [];

function writeFailedMessage(messageInfo, secondary) {
    const failedMessage = {
        messageInfo,
        secondary,
    };
    failedMessages.push(failedMessage);
}

module.exports = {
    replicatedLog,
    failedMessages,
    writeFailedMessage,
};
