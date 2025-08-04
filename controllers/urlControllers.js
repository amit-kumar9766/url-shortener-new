const {
  fetchLastTenUrlsService,
  deleteUrlService,
  getUserUrlsService,
  editShortCodeService,
  createShortenedUrlService,
  shortenBatchUrlsService,
  getUrlByCodeService,
} = require("../services/urlServices");

exports.getLastTenUrls = async (_, res) => {
  try {
    const urls = await fetchLastTenUrlsService();
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.shortenUrl = async (req, res) => {
  const { url, customCode, expiryDate } = req.body;

  if (!url || url.trim() === "") {
    return res.status(400).json({ error: "Missing or empty URL" });
  }
  const user = req.user;

  try {
    const result = await createShortenedUrlService({
      url,
      customCode,
      expiryDate,
      user,
    });

    if (result.reused) {
      return res.status(200).json({ shortCode: result.shortCode });
    }
    return res.status(201).json({ shortCode: result.shortCode });
  } catch (err) {
    return res.status(500).json({ error: "Could not shorten URL" });
  }
};

exports.shortenBatch = async (req, res) => {
  const user = req.user;
  try {
    const { results, error, status } = await shortenBatchUrlsService({
      urls: req.body.urls,
      user,
    });

    if (error) {
      return res.status(status || 400).json({ error });
    }

    return res.json({ results });
  } catch (err) {
    console.error("Batch shortening error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.redirectUrl = async (req, res) => {
  const { code, password } = req.query;
  if (!code) {
    return res.status(400).json({ error: "Missing code parameter" });
  }
  if (!password) {
    return res.status(400).json({ error: "Missing password parameter" });
  }

  try {
    const originalUrl = await getUrlByCodeService({ code, password });
    return res.json({ url: originalUrl });
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Server error" });
  }
};


/**
 * Allows users to delete properties 
 * Currently supports soft delete
 */
exports.deleteUrl = async (req, res) => {
  const { code } = req.params;
  const userId = req.user?.id;
  if (!code) {
    return res.status(400).json({ error: "Missing URL code" });
  }

  try {
    await deleteUrlService({ code, userId });
    return res.status(200).json({ message: "URL deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Internal server error" });
  }
};

/**
 * Allows users to edit properties of their short code.
 * Currently supports updating expiryDate.
 */
exports.editShortCode = async (req, res) => {
  const { shortCode } = req.params;
  const { expiryDate } = req.body;
  if (!shortCode || !expiryDate) {
    const error = new Error("shortCode and expiryDate are required");
    error.status = 404;
    throw error;
  }
  try {
    const user = req.user;
    const newShortCode = await editShortCodeService({
      shortCode,
      expiryDate,
      user,
    });
    res.status(200).json({ message: "Short code updated", newShortCode });
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

// Controller method to get all URLs for a user
exports.getUserUrls = async (req, res) => {
  try {
    const user = req.user;
    const urls = await getUserUrlsService(user);
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
