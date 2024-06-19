const axios = require('axios');

async function getWeatherForecast(latitude, longitude, apiKey) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

module.exports = { getWeatherForecast };
