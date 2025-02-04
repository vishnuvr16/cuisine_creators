const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const router = require('./routes');
const CookieParser = require("cookie-parser");
// const { default: aiRouter } = require('./AiKitchen');

require("dotenv").config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));

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