const { GoogleGenerativeAI } = require("@google/generative-ai");

async function analyzeWeather(sensorData, forecastData) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.warn("[Gemini] API Key is not configured. Skipping analysis.");
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        let prompt = `Bạn là AI Weather Analyst của hệ thống Smart Weather Monitoring System.

Dựa trên dữ liệu cảm biến và Weather API dưới đây, hãy tạo nội dung hiển thị cho bảng "AI Weather Insight".

Sensor Data
Temperature: ${sensorData.temperature} °C
Humidity: ${sensorData.humidity} %
Pressure: ${sensorData.pressure} hPa
Rain: ${sensorData.rain ? 'Có' : 'Không'} (${sensorData.rain_mm || 0} mm)
Light: ${sensorData.light} lux
Wind: ${sensorData.wind_kmh || 0} km/h

Weather API
Weather: ${forecastData ? forecastData.description : 'N/A'}
Forecast Temperature: ${forecastData ? forecastData.temperature + ' °C' : 'N/A'}
Rain Probability: N/A
Forecast Wind: N/A

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
- QUAN TRỌNG: Dữ liệu Cảm biến (Sensor Data) là THỰC TẾ tại chỗ và CHÍNH XÁC NHẤT. Nếu Sensor báo "Đang mưa" (Có / rain_mm > 0), AI BẮT BUỘC phải nhận định là "Trời đang mưa" trong summary và status, bất kể Weather API dự báo thế nào.
- status chỉ gồm 3–6 từ.
- summary tối đa 2 câu.
- trend tối đa 1 câu.
- forecast tối đa 1 câu.
- recommendations gồm tối đa 3 gợi ý ngắn.
- confidence là số từ 0 đến 100 thể hiện mức độ phù hợp giữa dữ liệu cảm biến và Weather API.
- Nếu Temperature > 38°C hoặc Humidity > 90% hoặc đang mưa lớn, alert phải tạo cảnh báo.
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

async function chatWithAI(sensorData, forecastData, userMessage, history = []) {
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
        if (forecastData) {
            systemPrompt += `\nDự báo thời tiết Internet: Nhiệt độ ${forecastData.temperature}°C, Tình trạng: ${forecastData.description}\n`;
        }
        
        systemPrompt += `\nHãy trả lời ngắn gọn, thân thiện, dễ hiểu và mang tính tư vấn thực tế cho nông nghiệp. Dùng tiếng Việt chuẩn.`;

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
