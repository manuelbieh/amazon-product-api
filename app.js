import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

// load custom modules
import routes from './routes';

// app setup
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cors());

app.use(routes);

app.use((err, req, res, next) => {
    const status = (err || {}).status || 501;
    return res.status(status).json({
        status: status,
        message: (err || {}).message
    });
});

const server = app.listen('9190', () => {
    console.log('SERVER LISTENING ON PORT ' + server.address().port);
});

server.on('close', () => {
    console.log('SERVER CLOSED');
});

server.on('error', (err) => {
    console.log('SERVER ERROR:', err.message);
    process.exit(1);
});
