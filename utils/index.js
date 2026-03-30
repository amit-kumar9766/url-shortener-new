const crypto = require("crypto");
const { Url } = require("../models");

exports.generateShortUrl = async ({ url, userId, expiryDate }) => {
  // Check if URL already exists for user
  const existing = await Url.findOne({ where: { originalUrl: url, userId } });
  if (existing) return { existing: true, shortCode: existing.shortCode };

  const code = crypto.randomBytes(3).toString("hex");
  const newUrl = await Url.create({
    originalUrl: url,
    shortCode: code,
    userId,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
  });

  return { existing: false, shortCode: newUrl.shortCode };
};
