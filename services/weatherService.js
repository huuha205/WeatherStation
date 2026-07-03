const axios = require('axios');

async function getForecast() {
    if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'your_openweather_api_key_here') {
        return null;
    }

    try {
        const lat = process.env.LOCATION_LAT || '21.0285';
        const lon = process.env.LOCATION_LON || '105.8542';
        const apiKey = process.env.OPENWEATHER_API_KEY;

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);
        const d = response.data;
        
        return {
            temperature: d.main.temp,
            humidity: d.main.humidity,
            pressure: d.main.pressure,
            wind: d.wind ? d.wind.speed : null,
            weather: d.weather[0].main,
            description: d.weather[0].description,
            icon: d.weather[0].icon,
            location: d.name || 'Unknown',
        };
    } catch (error) {
        console.error("[Weather] Lỗi OpenWeatherMap API:", error.message);
        return null;
    }
}

module.exports = { getForecast };
