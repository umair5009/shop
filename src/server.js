// src/server.js
require('dotenv').config();
require('express-async-error');

const express = require('express');
const morgan = require('morgan'); 
const helmet = require('helmet');
const cors = require('cors');

const connectDB = require('./config/db');
const routes = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopdb';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get("/", (req, res) => {
  res.json({ status: "OK", time: new Date() });
});
app.use('/api', routes);

app.use(errorHandler);

connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
