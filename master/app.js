const express = require('express');
const bodyParser = require('body-parser');
const replication = require('./src/replication');
const requestHandling = require('./src/requestHandling');
const constants = require('./constants/constants');
const utils = require("./utils/utils");

const app = express();

app.use(bodyParser.json());

setInterval(function (){
    constants.secondaries.forEach(async function(secondary){
        await replication.sendHeartbeats(secondary);
    });
}, constants.heartbeatInterval);

app.post('/append', requestHandling.handleAppend);

app.get('/messages', requestHandling.getMessages);

app.listen(constants.port, function(){
    utils.logger(`Master server listening at http://localhost:${constants.port}`);
});
