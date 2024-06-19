require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const sequelize = require('./config/database'); // เชื่อมต่อกับฐานข้อมูล Postgres
const moment = require('moment'); // ใช้ moment สำหรับการจัดการวันที่

const app = express();
const port = process.env.PORT || 4000;

const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => {
    console.error('Could not connect to Redis', err);
});
redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Routes
app.use('/', authRoutes);
app.use('/user', userRoutes);

// Add this route handler for admin_details in index.js
app.get('/admin_details/:id', async (req, res) => {
    const requestId = req.params.id;

    try {
        // เชื่อมต่อกับฐานข้อมูล
        const [requestDetails] = await sequelize.query('SELECT * FROM request WHERE Request_ID = ?', {
            replacements: [requestId],
            type: sequelize.QueryTypes.SELECT
        });

        if (requestDetails.length === 0) {
            res.status(404).send('Request not found');
            return;
        }

        const requestTime = requestDetails[0].Request_Time;

        // Execute the second query using the result from the first query
        const [additionalRequests] = await sequelize.query('SELECT * FROM request WHERE Request_Time = ?', {
            replacements: [requestTime],
            type: sequelize.QueryTypes.SELECT
        });

        res.render('admin_details', {
            user: req.session.user,
            request: requestDetails[0],
            additionalRequests,
            selectedDate: moment(requestDetails[0].Burn_Date).format('YYYY-MM-DD') // Pass the selected date
        });

    } catch (error) {
        console.error('Error querying request details:', error);
        res.status(500).send('An error occurred while retrieving request details');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
