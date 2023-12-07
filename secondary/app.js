const express = require('express');
const bodyParser = require('body-parser');

const log = [];

const app = express();

app.use(bodyParser.json());

app.post('/add-message', (req, res, next) => {
    log.push(req.body.message)
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
    res.send(JSON.stringify({status: 'Done'}));
    console.log(req.body);
});

app.get('/messages', (req, res, next) => {
    res.send(`<p>${log.join(', ')}</p>`);
});

app.get('/', (req, res, next) => {
    res.send(`Secondary`);
})

app.listen(3001);
