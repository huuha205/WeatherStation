const express = require('express');
const router = express.Router();
const webController = require('../controllers/webController');
const authController = require('../controllers/authController');
const isAuthenticated = require('../middleware/auth');

// Auth routes
router.get('/login', authController.renderLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// App routes (Protected)
router.get('/', isAuthenticated, webController.renderDashboard);
router.get('/history', isAuthenticated, webController.renderHistory);
router.get('/ai-insight', isAuthenticated, webController.renderAiInsight);

module.exports = router;
