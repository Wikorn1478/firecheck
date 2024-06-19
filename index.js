const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth');

const app = express();
const port = 4000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
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

// Routes
app.use('/', authRoutes);

// Add this route handler for admin_details in index.js

app.get('/admin_details/:id', async (req, res) => {
    const requestId = req.params.id;

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Execute the first query
        const [requestDetails] = await connection.execute('SELECT * FROM request WHERE Request_ID = ?', [requestId]);

        if (requestDetails.length === 0) {
            res.status(404).send('Request not found');
            return;
        }

        const requestTime = requestDetails[0].Request_Time;

        // Execute the second query using the result from the first query
        const [additionalRequests] = await connection.execute('SELECT * FROM request WHERE Request_Time = ?', [requestTime]);

        res.render('admin_details', {
            user: req.session.user,
            request: requestDetails[0],
            additionalRequests,
            selectedDate: moment(requestDetails[0].Burn_Date).format('YYYY-MM-DD')  // Pass the selected date
        });

        connection.end();
    } catch (error) {
        console.error('Error querying request details:', error);
        res.status(500).send('An error occurred while retrieving request details');
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});