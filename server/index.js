const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const router = require('./routes');
const CookieParser = require("cookie-parser");
// const { default: aiRouter } = require('./AiKitchen');

require("dotenv").config();

const app = express();
const corsOptions = {
  origin: (origin, callback) => {
    if (origin === process.env.FRONTEND_URL || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));
app.use(CookieParser());
app.use(express.json());

app.use((req, res, next) => {
  res.cookie = res.cookie.bind(res);
  next();
});

app.use('/api', router);

connectDB().then(()=>{
  console.log("DB connected");
})

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running}`);
});