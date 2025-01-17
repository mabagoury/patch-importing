require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const apiRouter = require('./routers');

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// API V1 routes
app.use('/api/v1', apiRouter);

module.exports = app;