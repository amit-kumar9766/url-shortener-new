// middlewares/validateApiKey.js

const { User } = require("../models");

const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers["api_key"];
  if (!apiKey) {
    return res.status(401).json({ error: "API key is required" });
  }
  try {
    const user = await User.findOne({ where: { api_key: apiKey } });
    if (!user) {
      return res.status(403).json({ error: "Invalid API key" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = validateApiKey;
