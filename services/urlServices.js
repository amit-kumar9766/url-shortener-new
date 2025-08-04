const { Url, User } = require("../models");
const crypto = require("crypto");

/**
 * Handles logic for last 10 urls
 */
exports.fetchLastTenUrlsService = async () => {
  return await Url.findAll({
    order: [["createdAt", "DESC"]],
    limit: 10,
    attributes: ["originalUrl", "shortCode", "createdAt"],
  });
};

/**
 * Handles logic for shortening a URL, including:
 * - API key validation
 * - existing URL check
 * - custom short code conflict check
 * - new short code generation
 */
exports.createShortenedUrlService = async ({
  url,
  customCode,
  expiryDate,
  user,
}) => {
  const existing = await Url.findOne({
    where: { originalUrl: url, userId: user.id },
  });

  if (existing) {
    return { reused: true, shortCode: existing.shortCode };
  }

  let shortCode;
  if (customCode) {
    const conflict = await Url.findOne({ where: { shortCode: customCode } });
    if (conflict) {
      const error = new Error("Custom short code already in use");
      error.status = 409;
      throw error;
    }
    shortCode = customCode;
  } else {
    shortCode = crypto.randomBytes(3).toString("hex");
  }

  const finalExpiryDate = expiryDate ? new Date(expiryDate) : null;

  const newUrl = await Url.create({
    originalUrl: url,
    shortCode: shortCode,
    userId: user.id,
    expiryDate: finalExpiryDate,
  });
  return { reused: false, shortCode: newUrl.shortCode };
};

/**
 * Handles logic for shortening a URL, including:
 * - API key validation
 * - reusing the above logic and doing Promise all for all urls in the batch
 */
exports.shortenBatchUrlsService = async ({ urls, user }) => {
  if (!Array.isArray(urls) || urls.length === 0) {
    return { error: "Provide a non-empty URLs array", status: 400 };
  }

  const results = await Promise.all(
    urls.map(async (entry) => {
      const { url, expiryDate, customCode } = entry || {};

      if (!url?.trim()) {
        return { url, error: "Missing or empty URL" };
      }
      try {
        const result = await exports.createShortenedUrlService({
          url,
          customCode,
          expiryDate,
          user,
        });

        return {
          url,
          shortCode: result.shortCode,
          reused: result.reused || false,
        };
      } catch (err) {
        return { url, error: "Failed to shorten" };
      }
    })
  );

  return { results };
};

/**
 * Validates and resolves a shortened URL code to its original URL.
 * Performs:
 * - lookup
 * - expiry check
 * - password match
 */

exports.getUrlByCodeService = async ({ code, password }) => {
  const entry = await Url.findOne({ where: { shortCode: code } });

  if (!entry) {
    const error = new Error("Short code not found");
    error.status = 404;
    throw error;
  }

  if (entry.expiryDate && new Date() > entry.expiryDate) {
    const error = new Error("Short URL has expired");
    error.status = 410;
    throw error;
  }

  if (entry.password) {
    if (entry.password !== password) {
      const error = new Error("Incorrect password");
      error.status = 403;
      throw error;
    }
  }

  return entry.originalUrl;
};

/**
 * deletes url service
 */
exports.deleteUrlService = async ({ code, userId }) => {
  const url = await Url.findOne({
    where: {
      shortCode: code,
      userId,
    },
  });

  if (!url) {
    const error = new Error("URL not found");
    error.status = 404;
    throw error;
  }

  // Soft delete: Sequelize must have `paranoid: true` enabled in the model
  await url.destroy();
};

exports.editShortCodeService = async ({ shortCode, expiryDate, user }) => {
  const urlEntry = await Url.findOne({
    where: { shortCode, userId: user.id },
  });

  if (!urlEntry) {
    const error = new Error("Short code not found or not owned by user");
    error.status = 404;
    throw error;
  }

  urlEntry.expiryDate = new Date(expiryDate);
  await urlEntry.save();
  return { message: "Short code updated", shortCode };
};

/**
 * get all urls for a user
 */
exports.getUserUrlsService = async (user) => {
  const urls = await Url.findAll({
    where: { userId: user.id },
    order: [["createdAt", "DESC"]],
  });

  return urls;
};
