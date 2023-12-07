const express = require('express');
const bodyParser = require('body-parser');

const log = [];

const app = express();

process.on('uncaughtException', function (err) {
    console.log(err);
});

app.use(bodyParser.urlencoded({extended: false}));

app.get('/add-message', (req, res, next) => {
    res.send('<form action="/message" method="post"><input type="text" name="message" /><button type="submit">Send message</button></form>');
});

app.post('/message', async (req, res, next) => {
    if (!req.body.message) {
        return;
    }

    log.push(req.body.message);

    const url = 'http://172.17.0.1:3001/add-message'
    const customHeaders = {
        "Content-Type": "application/json",
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: customHeaders,
            body: JSON.stringify({message: req.body.message}),
        });
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.log(error);
    } finally {
        res.redirect('/');
    }
});

app.get('/', (req, res, next) => {
    res.send(`<p>${log.join(', ')}</p>`);
})

app.listen(3000);
