// middlewares/blacklist.js
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config/blacklist.json");

// Read blacklist from file
function getBlacklistedKeys() {
  try {
    const data = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(data);
    return config.blacklistedKeys || [];
  } catch (error) {
    console.error("Error reading blacklist config:", error.message);
    return [];
  }
}

// Blacklist middleware
const blacklistMiddleware = (req, res, next) => {
  // Get API key from header or query
  const apiKey = req.get("x-api-key") || req.query.apikey;

  // Skip if no API key
  if (!apiKey) {
    return next();
  }

  // Read current blacklist
  const blacklistedKeys = getBlacklistedKeys();

  // Check if API key is blacklisted
  if (blacklistedKeys.includes(apiKey)) {
    console.log(`Blocked blacklisted key: ${apiKey}`);
    return res.status(403).json({
      error: "API key is blacklisted",
    });
  }

  // Continue if not blacklisted
  next();
};

module.exports = blacklistMiddleware;
