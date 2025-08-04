// middlewares/logger.js
const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "../logs.txt");

const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.get("User-Agent");
  const ip = req.ip || req.connection.remoteAddress;

  const logEntry = `[${timestamp}] ${method} ${url} - ${ip} - ${userAgent}\n`;

  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error("Failed to write log:", err);
    }
  });

  next();
};

module.exports = requestLogger;
