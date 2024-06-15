require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 5000;
app.use(cors()); // Add this line to enable CORS
app.use(express.json()); // To parse JSON bodies



// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Define a Weather model
const weatherSchema = new mongoose.Schema({
  city: String,
  temperature: Number,
  description: String,
  updatedAt: Date,
});
const Weather = mongoose.model('Weather', weatherSchema);

// Create and connect Redis client
async function createRedisClient() {

const redisClient = redis.createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  try {
    await redisClient.connect();

    return redisClient;
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    throw err;
  }
}

// Middleware to cache data
async function cache(req, res, next) {
  const { city } = req.params;
  const redisClient = await createRedisClient();
  console.log("running")

  try {
    const data = await redisClient.get(city);
    if (data) {
      console.log("there is data");
      res.send(JSON.parse(data));
    } else {
      console.log("No data");
      next();
    }
  } catch (err) {
    console.log('Error fetching from Redis:', err);
    next();
  }
}

// Route to get weather data
app.get('/api/weather/:city', cache, async (req, res) => {
  const { city } = req.params;

  try {
    const response = await axios.get(`http://api.weatherapi.com/v1/current.json?key=${process.env.API_KEY}&q=${city}&aqi=no`);
    const weatherData = {
      city: city,
      temperature: response.data.current.temp_c,
      description: response.data.current.condition.text,
      updatedAt: new Date(response.data.current.last_updated_epoch * 1000),
    };

    // Save weather data to MongoDB
    const weather = new Weather(weatherData);
    await weather.save();

    // Cache the weather data in Redis
    const redisClient = await createRedisClient();
    redisClient.setEx(city, 3600, JSON.stringify(weatherData));

    res.json(weatherData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.use(express.json()); // To parse JSON bodies

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
