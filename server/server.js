import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connect from './database/conn.js';
import router from './router/route.js';
import bodyParser from 'body-parser';


const app = express();

/**middlewares */
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.disable('x-powered-by'); // less hackers know about our stack


const port = 8080;


// HTTP get request
app.get('/', (req, res) => {
    res.status(201).json('Home Get Request')

});

/**api routes */
app.use('/api', router)


/**Start server only when we have a valid connection */

connect().then(() => {
    try {
        app.listen(port, () => {
            console.log(`Server connected to http://localhost:${port}`);
        })
    } catch (error) {
        console.log('Cannot connected to the server');
    }
}).catch(error => {
    console.log('Invalid database connection....');
})

