const SensorModel = require('../models/sensorModel');
const AiReportModel = require('../models/aiReportModel');
const geminiService = require('../services/geminiService');
const fcmService = require('../services/fcmService');

let lastAiTime = 0;
let lastRainState = 0; // Lưu trạng thái mưa lần trước
const AI_COOLDOWN_MS = 30000; // 30 GIÂY GỌI AI 1 LẦN (Cho đồ án giật giật liên tục)
const EMERGENCY_COOLDOWN_MS = 30000; // Cooldown khẩn cấp cũng 30 giây

exports.receiveSensorData = async (req, res) => {
    try {
        const data = req.body;
        
        // Validate
        if (data.temperature === undefined || data.humidity === undefined) {
            return res.status(400).json({ error: 'Missing required sensor data' });
        }

        // ===== FIX RACE CONDITION: KIỂM TRA QUOTA AI NGAY LẬP TỨC =====
        const now = Date.now();
        const isRainingNow = (data.rain == 1 || data.rain_mm > 0);
        const isEmergency = (isRainingNow && lastRainState === 0) || (data.temperature >= 38);
        lastRainState = isRainingNow ? 1 : 0;
        
        let shouldCallAI = false;
        if ((now - lastAiTime >= AI_COOLDOWN_MS) || (isEmergency && (now - lastAiTime >= EMERGENCY_COOLDOWN_MS))) {
            shouldCallAI = true;
            lastAiTime = now; // Khóa ngay lập tức các luồng khác tới cùng lúc
        }

        // 1. Lưu DB
        SensorModel.insert(data, async (err, sensorId) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            // 2. Broadcast realtime via Socket.IO
            const io = req.app.get('io');
            if (io) {
                io.emit('new_sensor_data', { ...data, id: sensorId });
            }

            // 3. AI Analysis
            if (shouldCallAI) {
                const aiResult = await geminiService.analyzeWeather(data);
                
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
                        // Bắn Telegram Alert
                        telegramService.sendAlert(
                            `Cảnh báo thời tiết (${aiResult.risk})`, 
                            `${aiResult.summary}\n\n💡 *Gợi ý:*\n- ${aiResult.recommendations.join('\n- ')}`
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
        const aiResult = await geminiService.analyzeWeather(data);
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
            
            // Bắn Push Notification khi người dùng chủ động ấn nút "Làm mới"
            if (aiResult.risk !== 'Low' && aiResult.risk !== 'Thấp') {
                const fcmService = require('../services/fcmService');
                const telegramService = require('../services/telegramService');
                fcmService.sendNotification(
                    `Cảnh báo thời tiết (${aiResult.risk})`, 
                    aiResult.summary
                );
                telegramService.sendAlert(
                    `Cảnh báo thời tiết (${aiResult.risk})`, 
                    `${aiResult.summary}\n\n💡 *Gợi ý:*\n- ${aiResult.recommendations.join('\n- ')}`
                );
            }

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

        const responseText = await geminiService.chatWithAI(sensorData, message, history || []);
        
        res.json({ response: responseText });
    });
};

exports.saveFcmToken = (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    
    // Gọi fcmService đăng ký token này vào topic weather_alerts
    fcmService.subscribeToTopic(token);
    
    res.json({ success: true });
};
