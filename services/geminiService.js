const { GoogleGenerativeAI } = require("@google/generative-ai");

async function analyzeWeather(sensorData) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.warn("[Gemini] API Key is not configured. Skipping analysis.");
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        let prompt = `Bạn là AI Weather Analyst của hệ thống Smart Weather Monitoring System.

Dựa trên DỮ LIỆU CẢM BIẾN THỰC TẾ dưới đây (không dùng Internet), hãy đưa ra phân tích và dự báo ngắn hạn.

Sensor Data
Temperature: ${sensorData.temperature} °C
Humidity: ${sensorData.humidity} %
Pressure: ${sensorData.pressure} hPa
Rain: ${sensorData.rain ? 'Có' : 'Không'} (${sensorData.rain_mm || 0} mm)
Light: ${sensorData.light} lux
Wind: ${sensorData.wind_kmh || 0} km/h


Yêu cầu:
Trả về JSON đúng định dạng:
{
  "status": "",
  "summary": "",
  "risk": "Low | Medium | High | Critical",
  "trend": "",
  "forecast": "",
  "recommendations": [
    "",
    "",
    ""
  ],
  "alert": "",
  "confidence": 0
}

Quy tắc:
- QUAN TRỌNG: AI PHẢI dự báo tình hình thời tiết sắp tới dựa trên xu hướng vật lý của cảm biến (ví dụ: Áp suất thấp dưới 1000hPa hoặc đang giảm mạnh -> có khả năng mưa bão; Nhiệt độ và độ ẩm quá cao -> oi bức, khả năng mưa rào).
- Nếu Wind (Gió) = 0 hoặc null, bỏ qua không phân tích, không kết luận về gió.
- status chỉ gồm 3–6 từ (tóm tắt hiện tại).
- summary tối đa 2 câu (nhận xét hiện trạng).
- trend tối đa 1 câu (phân tích xu hướng biến đổi dữ liệu).
- forecast tối đa 1 câu (đưa ra dự báo dựa trên dữ liệu, ví dụ: "Trời quang mây tạnh, không có dấu hiệu mưa." hoặc "Áp suất thấp cho thấy khả năng mưa bão đang tới.").
- recommendations gồm tối đa 3 gợi ý ngắn (khuyên người nông dân nên làm gì).
- confidence là số từ 0 đến 100 thể hiện mức độ tin cậy của dự báo (càng nhiều dữ liệu cực đoan thì độ tự tin càng cao).
- Nếu Temperature > 38°C hoặc Humidity > 90% hoặc đang mưa, alert phải tạo cảnh báo.
- Nếu không có nguy cơ thì alert = "Không có cảnh báo."

Chỉ trả về JSON, không thêm markdown hoặc giải thích.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Clean JSON string
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiResponse = JSON.parse(jsonStr);
        return aiResponse;

    } catch (error) {
        console.error("[Gemini] Lỗi phân tích AI:", error.message);
        return null;
    }
}

async function chatWithAI(sensorData, userMessage, history = []) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        return "Vui lòng cấu hình API Key trong file .env để sử dụng chatbot.";
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        let systemPrompt = `Bạn là trợ lý ảo nông nghiệp thông minh của hệ thống IoT Weather Dashboard.
Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng (nông dân) dựa trên dữ liệu thời tiết hiện tại.

Dữ liệu cảm biến thực tế ngay lúc này:
- Nhiệt độ: ${sensorData.temperature}°C
- Độ ẩm: ${sensorData.humidity}%
- Áp suất: ${sensorData.pressure} hPa
- Đang mưa: ${sensorData.rain ? 'Có' : 'Không'}
- Lượng mưa: ${sensorData.rain_mm || 0} mm
- Tốc độ gió: ${sensorData.wind_kmh || 0} km/h
- Ánh sáng: ${sensorData.light} lux
`;
        systemPrompt += `\nHãy trả lời ngắn gọn, thân thiện, dễ hiểu và mang tính tư vấn thực tế cho nông nghiệp. Phân tích hoàn toàn dựa trên dữ liệu cảm biến thực tế tại trạm, không dùng dữ liệu dự báo trên mạng. Dùng tiếng Việt chuẩn.`;

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(`${systemPrompt}\n\nCâu hỏi của người dùng: ${userMessage}`);
        return result.response.text();
    } catch (error) {
        console.error("[Gemini Chat] Error:", error);
        return "Xin lỗi, AI đang bận hoặc bị lỗi kết nối. Vui lòng thử lại sau.";
    }
}

module.exports = { analyzeWeather, chatWithAI };
