const express = require("express");
const router = express.Router();
const urlController = require("../controllers/urlControllers");

const requestLogger = require("../middlewares/logger");
const blacklistMiddleware = require("../middlewares/blacklist");
const responseTimer = require("../middlewares/responseTimer");
const validateApiKey = require("../middlewares/validateApiKey");
const checkEnterprisePlan = require("../middlewares/checkEnterprisePlan");

// Apply common middlewares to all routes
router.use(requestLogger);
router.use(blacklistMiddleware);
router.use(responseTimer);

// Get last 10 URLs
router.get("/api/lastUrls", urlController.getLastTenUrls);
// Shorten a URL
router.post("/api/shorten", validateApiKey, urlController.shortenUrl);
// Batch shorten URLs
router.post(
  "/api/shorten/batch",
  validateApiKey,
  checkEnterprisePlan,
  urlController.shortenBatch
);
// Redirect to original URL
router.get("/api/urls/redirect", urlController.redirectUrl);
// Delete a URL
router.delete("/api/deleteUrl/:code", validateApiKey, urlController.deleteUrl);
// Update short URL
router.put("/api/editUrl/:shortCode", validateApiKey, urlController.editShortCode);
// Get all URLs by user
router.get("/api/userUrls", validateApiKey, urlController.getUserUrls);

module.exports = router;
