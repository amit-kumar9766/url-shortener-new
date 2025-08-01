const crypto = require("crypto");
const { Url, User } = require("../models");
const { generateShortUrl } = require("../utils");

exports.getLastTenUrls = async (_, res) => {
  try {
    const urls = await Url.findAll({
      order: [["createdAt", "DESC"]],
      limit: 10,
      attributes: ["originalUrl", "shortCode", "createdAt"],
    });

    res.json(urls);
  } catch (err) {
    console.error("Failed to fetch last URLs", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.shortenUrl = async (req, res) => {
  const { url, customCode, expiryDate } = req.body;
  const apiKey = req.headers["api_key"];

  // Validate required fields
  if (!url || url.trim() === "") {
    return res.status(400).json({ error: "Missing or empty URL" });
  }

  if (!apiKey) {
    return res.status(401).json({ error: "API key required" });
  }

  try {
    // Authenticate user
    const user = await User.findOne({ where: { apiKey } });
    if (!user) {
      return res.status(403).json({ error: "Invalid API key" });
    }

    // Check if the URL is already shortened by this user
    const existing = await Url.findOne({
      where: { originalUrl: url, userId: user.id },
    });
    if (existing) {
      return res.json({ shortUrl: existing.shortUrl });
    }

    let shortCode;

    // Check customCode for uniqueness if provided
    if (customCode) {
      const conflict = await Url.findOne({ where: { shortUrl: customCode } });
      if (conflict) {
        return res
          .status(409)
          .json({ error: "Custom short code already in use" });
      }
      shortCode = customCode;
    } else {
      shortCode = crypto.randomBytes(3).toString("hex");
    }

    const finalExpiryDate = expiryDate ? new Date(expiryDate) : null;

    const newUrl = await Url.create({
      originalUrl: url,
      shortUrl: shortCode,
      userId: user.id,
      expiryDate: finalExpiryDate,
    });

    return res.json({ shortUrl: newUrl.shortUrl });
  } catch (err) {
    console.error("Error in shortenUrl:", err);
    return res.status(500).json({ error: "Could not shorten URL" });
  }
};

exports.shortenBatch = async (req, res) => {
  const { urls } = req.body;
  const apiKey = req.headers["api_key"];

  if (!Array.isArray(urls) || urls.length === 0)
    return res.status(400).json({ error: "Provide a non-empty URLs array" });

  try {
    const user = await User.findOne({ where: { apiKey } });
    if (!user) return res.status(403).json({ error: "Invalid API key" });

    // check tier
    if (user.tier !== "enterprise") {
      return res.status(403).json({
        error: "Bulk URL shortening is available for enterprise users only",
      });
    }

    const results = [];
    for (const entry of urls) {
      const { url, expiryDate } = entry;
      if (!url) {
        results.push({ url, error: "Missing URL" });
        continue;
      }

      try {
        const result = await generateShortUrl({
          url,
          userId: user.id,
          expiryDate,
        });
        results.push({ url, shortUrl: result.shortUrl });
      } catch (e) {
        results.push({ url, error: "Failed to shorten" });
      }
    }

    res.json({ results });
  } catch (err) {
    console.error("Batch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.redirectUrl = async (req, res) => {
  const { code, password } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Missing code parameter" });
  }

  try {
    const entry = await Url.findOne({ where: { shortUrl: code } });

    if (!entry) {
      return res.status(404).json({ error: "Short code not found" });
    }

    if (entry.expiryDate && new Date() > entry.expiryDate) {
      return res.status(410).json({ error: "Short URL has expired" });
    }

    if (entry.password && entry.password !== password) {
      return res.status(403).json({ error: "Incorrect or missing password" });
    }

    return res.json({ url: entry.originalUrl });
  } catch (err) {
    console.error("Redirect error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.deleteUrl = async (req, res) => {
  const { code } = req.params;
  const userId = req.user?.id;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    // Check if the URL belongs to the current user
    const url = await Url.findOne({
      where: {
        shortUrl: code,
        userId,
      },
    });

    if (!url) {
      return res.status(404).json({ error: "URL not found or not authorized" });
    }

    // Soft delete: Sequelize must have `paranoid: true` enabled in the model
    await url.destroy();

    return res.status(200).json({ message: "URL deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Allows users to edit properties of their short code.
 * Currently supports updating expiryDate.
 */
exports.editShortCode = async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const { expiryDate } = req.body;
    const apiKey = req.headers.api_key;

    if (!shortUrl || !expiryDate) {
      return res
        .status(400)
        .json({ error: "shortUrl and expiryDate are required" });
    }

    const user = await User.findOne({ where: { apiKey } });
    if (!user) {
      return res.status(403).json({ error: "Invalid API key" });
    }

    const urlEntry = await Url.findOne({
      where: { shortUrl, userId: user.id },
    });

    if (!urlEntry) {
      return res
        .status(404)
        .json({ error: "Short code not found or not owned by user" });
    }

    urlEntry.expiryDate = new Date(expiryDate);
    await urlEntry.save();

    res.json({ message: "Short code updated", shortUrl });
  } catch (err) {
    console.error("Edit short code error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller method to get all URLs for a user
exports.getUserUrls = async (req, res) => {
  try {
    const apiKey = req.headers.api_key;
    const user = await User.findOne({ where: { apiKey } });
    if (!user) return res.status(403).json({ error: "Invalid API key" });

    const urls = await Url.findAll({
      where: { userId: user.id },
      order: [["createdAt", "DESC"]],
    });

    res.json({ urls });
  } catch (err) {
    console.error("Get user URLs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
