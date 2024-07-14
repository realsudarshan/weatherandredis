import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    try {
      const response = await axios.get(`https://weatherandredis.vercel.app/${city}`);
      console.log(response.data)
      setWeatherData(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching weather data. Please try again.');
      console.error(err);
      console.log(err);
    }
  };

  return (
    <div className="App">
      <h1>Weather App</h1>
      <div>
        <input
          type="text"
          placeholder="Enter city name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button onClick={fetchWeather}>Get Weather</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {weatherData && (
        <div>
          <h2>Weather for {weatherData.city}</h2>
          <p>Temperature: {weatherData.temperature}°C</p>
          <p>Description: {weatherData.description}</p>
          <p>Updated at: {new Date(weatherData.updatedAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export default App;
