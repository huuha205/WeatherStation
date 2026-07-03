require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const session = require('express-session');
const db = require('./database/db'); // Initialize DB
const UserModel = require('./models/userModel');
const fcmService = require('./services/fcmService');

const apiRoutes = require('./routes/apiRoutes');
const webRoutes = require('./routes/webRoutes');

const expressLayouts = require('express-ejs-layouts');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// App settings
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Setup default admin
UserModel.checkDefaultAdmin();

// Initialize Firebase
fcmService.initFirebase();

// Share io instance to routes/controllers
app.set('io', io);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('[Socket] Client disconnected:', socket.id);
    });
});

// Routes
app.use('/api', apiRoutes);
app.use('/', webRoutes);

// Error Handling
app.use((req, res) => {
    res.status(404).send('404 Not Found');
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
