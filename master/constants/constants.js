const secondaries = [
    'http://172.17.0.1:3001',
    'http://172.17.0.1:3002',
];

/**
 * For local development
 */
// const secondaries = [
//     'http://localhost:3001',
//     'http://localhost:3002',
// ];

const heartbeatInterval = 5000;

const maxRetries = 3;
const retryDelay = 1000;

const port = 3000;

module.exports = {
    secondaries,
    heartbeatInterval,
    maxRetries,
    retryDelay,
    port,
};
