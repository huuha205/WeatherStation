const SensorModel = require('../models/sensorModel');
const AiReportModel = require('../models/aiReportModel');
const geminiService = require('../services/geminiService');
const fcmService = require('../services/fcmService');
const weatherService = require('../services/weatherService');

let lastAiTime = 0;
let lastRainState = null;
const AI_COOLDOWN_MS = 60000; // 1 minute cooldown to avoid API limits

exports.receiveSensorData = async (req, res) => {
    try {
        const data = req.body;
        
        // Validate
        if (data.temperature === undefined || data.humidity === undefined) {
            return res.status(400).json({ error: 'Missing required sensor data' });
        }

        // 1. Lưu DB
        SensorModel.insert(data, async (err, sensorId) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            // 2. Broadcast realtime via Socket.IO
            const io = req.app.get('io');
            if (io) {
                // Kéo thêm API thời tiết để so sánh
                const forecast = await weatherService.getForecast();
                io.emit('new_sensor_data', { ...data, forecast, id: sensorId });
            }

            // 3. AI Analysis (Tự động dự báo mỗi 1 phút HOẶC khi mưa bắt đầu/kết thúc)
            const now = Date.now();
            let isRainChanged = (lastRainState !== null && lastRainState !== data.rain);
            
            if (now - lastAiTime >= AI_COOLDOWN_MS || isRainChanged) {
                lastAiTime = now;
                lastRainState = data.rain;
                const forecast = await weatherService.getForecast();
                const aiResult = await geminiService.analyzeWeather(data, forecast);
                
                if (aiResult) {
                    // Lưu AI report
                    AiReportModel.insert({
                        sensor_id: sensorId,
                        status: aiResult.status,
                        summary: aiResult.summary,
                        risk: aiResult.risk,
                        trend: aiResult.trend,
                        forecast: aiResult.forecast,
                        recommendations: aiResult.recommendations,
                        alert: aiResult.alert,
                        confidence: aiResult.confidence
                    }, (err) => {
                        if (err) console.error("Lỗi lưu AI Report", err);
                    });

                    // Bắn Socket.IO AI mới
                    if (io) io.emit('new_ai_report', aiResult);

                    // Bắn Firebase Notification (Chỉ bắn khi rủi ro cao hoặc trung bình)
                    if (aiResult.risk !== 'Low' && aiResult.risk !== 'Thấp') {
                        fcmService.sendNotification(
                            `Cảnh báo thời tiết (${aiResult.risk})`, 
                            aiResult.summary
                        );
                    }
                }
            }

            res.status(200).json({ message: 'Data received successfully', id: sensorId });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getLatest = (req, res) => {
    SensorModel.getLatest((err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.json({});
        
        AiReportModel.getLatest((err2, aiRow) => {
            if (!err2 && aiRow) {
                row.aiResult = aiRow;
            }
            res.json(row);
        });
    });
};

exports.getHistory = (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    SensorModel.getHistory(limit, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows || []);
    });
};

exports.getReports = (req, res) => {
    AiReportModel.getAll((err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows || []);
    });
};

exports.forceAiAnalysis = (req, res) => {
    SensorModel.getLatest(async (err, data) => {
        if (err || !data) return res.status(404).json({ error: 'No data' });
        const forecast = await weatherService.getForecast();
        const aiResult = await geminiService.analyzeWeather(data, forecast);
        if (aiResult) {
            AiReportModel.insert({
                sensor_id: data.id,
                status: aiResult.status,
                summary: aiResult.summary,
                risk: aiResult.risk,
                trend: aiResult.trend,
                forecast: aiResult.forecast,
                recommendations: aiResult.recommendations,
                alert: aiResult.alert,
                confidence: aiResult.confidence
            }, () => {});

            const io = req.app.get('io');
            if (io) io.emit('new_ai_report', aiResult);
            
            res.json({ success: true, aiResult });
        } else {
            res.status(500).json({ error: 'AI Error' });
        }
    });
};

exports.chat = (req, res) => {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    SensorModel.getLatest(async (err, sensorData) => {
        if (err || !sensorData) return res.status(404).json({ error: 'No sensor data available to context' });

        const forecastData = await weatherService.getForecast();
        const responseText = await geminiService.chatWithAI(sensorData, forecastData, message, history || []);
        
        res.json({ response: responseText });
    });
};
