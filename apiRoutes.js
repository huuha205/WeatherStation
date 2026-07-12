const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

router.post('/sensor', apiController.receiveSensorData);
router.get('/latest', apiController.getLatest);
router.get('/history', apiController.getHistory);
router.get('/report', apiController.getReports);
router.get('/force-ai', apiController.forceAiAnalysis);
router.post('/chat', apiController.chat);
router.post('/fcm-token', apiController.saveFcmToken);

module.exports = router;
